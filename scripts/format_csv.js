const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function capitalizeWords(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9) digits = '0' + digits;
  if (digits.length > 10) digits = digits.slice(-10);
  if (digits.length < 10) digits = digits.padStart(10, '0');
  return digits;
}

const csvWriter = createCsvWriter({
  path: '../data/users.csv',
  header: [
    {id: 'name', title: 'name'},
    {id: 'idNumber', title: 'idNumber'},
    {id: 'phone', title: 'phone'},
    {id: 'email', title: 'email'},
    {id: 'password', title: 'password'},
    {id: 'hasVoted', title: 'hasVoted'},
    {id: 'uid', title: 'uid'},
    {id: 'used', title: 'used'} // Add used column
  ]
});

const users = [];
const seenUids = new Set();
const duplicateUids = new Set();

fs.createReadStream('../data/Original.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Format fields
    const name = capitalizeWords(row.name || '');
    const idNumber = (row.idNumber || '').replace(/\s+/g, '').toUpperCase();
    const phone = formatPhone(row.phone || '');
    const email = (row.email || '').replace(/\s+/g, '').toLowerCase();
    const password = (row.password || row.idNumber || '').replace(/\s+/g, '');
    const hasVoted = (row.hasVoted || 'false').toString().toLowerCase();
    const uid = (row.uid || row.idNumber || '').replace(/\s+/g, '').toUpperCase();
    // Use value from CSV, default to 'false' only if missing
    const used = (typeof row.used !== "undefined" && row.used !== "") ? row.used.toString().toLowerCase() : 'false';

    // Check if idNumber, password, and uid are not the same
    if (!(idNumber === password && password === uid)) {
      console.log(`⚠️ Mismatch for user "${name}": idNumber="${idNumber}", password="${password}", uid="${uid}"`);
    }

    // Check for duplicate uid
    if (seenUids.has(uid)) {
      console.log(`❗ Duplicate uid found: "${uid}" for user "${name}". Removing the first occurrence.`);
      duplicateUids.add(uid);
      // Remove the first occurrence from users array
      const index = users.findIndex(u => u.uid === uid);
      if (index !== -1) {
        users.splice(index, 1);
        console.log(`✅ Removed the first occurrence of uid "${uid}" successfully.`);
      }
    }
    seenUids.add(uid);

    users.push({ name, idNumber, phone, email, password, hasVoted, uid, used });
  })
  .on('end', () => {
    csvWriter.writeRecords(users).then(() => {
      console.log('✅ users.csv created successfully!');
    });
  });