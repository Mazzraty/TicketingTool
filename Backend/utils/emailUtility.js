import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, ticketData) => {
  try {
    console.log("📧 EMAIL FUNCTION CALLED");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP VERIFIED");

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `<h2>${ticketData.title}</h2>`,
    });

    console.log("✅ EMAIL SENT:", result.messageId);

  } catch (err) {
    console.log("❌ EMAIL ERROR:");
    console.log(err.message);
  }
};