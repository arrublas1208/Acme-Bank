import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

let currentUser = null;
let currentUserData = null;
let currentAccountData = null;

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 350px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#000';
            break;
        default:
            notification.style.backgroundColor = '#007bff';
    }
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function generateAccountNumber() {
    return Math.floor(Math.random() * 9000000000) + 1000000000;
}

function validateAccountNumber(accountNumber) {
    const cleanNumber = accountNumber.replace(/\D/g, '');
    return cleanNumber.length >= 8 && cleanNumber.length <= 12;
}

function loadUserAccounts() {
    const sourceAccountSelect = document.getElementById('sourceAccount');
    if (!sourceAccountSelect) return;
    sourceAccountSelect.innerHTML = '<option value="">Select source account</option>';

    if (currentAccountData && currentAccountData.accountNumber) {
        const balance = parseFloat(currentAccountData.balance) || 0;
        const accountNumber = currentAccountData.accountNumber;
        const accountType = currentAccountData.accountType || 'Account';
        const option = document.createElement('option');
        option.value = 'main-' + accountNumber;
        option.textContent = `${accountType} (...${String(accountNumber).slice(-4)}) - ${formatCurrency(balance)}`;
        option.dataset.balance = balance;
        option.dataset.accountNumber = accountNumber;
        sourceAccountSelect.appendChild(option);
        sourceAccountSelect.value = 'main-' + accountNumber;
        return;
    }

    if (currentAccountData && typeof currentAccountData === "object" && !Array.isArray(currentAccountData)) {
        let firstKey = null;
        Object.entries(currentAccountData).forEach(([key, acc]) => {
            if (acc && acc.accountNumber && acc.balance !== undefined) {
                const balance = parseFloat(acc.balance) || 0;
                const accountNumber = acc.accountNumber;
                const accountType = acc.accountType || 'Account';
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${accountType} (...${String(accountNumber).slice(-4)}) - ${formatCurrency(balance)}`;
                option.dataset.balance = balance;
                option.dataset.accountNumber = accountNumber;
                sourceAccountSelect.appendChild(option);
                if (!firstKey) firstKey = key;
            }
        });
        if (firstKey) {
            sourceAccountSelect.value = firstKey;
        }
    }
}

async function processTransfer(transferData) {
    try {
        const { sourceAccount, amount, recipientAccount, recipientName, transferType, memo } = transferData;
        let sourceOption = document.querySelector(`#sourceAccount option[value="${sourceAccount}"]`);
        if (!sourceOption) {
            const select = document.getElementById('sourceAccount');
            if (select && select.options.length > 1) {
                sourceOption = select.options[1];
            }
        }
        if (!sourceOption) throw new Error('Invalid source account');
        const currentBalance = parseFloat(sourceOption.dataset.balance);
        const transferAmount = parseFloat(amount);
        if (transferAmount > currentBalance) throw new Error('Insufficient funds for this transfer');
        if (transferAmount > 10000) throw new Error('Transfer amount exceeds daily limit of $10,000');
        const newBalance = currentBalance - transferAmount;
        const transactionId = generateTransactionId();
        const transactionDate = new Date().toISOString().split('T')[0];
        const transactionData = {
            id: transactionId,
            type: 'Debit',
            description: `Transfer to ${recipientName} (${recipientAccount})`,
            amount: transferAmount.toFixed(2),
            date: transactionDate,
            memo: memo || '',
            recipient: recipientName,
            recipientAccount: recipientAccount,
            transferType: transferType,
            status: 'Completed'
        };
        let updates = {};
        if (currentAccountData && typeof currentAccountData === "object" && !Array.isArray(currentAccountData) && currentAccountData[sourceAccount]) {
            updates[`accounts/${currentUser.uid}/${sourceAccount}/balance`] = newBalance.toFixed(2);
            updates[`accounts/${currentUser.uid}/${sourceAccount}/transactions/${transactionId}`] = transactionData;
        } else {
            updates[`accounts/${currentUser.uid}/balance`] = newBalance.toFixed(2);
            updates[`accounts/${currentUser.uid}/transactions/${transactionId}`] = transactionData;
        }
        await update(ref(database), updates);
        return {
            success: true,
            transactionId: transactionId,
            newBalance: newBalance
        };
    } catch (error) {
        throw error;
    }
}

async function handleTransferSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    try {
        const formData = new FormData(form);
        const transferData = {
            sourceAccount: formData.get('sourceAccount'),
            recipientAccount: formData.get('recipientAccountNumber'),
            amount: formData.get('transferAmount'),
            recipientName: formData.get('recipientName'),
            transferType: formData.get('transferType'),
            memo: formData.get('transferMemo')
        };
        if (!transferData.sourceAccount) throw new Error('Please select a source account');
        if (!validateAccountNumber(transferData.recipientAccount)) throw new Error('Please enter a valid recipient account number');
        const sourceOption = document.querySelector(`#sourceAccount option[value="${transferData.sourceAccount}"]`);
        const sourceAccountNumber = sourceOption ? sourceOption.dataset.accountNumber : null;
        if (sourceAccountNumber && transferData.recipientAccount === sourceAccountNumber) {
            throw new Error('You cannot transfer to your own account.');
        }
        if (!transferData.amount || parseFloat(transferData.amount) <= 0) throw new Error('Please enter a valid transfer amount');
        if (!transferData.recipientName.trim()) throw new Error('Please enter the recipient name');
        if (!transferData.transferType) throw new Error('Please select a transfer type');
        const result = await processTransfer(transferData);
        if (result.success) {
            showNotification(
                `Transfer successful! Transaction ID: ${result.transactionId}. New balance: ${formatCurrency(result.newBalance)}`,
                'success'
            );
            form.reset();
            setTimeout(() => {
                loadUserAccounts();
            }, 1000);
        }
    } catch (error) {
        console.error('Transfer error:', error);
        showNotification(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Money';
    }
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

function setupFormValidations() {
    const amountInput = document.getElementById('transferAmount');
    const accountInput = document.getElementById('recipientAccountNumber');
    if (amountInput) {
        amountInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value > 10000) {
                e.target.setCustomValidity('Amount exceeds daily limit of $10,000');
            } else if (value <= 0) {
                e.target.setCustomValidity('Amount must be greater than $0');
            } else {
                e.target.setCustomValidity('');
            }
        });
    }
    if (accountInput) {
        accountInput.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
            if (value.length < 8) {
                e.target.setCustomValidity('Account number must be at least 8 digits');
            } else if (value.length > 12) {
                e.target.setCustomValidity('Account number cannot exceed 12 digits');
            } else {
                e.target.setCustomValidity('');
            }
        });
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            currentUserData = snapshot.val();
        });
        const accountRef = ref(database, 'accounts/' + user.uid);
        onValue(accountRef, (snapshot) => {
            currentAccountData = snapshot.val();
            if (currentAccountData) {
                loadUserAccounts();
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', handleTransferSubmit);
    }
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
    setupFormValidations();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.min = today;
    });
});