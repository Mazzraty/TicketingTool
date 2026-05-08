import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, ticketData) => {
  try {
    console.log("📧 EMAIL TRIGGERED");

    await transporter.sendMail({
      from: `"IT Helpdesk System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <h2>New Ticket</h2>
        <p><b>Title:</b> ${ticketData.title}</p>
        <p><b>Description:</b> ${ticketData.description}</p>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESS");

  } catch (error) {
    console.log("❌ EMAIL ERROR:");
    console.log(error);
  }
};