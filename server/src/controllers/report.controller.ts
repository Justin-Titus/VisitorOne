import asyncHandler from '../utils/asyncHandler';
import * as reportService from '../services/report.service';
import { ApiResponse } from '../utils/ApiResponse';

export const getVisitorAnalytics = asyncHandler(async (req, res) => {
  const data = await reportService.getVisitorAnalytics(
    req.query as Record<string, string>,
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, 'Visitor analytics report fetched successfully'));
});

export const getSummary = asyncHandler(async (req, res) => {
  const { range, from, to } = req.query as Record<string, string | undefined>;
  const data = await reportService.getSummaryReport(range, from, to);
  res.status(200).json(new ApiResponse(200, data, 'Summary report fetched successfully'));
});

export const exportPdf = asyncHandler(async (req, res) => {
  const pdfBuffer = await reportService.generatePdfReport(
    req.query as Record<string, string>,
  );
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=VisitorOne_Security_Report_${Date.now()}.pdf`,
  );
  res.send(pdfBuffer);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const excelBuffer = await reportService.generateExcelReport(
    req.query as Record<string, string>,
  );
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=VisitorOne_Visitor_Registry_${Date.now()}.xlsx`,
  );
  res.send(excelBuffer);
});
