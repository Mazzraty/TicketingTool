// utils/emailUtility.js

import nodemailer from "nodemailer";

const createGmailTransporter = ({ port, secure }) => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const buildEmailHtml = (ticketData = {}) => `
  <div style="font-family:Arial, sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">
      <h2 style="color:#dc2626;">🚨 New Support Ticket</h2>
      <p>A new issue has been reported in your system.</p>
      <hr/>
      <h3>📌 Ticket Details</h3>
      <p><b>User:</b> ${ticketData.userEmail || "Unknown"}</p>
      <p><b>Title:</b> ${ticketData.title || "-"}</p>
      <p><b>Description:</b> ${ticketData.description || "-"}</p>
      <p><b>Department:</b> ${ticketData.department || "-"}</p>
      <p><b>Priority:</b> ${ticketData.priority || "Medium"}</p>
      <p><b>Status:</b> ${ticketData.status || "Open"}</p>
      <br/>
      <small style="color:#999;">IT Helpdesk Notification System</small>
    </div>
  </div>
`;

// ===============================
// 📧 SEND EMAIL FUNCTION
// ===============================
export const sendEmail = async (to, subject, ticketData = {}) => {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    console.log("📧 sendEmail triggered");
    console.log("Recipients:", recipients);

    const html = buildEmailHtml(ticketData);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
    }

    console.log("📨 Trying Gmail SMTP on port 465");
    let transporter = createGmailTransporter({ port: 465, secure: true });

    try {
      await transporter.verify();
      console.log("✅ SMTP verified successfully on port 465");
    } catch (verifyError) {
      console.error("⚠️ Gmail SMTP port 465 failed:", verifyError.message);
      console.log("📨 Trying Gmail SMTP on port 587");
      transporter = createGmailTransporter({ port: 587, secure: false });
      await transporter.verify();
      console.log("✅ SMTP verified successfully on port 587");
    }

    // ===============================
    // 📤 SEND MAIL
    // ===============================
    const result = await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });

    console.log("✅ Gmail email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error.message);
    if (error.response) {
      console.error("EMAIL RESPONSE:", error.response);
    }
    console.error(error.stack);
    throw error;
  }
};