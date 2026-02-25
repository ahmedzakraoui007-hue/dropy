
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function test() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev', // Safe test address for Resend
            subject: 'Test Email Dropy',
            html: '<p>Test</p>'
        });
        console.log('Data:', data);
        console.log('Error:', error);
    } catch (e) {
        console.log('Exception:', e);
    }
}
test();
