import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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
const database = getDatabase(app);

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.querySelector('.card-holder').textContent = 
                    `${userData.name.toUpperCase()} ${userData.lastName.toUpperCase()}`;
                
                const initials = `${userData.name.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
                document.querySelector('.user-icon').textContent = initials;
                document.querySelector('.user-icon').style.backgroundColor = '#003ab6';
                document.querySelector('.user-icon').style.color = 'white';
                document.querySelector('.user-icon').style.borderRadius = '50%';
                document.querySelector('.user-icon').style.display = 'flex';
                document.querySelector('.user-icon').style.alignItems = 'center';
                document.querySelector('.user-icon').style.justifyContent = 'center';
                document.querySelector('.user-icon').style.width = '40px';
                document.querySelector('.user-icon').style.height = '40px';
            }
        });

        const accountRef = ref(database, 'accounts/' + user.uid);
        onValue(accountRef, (snapshot) => {
            const accountData = snapshot.val();
            if (accountData) {
                document.querySelector('.summary-balance').textContent = `$${accountData.balance}`;
                document.querySelector('.summary-details').innerHTML = `
                    ${accountData.accountType}<br>
                    ${accountData.accountNumber}
                `;

                const transactionsContainer = document.querySelector('.transactions-list');
                transactionsContainer.innerHTML = '';
                
                Object.values(accountData.transactions).forEach(transaction => {
                    const transactionRow = document.createElement('div');
                    transactionRow.className = 'transaction-row';
                    
                    transactionRow.innerHTML = `
                        <span>${transaction.description}</span>
                        <span>${transaction.date}</span>
                        <span class="${transaction.type.toLowerCase() === 'credit' ? 'credit-amount' : 'debit-amount'}">
                            $${transaction.amount}
                        </span>
                        <span class="${transaction.type.toLowerCase()}">${transaction.type}</span>
                    `;
                    
                    transactionsContainer.appendChild(transactionRow);
                });
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});

document.getElementById('user-menu-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = "profile.html";
});