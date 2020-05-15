const mailgun = require('mailgun-js');

const sendEmail = async (options) => {
  const mg = mailgun({
    apiKey: `${process.env.MAILGUN_APIKEY}`,
    domain: `${process.env.MAILGUN_DOMAIN}`,
  });
  // send mail with defined transport object
  console.log(process.env.MAILGUN_DOMAIN);
  const data = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: 'discountappgroup@gmail.com',
    subject: options.subject,
    html: options.html,
  };
  await mg.messages().send(data, function (error, body) {
    console.log(body);
  });
};

module.exports = sendEmail;
