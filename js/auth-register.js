import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN8zBw644x9hrZngHpNYf01hY2UcENiTE",
  authDomain: "acme-bank-15f4a.firebaseapp.com",
  databaseURL: "https://acme-bank-15f4a-default-rtdb.firebaseio.com",
  projectId: "acme-bank-15f4a",
  storageBucket: "acme-bank-15f4a.firebasestorage.app",
  messagingSenderId: "575284743206",
  appId: "1:575284743206:web:9d38f5c7b7a9112092eae7",
  measurementId: "G-LSMBCTG4EK"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.error('Toast element not found in HTML');
    return;
  }
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');

  setTimeout(() => {
    toast.className = toast.className.replace(' show', '');
  }, 4000);
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

document.getElementById("check").addEventListener("click", async (e) => {
  e.preventDefault();

  const type = document.getElementById("identification-type").value;
  const idNumber = document.getElementById("id-number").value;
  const name = document.getElementById("name").value;
  const lastName = document.getElementById("last-name").value;
  const gender = document.getElementById("genre").value;
  const phone = document.getElementById("phone-number").value;
  const emailReal = document.getElementById("email").value;
  const address = document.getElementById("address").value;
  const city = document.getElementById("city").value;
  const password = document.getElementById("password").value;

  if (!type || !idNumber || !password) {
    showToast("Type, ID number and password are required.", true);
    return;
  }

  const fakeEmail = `${type.toLowerCase()}_${idNumber}@acmebank.com`;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
    const uid = userCredential.user.uid;

    await set(ref(database, 'users/' + uid), {
      identificationType: type,
      idNumber: idNumber,
      name: name,
      lastName: lastName,
      gender: gender,
      phone: phone,
      email: emailReal,
      address: address,
      city: city,
      createdAt: new Date().toISOString()
    });

    const accountData = {
      balance: "20.00",
      accountNumber: generateAccountNumber(),
      accountType: "Current Account",
      currency: "USD",
      status: "active",
      createdAt: new Date().toISOString(),
      transactions: [
        { 
          description: "Initial deposit", 
          date: new Date().toISOString().split('T')[0], 
          amount: "20.00", 
          type: "Credit",
          balanceAfter: "20.00",
          transactionId: Date.now().toString()
        }
      ]
    };

    await set(ref(database, 'accounts/' + uid), accountData);

    const cardData = {
      cardNumber: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
      cardHolder: `${name.toUpperCase()} ${lastName.toUpperCase()}`,
      expiryDate: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear() + 3).toString().slice(-2)}`,
      cvv: "•••",
      type: "Debit",
      status: "active",
      createdAt: new Date().toISOString()
    };

    await set(ref(database, 'cards/' + uid), cardData);

    showToast("User registered successfully! Account created with initial balance.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (error) {
    console.error("Registration error:", error);
    let errorMessage = "Registration failed. ";
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage += "This ID is already registered.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage += "Password should be at least 6 characters.";
    } else {
      errorMessage += error.message;
    }
    
    showToast(errorMessage, true);
  }
});

document.getElementById("return").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});