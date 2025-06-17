import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { toast.className = 'toast'; }, 4000);
}

document.getElementById("sign-in").addEventListener("click", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("email");
  if (!emailInput) {
    showToast("Error interno: falta el campo de correo.", true);
    return;
  }
  const email = emailInput.value.trim();

  if (!email) {
    showToast("Por favor, ingresa tu correo.", true);
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Se ha enviado un enlace de recuperación a tu correo.");
    console.log("Correo de recuperación enviado a:", email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      showToast("El correo no está registrado.", true);
    } else {
      showToast("No se pudo enviar el correo: " + error.message, true);
    }
    console.error(error);
  }
});