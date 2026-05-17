import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ===============================
// 📨 EMAIL TEMPLATE
// ===============================
const buildEmailHtml = (ticketData = {}) => `
  <div style="font-family:Arial, sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

      <h2 style="color:#dc2626;">
        🚨 New Support Ticket
      </h2>

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
`;

// ===============================
// 📧 SEND EMAIL FUNCTION (SENDGRID)
// ===============================
export const sendEmail = async (to, subject, ticketData = {}) => {
  try {
    console.log("📧 SendGrid email triggered");

    const recipients = Array.isArray(to) ? to : [to];

    const msg = {
      to: recipients,
      from: {
        email: process.env.EMAIL_FROM, // your Gmail (verified in SendGrid)
        name: "IT Helpdesk System",
      },
      subject,
      html: buildEmailHtml(ticketData),
    };

    const response = await sgMail.send(msg);

    console.log("✅ Email sent via SendGrid");
    return response;
  } catch (error) {
    console.error("❌ SendGrid Error:", error.message);
    throw error;
  }
};
