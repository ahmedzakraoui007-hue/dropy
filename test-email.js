require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function test() {
    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `Dropy <${process.env.SMTP_USER}>`,
            to: process.argv[2] || process.env.SMTP_USER,
            subject: 'Test Email Dropy',
            html: '<p>Test</p>'
        });
        console.log('Sent:', info.messageId);
    } catch (e) {
        console.log('Exception:', e);
    }
}
test();
