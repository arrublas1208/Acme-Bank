import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js"

const firebaseConfig = {
  apiKey: "AIzaSyCN8zBw644x9hrZngHpNYf01hY2UcENiTE",
  authDomain: "acme-bank-15f4a.firebaseapp.com",
  databaseURL: "https://acme-bank-15f4a-default-rtdb.firebaseio.com",
  projectId: "acme-bank-15f4a",
  storageBucket: "acme-bank-15f4a.appspot.com",
  messagingSenderId: "575284743206",
  appId: "1:575284743206:web:9d38f5c7b7a9112092eae7",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

// Elementos del DOM
const loadingState = document.getElementById("loading-state")
const errorState = document.getElementById("error-state")
const errorMessage = document.getElementById("error-message")
const debugInfo = document.getElementById("debug-info")
const debugContent = document.getElementById("debug-content")
const certificateDiv = document.getElementById("bank-certificate")
const userProfile = document.getElementById("user-profile")


const DEBUG_MODE = true

function showDebug(title, data) {
  if (!DEBUG_MODE || !debugInfo || !debugContent) return

  console.log(`[DEBUG] ${title}:`, data)

  debugContent.innerHTML += `
    <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">
      <strong>${title}:</strong>
      <pre style="margin: 5px 0; font-size: 12px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
    </div>
  `
  debugInfo.style.display = "block"
}

function showLoading() {
  if (loadingState) loadingState.style.display = "block"
  if (errorState) errorState.style.display = "none"
  if (certificateDiv) certificateDiv.style.display = "none"
}

function showError(message) {
  console.error("Certificate Error:", message)
  if (loadingState) loadingState.style.display = "none"
  if (errorState) errorState.style.display = "block"
  if (errorMessage) errorMessage.textContent = message
  if (certificateDiv) certificateDiv.style.display = "none"

  showDebug("Error", { message, timestamp: new Date().toISOString() })
}

function showCertificate() {
  if (loadingState) loadingState.style.display = "none"
  if (errorState) errorState.style.display = "none"
  if (certificateDiv) certificateDiv.style.display = "block"
}

function formatDate(dateString) {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

function generateCertificateNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `CERT-${year}${month}${day}-${random}`
}

async function fetchUserData(user) {
  try {
    showDebug("User Auth Object", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    })

    // Obtener datos del usuario desde users/${uid}
    console.log(` Fetching user data from: users/${user.uid}`)
    const userRef = ref(db, `users/${user.uid}`)
    const userSnap = await get(userRef)

    let userData = null
    if (userSnap.exists()) {
      userData = userSnap.val()
      console.log(` User data found:`, userData)
      showDebug("User data from Firebase", userData)
    } else {
      console.log(` No user data found at users/${user.uid}`)
    }

    // Obtener datos de la cuenta desde accounts/${uid}
    console.log(`Fetching account data from: accounts/${user.uid}`)
    const accountRef = ref(db, `accounts/${user.uid}`)
    const accountSnap = await get(accountRef)

    let accountData = null
    if (accountSnap.exists()) {
      accountData = accountSnap.val()
      console.log(`Account data found:`, accountData)
      showDebug("Account data from Firebase", accountData)
    } else {
      console.log(` No account data found at accounts/${user.uid}`)
    }

    // Combinar los datos
    const combinedData = {
      // Datos del usuario
      name: userData?.name || "N/A",
      lastName: userData?.lastName || "",
      fullName:
        userData?.name && userData?.lastName
          ? `${userData.name} ${userData.lastName}`
          : userData?.name || user.displayName || user.email?.split("@")[0] || "Account Holder",
      idNumber: userData?.idNumber || "N/A",
      email: userData?.email || user.email || "N/A",

      // Datos de la cuenta
      accountNumber: accountData?.accountNumber || `ACC-${user.uid.substring(0, 10).toUpperCase()}`,
      balance: accountData?.balance || "0.00",

      // Fecha de creacion
      accountOpeningDate: user.metadata.creationTime,

      uid: user.uid,
      status: "Active",
      lastLogin: user.metadata.lastSignInTime,
    }

    console.log("Final combined data for certificate:", combinedData)
    showDebug("Combined data for certificate", combinedData)

    return combinedData
  } catch (error) {
    console.error(" Error fetching user data:", error)
    showDebug("Fetch Error", error)
    throw new Error(`Failed to fetch user information: ${error.message}`)
  }
}

function renderBankCertificate(userData, user) {
  if (!certificateDiv) {
    showError("Certificate container not found in the page")
    return
  }

  if (!userData) {
    showError("No user data available to generate certificate")
    return
  }

  showDebug("Rendering certificate with data", userData)

  const certificateNumber = generateCertificateNumber()
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Actualizar perfil de usuario en header
  if (userProfile && userData.fullName) {
    const initials =
      userData.name && userData.lastName
        ? `${userData.name.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase()
        : userData.fullName.charAt(0).toUpperCase()
    userProfile.textContent = initials
  }

  certificateDiv.innerHTML = `
    <div class="certificate-content">
      <div class="certificate-header">
        <img src="assets/img/tex-logo-white.png" alt="ACME BANK">
        <h3>OFFICIAL BANK CERTIFICATE</h3>
      </div>
      
      <div class="certificate-info">
        <div class="info-row">
          <span class="info-label">Certificate Number:</span>
          <span class="info-value">${certificateNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Issue Date:</span>
          <span class="info-value">${currentDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Holder Name:</span>
          <span class="info-value">${userData.fullName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Identification Number:</span>
          <span class="info-value">${userData.idNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Number:</span>
          <span class="info-value">${userData.accountNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Opening Date:</span>
          <span class="info-value">${formatDate(userData.accountOpeningDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Status:</span>
          <span class="info-value">${userData.status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email Address:</span>
          <span class="info-value">${userData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Balance:</span>
          <span class="info-value">$${Number.parseFloat(userData.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div class="certificate-statement">
        <p>This is to certify that <strong>${userData.fullName}</strong> 
        (ID: ${userData.idNumber}) is a valued customer of ACME BANK and maintains an active account 
        (Account No: ${userData.accountNumber}) with us. This certificate is issued 
        for official purposes and is valid as of the date mentioned above.</p>
      </div>
      
      <div class="certificate-footer">
        <p><em>This certificate is computer generated and does not require a physical signature.</em></p>
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            <p><strong>Bank Manager</strong></p>
            <p>ACME BANK</p>
          </div>
        </div>
      </div>
      
      <div class="certificate-actions">
        <button onclick="window.print()" class="cert-btn print-btn">
          <span class="material-icons">print</span>
          Print Certificate
        </button>
        <button onclick="downloadCertificate()" class="cert-btn download-btn">
          <span class="material-icons">download</span>
          Download PDF
        </button>
      </div>
    </div>
  `

  showCertificate()
  showDebug("Certificate rendered successfully", { certificateNumber, currentDate })
}

// Función para descargar certificado
window.downloadCertificate = () => {
  alert("PDF download functionality will be implemented soon")
}

// Manejo del menú hamburguesa
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger")
  const sidebar = document.getElementById("sidebar")
  const overlay = document.getElementById("overlay")

  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("active")
      overlay.classList.toggle("active")
    })

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active")
      overlay.classList.remove("active")
    })
  }
})

// Inicialización principal
onAuthStateChanged(auth, async (user) => {
  console.log(" Auth state changed")
  showLoading()

  if (!user) {
    console.log(" No authenticated user, redirecting to login")
    showDebug("Auth Status", "No user authenticated")
    window.location.href = "index.html"
    return
  }

  console.log("User authenticated:", user.uid)
  showDebug("Authentication Success", { uid: user.uid, email: user.email })

  try {
    const userData = await fetchUserData(user)
    console.log(" Final user data for certificate:", userData)
    renderBankCertificate(userData, user)
  } catch (error) {
    console.error(" Error loading certificate:", error)
    showError(error.message || "Failed to load certificate. Please try again.")
  }
})