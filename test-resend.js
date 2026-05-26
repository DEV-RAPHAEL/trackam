const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const apiKeyLine = envContent.split('\n').find(line => line.trim().startsWith('RESEND_API_KEY='));
const apiKey = apiKeyLine.split('RESEND_API_KEY=')[1].trim().replace(/['"]/g, '');

const mailFromLine = envContent.split('\n').find(line => line.trim().startsWith('MAIL_FROM='));
const mailFrom = mailFromLine ? mailFromLine.split('MAIL_FROM=')[1].trim().replace(/['"]/g, '') : 'Trackam <onboarding@resend.dev>';

console.log('API Key:', apiKey);
console.log('Mail From:', mailFrom);

const resend = new Resend(apiKey);

async function test() {
  const recipient = 'hinovalimited@gmail.com';
  console.log(`Sending test email to ${recipient}...`);
  try {
    const result = await resend.emails.send({
      from: mailFrom,
      to: [recipient],
      subject: 'Test Email from Trackam Resend Diagnostics',
      html: '<p>If you see this, your Resend SMTP / Domain configuration is working perfectly!</p>'
    });
    console.log('Result:', result);
  } catch (error) {
    console.error('Exception:', error);
  }
}

test();
