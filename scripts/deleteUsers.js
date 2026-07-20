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

    let deletedCount = 0;

    for (const user of users) {
      const docId = user.idNumber.replace(/\//g, "_");
      let authDeleted = false;
      let firestoreDeleted = false;

      // Try to delete from Auth
      try {
        await admin.auth().deleteUser(user.idNumber);
        authDeleted = true;
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`ℹ️ User ${user.idNumber} not found in Auth (already deleted or never created)`);
          authDeleted = true; // Mark as resolved for Auth
        } else {
          console.error(`❌ Failed to delete ${user.idNumber} from Auth:`, error.message);
        }
      }

      // Try to delete from Firestore
      try {
        await db.collection("users").doc(docId).delete();
        firestoreDeleted = true;
      } catch (error) {
        console.error(`❌ Failed to delete ${user.idNumber} from Firestore:`, error.message);
      }

      if (authDeleted || firestoreDeleted) {
        deletedCount++;
        console.log(`✅ Cleaned up user ${user.idNumber} (Auth: ${authDeleted ? 'Deleted/Not found' : 'Failed'}, Firestore: ${firestoreDeleted ? 'Deleted' : 'Failed'})`);
      }
    }
    console.log(`🎉 All done! Total accounts cleaned up: ${deletedCount}`);
  });