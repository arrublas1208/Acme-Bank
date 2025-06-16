import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"
import { getDatabase, ref, get, update, push } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js"

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

let currentUser = null
let lastPaymentData = null

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

  const logoutBtn = document.querySelector(".logout")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      auth.signOut().then(() => {
        window.location.href = "index.html"
      })
    })
  }
})

// Autenticación y carga de datos del usuario
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  currentUser = user

  // Cargar datos del usuario para mostrar iniciales
  try {
    const userRef = ref(db, "users/" + user.uid)
    const snapshot = await get(userRef)
    if (snapshot.exists()) {
      const userData = snapshot.val()
      const iniciales = `${userData.name?.charAt(0) || ""}${userData.lastName?.charAt(0) || ""}`.toUpperCase()
      const profileDiv = document.querySelector(".user-profile")
      if (profileDiv) {
        profileDiv.textContent = iniciales
        profileDiv.style.color = "white"
        profileDiv.style.borderRadius = "50%"
        profileDiv.style.display = "flex"
        profileDiv.style.alignItems = "center"
        profileDiv.style.justifyContent = "center"
        profileDiv.style.width = "40px"
        profileDiv.style.height = "40px"
        profileDiv.style.cursor = "pointer"
        profileDiv.addEventListener("click", () => {
          window.location.href = "profile.html"
        })
      }
    }
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error)
  }

  // Configurar el formulario de pago
  setupPaymentForm()
})

function setupPaymentForm() {
  const paymentForm = document.getElementById("depositForm")
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePaymentSubmission)
  }
}

function generateTransactionId() {
  return "TXN-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

async function handlePaymentSubmission(event) {
  event.preventDefault()

  if (!currentUser) {
    alert("Debe iniciar sesión para realizar pagos.")
    return
  }

  const formData = new FormData(event.target)
  const publicService = formData.get("destinationAccount")
  const referenceNumber = formData.get("reference")
  const amount = Number.parseFloat(formData.get("depositAmount"))

  // Validación
  if (!publicService || !referenceNumber || !amount) {
    alert("Todos los campos son requeridos.")
    return
  }

  if (amount <= 0) {
    alert("El monto debe ser mayor a $0.00")
    return
  }

  // Confirmar el pago
  const serviceSelect = document.getElementById("destinationAccount")
  const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text

  const confirmMessage = `¿Confirma el pago de $${amount.toFixed(2)} para ${serviceName}?\nReferencia: ${referenceNumber}`
  if (!confirm(confirmMessage)) {
    return
  }

  // Mostrar estado de carga
  const submitButton = event.target.querySelector(".submit-button")
  const originalText = submitButton.textContent
  submitButton.disabled = true
  submitButton.textContent = "Procesando..."

  try {
    // Obtener datos actuales de la cuenta
    const accountRef = ref(db, `accounts/${currentUser.uid}`)
    const accountSnap = await get(accountRef)

    if (!accountSnap.exists()) {
      alert("Cuenta no encontrada.")
      return
    }

    const accountData = accountSnap.val()
    const currentBalance = Number.parseFloat(accountData.balance || 0)

    // Verificar fondos suficientes
    if (amount > currentBalance) {
      alert("Fondos insuficientes para realizar el pago.")
      return
    }

    // Calcular nuevo saldo
    const newBalance = (currentBalance - amount).toFixed(2)

    // Generar ID de transacción
    const transactionId = generateTransactionId()

    // Actualizar saldo
    await update(accountRef, { balance: newBalance })

    // Crear registro de transacción 
    const transaction = {
      description: `Utility Bill Payment - ${serviceName}`,
      amount: amount.toFixed(2),
      type: "Debit",
      date: new Date().toLocaleDateString("en-US"),
      memo: `Reference: ${referenceNumber}`,
    }

    // Agregar transacción al historial
    await push(ref(db, `accounts/${currentUser.uid}/transactions`), transaction)

    // Guardar datos del pago para el resumen
    lastPaymentData = {
      transactionId,
      serviceName,
      referenceNumber,
      amount: amount.toFixed(2),
      newBalance,
      date: new Date().toLocaleString("en-US"),
    }

    // Mostrar resumen del pago
    showPaymentSummary()

    console.log("Pago procesado exitosamente:", lastPaymentData)
  } catch (error) {
    console.error("Error procesando el pago:", error)
    alert("Error al procesar el pago. Intente nuevamente.")
  } finally {
    // Restaurar botón
    submitButton.disabled = false
    submitButton.textContent = originalText
  }
}

function showPaymentSummary() {
  try {
    if (!lastPaymentData) {
      console.error("No hay datos de pago para mostrar")
      return
    }

    console.log("Mostrando resumen con datos:", lastPaymentData)

    // Llenar los datos del resumen
    const elements = {
      "transaction-id": lastPaymentData.transactionId,
      "service-name": lastPaymentData.serviceName,
      "reference-number": lastPaymentData.referenceNumber,
      "amount-paid": `$${lastPaymentData.amount}`,
      "payment-date": lastPaymentData.date,
      "new-balance": `$${lastPaymentData.newBalance}`,
    }

    // Actualizar cada elemento
    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id)
      if (element) {
        element.textContent = value
        console.log(`Actualizado ${id}: ${value}`)
      } else {
        console.error(`Elemento no encontrado: ${id}`)
      }
    }

    // Mostrar el resumen
    const summaryElement = document.getElementById("payment-summary")
    if (summaryElement) {
      summaryElement.style.display = "block"
      console.log("Resumen mostrado")

      setTimeout(() => {
        summaryElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } else {
      console.error("Elemento payment-summary no encontrado")
    }
  } catch (error) {
    console.error("Error mostrando resumen:", error)
  }
}

// Función para imprimir el recibo
function printReceipt() {
  if (!lastPaymentData) {
    alert("No hay datos de pago para imprimir")
    return
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Receipt - ACME Bank</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1d2f75; padding-bottom: 20px; }
            .receipt-header h1 { color: #1d2f75; margin: 0; font-size: 2rem; }
            .receipt-header h2 { color: #666; margin: 5px 0 0 0; font-size: 1.2rem; }
            .receipt-details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; font-weight: bold; }
            .label { font-weight: bold; }
            .value { text-align: right; }
            .amount { color: #28a745; font-size: 1.2rem; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9rem; color: #666; }
        </style>
    </head>
    <body>
        <div class="receipt-header">
            <h1>ACME BANK</h1>
            <h2>Utility Bill Payment Receipt</h2>
        </div>
        <div class="receipt-details">
            <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span class="value">${lastPaymentData.transactionId}</span>
            </div>
            <div class="detail-row">
                <span class="label">Service:</span>
                <span class="value">${lastPaymentData.serviceName}</span>
            </div>
            <div class="detail-row">
                <span class="label">Reference Number:</span>
                <span class="value">${lastPaymentData.referenceNumber}</span>
            </div>
            <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span class="value amount">$${lastPaymentData.amount}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">${lastPaymentData.date}</span>
            </div>
        </div>
        <div class="footer">
            <p>Thank you for using ACME Bank services.</p>
            <p>This receipt is computer generated and does not require a signature.</p>
        </div>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  } else {
    alert("No se pudo abrir la ventana de impresión. Por favor, permita ventanas emergentes.")
  }
}

// Función para nuevo pago
function newPayment() {
  const summaryElement = document.getElementById("payment-summary")
  if (summaryElement) {
    summaryElement.style.display = "none"
  }

  // Limpiar formulario
  const form = document.getElementById("depositForm")
  if (form) {
    form.reset()
    form.scrollIntoView({ behavior: "smooth" })
  }

  // Limpiar datos del último pago
  lastPaymentData = null
}

// Función para ir al dashboard
function goToDashboard() {
  window.location.href = "dashboard.html"
}

// Hacer las funciones globales para los botones
window.printReceipt = printReceipt
window.newPayment = newPayment
window.goToDashboard = goToDashboard

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Exportar funciones si es necesario
window.PublicServicesApp = {
  handlePaymentSubmission,
  formatCurrency,
  printReceipt,
  newPayment,
  goToDashboard,
}
