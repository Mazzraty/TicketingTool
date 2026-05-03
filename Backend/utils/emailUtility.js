import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  console.error("Missing email credentials in environment:", {
    EMAIL_USER: Boolean(emailUser),
    EMAIL_PASS: Boolean(emailPass),
  });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass, // Google App Password
  },
});

export const sendEmail = async (to, subject, ticketData) => {
  try {
    await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
      <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

          <h2 style="color:#dc2626;">🚨 New Support Ticket</h2>

          <p style="color:#555;">
            A new issue has been reported in the IT Helpdesk system.
          </p>

          <hr style="margin:15px 0;" />

          <h3>📌 Ticket Information</h3>

          <table style="width:100%;font-size:14px;">
            <tr>
              <td><b>User:</b></td>
              <td>${ticketData.userEmail || "Unknown"}</td>
            </tr>
            <tr>
              <td><b>Title:</b></td>
              <td>${ticketData.title || "-"}</td>
            </tr>
            <tr>
              <td><b>Description:</b></td>
              <td>${ticketData.description || "-"}</td>
            </tr>
            <tr>
              <td><b>Department:</b></td>
              <td>${ticketData.department || "-"}</td>
            </tr>
            <tr>
              <td><b>Priority:</b></td>
              <td>${ticketData.priority || "Medium"}</td>
            </tr>
            <tr>
              <td><b>Status:</b></td>
              <td style="color:#f59e0b;"><b>${ticketData.status || "Open"}</b></td>
            </tr>
          </table>

          <div style="margin-top:20px;padding:10px;background:#fff3f3;border-left:4px solid #dc2626;">
            ⚡ Please check and resolve this ticket as soon as possible.
          </div>

          <p style="margin-top:30px;font-size:12px;color:#999;">
            © IT Helpdesk System
          </p>

        </div>
      </div>
      `,
    });

    console.log("✅ HTML Email sent successfully");
  } catch (error) {
    console.error("❌ Email Error:", error);
  }
};