import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN8zBw644x9hrZngHpNYf01hY2UcENiTE",
  authDomain: "acme-bank-15f4a.firebaseapp.com",
  projectId: "acme-bank-15f4a",
  storageBucket: "acme-bank-15f4a.appspot.com",
  messagingSenderId: "575284743206",
  appId: "1:575284743206:web:9d38f5c7b7a9112092eae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');

  setTimeout(() => {
    toast.className = 'toast';
  }, 4000);
}

document.getElementById("sign-in").addEventListener("click", async (e) => {
  e.preventDefault();

  const type = document.getElementById("identification-r").value;
  const idNumber = document.getElementById("identification").value;
  const password = document.getElementById("password").value;

  if (!type || !idNumber || !password) {
    showToast("Please fill all fields.", true);
    return;
  }

  const fakeEmail = `${type.toLowerCase()}_${idNumber}@acmebank.com`;

  try {
    await signInWithEmailAndPassword(auth, fakeEmail, password);
    showToast("Login successful!");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  } catch (error) {
    console.error(error);
    showToast("Login failed: " + error.message, true);
  }
});
