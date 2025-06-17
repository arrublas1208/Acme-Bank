import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
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

function getCurrentDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date().toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function loadProfileData(userData, accountData) {
    if (!userData || !accountData) return;
    
    document.getElementById('profile-name').textContent = `${userData.name} ${userData.lastName}`;
    document.getElementById('profile-id').textContent = `ID: ${userData.idNumber}`;
    document.getElementById('profile-email').textContent = userData.email || 'No email provided';
    
    document.getElementById('profile-balance').textContent = formatCurrency(parseFloat(accountData.balance));
    document.getElementById('profile-account-number').textContent = accountData.accountNumber;
    
    if (document.getElementById('display-name')) {
        document.getElementById('display-name').textContent = `${userData.name} ${userData.lastName}`;
        document.getElementById('display-id').textContent = `ID: ${userData.idNumber}`;
        document.getElementById('display-date').textContent = getCurrentDate();
        
        const initials = `${userData.name.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
        const userBtn = document.getElementById('user-menu-btn');
        if (userBtn) {
            userBtn.textContent = initials;
            Object.assign(userBtn.style, {
                backgroundColor: '#003ab6',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                border: 'none',
                cursor: 'pointer',
                outline: 'none'
            });
        }
    }
}

function setupUserMenu() {
    const userBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    if (userBtn && dropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', function(event) {
            if (!userBtn.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        setupUserMenu();
        
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            
            const accountRef = ref(database, 'accounts/' + user.uid);
            onValue(accountRef, (accountSnapshot) => {
                const accountData = accountSnapshot.val();
                loadProfileData(userData, accountData);
            });
        });
    } else {
        window.location.href = "index.html";
    }
});

if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
}