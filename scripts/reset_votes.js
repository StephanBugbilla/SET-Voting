const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetVotes() {
    const candidatesRef = db.collection("Candidates");
    const snapshot = await candidatesRef.get();

    if (snapshot.empty) {
        console.log("No candidate documents found in the Candidates collection.");
        return;
    }

    let batch = db.batch();
    let batchCount = 0;

    snapshot.docs.forEach((doc, index) => {
        const docRef = candidatesRef.doc(doc.id);
        batch.update(docRef, {
            Votes: 0,
            yesVotes: 0,
            noVotes: 0,
        });

        batchCount += 1;

        if (batchCount === 500) {
            batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    });

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`Reset votes to zero for ${snapshot.size} candidate(s).`);
}

resetVotes()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error resetting votes:", error);
        process.exit(1);
    });
