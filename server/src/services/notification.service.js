const nodemailer = require('nodemailer');

// Initialize SMTP transporter if env configuration exists, otherwise null
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"VisitorOne Security" <noreply@visitorone.com>',
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
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    return false;
  }
};

const sendSMS = async ({ phone, message }) => {
  try {
    console.log(`[SMS MOCK DISPATCH] Phone: ${phone} | Msg: ${message}`);
    return true;
  } catch (err) {
    console.error(`[SMS ERROR] Failed to send SMS to ${phone}:`, err.message);
    return false;
  }
};

const notifyVisitorCreated = async (visitRequest, employee, visitor) => {
  if (employee && employee.email) {
    const subject = `[VisitorOne] Action Required: New Visitor Request from ${visitor.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Visitor Access Request Pending Approval</h2>
        <p>Hello <strong>${employee.name}</strong>,</p>
        <p>A new visitor pass has been requested for your approval:</p>
        <ul>
          <li><strong>Visitor:</strong> ${visitor.name} (${visitor.company || 'N/A'})</li>
          <li><strong>Phone:</strong> ${visitor.phone}</li>
          <li><strong>Purpose:</strong> ${visitRequest.purpose}</li>
          <li><strong>Date & Time:</strong> ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime}</li>
        </ul>
        <p>Please log in to your VisitorOne portal to approve or reject this request.</p>
      </div>
    `;
    await sendEmail({ to: employee.email, subject, html });
  }

  if (visitor && visitor.phone) {
    await sendSMS({
      phone: visitor.phone,
      message: `VisitorOne: Your pass request for ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime} has been submitted for host approval.`,
    });
  }
};

const notifyVisitorApproved = async (visitRequest, employee, visitor) => {
  if (visitor && visitor.email) {
    const subject = `[VisitorOne] Pass Approved! Access Code: #${visitRequest._id.toString().slice(-6).toUpperCase()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #059669;">Visitor Access Pass Approved</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>Your visit request to meet <strong>${employee ? employee.name : 'Host'}</strong> has been approved!</p>
        <p><strong>Pass ID:</strong> #${visitRequest._id.toString().slice(-6).toUpperCase()}</p>
        <p><strong>Scheduled Date:</strong> ${visitRequest.visitDateString} at ${visitRequest.expectedArrivalTime}</p>
        <p>Please present this Pass ID or barcode at the security desk upon arrival.</p>
      </div>
    `;
    await sendEmail({ to: visitor.email, subject, html });
  }

  if (visitor && visitor.phone) {
    await sendSMS({
      phone: visitor.phone,
      message: `VisitorOne Pass APPROVED! Pass ID: #${visitRequest._id.toString().slice(-6).toUpperCase()} for ${visitRequest.visitDateString}. Show this at security upon arrival.`,
    });
  }
};

const notifyVisitorRejected = async (visitRequest, employee, visitor, remarks) => {
  if (visitor && visitor.email) {
    const subject = `[VisitorOne] Update regarding your visit request`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #dc2626;">Visit Request Decision Notice</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>Your visit request to meet ${employee ? employee.name : 'Host'} for ${visitRequest.visitDateString} could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${remarks || 'No reason specified'}</p>
      </div>
    `;
    await sendEmail({ to: visitor.email, subject, html });
  }
};

const notifyVisitorCheckedIn = async (visitRequest, employee, visitor) => {
  if (employee && employee.email) {
    const subject = `[VisitorOne] ALERT: Your Visitor ${visitor.name} Has Checked In`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #0891b2;">Visitor Arrival Alert</h2>
        <p>Hello <strong>${employee.name}</strong>,</p>
        <p>Your visitor <strong>${visitor.name}</strong> has checked in at the main entrance security desk.</p>
        <p><strong>Check-in Time:</strong> ${new Date(visitRequest.checkInTime).toLocaleTimeString()}</p>
      </div>
    `;
    await sendEmail({ to: employee.email, subject, html });
  }

  if (employee && employee.phone) {
    await sendSMS({
      phone: employee.phone,
      message: `VisitorOne Alert: Your visitor ${visitor.name} has checked in at reception.`,
    });
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  notifyVisitorCreated,
  notifyVisitorApproved,
  notifyVisitorRejected,
  notifyVisitorCheckedIn,
};
