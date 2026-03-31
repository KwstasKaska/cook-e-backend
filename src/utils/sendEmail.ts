'use strict';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'a6oqhw5zazclae4h@ethereal.email',
    pass: 'PSfurFcPVYKdk2SRng',
  },
});

// async..await is not allowed in global scope, must use a wrapper
export const sendEmail = async (to: string, html: string) => {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"<cookE@gmail.com>', // sender address
    to: to,
    subject: 'Αλλαγή κωδικού πρόσβασης', // Subject line
    html, // html body
  });

  console.log('Message sent: %s', info.messageId);

  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};
