import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendEmail = async (to: string, html: string) => {
  await transporter.sendMail({
    from: `"Cook-E" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Αλλαγή κωδικού πρόσβασης',
    html,
  });
};
