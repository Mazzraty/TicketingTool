// utils/emailUtility.js

import nodemailer from "nodemailer";

// ===============================
// 📧 CREATE GMAIL TRANSPORTER
// ===============================
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Google App Password
    },
  });
};

// ===============================
// 📨 EMAIL TEMPLATE
// ===============================
const buildEmailHtml = (ticketData = {}) => `
  <div style="font-family:Arial, sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

      <h2 style="color:#dc2626;">
        🚨 New Support Ticket
      </h2>

      <p>
        A new issue has been reported in your system.
      </p>

      <hr/>

      <h3>📌 Ticket Details</h3>

      <p>
        <b>User:</b>
        ${ticketData.userEmail || "Unknown"}
      </p>

      <p>
        <b>Title:</b>
        ${ticketData.title || "-"}
      </p>

      <p>
        <b>Description:</b>
        ${ticketData.description || "-"}
      </p>

      <p>
        <b>Department:</b>
        ${ticketData.department || "-"}
      </p>

      <p>
        <b>Priority:</b>
        ${ticketData.priority || "Medium"}
      </p>

      <p>
        <b>Status:</b>
        ${ticketData.status || "Open"}
      </p>

      <br/>

      <small style="color:#999;">
        IT Helpdesk Notification System
      </small>

    </div>
  </div>
`;

// ===============================
// 📧 SEND EMAIL FUNCTION
// ===============================
export const sendEmail = async (
  to,
  subject,
  ticketData = {}
) => {
  try {
    console.log("📧 sendEmail triggered");

    const recipients = Array.isArray(to)
      ? to
      : [to];

    console.log("Recipients:", recipients);

    // ===============================
    // ✅ CHECK ENV VARIABLES
    // ===============================
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      throw new Error(
        "Missing EMAIL_USER or EMAIL_PASS in environment variables"
      );
    }

    // ===============================
    // 📧 CREATE TRANSPORTER
    // ===============================
    const transporter = createGmailTransporter();

    // ===============================
    // 📨 BUILD HTML
    // ===============================
    const html = buildEmailHtml(ticketData);

    // ===============================
    // 📤 SEND EMAIL
    // ===============================
    const result = await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });

    console.log(
      "✅ Email sent successfully:",
      result.messageId
    );

    return result;
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error.message);
    console.error(error.stack);

    throw error;
  }
};