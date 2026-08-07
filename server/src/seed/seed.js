const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');
const Visitor = require('../models/Visitor.model');
const VisitRequest = require('../models/VisitRequest.model');
const ActivityLog = require('../models/ActivityLog.model');
const { ROLES, EMPLOYEE_STATUS, VISIT_STATUS, ACTIVITY_ACTIONS } = require('../utils/constants');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('⚡ MongoDB Connected for Seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear all existing data
    await User.deleteMany();
    await Employee.deleteMany();
    await Visitor.deleteMany();
    await VisitRequest.deleteMany();
    await ActivityLog.deleteMany();

    console.log('🧹 Cleared existing Database collections');

    // 1. Create Core Users
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@visitorone.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
    });

    const receptionistUser = await User.create({
      name: 'Front Desk',
      email: 'reception@visitorone.com',
      password: 'Reception@123',
      role: ROLES.RECEPTIONIST,
    });

    // 2. Create Staff Employees
    const employeesData = [
      {
        name: 'Alice Smith',
        employeeCode: 'EMP001',
        department: 'Engineering',
        designation: 'Senior Architect',
        email: 'alice.smith@visitorone.com',
        phone: '9876543210',
        status: EMPLOYEE_STATUS.ACTIVE,
      },
      {
        name: 'Bob Jones',
        employeeCode: 'EMP002',
        department: 'Human Resources',
        designation: 'HR Director',
        email: 'bob.jones@visitorone.com',
        phone: '9876543211',
        status: EMPLOYEE_STATUS.ACTIVE,
      },
      {
        name: 'Charlie Brown',
        employeeCode: 'EMP003',
        department: 'Operations',
        designation: 'Operations Manager',
        email: 'charlie.brown@visitorone.com',
        phone: '9876543212',
        status: EMPLOYEE_STATUS.ACTIVE,
      },
    ];

    const createdEmployees = await Employee.insertMany(employeesData);
    console.log('✅ Sample Staff Employees created');

    // Create User accounts for Employees
    const empUsersMap = {};
    for (const employee of createdEmployees) {
      const empUser = await User.create({
        name: employee.name,
        email: employee.email,
        password: 'Employee@123',
        role: ROLES.EMPLOYEE,
        employeeRef: employee._id,
      });
      empUsersMap[employee.name] = { user: empUser, employee };
    }

    // 3. Create Sample Visitors
    const visitorsData = [
      {
        name: 'John Doe',
        phone: '9811122334',
        email: 'john.doe@techcorp.io',
        company: 'TechCorp Solutions',
        idProofType: 'aadhar',
        idProofNumber: '1234-5678-9012',
      },
      {
        name: 'Sarah Connor',
        phone: '9822233445',
        email: 'sarah.c@cyberdyne.com',
        company: 'Cyberdyne Systems',
        idProofType: 'passport',
        idProofNumber: 'A1234567',
      },
      {
        name: 'David Miller',
        phone: '9833344556',
        email: 'david.m@acme.com',
        company: 'Acme Industries',
        idProofType: 'driving_license',
        idProofNumber: 'DL-987654321',
      },
      {
        name: 'Elena Rostova',
        phone: '9844455667',
        email: 'elena.r@globallogistics.com',
        company: 'Global Logistics Corp',
        idProofType: 'voter_id',
        idProofNumber: 'VTR88776655',
      },
      {
        name: 'Michael Vance',
        phone: '9855566778',
        email: 'michael.v@apex.org',
        company: 'Apex Innovations',
        idProofType: 'aadhar',
        idProofNumber: '5566-7788-9900',
      },
    ];

    const createdVisitors = await Visitor.insertMany(visitorsData);
    console.log('✅ Sample Visitors created');

    // 4. Create Visit Requests with Various Statuses
    const todayStr = new Date().toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const requestsData = [
      // 1) Pending Request -> Alice
      {
        visitor: createdVisitors[0]._id, // John Doe
        employeeToVisit: empUsersMap['Alice Smith'].employee._id,
        purpose: 'Technical Architecture Review',
        visitDate: new Date(),
        visitDateString: todayStr,
        expectedArrivalTime: '14:30',
        status: VISIT_STATUS.PENDING,
        createdBy: receptionistUser._id,
      },
      // 2) Approved Request -> Bob
      {
        visitor: createdVisitors[1]._id, // Sarah Connor
        employeeToVisit: empUsersMap['Bob Jones'].employee._id,
        purpose: 'Executive Hiring Discussion',
        visitDate: new Date(),
        visitDateString: todayStr,
        expectedArrivalTime: '11:00',
        status: VISIT_STATUS.APPROVED,
        createdBy: receptionistUser._id,
        approvedBy: empUsersMap['Bob Jones'].user._id,
        decidedAt: new Date(),
        remarks: 'Cleared for VIP conference room access',
      },
      // 3) Checked In Request -> Charlie
      {
        visitor: createdVisitors[2]._id, // David Miller
        employeeToVisit: empUsersMap['Charlie Brown'].employee._id,
        purpose: 'Annual Facility Audit',
        visitDate: new Date(),
        visitDateString: todayStr,
        expectedArrivalTime: '09:30',
        status: VISIT_STATUS.CHECKED_IN,
        createdBy: receptionistUser._id,
        approvedBy: empUsersMap['Charlie Brown'].user._id,
        decidedAt: new Date(Date.now() - 3600000 * 3),
        checkInTime: new Date(Date.now() - 3600000 * 2),
        remarks: 'Issued Zone 1 Security Badge',
      },
      // 4) Checked Out Request (Yesterday) -> Alice
      {
        visitor: createdVisitors[3]._id, // Elena Rostova
        employeeToVisit: empUsersMap['Alice Smith'].employee._id,
        purpose: 'Vendor Onboarding & Contract Signing',
        visitDate: yesterday,
        visitDateString: yesterdayStr,
        expectedArrivalTime: '10:00',
        status: VISIT_STATUS.CHECKED_OUT,
        createdBy: receptionistUser._id,
        approvedBy: empUsersMap['Alice Smith'].user._id,
        decidedAt: new Date(yesterday.valueOf() + 3600000),
        checkInTime: new Date(yesterday.valueOf() + 7200000),
        checkOutTime: new Date(yesterday.valueOf() + 14400000),
        remarks: 'Contract signed. Badge returned.',
      },
      // 5) Rejected Request -> Bob
      {
        visitor: createdVisitors[4]._id, // Michael Vance
        employeeToVisit: empUsersMap['Bob Jones'].employee._id,
        purpose: 'Unscheduled Sales Pitch',
        visitDate: new Date(),
        visitDateString: todayStr,
        expectedArrivalTime: '16:00',
        status: VISIT_STATUS.REJECTED,
        createdBy: receptionistUser._id,
        rejectedBy: empUsersMap['Bob Jones'].user._id,
        decidedAt: new Date(),
        remarks: 'Host employee unavailable today',
      },
    ];

    const createdRequests = await VisitRequest.insertMany(requestsData);
    console.log('✅ Sample Visit Requests created across all statuses');

    // 5. Seed Activity Logs for Audit Trail
    const logs = [];

    // Log for Pending
    logs.push({
      visitRequest: createdRequests[0]._id,
      action: ACTIVITY_ACTIONS.CREATED,
      performedBy: receptionistUser._id,
      remarks: 'Visitor registered at reception desk',
      timestamp: createdRequests[0].createdAt,
    });

    // Log for Approved
    logs.push(
      {
        visitRequest: createdRequests[1]._id,
        action: ACTIVITY_ACTIONS.CREATED,
        performedBy: receptionistUser._id,
        remarks: 'Visitor registered',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        visitRequest: createdRequests[1]._id,
        action: ACTIVITY_ACTIONS.APPROVED,
        performedBy: empUsersMap['Bob Jones'].user._id,
        remarks: 'Approved by host employee',
        timestamp: createdRequests[1].decidedAt,
      }
    );

    // Log for Checked-In
    logs.push(
      {
        visitRequest: createdRequests[2]._id,
        action: ACTIVITY_ACTIONS.CREATED,
        performedBy: receptionistUser._id,
        remarks: 'Visitor registered',
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        visitRequest: createdRequests[2]._id,
        action: ACTIVITY_ACTIONS.APPROVED,
        performedBy: empUsersMap['Charlie Brown'].user._id,
        remarks: 'Approved by host',
        timestamp: createdRequests[2].decidedAt,
      },
      {
        visitRequest: createdRequests[2]._id,
        action: ACTIVITY_ACTIONS.CHECKED_IN,
        performedBy: receptionistUser._id,
        remarks: 'Checked in at reception gate 1',
        timestamp: createdRequests[2].checkInTime,
      }
    );

    // Log for Checked-Out
    logs.push(
      {
        visitRequest: createdRequests[3]._id,
        action: ACTIVITY_ACTIONS.CREATED,
        performedBy: receptionistUser._id,
        remarks: 'Visitor registered',
        timestamp: yesterday,
      },
      {
        visitRequest: createdRequests[3]._id,
        action: ACTIVITY_ACTIONS.APPROVED,
        performedBy: empUsersMap['Alice Smith'].user._id,
        remarks: 'Approved',
        timestamp: createdRequests[3].decidedAt,
      },
      {
        visitRequest: createdRequests[3]._id,
        action: ACTIVITY_ACTIONS.CHECKED_IN,
        performedBy: receptionistUser._id,
        remarks: 'Checked in',
        timestamp: createdRequests[3].checkInTime,
      },
      {
        visitRequest: createdRequests[3]._id,
        action: ACTIVITY_ACTIONS.CHECKED_OUT,
        performedBy: receptionistUser._id,
        remarks: 'Checked out & badge returned',
        timestamp: createdRequests[3].checkOutTime,
      }
    );

    // Log for Rejected
    logs.push(
      {
        visitRequest: createdRequests[4]._id,
        action: ACTIVITY_ACTIONS.CREATED,
        performedBy: receptionistUser._id,
        remarks: 'Visitor registered',
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        visitRequest: createdRequests[4]._id,
        action: ACTIVITY_ACTIONS.REJECTED,
        performedBy: empUsersMap['Bob Jones'].user._id,
        remarks: 'Host employee unavailable today',
        timestamp: createdRequests[4].decidedAt,
      }
    );

    await ActivityLog.insertMany(logs);
    console.log('✅ Sample Security Audit Trail Activity Logs created');

    console.log('\n🚀 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('🔐 Quick Credentials:');
    console.log('  - Admin:        admin@visitorone.com        / Admin@123');
    console.log('  - Receptionist: reception@visitorone.com    / Reception@123');
    console.log('  - Alice (Dev):  alice.smith@visitorone.com  / Employee@123');
    console.log('  - Bob (HR):     bob.jones@visitorone.com    / Employee@123');
    console.log('  - Charlie (Ops):charlie.brown@visitorone.com / Employee@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

connectDB().then(seedData);
