const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Base URL for voting app
const BASE_URL = "https://set-voting.vercel.app/?token=";

// Prepare CSV writer for output
const csvWriter = createCsvWriter({
  path: '../data/user_tokens.csv',
  header: [
    {id: 'name', title: 'name'},
    {id: 'idNumber', title: 'idNumber'},
    {id: 'phone', title: 'phone'},
    {id: 'tokenLink', title: 'tokenLink'}
  ]
});

const users = [];

// Read users.csv and generate token links
fs.createReadStream('../data/users.csv')
  .pipe(csv())
  .on('data', (row) => {
    const name = (row.name || '').trim();
    const idNumber = (row.idNumber || '').trim();
    const phone = (row.phone || '').trim();
    if (idNumber) {
      const tokenLink = `${BASE_URL}${encodeURIComponent(idNumber)}`;
      users.push({ name, idNumber, phone, tokenLink });
    }
  })
  .on('end', () => {
    csvWriter.writeRecords(users).then(() => {
      console.log('✅ user_tokens.csv created successfully!');
    });
  });