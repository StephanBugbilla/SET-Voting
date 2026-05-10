import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, updateDoc, increment, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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

const positions = ["president", "general secretary", "financial secretary", "public relations officer"]; // Must match Firestore exactly

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You must be logged in to vote.");
    window.location.href = "index.html";
    return;
  }

  // Get idNumber from sessionStorage
  const idNumber = sessionStorage.getItem("userIdNumber");

  if (!idNumber) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  // Query user by idNumber
  const userQuery = query(collection(db, "users"), where("idNumber", "==", idNumber));
  const querySnapshot = await getDocs(userQuery);

  if (querySnapshot.empty) {
    alert("User data not found.");
    window.location.href = "index.html";
    return;
  }

  const userDoc = querySnapshot.docs[0];
  const userRef = userDoc.ref;
  const userData = userDoc.data();

  if (userData.hasVoted) {
    alert("You have already completed voting.");
    await signOut(auth);
    window.location.href = "link_used.html";
    return;
  }

  // Track votes per position in user document (e.g., { votes: { President: "candidateId", GeneralSecretary: "candidateId" } })
  let userVotes = userData.votes || {};

  // Dynamically render candidates for each position
  const container = document.getElementById("votingContainer");
  for (const position of positions) {
    // Query candidates for this position
    const candidatesQuery = query(collection(db, "Candidates"), where("position", "==", position));
    const candidatesSnapshot = await getDocs(candidatesQuery);
    console.log(`Candidates for ${position}:`, candidatesSnapshot.size);
    candidatesSnapshot.forEach((docSnap) => {
      console.log(docSnap.id, docSnap.data());
    });

    // Create section for this position
    const section = document.createElement("div");
    section.innerHTML = `<h3>${position}</h3>`;

    if (candidatesSnapshot.size === 1) {
      // YES/NO voting
      const docSnap = candidatesSnapshot.docs[0];
      const candidate = docSnap.data();
      const candidateId = docSnap.id;

      const candidateDiv = document.createElement("div");
      candidateDiv.innerHTML = `
        <div class="candidate-photo">
          <img src="${candidate.photoUrl || 'assets/images/Candidate_photos/default-avatar.png'}" alt="${candidate.name || 'Candidate'}'s photo">
        </div>
        <p><strong>${candidate.name}</strong></p>
      `;

      const yesBtn = document.createElement("button");
      yesBtn.textContent = "Yes";
      yesBtn.disabled = !!userVotes[position];

      const noBtn = document.createElement("button");
      noBtn.textContent = "No";
      noBtn.disabled = !!userVotes[position];

      const handleYesNoVote = async (voteType) => {
        if (userVotes[position]) {
          alert(`You have already voted for ${position}.`);
          return;
        }

        // Prevent double click by disabling immediately and updating local state
        yesBtn.disabled = true;
        noBtn.disabled = true;
        userVotes[position] = voteType;

        try {
          const candidateRef = doc(db, "Candidates", candidateId);
          await updateDoc(candidateRef, {
            [voteType === "yes" ? "yesVotes" : "noVotes"]: increment(1)
          });

          await updateDoc(userRef, {
            [`votes.${position}`]: voteType
          });

          alert(`You voted '${voteType.toUpperCase()}' for ${candidate.name} as ${position}.`);

          const hasVotedAll = positions.every(pos => userVotes[pos]);
          if (hasVotedAll) {
            await updateDoc(userRef, { hasVoted: true });
            await signOut(auth);
            alert("You have completed voting. You will now be signed out.");
            window.location.href = "link_used.html";
          }

        } catch (error) {
          alert("Error while voting: " + error.message);
        }
      };

      yesBtn.addEventListener("click", () => handleYesNoVote("yes"));
      noBtn.addEventListener("click", () => handleYesNoVote("no"));

      candidateDiv.appendChild(yesBtn);
      candidateDiv.appendChild(noBtn);
      section.appendChild(candidateDiv);

    } else {
      // Normal voting
      candidatesSnapshot.forEach((docSnap) => {
        const candidate = docSnap.data();
        const candidateId = docSnap.id;

        const candidateDiv = document.createElement("div");
        const voteBtn = document.createElement("button");
        voteBtn.textContent = "Vote";
        voteBtn.disabled = !!userVotes[position];
        voteBtn.addEventListener("click", async () => {
          if (userVotes[position]) {
            alert(`You have already voted for ${position}.`);
            return;
          }

          // Prevent double click by disabling immediately and updating local state
          section.querySelectorAll("button").forEach(btn => btn.disabled = true);
          userVotes[position] = candidate.name;

          try {
            const candidateRef = doc(db, "Candidates", candidateId);
            await updateDoc(candidateRef, {
              Votes: increment(1)
            });

            await updateDoc(userRef, {
              [`votes.${position}`]: candidate.name
            });

            alert(`Your vote for ${candidate.name} as ${position} has been recorded!`);

            const hasVotedAll = positions.every(pos => userVotes[pos]);
            if (hasVotedAll) {
              await updateDoc(userRef, { hasVoted: true });
              await signOut(auth);
              alert("You have completed voting. You will now be signed out.");
              window.location.href = "link_used.html";
            }
          } catch (error) {
            alert("Error while voting: " + error.message);
          }
        });

        // Always show image for all positions
        candidateDiv.innerHTML = `
          <div class="candidate-photo">
            <img src="${candidate.photoUrl || 'assets/images/Candidate_photos/default-avatar.png'}" alt="${candidate.name || 'Candidate'}'s photo">
          </div>
          <p><strong>${candidate.name || "No Name"}</strong></p>
        `;
        candidateDiv.appendChild(voteBtn);
        section.appendChild(candidateDiv);
      });
    }

    container.appendChild(section); // <-- This is important!
  }
});
