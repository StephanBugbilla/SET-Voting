const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetAllUsers() {
  const usersSnapshot = await db.collection("users").get();

  if (usersSnapshot.empty) {
    console.log("No user documents found in users collection.");
    return;
  }

  let batch = db.batch();
  let operationCount = 0;

  usersSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      hasVoted: false,
      used: false,
      votes: admin.firestore.FieldValue.delete(),
    });
    operationCount += 1;

    if (operationCount === 500) {
      batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  });

  if (operationCount > 0) {
    await batch.commit();
  }

  console.log(`Reset ${usersSnapshot.size} user(s) in the users collection.`);
}

resetAllUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
