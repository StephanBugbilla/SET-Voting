const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// =========================================================
// 1. Put your Africa's Talking credentials here
// =========================================================
const credentials = {
    apiKey: 'YOUR_API_KEY_HERE',
    username: 'YOUR_USERNAME_HERE'
};

// Initialize the SDK
const AfricasTalking = require('africastalking')(credentials);
const sms = AfricasTalking.SMS;

// Optional: If you have a registered Short Code or Alphanumeric Sender ID (e.g., "CULSU"), put it here.
// If you don't have one yet, leave it as undefined and AT will use a default shared number.
const SENDER_ID = undefined; 

const smsPromises = [];

console.log("Starting SMS broadcast process...");

// Read the user_tokens.csv and send messages
const csvPath = path.join(__dirname, '../data/user_tokens.csv');
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    let phone = (row.phone || '').trim();
    const tokenLink = (row.tokenLink || '').trim();

    if (phone && tokenLink) {
      // Format phone number to E.164 format (Africa's Talking strictly requires this)
      // Assuming Ghanaian numbers (e.g., 0541234567 becomes +233541234567)
      if (phone.startsWith('0')) {
        phone = '+233' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        // Just in case it already has country code but no '+'
        phone = '+' + phone; 
      }

      // The custom message for each unique user
      const message = `Hello, voting for the Law Students' Union is open. Here is your unique voting link: ${tokenLink}\n\nDo not share this link!`;

      const options = {
          to: [phone],
          message: message,
          from: SENDER_ID
      };

      // Send the SMS
      const request = sms.send(options)
          .then(response => {
              // The response object contains details about delivery status
              console.log(`✅ SMS dispatched to ${phone}`);
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
