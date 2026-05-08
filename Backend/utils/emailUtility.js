// utils/emailUtility.js

import nodemailer from "nodemailer";

// ===============================
// 🔌 CREATE TRANSPORTER
// ===============================
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password ONLY
    },
  });
};

// ===============================
// 📧 SEND EMAIL FUNCTION
// ===============================
export const sendEmail = async (to, subject, ticketData = {}) => {
  try {
    console.log("📧 sendEmail triggered");
    console.log("TO:", to);
    console.log("FROM:", process.env.EMAIL_USER);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
    }

    const transporter = createTransporter();

    // ===============================
    // 🔥 VERIFY SMTP BEFORE SENDING
    // ===============================
    await transporter.verify();
    console.log("✅ SMTP Verified successfully");

    // ===============================
    // 📤 SEND MAIL
    // ===============================
    const result = await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
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

            <small style="color:#999;">
              IT Helpdesk Notification System
            </small>

          </div>
        </div>
      `,
    });

    console.log("📨 Email sent successfully:", result.messageId);

    return result;

  } catch (error) {
    console.error("❌ EMAIL ERROR:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    throw error;
  }
};