import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Use your actual Firebase config (copied from vote.js)
const firebaseConfig = {
  apiKey: "AIzaSyB9S48VgJ5oOSLSmnOMIJI5-84s9l4FERI",
  authDomain: "law-voting-app-a31d2.firebaseapp.com",
  projectId: "law-voting-app-a31d2",
  storageBucket: "law-voting-app-a31d2.firebasestorage.app",
  messagingSenderId: "718947262752",
  appId: "1:718947262752:web:c30b06d0acca283fd83745",
  measurementId: "G-4TX1218GL1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const voteTable = document.getElementById("voteTable");

// Admin authentication using Firebase
const adminEmail = prompt("Enter admin email:");
const adminPassword = prompt("Enter admin password:");

if (!adminEmail || !adminPassword) {
  alert("Access denied");
  window.location.href = "index.html";
} else {
  console.log("🔑 Initiating admin sign-in with Firebase Auth...");
  signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    .then(() => {
      console.log("✅ Admin signed in successfully. Fetching voting configuration...");
      return getDoc(doc(db, "settings", "voting_config"));
    })
    .then((configDoc) => {
      console.log("📄 Firestore config fetched. Document exists:", configDoc.exists());
      let isClosed = false;
      let deadlineText = "";

      if (configDoc.exists()) {
        const configData = configDoc.data();
        const endTime = new Date(configData.endTime);
        deadlineText = configData.endTimeFormatted || "";
        console.log(`⏰ Deadline: ${endTime.toISOString()}. Current time: ${new Date().toISOString()}`);
        if (new Date() > endTime) {
          isClosed = true;
        }
      } else {
        console.warn("⚠️ No voting configuration found in Firestore. Defaulting to closed.");
        isClosed = true;
      }

      console.log("🔒 Is voting closed:", isClosed);

      if (!isClosed) {
        console.log("🙈 Voting is still open. Hiding live results from display.");
        voteTable.innerHTML = `
          <div class="lockout-message" style="text-align: center; margin-top: 50px; font-family: sans-serif; color: #fff; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <h2 style="color: #ffc107;">Results Hidden</h2>
            <p>Voting is currently in progress. Results will be revealed after the voting period ends.</p>
            <p><strong>Scheduled End Time:</strong> ${deadlineText}</p>
            <p style="font-size: 0.9em; color: #aaa; margin-top: 15px;">Please reload this page after the scheduled end time to view the final results.</p>
          </div>
        `;
        return;
      }

      console.log("👁️ Voting is closed. Starting real-time listener for Candidates...");
      onSnapshot(
        collection(db, "Candidates"),
        (snapshot) => {
          console.log("📊 Candidates data update received. Document count:", snapshot.size);
          const groups = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            const position = (data.position || "").trim() || "Unknown";
            if (!acc[position]) acc[position] = [];
            acc[position].push(data);
            return acc;
          }, {});

          const groupedPositions = Object.entries(groups)
            .map(([position, candidates]) => ({
              position,
              candidates,
              count: candidates.length
            }))
            .sort((a, b) => b.count - a.count || a.position.localeCompare(b.position));

          let html = `<table>
            <tr><th>Position</th><th>Name</th><th>Votes</th><th>Yes Votes</th><th>No Votes</th></tr>`;

          groupedPositions.forEach(group => {
            group.candidates.sort((a, b) => {
              return (b.Votes ?? 0) - (a.Votes ?? 0) || (a.name || "").localeCompare(b.name || "");
            });

            html += `<tr class="position-header"><td colspan="5"><strong>${group.position} (${group.count})</strong></td></tr>`;

            group.candidates.forEach(data => {
              html += `<tr>
                <td>${data.position || ""}</td>
                <td>${data.name || ""}</td>
                <td>${data.Votes ?? ""}</td>
                <td>${data.yesVotes ?? ""}</td>
                <td>${data.noVotes ?? ""}</td>
              </tr>`;
            });
          });

          html += `</table>`;
          voteTable.innerHTML = html;
        },
        (error) => {
          console.error("❌ Firestore Candidates snapshot failed:", error);
          alert("Error loading candidate results: " + error.message);
        }
      );
    })
    .catch((error) => {
      console.error("❌ Admin process encountered an error:", error);
      alert("Error: " + error.message);
      window.location.href = "index.html";
    });
}