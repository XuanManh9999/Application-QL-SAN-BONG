const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  const instance = getTransporter();

  if (!instance) {
    console.warn("SMTP not configured. Skip sending email.");
    return;
  }

  await instance.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
  });
};

module.exports = {
  sendMail,
};
