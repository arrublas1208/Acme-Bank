import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth, confirmPasswordReset } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCN8zBw644x9hrZngHpNYf01hY2UcENiTE",
    authDomain: "acme-bank-15f4a.firebaseapp.com",
    projectId: "acme-bank-15f4a",
    storageBucket: "acme-bank-15f4a.appspot.com",
    messagingSenderId: "575284743206",
    appId: "1:575284743206:web:9d38f5c7b7a9112092eae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showToast(message, isError = false) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const errors = [];
    if (password.length < minLength) errors.push(`Mínimo ${minLength} caracteres`);
    if (!hasUpperCase) errors.push('Al menos una mayúscula');
    if (!hasLowerCase) errors.push('Al menos una minúscula');
    if (!hasNumbers) errors.push('Al menos un número');
    if (!hasSpecialChar) errors.push('Al menos un carácter especial');
    return { isValid: errors.length === 0, errors };
}

document.addEventListener('DOMContentLoaded', () => {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('new-password1');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const passwordMatchMessage = document.getElementById('password-match-message');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetInput = document.getElementById(targetId);
            const icon = button.querySelector('i');
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    function checkPasswordsMatch() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (newPassword === '' && confirmPassword === '') {
            passwordMatchMessage.textContent = '';
            return false;
        }
        if (newPassword === confirmPassword && newPassword !== '') {
            passwordMatchMessage.textContent = 'Las contraseñas coinciden ✓';
            passwordMatchMessage.style.color = 'green';
            const validation = validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                passwordMatchMessage.textContent = `Contraseña débil: ${validation.errors.join(', ')}`;
                passwordMatchMessage.style.color = 'orange';
                return false;
            }
            return true;
        } else if (confirmPassword !== '') {
            passwordMatchMessage.textContent = 'Las contraseñas no coinciden';
            passwordMatchMessage.style.color = 'red';
            return false;
        } else {
            passwordMatchMessage.textContent = '';
            return false;
        }
    }

    newPasswordInput.addEventListener('input', checkPasswordsMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordsMatch);

    resetPasswordBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const oobCode = getUrlParameter('oobCode');

        if (!oobCode) {
            showToast('Enlace inválido o expirado.', true);
            return;
        }
        if (!newPassword || !confirmPassword) {
            showToast('Completa todos los campos.', true);
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Las contraseñas no coinciden.', true);
            return;
        }
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            showToast(`Contraseña débil: ${passwordValidation.errors.join(', ')}`, true);
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            showToast('Contraseña restablecida exitosamente.');
            setTimeout(() => window.location.href = 'index.html', 2000);
        } catch (error) {
            showToast('No se pudo restablecer la contraseña: ' + error.message, true);
        }
    });
});