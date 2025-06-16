import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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
        const uid = user.uid;
        const userRef = ref(database, 'users/' + uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                const initials = `${userData.name.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
                const userIcon = document.querySelector('.user-icon');

                document.querySelector('.user-icon').textContent = initials;
                document.querySelector('.user-icon').style.backgroundColor = '#003ab6';
                document.querySelector('.user-icon').style.color = 'white';
                document.querySelector('.user-icon').style.borderRadius = '50%';
                document.querySelector('.user-icon').style.display = 'flex';
                document.querySelector('.user-icon').style.alignItems = 'center';
                document.querySelector('.user-icon').style.justifyContent = 'center';
                document.querySelector('.user-icon').style.width = '40px';
                document.querySelector('.user-icon').style.height = '40px';
                const userMenuBtn = document.getElementById('user-menu-btn')
                userMenuBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = "profile.html";
        });    
            
            }
            
            
        });
        const accountRef = ref(database, `accounts/${uid}`);
        const depositSource = document.getElementById("depositSource");
        const checkUploadGroup = document.getElementById("checkUploadGroup");

        depositSource.addEventListener("change", () => {
            checkUploadGroup.style.display = depositSource.value === "check" ? "block" : "none";
            
        });
        

        const form = document.getElementById("depositForm");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById("depositAmount").value);
            const destinationAccount = document.getElementById("destinationAccount").value;
            const depositSourceValue = document.getElementById("depositSource").value;
            const memo = document.getElementById("memo").value || "";

            if (!destinationAccount || !depositSourceValue || amount <= 0) {
                alert("Please complete all required fields.");
                return;
            }

            onValue(accountRef, (snapshot) => {
                const accountData = snapshot.val();

                if (accountData) {
                    const currentBalance = parseFloat(accountData.balance || 0);
                    const newBalance = (currentBalance + amount).toFixed(2);

                    const newTransaction = {
                        description: `Deposit - ${depositSourceValue}`,
                        amount: amount.toFixed(2),
                        type: "Credit",
                        date: new Date().toLocaleDateString("en-US"),
                        memo: memo
                    };

                    update(accountRef, {
                        balance: newBalance
                    });

                    const transactionsRef = ref(database, `accounts/${uid}/transactions`);
                    push(transactionsRef, newTransaction);

                    alert("Deposit successful!");
                    form.reset();
                    checkUploadGroup.style.display = "none";
                }
            }, { onlyOnce: true });
        });
    } else {
        window.location.href = "index.html";
    }
});




