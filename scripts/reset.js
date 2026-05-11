const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetUser(idNumber) {
  const docId = idNumber.replace(/\//g, "_");
  const userRef = db.collection("users").doc(docId);

  await userRef.update({
    hasVoted: false,
    used: false,
    votes: admin.firestore.FieldValue.delete()
  });
  console.log(`Reset user ${idNumber}`);
}

resetUser("CSC/22/01/1766").then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
