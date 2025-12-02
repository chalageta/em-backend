import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"EM Pharmaceutical" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,       
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully to:", to);

  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};
