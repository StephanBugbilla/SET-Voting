const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// =========================================================
// =========================================================
const credentials = {
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME
};

// Initialize the SDK
const AfricasTalking = require('africastalking')(credentials);
const sms = AfricasTalking.SMS;

// Registered Alphanumeric Sender ID
const SENDER_ID = "SETVOTES";

const smsPromises = [];

console.log("Starting SMS broadcast process...");

// Read the user_tokens.csv and send messages
const csvPath = path.join(__dirname, '../data/user_tokens.csv');
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    const name = (row.name || '').trim();
    let phone = (row.phone || '').trim();
    const tokenLink = (row.tokenLink || '').trim();

    if (phone && tokenLink) {
      // Normalize phone number and format to E.164.
      // This keeps a leading '+' if present and strips other non-digit characters.
      phone = phone.replace(/[^+\d]/g, '');
      if (phone.startsWith('0')) {
        phone = '+233' + phone.substring(1);
      } else if (phone.startsWith('233') && !phone.startsWith('+')) {
        phone = '+' + phone;
      } else if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }

      // The custom message for each unique user
      const greetingName = name ? name : 'Student';
      const message = `Hello ${greetingName}, voting for the School of Engineering Students' Union is open. Here is your unique voting link: ${tokenLink}\n\nDo not share this link! THIS LINK IS A SINGLE USE LINK`;

      const options = {
        to: [phone],
        message: message
      };

      if (SENDER_ID) {
        options.from = SENDER_ID;
      }

      console.log(`📤 Sending SMS to ${phone}`);

      // Send the SMS
      const request = sms.send(options)
        .then(response => {
          const recipients = response?.SMSMessageData?.Recipients || [];
          console.log(`✅ SMS dispatched to ${phone}`);
          console.log('   Africa\'s Talking response:', JSON.stringify(response, null, 2));
          recipients.forEach(recipient => {
            console.log(`   recipient ${recipient.number}: status=${recipient.status} cost=${recipient.cost} messageId=${recipient.messageId || 'N/A'}`);
          });
        })
        .catch(error => {
          console.error(`❌ Failed to send SMS to ${phone}:`, error);
        });

      smsPromises.push(request);
    }
  })
  .on('end', async () => {
    console.log("📄 Finished reading CSV. Waiting for all API requests to finish...");
    // Wait for all SMS promises to resolve so the script doesn't exit prematurely
    await Promise.allSettled(smsPromises);
    console.log("🎉 All SMS sending processes completed.");
  });
