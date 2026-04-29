const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const users = [];

// Read users from users.csv
fs.createReadStream("../data/users.csv")
  .pipe(csv())
  .on("data", (row) => {
    users.push(row);
  })
  .on("end", async () => {
    console.log("📄 CSV file successfully processed.");

    let createdCount = 0;

    for (const user of users) {
      try {
        // Use idNumber as UID
        await admin.auth().createUser({
          uid: user.idNumber,
          email: user.email,
          password: user.password,
        });

        // Replace slashes with underscores for Firestore document ID
        const docId = user.idNumber.replace(/\//g, "_");

        // Add user document to Firestore
        await db.collection("users").doc(docId).set({
          name: user.name,
          idNumber: user.idNumber,
          email: user.email,
          phone: user.phone,
          hasVoted: user.hasVoted === "true" || user.hasVoted === true,
          used: user.used === "true" || user.used === true, // <-- Add this line
        });

        createdCount++;
        console.log(`✅ Created user ${user.idNumber}`);
      } catch (error) {
        console.error(`❌ Failed for ${user.idNumber}:`, error.message);
      }
    }

    console.log(`🎉 All done! Total accounts created: ${createdCount}`);
  });