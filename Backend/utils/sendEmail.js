import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: {
        email: process.env.EMAIL_FROM,
        name: "HelpyFy System",
      },
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent via SendGrid");
  } catch (error) {
    console.error("❌ SendGrid Error:", error.message);
    throw error;
  }
};

export default sendEmail;