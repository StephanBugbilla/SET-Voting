import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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
  signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    .then(() => {
      // Successful sign in, proceed
      // Listen for live updates
      onSnapshot(collection(db, "Candidates"), (snapshot) => {
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
      });
    })
    .catch((error) => {
      alert("Access denied: " + error.message + ". Please verify the email and password and ensure the user exists in Firebase Auth.");
      window.location.href = "index.html";
    });
}