const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'novalabs.com.ng',
  port: 465,
  secure: true,
  auth: {
    user: 'hello@novalabs.com.ng',
    pass: 'Amalgamate1999@'
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP ERROR:', error);
  } else {
    console.log('SMTP SUCCESS!');
  }
});
