import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get, update, push } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCN8zBw644x9hrZngHpNYf01hY2UcENiTE",
    authDomain: "acme-bank-15f4a.firebaseapp.com",
    databaseURL: "https://acme-bank-15f4a-default-rtdb.firebaseio.com",
    projectId: "acme-bank-15f4a",
    storageBucket: "acme-bank-15f4a.appspot.com",
    messagingSenderId: "575284743206",
    appId: "1:575284743206:web:9d38f5c7b7a9112092eae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const withdrawalMethod = document.getElementById('withdrawalMethod');
    const externalAccountGroup = document.getElementById('externalAccountGroup');
    if (withdrawalMethod && externalAccountGroup) {
        withdrawalMethod.addEventListener('change', (e) => {
            if (e.target.value === 'transfer-external') {
                externalAccountGroup.style.display = 'block';
            } else {
                externalAccountGroup.style.display = 'none';
            }
        });
    }
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userRef = ref(db, 'users/' + user.uid);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const iniciales = `${userData.name?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`.toUpperCase();
            const profileDiv = document.querySelector('.user-profile');
            if (profileDiv) {
                profileDiv.textContent = iniciales;
                profileDiv.addEventListener('click', () => {
                    window.location.href = "profile.html";
                });
            }
        }
    } catch (error) {
        alert("Error al cargar datos del usuario");
    }

    // Agregar solo la cuenta actual al select Source Account
    const sourceAccountSelect = document.getElementById('sourceAccount');
    const accountRef = ref(db, `accounts/${user.uid}`);
    try {
        const accountSnap = await get(accountRef);
        if (accountSnap.exists() && sourceAccountSelect) {
            sourceAccountSelect.innerHTML = '';
            const accountData = accountSnap.val();
            // Si hay varias cuentas, puedes ajustar aquí, pero por ahora solo una cuenta:
            const balance = parseFloat(accountData.balance || 0);
            const accountNumber = accountData.accountNumber || '';
            const accountType = accountData.accountType || 'Account';
            const option = document.createElement('option');
            option.value = accountNumber;
            option.textContent = `${accountType} (...${String(accountNumber).slice(-4)}) - $${balance.toFixed(2)}`;
            sourceAccountSelect.appendChild(option);
        }
    } catch (error) {
        // No hacer nada, solo no mostrar opciones
    }

    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(withdrawalForm);
            const sourceAccount = formData.get("sourceAccount");
            const amount = parseFloat(formData.get("withdrawalAmount"));
            const withdrawalMethod = formData.get("withdrawalMethod");
            const memo = formData.get("withdrawalMemo") || "";

            if (!sourceAccount || !amount || !withdrawalMethod) {
                alert("All fields are required.");
                return;
            }
            if (amount <= 0) {
                alert("Amount must be greater than $0.00");
                return;
            }

            try {
                const accountSnap = await get(accountRef);
                if (!accountSnap.exists()) {
                    alert("Account not found.");
                    return;
                }
                const accountData = accountSnap.val();
                const currentBalance = parseFloat(accountData.balance || 0);

                if (amount > currentBalance) {
                    alert("Insufficient funds.");
                    return;
                }

                const newBalance = (currentBalance - amount).toFixed(2);
                await update(accountRef, { balance: newBalance });

                const transaction = {
                    description: withdrawalMethod === "atm"
                        ? "ATM Withdrawal"
                        : "External Bank Withdrawal",
                    amount: amount.toFixed(2),
                    type: "Debit",
                    date: new Date().toLocaleDateString("en-US"),
                    memo
                };
                await push(ref(db, `accounts/${user.uid}/transactions`), transaction);

                alert("Withdrawal successful!");
                withdrawalForm.reset();
            } catch (error) {
                console.error(error);
                alert("Error processing withdrawal. Try again.");
            }
        });
    }
});