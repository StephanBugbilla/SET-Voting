const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function isAdminUser(email = "", uid = "") {
  const emailLower = email.toLowerCase();
  const uidLower = uid.toLowerCase();
  return (
    emailLower.includes("admin") ||
    uidLower.includes("admin") ||
    (emailLower.length > 0 && !emailLower.endsWith("@setvoting.app"))
  );
}

async function clearAllAuthUsers() {
  console.log("🧹 Fetching users from Firebase Auth...");
  let deletedCount = 0;
  let listUsersResult = await admin.auth().listUsers(1000);
  
  while (listUsersResult.users.length > 0) {
    const toDelete = [];
    const preserved = [];

    for (const user of listUsersResult.users) {
      if (isAdminUser(user.email, user.uid)) {
        preserved.push(user.email || user.uid);
      } else {
        toDelete.push(user.uid);
      }
    }

    if (preserved.length > 0) {
      console.log(`🛡️ Preserving Admin Auth account(s): ${preserved.join(", ")}`);
    }

    if (toDelete.length > 0) {
      await admin.auth().deleteUsers(toDelete);
      deletedCount += toDelete.length;
      console.log(`✅ Deleted ${toDelete.length} student user(s) from Auth.`);
    }
    
    if (listUsersResult.pageToken) {
      listUsersResult = await admin.auth().listUsers(1000, listUsersResult.pageToken);
    } else {
      break;
    }
  }
  return deletedCount;
}

async function clearAllFirestoreUsers() {
  console.log("🧹 Fetching user documents from Firestore...");
  const usersSnapshot = await db.collection("users").get();
  
  if (usersSnapshot.empty) {
    console.log("No user documents found in Firestore.");
    return 0;
  }

  let batch = db.batch();
  let operationCount = 0;
  let deletedDocs = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data() || {};
    const email = data.email || "";
    
    if (isAdminUser(email, doc.id)) {
      console.log(`🛡️ Preserving Admin Firestore document: ${doc.id}`);
      continue;
    }

    batch.delete(doc.ref);
    operationCount++;
    deletedDocs++;

    if (operationCount === 500) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Deleted ${deletedDocs} student user document(s) from Firestore.`);
  return deletedDocs;
}

async function run() {
  console.log("⚠️ Starting full cleanup of Firebase Auth and Firestore users...");
  try {
    const authDeleted = await clearAllAuthUsers();
    const dbDeleted = await clearAllFirestoreUsers();
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`- Auth users deleted: ${authDeleted}`);
    console.log(`- Firestore users deleted: ${dbDeleted}`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
