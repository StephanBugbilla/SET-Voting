import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
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

// Autofill index number from token in URL
window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    const idNumber = decodeURIComponent(token);
    document.getElementById("idNumber").value = idNumber;

    // Check Firestore for used status
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("No user found with this ID number.");
      document.getElementById("loginForm").querySelector("button[type='submit']").disabled = true;
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.used === true) {
      // Redirect to a custom page if link has been used
      window.location.href = "link_used.html";
      return;
    }
  }
});

document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const idNumber = document.getElementById("idNumber").value.trim();

  if (!idNumber) {
    alert("Please enter your ID number.");
    return;
  }

  // Get user document from Firestore
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("idNumber", "==", idNumber));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert("No user found with this ID number.");
    return;
  }

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();

  // Check if link already used
  if (userData.used === true) {
    alert("This link has already been used.");
    return;
  }

  const email = userData.email;
  const password = idNumber; // Or userData.password if stored

  try {
    // Sign in using Firebase Auth with retrieved email
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Mark as used in Firestore (use the document ID directly)
    await updateDoc(doc(db, "users", userDoc.id), { used: true });

    // Store session info
    sessionStorage.setItem("userIdNumber", idNumber);
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userUid", userCredential.user.uid);

    // Redirect
    window.location.href = "voting_page.html";
  } catch (error) {
    alert("Authentication failed: " + error.message);
  }
});
