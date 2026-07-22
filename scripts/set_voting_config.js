const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function setVotingConfig() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
❌ Error: Missing arguments.
Usage:
  node scripts/set_voting_config.js "<ISO_END_TIME>" "<FORMATTED_END_TIME>"

Example:
  node scripts/set_voting_config.js "2026-07-22T17:00:00Z" "5:00 PM on Wednesday, July 22, 2026"
    `);
    process.exit(1);
  }

  const endTime = args[0];
  const endTimeFormatted = args[1];

  // Simple validation for ISO timestamp
  try {
    new Date(endTime).toISOString();
  } catch (err) {
    console.error("❌ Error: Invalid ISO_END_TIME format. Please use ISO-8601 format (e.g., YYYY-MM-DDTHH:MM:SSZ)");
    process.exit(1);
  }

  console.log("⚙️ Writing voting configuration to Firestore...");

  await db.collection("settings").doc("voting_config").set({
    endTime: endTime,
    endTimeFormatted: endTimeFormatted,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`✅ Success! Voting configuration updated:`);
  console.log(`- ISO Cutoff (endTime): ${endTime}`);
  console.log(`- Human Readable (endTimeFormatted): ${endTimeFormatted}`);
}

setVotingConfig()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to update configuration:", err);
    process.exit(1);
  });
