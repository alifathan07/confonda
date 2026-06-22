import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "confonda@gmail.com",
    pass: "nxwk mycf vzyp ibdl",
  },
});

export const sendEmail = async ({ subject, to, text, html, attachments }) => {
  try {
    const mailOptions = {
      from: '"CONFONDA" <confonda@gmail.com>', // improved sender format
      to,
      subject,
      text,
      html,
      attachments,
    };

    await mailTransporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
};
