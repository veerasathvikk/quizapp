const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
