import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
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
const db = getFirestore(app);

const voteTable = document.getElementById("voteTable");

// Optional: Simple password protection
const adminPassword = "yourSecretPassword";
if (prompt("Enter admin password:") !== adminPassword) {
  alert("Access denied");
  window.location.href = "index.html";
}

// Listen for live updates
onSnapshot(collection(db, "Candidates"), (snapshot) => {
  let html = `<table>
    <tr><th>Position</th><th>Name</th><th>Votes</th><th>Yes Votes</th><th>No Votes</th></tr>`;
  snapshot.forEach(doc => {
    const data = doc.data();
    html += `<tr>
      <td>${data.position || ""}</td>
      <td>${data.name || ""}</td>
      <td>${data.Votes ?? ""}</td>
      <td>${data.yesVotes ?? ""}</td>
      <td>${data.noVotes ?? ""}</td>
    </tr>`;
  });
  html += `</table>`;
  voteTable.innerHTML = html;
});