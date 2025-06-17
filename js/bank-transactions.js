import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

let allTransactions = [];
let currentUserData = null;
let currentAccountData = null;
let filteredTransactions = [];

function parseDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);

    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        return new Date(`${y}-${m}-${d}`);
    }
    if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [m, d, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
    }
    return new Date(dateStr);
}

function printStatement() {
    const startDate = document.getElementById("start-date")?.value || "";
    const endDate = document.getElementById("end-date")?.value || "";
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Bank Statement</title>
            <style>
                body { font-family: Arial; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #1d2f75; padding-bottom: 20px; }
                .info { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #1d2f75; color: white; }
                .credit { color: #2ecc71; font-weight: bold; }
                .debit { color: #e74c3c; font-weight: bold; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ACME BANK</h1>
                <h2>Bank Statement</h2>
                <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="info">
                <p><strong>Customer:</strong> ${currentUserData?.name || ''} ${currentUserData?.lastName || ''}</p>
                <p><strong>Account:</strong> ${currentAccountData?.accountNumber || 'N/A'}</p>
                <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
            </div>
            
            <button onclick="window.print()" class="no-print">Print</button>
            
            <table>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                </tr>
                ${filteredTransactions.map(tx => `
                    <tr>
                        <td>${tx.date || 'N/A'}</td>
                        <td>${tx.description || 'N/A'}</td>
                        <td>${tx.type || 'N/A'}</td>
                        <td class="${tx.type === 'credit' ? 'credit' : 'debit'}">
                            ${tx.type === 'credit' ? '+' : '-'}$${tx.amount || '0'}
                        </td>
                    </tr>
                `).join('')}
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
}

document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
        });
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    document.getElementById("start-date").value = thirtyDaysAgo.toISOString().split("T")[0];
    document.getElementById("end-date").value = today.toISOString().split("T")[0];

    const filtersContainer = document.querySelector(".transaction-filters");
    const printBtn = document.createElement("button");
    printBtn.innerHTML = "🖨️ Print";
    printBtn.style.cssText = "background: #28a745; color: white; padding: 12px 25px; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;";
    printBtn.onclick = printStatement;
    filtersContainer.appendChild(printBtn);
});

function filterByDate(startDate, endDate) {
    return allTransactions.filter(tx => {
        if (!tx.date) return true;
        const txDate = parseDate(tx.date);
        if (isNaN(txDate)) return false;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && txDate < start) return false;
        if (end && txDate > end) return false;
        return true;
    });
}

function showTransactions(transactions) {
    filteredTransactions = transactions;
    const tbody = document.getElementById("transaction-data");
    
    if (!transactions.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => {
        const isCredit = tx.type?.toLowerCase() === 'credit';
        return `
            <tr>
                <td>${tx.date || "N/A"}</td>
                <td>${tx.description || "N/A"}</td>
                <td>${tx.memo || tx.referenceNumber || "N/A"}</td>
                <td>${tx.type || "N/A"}</td>
                <td class="amount" style="font-weight: bold; color: ${isCredit ? '#2ecc71' : '#e74c3c'};">
                    ${isCredit ? '+' : '-'}$${tx.amount || '0'}
                </td>
            </tr>
        `;
    }).join('');
}

function applyFilters() {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const filtered = filterByDate(startDate, endDate);
    showTransactions(filtered);
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {
        const userSnap = await get(ref(db, 'users/' + user.uid));
        const accountSnap = await get(ref(db, 'accounts/' + user.uid));
        
        if (userSnap.exists()) currentUserData = userSnap.val();
        if (accountSnap.exists()) currentAccountData = accountSnap.val();

        const profileDiv = document.querySelector('.user-profile');
        if (profileDiv && currentUserData) {
            const initials = `${currentUserData.name?.charAt(0) || ''}${currentUserData.lastName?.charAt(0) || ''}`.toUpperCase();
            profileDiv.textContent = initials;
            profileDiv.style.backgroundColor = '#1d2f75';
            profileDiv.addEventListener("click", () => window.location.href = "profile.html");
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }

    try {
        const txSnap = await get(ref(db, `accounts/${user.uid}/transactions`));
        if (txSnap.exists()) {
            allTransactions = Object.values(txSnap.val());
            applyFilters(); 
        }
    } catch (error) {
        console.error("Error loading transactions:", error);
    }

    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.querySelectorAll('.logout').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut(auth);
            window.location.href = "index.html";
        });
    });
});
