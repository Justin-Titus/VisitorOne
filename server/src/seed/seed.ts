import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import Visitor from '../models/Visitor.model';
import VisitRequest from '../models/VisitRequest.model';
import ActivityLog from '../models/ActivityLog.model';
import { ROLES, EMPLOYEE_STATUS, VISIT_STATUS, ACTIVITY_ACTIONS } from '../utils/constants';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env['MONGO_URI'] as string);
    console.log('⚡ MongoDB Connected for Rich Seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async (): Promise<void> => {
  try {
    // Clear all existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Visitor.deleteMany({});
    await VisitRequest.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('🧹 Cleared existing Database collections');

    // 1. Create Core Administrative & Gate Staff Users
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@visitorone.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
    });

    const receptionistUser = await User.create({
      name: 'Front Desk Receptionist',
      email: 'reception@visitorone.com',
      password: 'Reception@123',
      role: ROLES.RECEPTIONIST,
    });

    // 2. Create Staff Employees Across 5 Departments
    const employeesData = [
      { name: 'Alice Smith', employeeCode: 'EMP001', department: 'Engineering', designation: 'Senior Principal Architect', email: 'alice.smith@visitorone.com', phone: '9876543210', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Bob Jones', employeeCode: 'EMP002', department: 'Human Resources', designation: 'HR Director', email: 'bob.jones@visitorone.com', phone: '9876543211', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Charlie Brown', employeeCode: 'EMP003', department: 'Operations', designation: 'VP of Operations', email: 'charlie.brown@visitorone.com', phone: '9876543212', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Diana Prince', employeeCode: 'EMP004', department: 'Marketing', designation: 'Chief Marketing Officer', email: 'diana.prince@visitorone.com', phone: '9876543213', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Ethan Hunt', employeeCode: 'EMP005', department: 'Security & Facilities', designation: 'Head of Physical Security', email: 'ethan.hunt@visitorone.com', phone: '9876543214', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Fiona Gallagher', employeeCode: 'EMP006', department: 'Finance', designation: 'Financial Controller', email: 'fiona.gallagher@visitorone.com', phone: '9876543215', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'George Clark', employeeCode: 'EMP007', department: 'Engineering', designation: 'DevOps Lead', email: 'george.clark@visitorone.com', phone: '9876543216', status: EMPLOYEE_STATUS.ACTIVE },
      { name: 'Hannah Abbott', employeeCode: 'EMP008', department: 'Legal', designation: 'General Counsel', email: 'hannah.abbott@visitorone.com', phone: '9876543217', status: EMPLOYEE_STATUS.ACTIVE },
    ];

    const createdEmployees = await Employee.insertMany(employeesData);
    console.log(`✅ ${createdEmployees.length} Staff Employees created across 6 departments`);

    // Create User accounts for Employees
    const empUsersMap: Record<string, { user: typeof adminUser; employee: (typeof createdEmployees)[0] }> = {};
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

    // 3. Create Expanded Visitor Directory
    const visitorsData = [
      { name: 'John Doe', phone: '9811122334', email: 'john.doe@techcorp.io', company: 'TechCorp Solutions', idProofType: 'aadhar', idProofNumber: '1234-5678-9012' },
      { name: 'Sarah Connor', phone: '9822233445', email: 'sarah.c@cyberdyne.com', company: 'Cyberdyne Systems', idProofType: 'passport', idProofNumber: 'A1234567' },
      { name: 'David Miller', phone: '9833344556', email: 'david.m@acme.com', company: 'Acme Industries', idProofType: 'driving_license', idProofNumber: 'DL-987654321' },
      { name: 'Elena Rostova', phone: '9844455667', email: 'elena.r@globallogistics.com', company: 'Global Logistics Corp', idProofType: 'voter_id', idProofNumber: 'VTR88776655' },
      { name: 'Michael Vance', phone: '9855566778', email: 'michael.v@apex.org', company: 'Apex Innovations', idProofType: 'aadhar', idProofNumber: '5566-7788-9900' },
      { name: 'Robert Langdon', phone: '9866677889', email: 'robert@symbology.edu', company: 'Harvard Research', idProofType: 'passport', idProofNumber: 'P9988776' },
      { name: 'Clara Oswald', phone: '9877788990', email: 'clara@tardis.uk', company: 'Coal Hill Media', idProofType: 'driving_license', idProofNumber: 'DL-445566' },
      { name: 'Victor Stone', phone: '9888899001', email: 'victor@star-labs.com', company: 'S.T.A.R. Labs', idProofType: 'aadhar', idProofNumber: '9900-1122-3344' },
      { name: 'Arthur Dent', phone: '9899900112', email: 'arthur@hitchhiker.org', company: 'Sub-Etha Media', idProofType: 'voter_id', idProofNumber: 'VTR112233' },
      { name: 'Bruce Wayne', phone: '9800011223', email: 'bruce@wayneenterprises.com', company: 'Wayne Enterprises', idProofType: 'passport', idProofNumber: 'BW-007007' },
      { name: 'Peter Parker', phone: '9812345678', email: 'peter@dailybugle.com', company: 'Daily Bugle Press', idProofType: 'driving_license', idProofNumber: 'DL-778899' },
      { name: 'Tony Stark', phone: '9823456789', email: 'tony@starkindustries.com', company: 'Stark Tech Global', idProofType: 'passport', idProofNumber: 'ST-100100' },
      { name: 'Natasha Romanoff', phone: '9834567890', email: 'natasha@shield.gov', company: 'S.H.I.E.L.D. Agency', idProofType: 'passport', idProofNumber: 'SH-909090' },
      { name: 'Clark Kent', phone: '9845678901', email: 'clark@metropolis.com', company: 'Daily Planet', idProofType: 'voter_id', idProofNumber: 'VTR554433' },
      { name: 'Wanda Maximoff', phone: '9856789012', email: 'wanda@westview.io', company: 'Hex Media Labs', idProofType: 'aadhar', idProofNumber: '7766-5544-3322' },
    ];

    const createdVisitors = await Visitor.insertMany(visitorsData);
    console.log(`✅ ${createdVisitors.length} Sample Visitors created`);

    // 4. Create Historical & Current Visit Requests Across Past 10 Days
    const logsData: Array<{
      visitRequest: mongoose.Types.ObjectId;
      action: string;
      performedBy: mongoose.Types.ObjectId;
      remarks: string;
      timestamp: Date | null;
    }> = [];

    const purposes = [
      'Technical Architecture Review',
      'Executive Hiring Interview',
      'Annual Facility Compliance Audit',
      'Vendor Onboarding & Contract Signing',
      'Strategic Partnership Discussion',
      'Equipment Maintenance & Inspection',
      'Financial Portfolio Review',
      'Legal Consultation & Compliance',
      'Media Press Conference Briefing',
      'System Security & Access Evaluation',
    ];

    const arrivalTimes = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:15', '13:00', '14:00', '14:30', '15:15', '16:00', '17:00'];

    const now = new Date();

    // Generate requests for last 10 days up to today
    for (let dayOffset = 10; dayOffset >= 0; dayOffset--) {
      const vDate = new Date();
      vDate.setDate(now.getDate() - dayOffset);
      const vDateStr = vDate.toISOString().split('T')[0] as string;

      const countForDay = dayOffset === 0 ? 6 : Math.floor(3 + Math.random() * 4);

      for (let i = 0; i < countForDay; i++) {
        const visitorIndex = (dayOffset * 3 + i) % createdVisitors.length;
        const employeeObj = createdEmployees[(i + dayOffset) % createdEmployees.length];
        const hostUser = empUsersMap[employeeObj.name as string]?.user;
        const visitorObj = createdVisitors[visitorIndex];
        const purpose = purposes[(i + dayOffset) % purposes.length] as string;
        const expectedTime = arrivalTimes[(i * 2 + dayOffset) % arrivalTimes.length] as string;

        let status: string;
        if (dayOffset > 0) {
          const pastStatuses = [VISIT_STATUS.CHECKED_OUT, VISIT_STATUS.CHECKED_OUT, VISIT_STATUS.CHECKED_OUT, VISIT_STATUS.REJECTED, VISIT_STATUS.CANCELLED];
          status = pastStatuses[(i + dayOffset) % pastStatuses.length] as string;
        } else {
          const todayStatuses = [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.APPROVED, VISIT_STATUS.PENDING, VISIT_STATUS.CHECKED_OUT, VISIT_STATUS.REJECTED];
          status = todayStatuses[i % todayStatuses.length] as string;
        }

        const createdAt = new Date(vDate.valueOf() - 3600000 * 24);

        let checkInTime: Date | null = null;
        let checkOutTime: Date | null = null;
        let decidedAt: Date | null = null;
        let remarks: string | undefined;

        if (status !== VISIT_STATUS.PENDING) {
          decidedAt = new Date(vDate.valueOf() + 3600000 * 1);
        }

        if (status === VISIT_STATUS.CHECKED_IN || status === VISIT_STATUS.CHECKED_OUT) {
          const [h, m] = expectedTime.split(':').map(Number);
          checkInTime = new Date(vDate);
          checkInTime.setHours(h as number, m as number, 0, 0);
        }

        if (status === VISIT_STATUS.CHECKED_OUT && checkInTime) {
          const durationHours = 1 + (i % 3);
          checkOutTime = new Date(checkInTime.valueOf() + 3600000 * durationHours);
          remarks = 'Visit completed successfully. Visitor badge returned.';
        } else if (status === VISIT_STATUS.REJECTED) {
          remarks = 'Host employee had a scheduling conflict.';
        } else if (status === VISIT_STATUS.APPROVED) {
          remarks = 'Approved for conference room meeting.';
        } else if (status === VISIT_STATUS.CHECKED_IN) {
          remarks = 'Checked in at main entrance security desk.';
        }

        const visitReq = new VisitRequest({
          visitor: visitorObj?._id,
          employeeToVisit: employeeObj._id,
          purpose,
          visitDate: vDate,
          visitDateString: vDateStr,
          expectedArrivalTime: expectedTime,
          status,
          createdBy: receptionistUser._id,
          approvedBy:
            status === VISIT_STATUS.APPROVED ||
            status === VISIT_STATUS.CHECKED_IN ||
            status === VISIT_STATUS.CHECKED_OUT
              ? hostUser?._id
              : undefined,
          rejectedBy: status === VISIT_STATUS.REJECTED ? hostUser?._id : undefined,
          decidedAt,
          checkInTime,
          checkOutTime,
          remarks,
          createdAt,
        });

        const savedReq = await visitReq.save();

        logsData.push({
          visitRequest: savedReq._id,
          action: ACTIVITY_ACTIONS.CREATED,
          performedBy: receptionistUser._id,
          remarks: 'Visitor pass created',
          timestamp: createdAt,
        });

        if (
          status === VISIT_STATUS.APPROVED ||
          status === VISIT_STATUS.CHECKED_IN ||
          status === VISIT_STATUS.CHECKED_OUT
        ) {
          logsData.push({
            visitRequest: savedReq._id,
            action: ACTIVITY_ACTIONS.APPROVED,
            performedBy: hostUser?._id,
            remarks: 'Pass approved by host employee',
            timestamp: decidedAt,
          });
        }

        if (status === VISIT_STATUS.REJECTED) {
          logsData.push({
            visitRequest: savedReq._id,
            action: ACTIVITY_ACTIONS.REJECTED,
            performedBy: hostUser?._id,
            remarks: remarks ?? 'Rejected',
            timestamp: decidedAt,
          });
        }

        if (status === VISIT_STATUS.CHECKED_IN || status === VISIT_STATUS.CHECKED_OUT) {
          logsData.push({
            visitRequest: savedReq._id,
            action: ACTIVITY_ACTIONS.CHECKED_IN,
            performedBy: receptionistUser._id,
            remarks: 'Visitor checked in at front desk',
            timestamp: checkInTime,
          });
        }

        if (status === VISIT_STATUS.CHECKED_OUT) {
          logsData.push({
            visitRequest: savedReq._id,
            action: ACTIVITY_ACTIONS.CHECKED_OUT,
            performedBy: receptionistUser._id,
            remarks: 'Visitor checked out',
            timestamp: checkOutTime,
          });
        }
      }
    }

    console.log(`✅ Visit Requests & ${logsData.length} Activity Log Entries created!`);

    await ActivityLog.insertMany(logsData);
    console.log('✅ Audit Trail Logs populated successfully!');

    console.log('\n🚀 RICH SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('🔐 Access Quick Credentials:');
    console.log('  - Admin:        admin@visitorone.com        / Admin@123');
    console.log('  - Receptionist: reception@visitorone.com    / Reception@123');
    console.log('  - Alice (Eng):  alice.smith@visitorone.com  / Employee@123');
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
