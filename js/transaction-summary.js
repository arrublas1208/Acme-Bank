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

let allTransactions = [];
let filteredTransactions = [];

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transaction-data');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions found</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const isCredit = transaction.type.toLowerCase() === 'credit';
        const amountClass = isCredit ? 'credit-amount' : 'debit-amount';
        const typeClass = transaction.type.toLowerCase();
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td class="${amountClass}">$${transaction.amount}</td>
            <td class="${typeClass}">${transaction.type}</td>
            <td class="status-completed">Completed</td>
        `;
        
        tbody.appendChild(row);
    });
}

function filterTransactions() {
    if (allTransactions.length === 0) {
        console.log('No transactions loaded yet');
        return;
    }
    
    const typeFilter = document.getElementById('transaction-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    console.log('Filtering with:', { typeFilter, startDate, endDate });
    console.log('Total transactions:', allTransactions.length);
    
    filteredTransactions = allTransactions.filter(transaction => {
        if (typeFilter !== 'all') {
            const transactionType = transaction.type.toLowerCase();
            if (transactionType !== typeFilter.toLowerCase()) {
                return false;
            }
        }
        
        const transactionDate = new Date(transaction.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;
        
        if (start && transactionDate < start) {
            return false;
        }
        
        if (end && transactionDate > end) {
            return false;
        }
        
        return true;
    });
    
    console.log('Filtered transactions:', filteredTransactions.length);
    renderTransactions(filteredTransactions);
}

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

function setupUserProfile() {
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            window.location.href = "profile.html";
        });
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        const accountRef = ref(database, 'accounts/' + user.uid);
        onValue(accountRef, (snapshot) => {
            const accountData = snapshot.val();
            if (accountData && accountData.transactions) {
                allTransactions = Object.values(accountData.transactions);
                allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                filteredTransactions = [...allTransactions];
                renderTransactions(filteredTransactions);
            } else {
                renderTransactions([]);
            }
        });
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                const userProfile = document.querySelector('.user-profile');
                if (userProfile) {
                    const initials = `${userData.name.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
                    userProfile.textContent = initials;
                    userProfile.style.backgroundColor = '#003ab6';
                    userProfile.style.color = 'white';
                    userProfile.style.borderRadius = '50%';
                    userProfile.style.display = 'flex';
                    userProfile.style.alignItems = 'center';
                    userProfile.style.justifyContent = 'center';
                    userProfile.style.width = '40px';
                    userProfile.style.height = '40px';
                    userProfile.style.border = 'none';
                    userProfile.style.cursor = 'pointer';
                    userProfile.style.fontSize = '14px';
                    userProfile.style.fontWeight = 'bold';
                }
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterTransactions();
        });
    }
    
    // Configurar logout
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.error('Error signing out:', error);
            });
        });
    }
    
    setupMobileMenu();
    
    setupUserProfile();
    
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    const startDateFilter = document.getElementById('start-date');
    const endDateFilter = document.getElementById('end-date');
    
    if (startDateFilter && !startDateFilter.value) {
        startDateFilter.value = startOfYear.toISOString().split('T')[0];
    }
    
    if (endDateFilter && !endDateFilter.value) {
        endDateFilter.value = today.toISOString().split('T')[0];
    }
});