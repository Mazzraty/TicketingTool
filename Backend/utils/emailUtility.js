import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, ticketData) => {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL DEBUG START");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    // 1. ENV CHECK
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL credentials in .env");
    }

    // 2. CREATE TRANSPORTER
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("🔌 Verifying SMTP connection...");

    // 3. VERIFY CONNECTION (VERY IMPORTANT)
    await transporter.verify();
    console.log("✅ SMTP connection SUCCESS");

    // 4. SEND EMAIL
    console.log("📨 Sending email to:", to);

    const result = await transporter.sendMail({
      from: `"IT Helpdesk" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <h2>New Ticket</h2>
        <p><b>Title:</b> ${ticketData.title}</p>
        <p><b>Description:</b> ${ticketData.description}</p>
        <p><b>Priority:</b> ${ticketData.priority}</p>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", result.messageId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    return result;

  } catch (error) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("❌ EMAIL FAILED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    console.log("Error Name:", error.name);
    console.log("Error Message:", error.message);

    if (error.response) {
      console.log("SMTP Response:", error.response);
    }

    throw error;
  }
};