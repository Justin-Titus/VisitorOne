const http = require('http');
const connectDB = require('../config/db');
const app = require('../app');

let serverInstance = null;
let apiBaseUrl = '';

const setupTestServer = async () => {
  await connectDB();
  return new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      apiBaseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });
};

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(apiBaseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            const parsed = buffer.length ? JSON.parse(buffer.toString()) : {};
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw: buffer.toString(), headers: res.headers });
          }
        } else {
          resolve({ status: res.statusCode, buffer, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🚀 VISITOR ONE — ENHANCED BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  try {
    await setupTestServer();

    let adminToken, receptionistToken, employeeToken, employeeId;
    let createdRequestId;

    // 1. AUTHENTICATION TESTS
    console.log('\n--- 1. Authentication & Role Permissions ---');

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@visitorone.com',
      password: 'Admin@123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.data?.token, 'Admin login succeeds and returns JWT');
    adminToken = adminLogin.data.data?.token;

    const recepLogin = await request('POST', '/auth/login', {
      email: 'reception@visitorone.com',
      password: 'Reception@123',
    });
    assert(recepLogin.status === 200 && recepLogin.data.data?.token, 'Receptionist login succeeds');
    receptionistToken = recepLogin.data.data?.token;

    const empLogin = await request('POST', '/auth/login', {
      email: 'alice.smith@visitorone.com',
      password: 'Employee@123',
    });
    assert(empLogin.status === 200 && empLogin.data.data?.token, 'Employee login succeeds');
    employeeToken = empLogin.data.data?.token;

    const invalidLogin = await request('POST', '/auth/login', {
      email: 'admin@visitorone.com',
      password: 'WrongPassword123',
    });
    assert(invalidLogin.status === 401, 'Invalid credentials return 401 Unauthorized');

    // 2. EMPLOYEE & USER MANAGEMENT
    console.log('\n--- 2. Employee & User Management ---');

    const empList = await request('GET', '/employees', null, receptionistToken);
    assert(empList.status === 200 && Array.isArray(empList.data.data), 'Receptionist can fetch active employee list');
    if (empList.data.data?.length > 0) {
      employeeId = empList.data.data[0]._id;
    }

    const userListEmployee = await request('GET', '/users', null, employeeToken);
    assert(userListEmployee.status === 403, 'Non-admin employee blocked from managing user accounts (RBAC 403)');

    const userListAdmin = await request('GET', '/users', null, adminToken);
    assert(userListAdmin.status === 200, 'Admin can view system user accounts');

    // 3. DASHBOARDS & GRAPHICAL ANALYTICS
    console.log('\n--- 3. Role-Based Dashboards & Analytics ---');

    const adminDash = await request('GET', '/dashboard/admin', null, adminToken);
    assert(adminDash.status === 200 && adminDash.data.data?.totalEmployees !== undefined, 'Admin dashboard returns metrics');

    const recepDash = await request('GET', '/dashboard/receptionist', null, receptionistToken);
    assert(recepDash.status === 200 && recepDash.data.data?.todaysScheduled !== undefined, 'Receptionist dashboard returns gate statistics');

    const empDash = await request('GET', '/dashboard/employee', null, employeeToken);
    assert(empDash.status === 200 && empDash.data.data?.pendingCount !== undefined, 'Employee dashboard returns pending requests metrics');

    // 4. BUSINESS RULES, STATE MACHINE & VISITOR REGISTRATION
    console.log('\n--- 4. Visitor Workflow & State Machine Edge Rules ---');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    const testPhone = '99999' + Math.floor(10005 + Math.random() * 89995);

    // Rule 3: Past Date Check
    const pastDateReq = await request('POST', '/visitor-requests', {
      visitorData: { name: 'Test Past Visitor', phone: testPhone, email: 'past@test.com', company: 'Acme', idProofType: 'aadhar', idProofNumber: '1234' },
      employeeToVisit: employeeId,
      purpose: 'Past Visit Test',
      visitDate: '2020-01-01T10:00:00.000Z',
      expectedArrivalTime: '10:00',
    }, receptionistToken);
    assert(pastDateReq.status === 400, 'Rule 3: Visit date in the past is rejected with 400 Bad Request');

    // Valid Registration
    const validReq = await request('POST', '/visitor-requests', {
      visitorData: { name: 'Automated Test Visitor', phone: testPhone, email: 'auto@test.com', company: 'TestCorp', idProofType: 'aadhar', idProofNumber: '123456789012' },
      employeeToVisit: employeeId,
      purpose: 'Business Meeting',
      visitDate: tomorrowISO,
      expectedArrivalTime: '14:30',
    }, receptionistToken);
    assert(validReq.status === 201 && validReq.data.data?._id, 'Visitor pass created successfully in PENDING status');
    createdRequestId = validReq.data.data?._id;

    // Rule 1: Active Visit Check
    const activeVisitCheck = await request('POST', '/visitor-requests', {
      visitorData: { name: 'Automated Test Visitor', phone: testPhone, email: 'auto@test.com', company: 'TestCorp', idProofType: 'aadhar', idProofNumber: '123456789012' },
      employeeToVisit: employeeId,
      purpose: 'Second Meeting Same Time',
      visitDate: tomorrowISO,
      expectedArrivalTime: '14:30',
    }, receptionistToken);
    assert(activeVisitCheck.status === 409, 'Rule 1: Rejects duplicate registration while another active visit exists (409 Conflict)');

    // Rule 6: Check-in before approval check
    const prematureCheckIn = await request('PATCH', `/visitor-requests/${createdRequestId}/check-in`, {}, receptionistToken);
    assert(prematureCheckIn.status === 400, 'Rule 6: State machine blocks check-in before employee approval (400 Bad Request)');

    // Employee Approves
    const approveRes = await request('PATCH', `/visitor-requests/${createdRequestId}/approve`, { remarks: 'Approved by automated test' }, employeeToken);
    assert(approveRes.status === 200 && approveRes.data.data?.status === 'approved', 'Host employee approves visitor request');

    // Receptionist Checks In
    const checkInRes = await request('PATCH', `/visitor-requests/${createdRequestId}/check-in`, {}, receptionistToken);
    assert(checkInRes.status === 200 && checkInRes.data.data?.status === 'checked_in', 'Receptionist checks in approved visitor');

    // Rule 7: Duplicate check-in check
    const doubleCheckIn = await request('PATCH', `/visitor-requests/${createdRequestId}/check-in`, {}, receptionistToken);
    assert(doubleCheckIn.status === 400, 'Rule 7: Already checked in visitor cannot check in again (400 Bad Request)');

    // Receptionist Checks Out
    const checkOutRes = await request('PATCH', `/visitor-requests/${createdRequestId}/check-out`, {}, receptionistToken);
    assert(checkOutRes.status === 200 && checkOutRes.data.data?.status === 'checked_out', 'Receptionist checks out visitor with recorded checkOutTime');

    // State Machine Terminal State Check
    const postCheckOutApprove = await request('PATCH', `/visitor-requests/${createdRequestId}/approve`, {}, employeeToken);
    assert(postCheckOutApprove.status === 400, 'State Machine: Terminal checked_out status cannot transition to approved');

    // 5. BULK VISITOR OPERATIONS & ADVANCED FILTERS
    console.log('\n--- 5. Bulk Visitor Operations & Advanced Filtering ---');

    // Create 2 new passes for bulk testing
    const p1Phone = '98888' + Math.floor(10005 + Math.random() * 89995);
    const p2Phone = '97777' + Math.floor(10005 + Math.random() * 89995);

    const bReq1 = await request('POST', '/visitor-requests', {
      visitorData: { name: 'Bulk Visitor One', phone: p1Phone, company: 'Corp1' },
      employeeToVisit: employeeId,
      purpose: 'Bulk Test 1',
      visitDate: tomorrowISO,
      expectedArrivalTime: '10:00',
    }, receptionistToken);

    const bReq2 = await request('POST', '/visitor-requests', {
      visitorData: { name: 'Bulk Visitor Two', phone: p2Phone, company: 'Corp2' },
      employeeToVisit: employeeId,
      purpose: 'Bulk Test 2',
      visitDate: tomorrowISO,
      expectedArrivalTime: '11:00',
    }, receptionistToken);

    const pass1Id = bReq1.data.data?._id;
    const pass2Id = bReq2.data.data?._id;

    assert(pass1Id && pass2Id, 'Created 2 sample visitor passes for bulk testing');

    // Bulk Approve
    const bulkApproveRes = await request('PATCH', '/visitor-requests/bulk-approve', { ids: [pass1Id, pass2Id] }, adminToken);
    assert(bulkApproveRes.status === 200 && bulkApproveRes.data.data?.succeeded?.length === 2, 'Admin performs bulk approval on multiple passes');

    // Bulk Check-In
    const bulkCheckInRes = await request('PATCH', '/visitor-requests/bulk-check-in', { ids: [pass1Id, pass2Id] }, receptionistToken);
    assert(bulkCheckInRes.status === 200 && bulkCheckInRes.data.data?.succeeded?.length === 2, 'Receptionist performs bulk check-in on approved passes');

    // Advanced Multi-Condition Filter Query
    const multiFilterRes = await request('GET', `/visitor-requests?visitorName=Bulk&purpose=Test`, null, adminToken);
    assert(multiFilterRes.status === 200 && multiFilterRes.data.data?.total >= 2, 'Multi-condition filtering retrieves matching records');

    // 6. REPORT PDF & EXCEL EXPORTS
    console.log('\n--- 6. PDF & Excel Report Exports ---');

    const pdfExportRes = await request('GET', '/reports/export/pdf', null, adminToken);
    assert(pdfExportRes.status === 200 && pdfExportRes.headers['content-type'] === 'application/pdf', 'PDF report export returns HTTP 200 with application/pdf header');

    const excelExportRes = await request('GET', '/reports/export/excel', null, adminToken);
    assert(excelExportRes.status === 200 && excelExportRes.headers['content-type'].includes('spreadsheet'), 'Excel report export returns HTTP 200 with spreadsheet header');

    // 7. AUDIT LOGS
    console.log('\n--- 7. Security Audit Logs ---');
    const auditLogsRes = await request('GET', '/activity-logs', null, adminToken);
    assert(auditLogsRes.status === 200 && auditLogsRes.data.data?.data?.length > 0, 'Admin fetches system activity logs');

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    if (serverInstance) {
      serverInstance.close();
    }
    await require('mongoose').connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err.stack || err.message);
    if (serverInstance) {
      serverInstance.close();
    }
    await require('mongoose').connection.close();
    process.exit(1);
  }
};

runTests();
