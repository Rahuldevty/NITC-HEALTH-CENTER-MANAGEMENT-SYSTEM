require("dotenv").config();
const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const tx = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  return tx.sendMail({ from, to, subject, html, text });
}

function formatApptDate(date, time) {
  try {
    const d = new Date(date);
    return `${d.toDateString()} at ${time}`;
  } catch (_) {
    return `${date} ${time}`;
  }
}

async function sendAppointmentConfirmation({
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime,
  purpose,
}) {
  const subject = "Appointment Confirmation - NITC Health Centre";
  const when = formatApptDate(appointmentDate, appointmentTime);
  const html = `
    <h2>Appointment Confirmed</h2>
    <p>Dear ${patientName || "User"},</p>
    <p>Your appointment has been scheduled with <strong>Dr. ${doctorName}</strong>.</p>
    <ul>
      <li><strong>When:</strong> ${when}</li>
      <li><strong>Purpose:</strong> ${purpose || "Consultation"}</li>
    </ul>
    <p>Please arrive 10 minutes early with your health card.</p>
  `;
  return sendEmail({
    to: patientEmail,
    subject,
    html,
    text: `Appointment with Dr. ${doctorName} on ${when}`,
  });
}

async function sendAppointmentReminder({
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime,
  purpose,
}) {
  const subject = "Appointment Reminder - NITC Health Centre";
  const when = formatApptDate(appointmentDate, appointmentTime);
  const html = `
    <h2>Appointment Reminder</h2>
    <p>Dear ${patientName || "User"},</p>
    <p>This is a reminder for your upcoming appointment with <strong>Dr. ${doctorName}</strong>.</p>
    <ul>
      <li><strong>When:</strong> ${when}</li>
      <li><strong>Purpose:</strong> ${purpose || "Consultation"}</li>
    </ul>
  `;
  return sendEmail({
    to: patientEmail,
    subject,
    html,
    text: `Reminder: Dr. ${doctorName} on ${when}`,
  });
}

async function sendBroadcastEmail({
  recipients,
  subject,
  messageHtml,
  messageText,
}) {
  const tx = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  // Send as BCC to protect privacy
  return tx.sendMail({
    from,
    to: from,
    bcc: recipients,
    subject,
    html: messageHtml,
    text: messageText,
  });
}

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendBroadcastEmail,
};









