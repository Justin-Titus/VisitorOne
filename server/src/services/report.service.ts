import VisitRequest from '../models/VisitRequest.model';
import Employee from '../models/Employee.model';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { escapeRegex } from '../utils/helpers';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  range?: string;
  from?: string;
  to?: string;
}

export const getVisitorAnalytics = async (filters: ReportFilters = {}) => {
  const { startDate, endDate, department, range, from, to } = filters;
  const matchQuery: Record<string, unknown> = {};

  const effectiveStart = startDate ?? from;
  const effectiveEnd = endDate ?? to;

  if (range === 'today') {
    const today = new Date().toISOString().split('T')[0];
    matchQuery['visitDateString'] = today;
  } else if (range === 'week') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    matchQuery['visitDate'] = { $gte: startOfWeek };
  } else if (effectiveStart && effectiveEnd) {
    matchQuery['visitDateString'] = { $gte: effectiveStart, $lte: effectiveEnd };
  } else if (effectiveStart) {
    matchQuery['visitDateString'] = { $gte: effectiveStart };
  } else if (effectiveEnd) {
    matchQuery['visitDateString'] = { $lte: effectiveEnd };
  }

  if (department) {
    const matchingEmployees = await Employee.find({
      department: { $regex: escapeRegex(department), $options: 'i' },
    }).select('_id');
    matchQuery['employeeToVisit'] = { $in: matchingEmployees.map((e) => e._id) };
  }

  const [
    statusCounts,
    totalVisitors,
    deptBreakdown,
    hostBreakdown,
    durationAggr,
    hourlyAggr,
    dailyAggr,
  ] = await Promise.all([
    VisitRequest.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    VisitRequest.countDocuments(matchQuery),
    VisitRequest.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'employees', localField: 'employeeToVisit', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $group: { _id: '$emp.department', count: { $sum: 1 } } },
      { $project: { department: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    VisitRequest.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'employees', localField: 'employeeToVisit', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $group: { _id: '$emp.name', count: { $sum: 1 } } },
      { $project: { employeeName: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    VisitRequest.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'checked_out',
          checkInTime: { $exists: true, $ne: null },
          checkOutTime: { $exists: true, $ne: null },
        },
      },
      { $project: { durationMs: { $subtract: ['$checkOutTime', '$checkInTime'] } } },
      { $group: { _id: null, avgDurationMs: { $avg: '$durationMs' } } },
    ]),
    VisitRequest.aggregate([
      { $match: matchQuery },
      { $project: { hourStr: { $substr: ['$expectedArrivalTime', 0, 2] } } },
      { $group: { _id: '$hourStr', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    VisitRequest.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$visitDateString', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const countsMap = (statusCounts as Array<{ _id: string; count: number }>).reduce<
    Record<string, number>
  >((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const firstDuration = (durationAggr as Array<{ avgDurationMs: number }>)[0];
  const avgDurationMinutes =
    firstDuration && firstDuration.avgDurationMs > 0
      ? parseFloat((firstDuration.avgDurationMs / 60000).toFixed(1))
      : 0;

  const peakHoursBreakdown = (hourlyAggr as Array<{ _id: string; count: number }>).map(
    (item) => ({
      hour: item._id ? `${item._id}:00` : 'Unknown',
      count: item.count,
    }),
  );

  const dailyTrends = (dailyAggr as Array<{ _id: string; count: number }>).map(
    (item) => ({ date: item._id, count: item.count }),
  );

  return {
    summary: {
      total: totalVisitors,
      pending: countsMap['pending'] ?? 0,
      approved: countsMap['approved'] ?? 0,
      checkedIn: countsMap['checked_in'] ?? 0,
      checkedOut: countsMap['checked_out'] ?? 0,
      rejected: countsMap['rejected'] ?? 0,
      cancelled: countsMap['cancelled'] ?? 0,
    },
    countsByStatus: countsMap,
    byDepartment: deptBreakdown,
    byHost: hostBreakdown,
    avgDurationMinutes,
    peakHoursBreakdown,
    dailyTrends,
  };
};

export const generatePdfReport = async (filters: ReportFilters = {}): Promise<Buffer> => {
  const analytics = await getVisitorAnalytics(filters);

  const rawRequests = await VisitRequest.find({})
    .populate('visitor')
    .populate('employeeToVisit')
    .sort({ visitDate: -1 })
    .limit(100);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: Error) => reject(err));

    doc
      .fillColor('#4f46e5')
      .fontSize(22)
      .text('VisitorOne — Security Access Audit Report', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fillColor('#64748b')
      .fontSize(10)
      .text(
        `Generated on: ${new Date().toLocaleString()} | Enterprise Access Logs`,
        { align: 'center' },
      );
    doc.moveDown(1.5);

    doc.fillColor('#1e293b').fontSize(14).text('Summary Telemetry', { underline: true });
    doc.moveDown(0.5);

    const { summary, avgDurationMinutes } = analytics;
    doc.fontSize(10).fillColor('#334155');
    doc.text(`• Total Passes Issued: ${summary.total}`);
    doc.text(`• Completed Visits (Checked Out): ${summary.checkedOut}`);
    doc.text(`• Currently Active On-Premises: ${summary.checkedIn}`);
    doc.text(`• Pending Employee Approvals: ${summary.pending}`);
    doc.text(`• Rejected / Cancelled: ${summary.rejected + summary.cancelled}`);
    doc.text(`• Average Visit Duration: ${avgDurationMinutes} minutes`);
    doc.moveDown(1.5);

    if (analytics.byDepartment && analytics.byDepartment.length > 0) {
      doc
        .fillColor('#1e293b')
        .fontSize(14)
        .text('Department Traffic Breakdown', { underline: true });
      doc.moveDown(0.5);
      (analytics.byDepartment as Array<{ department: string; count: number }>)
        .slice(0, 10)
        .forEach((dept) => {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .text(`  ${dept.department ?? 'Unspecified'}: ${dept.count} visitors`);
        });
      doc.moveDown(1.5);
    }

    doc
      .fillColor('#1e293b')
      .fontSize(14)
      .text('Recent Visitor Access Registry', { underline: true });
    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .fillColor('#4f46e5')
      .text('ID           VISITOR NAME         HOST EMPLOYEE        DATE          STATUS');
    doc
      .fillColor('#cbd5e1')
      .text('----------------------------------------------------------------------------------');

    doc.fontSize(8).fillColor('#334155');
    rawRequests.forEach((req) => {
      const visitor = req.visitor as unknown as { name?: string } | null;
      const host = req.employeeToVisit as unknown as { name?: string } | null;
      const passId = `#${req._id.toString().slice(-6).toUpperCase()}`.padEnd(12);
      const visitorName = (visitor?.name ?? 'Unknown').substring(0, 18).padEnd(20);
      const hostName = (host?.name ?? 'Unknown').substring(0, 18).padEnd(20);
      const vDate = (req.visitDateString ?? '').padEnd(12);
      const status = (req.status ?? '').toUpperCase();
      doc.text(`${passId} ${visitorName} ${hostName} ${vDate} ${status}`);
    });

    doc.end();
  });
};

export const generateExcelReport = async (filters: ReportFilters = {}) => {
  const analytics = await getVisitorAnalytics(filters);

  const rawRequests = await VisitRequest.find({})
    .populate('visitor')
    .populate('employeeToVisit')
    .sort({ visitDate: -1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VisitorOne System';
  workbook.created = new Date();

  const sheet1 = workbook.addWorksheet('Visitor Registry');
  sheet1.columns = [
    { header: 'Pass ID', key: 'passId', width: 15 },
    { header: 'Visitor Name', key: 'visitorName', width: 22 },
    { header: 'Phone Number', key: 'phone', width: 16 },
    { header: 'Company', key: 'company', width: 20 },
    { header: 'Host Employee', key: 'hostName', width: 22 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Purpose of Visit', key: 'purpose', width: 25 },
    { header: 'Visit Date', key: 'visitDate', width: 14 },
    { header: 'Expected Arrival', key: 'expectedTime', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Check In Time', key: 'checkInTime', width: 20 },
    { header: 'Check Out Time', key: 'checkOutTime', width: 20 },
  ];

  sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet1.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' },
  };

  rawRequests.forEach((req) => {
    const visitor = req.visitor as unknown as {
      name?: string;
      phone?: string;
      company?: string;
    } | null;
    const host = req.employeeToVisit as unknown as {
      name?: string;
      department?: string;
    } | null;

    sheet1.addRow({
      passId: `#${req._id.toString().slice(-6).toUpperCase()}`,
      visitorName: visitor?.name ?? 'N/A',
      phone: visitor?.phone ?? 'N/A',
      company: visitor?.company ?? 'N/A',
      hostName: host?.name ?? 'N/A',
      department: host?.department ?? 'N/A',
      purpose: req.purpose ?? 'N/A',
      visitDate: req.visitDateString ?? 'N/A',
      expectedTime: req.expectedArrivalTime ?? 'N/A',
      status: (req.status ?? '').toUpperCase(),
      checkInTime: req.checkInTime
        ? new Date(req.checkInTime).toLocaleString()
        : 'N/A',
      checkOutTime: req.checkOutTime
        ? new Date(req.checkOutTime).toLocaleString()
        : 'N/A',
    });
  });

  const sheet2 = workbook.addWorksheet('Analytics Summary');
  sheet2.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet2.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' },
  };

  const { summary, avgDurationMinutes } = analytics;
  sheet2.addRow({ metric: 'Total Passes Issued', value: summary.total });
  sheet2.addRow({ metric: 'Completed Visits', value: summary.checkedOut });
  sheet2.addRow({ metric: 'Currently On-Premises', value: summary.checkedIn });
  sheet2.addRow({ metric: 'Pending Approvals', value: summary.pending });
  sheet2.addRow({ metric: 'Rejected / Cancelled', value: summary.rejected + summary.cancelled });
  sheet2.addRow({ metric: 'Average Visit Duration (min)', value: avgDurationMinutes });

  return workbook.xlsx.writeBuffer();
};

export const getSummaryReport = (
  range?: string,
  from?: string,
  to?: string,
) => getVisitorAnalytics({ range, from, to });
