//const nodemailer = require('nodemailer');
const mailgun = require('mailgun-js');

const mg = mailgun({
  apiKey: `${process.env.MAILGUN_APIKEY}`,
  domain: `${process.env.MAILGUN_DOMAIN}`,
});

const sendEmail = async (options) => {
  // send mail with defined transport object
  const data = {
    from: `<${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };
  await mg.messages().send(data, function (error, body) {
    console.log(body);
  });
};

module.exports = sendEmail;
