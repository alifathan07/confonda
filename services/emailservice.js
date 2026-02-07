import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "confonda@gmail.com",
    pass: "kxdl rgui vvxw eyfw",
  },
});

export const sendEmail = async ({subject, to, text, attachments}) => {
    try {
        const mailOptions = {
            from: "CONFONDA",
            to,
            subject,
            text,
            attachments,
        };
        
        await mailTransporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error in sendEmail:', error);
        return { success: false, error: error.message || "Erreur serveur" };
    }
};
