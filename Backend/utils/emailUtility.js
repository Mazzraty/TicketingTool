import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, ticketData) => {
  try {
    const response = await resend.emails.send({
      from: "IT Helpdesk <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2>🚨 New Support Ticket</h2>

          <p><b>Title:</b> ${ticketData.title}</p>
          <p><b>Description:</b> ${ticketData.description}</p>
          <p><b>Department:</b> ${ticketData.department}</p>
          <p><b>Priority:</b> ${ticketData.priority}</p>
          <p><b>Status:</b> ${ticketData.status}</p>
          <p><b>User:</b> ${ticketData.userEmail}</p>
        </div>
      `,
    });

    console.log("✅ Email sent:", response);

  } catch (error) {
    console.log("❌ Email Error:", error);
  }
};