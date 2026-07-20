const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const users = [];

// Read users from users.csv
const csvPath = path.join(__dirname, "../data/users.csv");
fs.createReadStream(csvPath)
  .pipe(csv())
  .on("data", (row) => {
    users.push(row);
  })
  .on("end", async () => {
    console.log("📄 CSV file successfully processed.");

    let createdCount = 0;

    for (const user of users) {
      const generatedEmail = `${user.idNumber.replace(/\//g, "_").toLowerCase()}@setvoting.app`;
      const docId = user.idNumber.replace(/\//g, "_");
      let authReady = false;

      // Try to create in Auth
      try {
        await admin.auth().createUser({
          uid: user.idNumber,
          email: generatedEmail,
          password: user.password,
        });
        authReady = true;
      } catch (error) {
        if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
          console.log(`ℹ️ User ${user.idNumber} already exists in Auth. Updating password...`);
          try {
            await admin.auth().updateUser(user.idNumber, {
              password: user.password,
              email: generatedEmail
            });
            authReady = true;
          } catch (updateError) {
            console.error(`❌ Failed to update password/email for ${user.idNumber} in Auth:`, updateError.message);
          }
        } else {
          console.error(`❌ Failed to create user ${user.idNumber} in Auth:`, error.message);
        }
      }

      // Try to write to Firestore
      try {
        await db.collection("users").doc(docId).set({
          name: user.name,
          idNumber: user.idNumber,
          email: generatedEmail,
          phone: user.phone,
          hasVoted: user.hasVoted === "true" || user.hasVoted === true,
          used: user.used === "true" || user.used === true,
        });
        createdCount++;
        console.log(`✅ Successfully processed user ${user.idNumber} (Auth ready: ${authReady})`);
      } catch (error) {
        console.error(`❌ Failed to write to Firestore for ${user.idNumber}:`, error.message);
      }
    }

    console.log(`🎉 All done! Total accounts processed: ${createdCount}`);
  });