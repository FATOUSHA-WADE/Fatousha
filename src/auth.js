// Variables globales
let isLoggedIn = false;
let currentUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupAuthEventListeners();
});

// Vérifier le statut d'authentification
function checkAuthStatus() {
    const token = localStorage.getItem('whatsapp_token');
    const userData = localStorage.getItem('whatsapp_user');
    
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            // Rediriger vers l'application principale
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur lors de la récupération des données utilisateur:', error);
            clearAuthData();
        }
    }
}

// Configuration des événements d'authentification
function setupAuthEventListeners() {
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Toggle mot de passe
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => togglePasswordVisibility('password'));
    }
    
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    if (toggleNewPassword) {
        toggleNewPassword.addEventListener('click', () => togglePasswordVisibility('newPassword'));
    }
    
    // Liens de navigation
    const createAccountLink = document.getElementById('createAccountLink');
    if (createAccountLink) {
        createAccountLink.addEventListener('click', showRegisterView);
    }
    
    const backToLoginLink = document.getElementById('backToLoginLink');
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', showLoginView);
    }
    
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// Gérer la connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    
    // Récupérer les données du formulaire
    const formData = new FormData(event.target);
    const identifier = formData.get('identifier').trim();
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validation
    if (!identifier || !password) {
        showError('loginError', 'Veuillez remplir tous les champs');
        return;
    }
    
    // État de chargement
    setLoadingState(loginBtn, loginBtnText, loginSpinner, true);
    hideError('loginError');
    
    try {
        // Charger les données utilisateurs
        const users = await loadUsersData();
        
        // Vérifier les identifiants
        const user = users.find(u => 
            (u.email === identifier || u.phone === identifier) && u.password === password
        );
        
        if (!user) {
            throw new Error('Identifiants incorrects');
        }
        
        // Connexion réussie
        const token = generateToken();
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar || null
        };
        
        // Sauvegarder les données d'authentification
        localStorage.setItem('whatsapp_token', token);
        localStorage.setItem('whatsapp_user', JSON.stringify(userData));
        
        if (rememberMe) {
            localStorage.setItem('whatsapp_remember', 'true');
        }
        
        currentUser = userData;
        isLoggedIn = true;
        
        // Redirection vers l'application
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showError('loginError', error.message || 'Erreur de connexion');
    } finally {
        setLoadingState(loginBtn, loginBtnText, loginSpinner, false);
    }
}

// Gérer l'inscription
async function handleRegister(event) {
    event.preventDefault();
    
    const registerBtn = document.getElementById('registerBtn');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerSpinner = document.getElementById('registerSpinner');
    
    // Récupérer les données du formulaire
    const formData = new FormData(event.target);
    const fullName = formData.get('fullName').trim();
    const email = formData.get('email').trim();
    const phone = formData.get('phone').trim();
    const password = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
        showError('registerError', 'Veuillez remplir tous les champs');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('registerError', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('registerError', 'Adresse email invalide');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showError('registerError', 'Numéro de téléphone invalide');
        return;
    }
    
    // État de chargement
    setLoadingState(registerBtn, registerBtnText, registerSpinner, true);
    hideError('registerError');
    
    try {
        // Charger les données utilisateurs existantes
        const users = await loadUsersData();
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = users.find(u => u.email === email || u.phone === phone);
        if (existingUser) {
            throw new Error('Un compte existe déjà avec cet email ou ce numéro');
        }
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: generateUserId(),
            name: fullName,
            email: email,
            phone: phone,
            password: password,
            avatar: null,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Ajouter à la liste des utilisateurs
        users.push(newUser);
        
        // Sauvegarder dans localStorage (simulation)
        localStorage.setItem('whatsapp_users', JSON.stringify(users));
        
        // Connexion automatique après inscription
        const token = generateToken();
        const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            avatar: newUser.avatar
        };
        
        localStorage.setItem('whatsapp_token', token);
        localStorage.setItem('whatsapp_user', JSON.stringify(userData));
        
        currentUser = userData;
        isLoggedIn = true;
        
        // Redirection vers l'application
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        showError('registerError', error.message || 'Erreur lors de la création du compte');
    } finally {
        setLoadingState(registerBtn, registerBtnText, registerSpinner, false);
    }
}

// Charger les données utilisateurs
async function loadUsersData() {
    try {
        // Essayer de charger depuis data.json
        const response = await fetch('src/data.json');
        if (response.ok) {
            const data = await response.json();
            if (data.users && Array.isArray(data.users)) {
                return data.users;
            }
        }
    } catch (error) {
        console.log('Impossible de charger data.json, utilisation du localStorage');
    }
    
    // Fallback vers localStorage
    const savedUsers = localStorage.getItem('whatsapp_users');
    if (savedUsers) {
        return JSON.parse(savedUsers);
    }
    
    // Données par défaut
    return [
        {
            id: 1,
            name: "Admin",
            email: "admin@whatsapp.com",
            phone: "+221771234567",
            password: "admin123",
            avatar: null,
            createdAt: new Date().toISOString(),
            isActive: true
        }
    ];
}

// Fonctions utilitaires
function generateToken() {
    return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateUserId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(`toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function setLoadingState(button, textElement, spinner, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
        textElement.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        textElement.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function showLoginView() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('register-view').classList.add('hidden');
}

function showRegisterView() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('register-view').classList.remove('hidden');
}

function handleForgotPassword() {
    alert('Fonctionnalité de récupération de mot de passe à implémenter');
}
//zone de connexion
function clearAuthData() {
    localStorage.removeItem('whatsapp_token');
    localStorage.removeItem('whatsapp_user');
    localStorage.removeItem('whatsapp_remember');
    currentUser = null;
    isLoggedIn = false;
}

// Fonction de déconnexion (à utiliser dans l'application principale)
function logout() {
    clearAuthData();
    window.location.href = 'login.html';
}

// Exporter les fonctions pour utilisation dans d'autres fichiers
window.logout = logout;
window.currentUser = currentUser;
window.isLoggedIn = isLoggedIn;