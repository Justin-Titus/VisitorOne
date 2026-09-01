import nodemailer from 'nodemailer';
import { NotificationEmailPayload, NotificationSmsPayload } from '../types';

// Initialize SMTP transporter if env configuration exists, otherwise null
let transporter: nodemailer.Transporter | null = null;
if (process.env['SMTP_HOST'] && process.env['SMTP_USER']) {
  transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: NotificationEmailPayload): Promise<boolean> => {
  try {
    if (transporter) {
      await transporter.sendMail({
        from:
          process.env['SMTP_FROM'] ?? '"VisitorOne Security" <noreply@visitorone.com>',
        to,
        subject,
        html,
        text,
      });
      console.log(`[EMAIL DISPATCHED] To: ${to} | Subject: ${subject}`);
    } else {
      console.log(`[EMAIL MOCK DISPATCH] To: ${to} | Subject: ${subject}`);
    }
    return true;
  } catch (err) {
    console.error(
      `[EMAIL ERROR] Failed to send email to ${to}:`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
};

export const sendSMS = async ({
  phone,
  message,
}: NotificationSmsPayload): Promise<boolean> => {
  try {
    console.log(`[SMS MOCK DISPATCH] Phone: ${phone} | Msg: ${message}`);
    return true;
  } catch (err) {
    console.error(
      `[SMS ERROR] Failed to send SMS to ${phone}:`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
};

interface VisitRequestLike {
  _id: { toString(): string };
  purpose: string;
  visitDateString: string;
  expectedArrivalTime: string;
  checkInTime?: Date;
}

interface EmployeeLike {
  name: string;
  email?: string;
  phone?: string;
}

interface VisitorLike {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export const notifyVisitorCreated = async (
  visitRequest: VisitRequestLike,
  employee: EmployeeLike | null,
  visitor: VisitorLike,
): Promise<void> => {
  if (employee?.email) {
    const subject = `[VisitorOne] Action Required: New Visitor Request from ${visitor.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Visitor Access Request Pending Approval</h2>
        <p>Hello <strong>${employee.name}</strong>,</p>
        <p>A new visitor pass has been requested for your approval:</p>
        <ul>
          <li><strong>Visitor:</strong> ${visitor.name} (${visitor.company ?? 'N/A'})</li>
          <li><strong>Phone:</strong> ${visitor.phone ?? 'N/A'}</li>
          <li><strong>Purpose:</strong> ${visitRequest.purpose}</li>
          <li><strong>Date &amp; Time:</strong> ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime}</li>
        </ul>
        <p>Please log in to your VisitorOne portal to approve or reject this request.</p>
      </div>
    `;
    await sendEmail({ to: employee.email, subject, html });
  }

  if (visitor.phone) {
    await sendSMS({
      phone: visitor.phone,
      message: `VisitorOne: Your pass request for ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime} has been submitted for host approval.`,
    });
  }
};

export const notifyVisitorApproved = async (
  visitRequest: VisitRequestLike,
  employee: EmployeeLike | null,
  visitor: VisitorLike,
): Promise<void> => {
  const passId = `#${visitRequest._id.toString().slice(-6).toUpperCase()}`;

  if (visitor.email) {
    const subject = `[VisitorOne] Pass Approved! Access Code: ${passId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #059669;">Visitor Access Pass Approved</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>Your visit request to meet <strong>${employee ? employee.name : 'Host'}</strong> has been approved!</p>
        <p><strong>Pass ID:</strong> ${passId}</p>
        <p><strong>Scheduled Date:</strong> ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime}</p>
        <p>Please present this Pass ID or barcode at the security desk upon arrival.</p>
      </div>
    `;
    await sendEmail({ to: visitor.email, subject, html });
  }

  if (visitor.phone) {
    await sendSMS({
      phone: visitor.phone,
      message: `VisitorOne Pass APPROVED! Pass ID: ${passId} for ${visitRequest.visitDateString}. Show this at security upon arrival.`,
    });
  }
};

export const notifyVisitorRejected = async (
  visitRequest: VisitRequestLike,
  employee: EmployeeLike | null,
  visitor: VisitorLike,
  remarks?: string,
): Promise<void> => {
  if (visitor.email) {
    const subject = `[VisitorOne] Update regarding your visit request`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #dc2626;">Visit Request Decision Notice</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>Your visit request to meet ${employee ? employee.name : 'Host'} for ${visitRequest.visitDateString} could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${remarks ?? 'No reason specified'}</p>
      </div>
    `;
    await sendEmail({ to: visitor.email, subject, html });
  }
};

export const notifyVisitorCheckedIn = async (
  visitRequest: VisitRequestLike,
  employee: EmployeeLike | null,
  visitor: VisitorLike,
): Promise<void> => {
  if (employee?.email) {
    const subject = `[VisitorOne] ALERT: Your Visitor ${visitor.name} Has Checked In`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #0891b2;">Visitor Arrival Alert</h2>
        <p>Hello <strong>${employee.name}</strong>,</p>
        <p>Your visitor <strong>${visitor.name}</strong> has checked in at the main entrance security desk.</p>
        <p><strong>Check-in Time:</strong> ${visitRequest.checkInTime ? new Date(visitRequest.checkInTime).toLocaleTimeString() : 'N/A'}</p>
      </div>
    `;
    await sendEmail({ to: employee.email, subject, html });
  }

  if (employee?.phone) {
    await sendSMS({
      phone: employee.phone,
      message: `VisitorOne Alert: Your visitor ${visitor.name} has checked in at reception.`,
    });
  }
};
