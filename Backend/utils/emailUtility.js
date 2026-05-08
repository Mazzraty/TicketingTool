import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (to, subject, ticketData) => {
  try {
    const transporter = createTransporter();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials missing in env");
    }

    await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
      <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

          <h2 style="color:#dc2626;">🚨 New Support Ticket</h2>

          <p>A new issue has been reported.</p>

          <hr />

          <h3>📌 Ticket Information</h3>

          <p><b>User:</b> ${ticketData.userEmail || "Unknown"}</p>
          <p><b>Title:</b> ${ticketData.title || "-"}</p>
          <p><b>Description:</b> ${ticketData.description || "-"}</p>
          <p><b>Department:</b> ${ticketData.department || "-"}</p>
          <p><b>Priority:</b> ${ticketData.priority || "Medium"}</p>
          <p><b>Status:</b> ${ticketData.status || "Open"}</p>

        </div>
      </div>
      `,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email Error:", error.message);
  }
};