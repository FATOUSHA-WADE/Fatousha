import 'tailwindcss/tailwind.css';
import './styles.css';

// Imports (seulement après vérification de l'authentification)
import { ContactsManager } from './modules/contacts.js';
import { MessagesManager } from './modules/messages.js';
import { showNotification, setupGlobalErrorHandling, showConfirmPopup, showError } from './modules/errors.js';
import { resizeImage, validatePhone, formatPhone } from './modules/utils.js';

// API_URL n'est pas défini
const API_URL = 'https://json-backend-2-kyx1.onrender.com'; // ou votre URL d'API

// Variables globales d'authentification
let currentUser = null;
let isLoggedIn = false;
// apiService n'est pas importé
import { ApiService } from './modules/api.js';
const apiService = new ApiService(API_URL);



// Instances des managers
const contactsManager = new ContactsManager();
const messagesManager = new MessagesManager();

// CORRECTION: Fonction pour synchroniser les variables d'authentification
function syncAuthVariables() {
    window.currentUser = currentUser;
    window.isLoggedIn = isLoggedIn;
    
    if (currentUser) {
        localStorage.setItem('whatsapp_user', JSON.stringify(currentUser));
        localStorage.setItem('whatsapp_token', 'dummy_token'); // Token temporaire
    }
}


// CORRECTION: Fonction pour charger les données de l'application
async function loadAppData() {
    try {
        await Promise.all([
            contactsManager.loadContacts(),
            messagesManager.loadChats()
        ]);
        syncAuthVariables();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

// Fonction checkAuthentication() appelée mais non définie
function checkAuthentication() {
    const token = localStorage.getItem('whatsapp_token');
    const user = localStorage.getItem('whatsapp_user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            isLoggedIn = true;
            syncAuthVariables();
            return true;
        } catch (error) {
            console.error('Erreur parsing user data:', error);
            localStorage.removeItem('whatsapp_token');
            localStorage.removeItem('whatsapp_user');
        }
    }
    
    isLoggedIn = false;
    currentUser = null;
    return false;
}

// Fonction initializeApp() appelée mais non définie
async function initializeApp() {
    try {
        // Afficher l'application principale
        showMainApp();
        
        // Charger les données de l'application
        await loadAppData();
        
        // Configurer les événements
        setupEventListeners();
        
        // Mettre à jour l'interface utilisateur
        updateUserInterface();
        
        // Afficher la vue des conversations
        showConversationsView();
        
        console.log('Application initialisée avec succès');
        showNotification('Connexion réussie!', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'app:', error);
        showNotification('Erreur lors de l\'initialisation', 'error');
    }
}
// Fonction showLoginInterface() appelée mais non définie
function showLoginInterface() {
    // Afficher la vue de connexion et cacher l'application principale
    const loginView = document.getElementById('login-view');
    const mainApp = document.getElementById('main-app');
    
    if (loginView && mainApp) {
        loginView.classList.remove('hidden');
        mainApp.classList.add('hidden');
    } else {
        // Fallback : redirection vers index.html
        window.location.href = 'index.html';
    }
}
function showMainApp() {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const mainApp = document.getElementById('main-app');
    
    if (loginView) loginView.classList.add('hidden');
    if (registerView) registerView.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
}
// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Configuration des erreurs globales
        setupGlobalErrorHandling();
        
        // Vérifier l'authentification
        const isAuthenticated = checkAuthentication();
        
        if (isAuthenticated) {
            // L'utilisateur est connecté, initialiser l'application
            await initializeApp();
        } else {
            // L'utilisateur n'est pas connecté, afficher la vue de connexion
            showLoginInterface();
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement de l\'application', 'error');
    }
});


// Configuration des événements
function setupEventListeners() {
    // Navigation
    setupNavigationEvents();
    
    // Formulaires
    setupFormEvents();
    
    // Messages
    setupMessageEvents();
    
    // Recherche
    setupSearchEvents();
    
    // Menu contextuel
    setupMenuEvents();
    
    // Événements personnalisés
    document.addEventListener('startChat', async (e) => {
        const { name, phone, contactId } = e.detail;
        const chat = await messagesManager.createChat(name, phone, contactId);
        messagesManager.openChat(chat);
        showConversationsView();
    });
}


function setupNavigationEvents() {
    document.getElementById('new-chat-btn')?.addEventListener('click', showNewChatView);
    document.getElementById('back-to-chats')?.addEventListener('click', showConversationsView);
    document.getElementById('new-contact-btn')?.addEventListener('click', showAddContactView);
    document.getElementById('back-to-new-chat')?.addEventListener('click', showNewChatView);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

function setupFormEvents() {
    const addContactForm = document.getElementById('addContactForm');
    if (addContactForm) {
        addContactForm.addEventListener('submit', handleAddContact);
    }
    
    const contactAvatar = document.getElementById('contactAvatar');
    if (contactAvatar) {
        contactAvatar.addEventListener('change', handleAvatarUpload);
    }
}

function setupMessageEvents() {
    const messageInput = document.querySelector('footer input[type="text"]');
    const sendButton = document.querySelector('footer button:last-child');
    
    if (messageInput && sendButton) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', function() {
            const icon = sendButton.querySelector('i');
            if (this.value.trim()) {
                icon.classList.remove('fa-microphone');
                icon.classList.add('fa-paper-plane');
            } else {
                icon.classList.remove('fa-paper-plane');
                icon.classList.add('fa-microphone');
            }
        });
        
        sendButton.addEventListener('click', () => {
            const icon = sendButton.querySelector('i');
            if (icon && icon.classList.contains('fa-paper-plane')) {
                sendMessage();
            }
        });
        
        messageInput.addEventListener('blur', function() {
            if (messagesManager.currentChat) {
                messagesManager.saveDraft(messagesManager.currentChat.id, this.value);
            }
        });
    }
}

function setupSearchEvents() {
    const contactSearch = document.getElementById('contact-search');
    if (contactSearch) {
        contactSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            contactsManager.filterContacts(searchTerm);
        });
    }
}

function setupMenuEvents() {
    const menuBtn = document.getElementById('chat-menu-btn');
    const menuDropdown = document.getElementById('chat-menu-dropdown');
    const deleteBtn = document.getElementById('delete-contact-btn');
    
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!messagesManager.currentChat) return;
            
            showConfirmPopup(`Supprimer le contact "${messagesManager.currentChat.name}" ?`, async () => {
                await contactsManager.deleteContact(messagesManager.currentChat.contactId);
                await messagesManager.deleteChat(messagesManager.currentChat.id);
                messagesManager.currentChat = null;
            });
            
            menuDropdown.classList.add('hidden');
        });
    }
    
    const contactsMenuBtn = document.getElementById('contacts-menu-btn');
    const contactsMenuDropdown = document.getElementById('contacts-menu-dropdown');

    if (contactsMenuBtn && contactsMenuDropdown) {
        contactsMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contactsMenuDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            contactsMenuDropdown.classList.add('hidden');
        });
        contactsMenuDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const mainMenuDropdown = document.getElementById('main-menu-dropdown');

    if (mainMenuBtn && mainMenuDropdown) {
        mainMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mainMenuDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!mainMenuDropdown.contains(e.target) && !mainMenuBtn.contains(e.target)) {
                mainMenuDropdown.classList.add('hidden');
            }
        });

        mainMenuDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Reste des fonctions (pas de changement significatif)
async function handleAddContact(event) {
    event.preventDefault();
    
    const saveBtn = document.getElementById('saveContactBtn');
    const formData = new FormData(event.target);
    
    const contactData = {
        prenom: formData.get('prenom').trim(),
        prenomPhonetique: formData.get('prenom-phonetique').trim(),
        nom: formData.get('nom').trim(),
        nomPhonetique: formData.get('nom-phonetique').trim(),
        entreprise: formData.get('entreprise').trim(),
        phone: formData.get('phone').trim()
    };
    
    const avatarImg = document.querySelector('#add-contact-view img[alt="Avatar"]');
    if (avatarImg && avatarImg.src.startsWith('data:')) {
        contactData.avatar = avatarImg.src;
    }
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enregistrement...';
    
    try {
        await contactsManager.addContact(contactData);
        event.target.reset();
        resetAvatarDisplay();
        showNewChatView();
    } catch (error) {
        showError('addContactError', error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Enregistrer';
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification('L\'image ne doit pas dépasser 10MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner une image valide', 'error');
        return;
    }
    
    try {
        const resizedImage = await resizeImage(file, 200, 200, 0.8);
        const avatarContainer = document.querySelector('#add-contact-view .w-32.h-32');
        if (avatarContainer) {
            avatarContainer.innerHTML = `
                <img src="${resizedImage}" alt="Avatar" class="w-full h-full object-cover rounded-full">
            `;
        }
        showNotification('Image chargée avec succès', 'success');
    } catch (error) {
        showNotification('Erreur lors du traitement de l\'image', 'error');
    }
}

async function sendMessage() {
    const messageInput = document.querySelector('footer input[type="text"]');
    if (!messageInput) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    await messagesManager.sendMessage(messageText);
    messageInput.value = '';
    
    const sendButton = document.querySelector('footer button:last-child i');
    if (sendButton) {
        sendButton.classList.remove('fa-paper-plane');
        sendButton.classList.add('fa-microphone');
    }
}

// Navigation
function showConversationsView() {
    document.getElementById('conversations-view').classList.remove('hidden');
    document.getElementById('new-chat-view').classList.add('hidden');
    document.getElementById('add-contact-view').classList.add('hidden');
}

function showNewChatView() {
    document.getElementById('conversations-view').classList.add('hidden');
    document.getElementById('new-chat-view').classList.remove('hidden');
    document.getElementById('add-contact-view').classList.add('hidden');
    contactsManager.renderContactList();
}

function showAddContactView() {
    document.getElementById('conversations-view').classList.add('hidden');
    document.getElementById('new-chat-view').classList.add('hidden');
    document.getElementById('add-contact-view').classList.remove('hidden');
    
    const form = document.getElementById('addContactForm');
    if (form) {
        form.reset();
        resetAvatarDisplay();
    }
}

function resetAvatarDisplay() {
    const avatarContainer = document.querySelector('#add-contact-view .w-32.h-32');
    if (avatarContainer) {
        avatarContainer.innerHTML = `<i class="fa-solid fa-image text-4xl text-blue-400"></i>`;
    }
}

function updateUserInterface() {
    if (currentUser) {
        const userAvatar = document.querySelector('aside img[alt="User"]');
        if (userAvatar && currentUser.avatar) {
            userAvatar.src = currentUser.avatar;
        }
    }
}

// CORRECTION: Fonction de déconnexion mise à jour
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('whatsapp_token');
        localStorage.removeItem('whatsapp_user');
        localStorage.removeItem('whatsapp_remember');
        window.location.href = 'index.html';
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(event) {
    console.error('Erreur globale:', event.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rejetée:', event.reason);
    showNotification('Erreur de chargement des données', 'error');
    event.preventDefault();
});

document.addEventListener('DOMContentLoaded', function() {
    // Gestion des vues de connexion/inscription
    const createAccountLink = document.getElementById('createAccountLink');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    // Basculer vers la vue d'inscription
    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginView) loginView.classList.add('hidden');
            if (registerView) registerView.classList.remove('hidden');
        });
    }

    // Retour à la vue de connexion
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerView) registerView.classList.add('hidden');
            if (loginView) loginView.classList.remove('hidden');
        });
    }

    // Gestion du formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Gestion du formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Gestion de l'affichage/masquage du mot de passe
    setupPasswordToggles();
});

// Fonction de connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    
    const formData = new FormData(event.target);
    const identifier = formData.get('identifier').trim();
    const password = formData.get('password').trim();
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validation de base
    if (!identifier || !password) {
        showLoginError('Veuillez remplir tous les champs');
        return;
    }
    
    // État de chargement
    loginBtn.disabled = true;
    loginBtnText.textContent = 'Connexion...';
    loginSpinner.classList.remove('hidden');
    hideLoginError();
    
    try {
        // Simuler un appel API ou utiliser des données locales
        const userData = await authenticateUser(identifier, password);
        
        if (userData) {
            // Connexion réussie
            currentUser = userData;
            isLoggedIn = true;
            
            // Sauvegarder les données
            localStorage.setItem('whatsapp_user', JSON.stringify(userData));
            localStorage.setItem('whatsapp_token', 'dummy_token_' + Date.now());
            
            if (rememberMe) {
                localStorage.setItem('whatsapp_remember', 'true');
            }
            
            // Initialiser l'application
            await initializeApp();
        } else {
            showLoginError('Identifiants incorrects');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showLoginError('Erreur de connexion. Veuillez réessayer.');
    } finally {
        // Restaurer l'état du bouton
        loginBtn.disabled = false;
        loginBtnText.textContent = 'Se connecter';
        loginSpinner.classList.add('hidden');
    }
}

// Fonction d'inscription
async function handleRegister(event) {
    event.preventDefault();
    
    const registerBtn = document.getElementById('registerBtn');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerSpinner = document.getElementById('registerSpinner');
    
    const formData = new FormData(event.target);
    const userData = {
        fullName: formData.get('fullName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        password: formData.get('newPassword').trim(),
        confirmPassword: formData.get('confirmPassword').trim()
    };
    
    // Validation
    if (!validateRegisterData(userData)) {
        return;
    }
    
    // État de chargement
    registerBtn.disabled = true;
    registerBtnText.textContent = 'Création...';
    registerSpinner.classList.remove('hidden');
    hideRegisterError();
    
    try {
        const newUser = await createUser(userData);
        
        if (newUser) {
            // Inscription réussie, connecter automatiquement
            currentUser = newUser;
            isLoggedIn = true;
            
            localStorage.setItem('whatsapp_user', JSON.stringify(newUser));
            localStorage.setItem('whatsapp_token', 'dummy_token_' + Date.now());
            
            // Initialiser l'application
            await initializeApp();
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        showRegisterError('Erreur lors de la création du compte');
    } finally {
        registerBtn.disabled = false;
        registerBtnText.textContent = 'Créer le compte';
        registerSpinner.classList.add('hidden');
    }
}

// Authentification utilisateur (simulation avec données locales)
async function authenticateUser(identifier, password) {
    // Utilisateurs par défaut pour test
    const defaultUsers = [
        {
            id: 1,
            name: "Admin",
            email: "admin@whatsapp.com",
            phone: "+221771234567",
            password: "admin123",
            avatar: null
        },
        {
            id: 2,
            name: "Test User",
            email: "test@example.com",
            phone: "+221771234568",
            password: "test123",
            avatar: null
        }
    ];
    
    // Vérifier les utilisateurs stockés localement
    let users = JSON.parse(localStorage.getItem('whatsapp_users') || '[]');
    if (users.length === 0) {
        users = defaultUsers;
        localStorage.setItem('whatsapp_users', JSON.stringify(users));
    }
    
    // Rechercher l'utilisateur
    const user = users.find(u => 
        (u.email === identifier || u.phone === identifier) && u.password === password
    );
    
    if (user) {
        // Retourner une copie sans le mot de passe
        const { password: pwd, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    return null;
}

// Créer un nouvel utilisateur
async function createUser(userData) {
    let users = JSON.parse(localStorage.getItem('whatsapp_users') || '[]');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(u => 
        u.email === userData.email || u.phone === userData.phone
    );
    
    if (existingUser) {
        throw new Error('Un utilisateur avec cet email ou téléphone existe déjà');
    }
    
    // Créer le nouvel utilisateur
    const newUser = {
        id: Date.now(),
        name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        avatar: null,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('whatsapp_users', JSON.stringify(users));
    
    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

// Validation des données d'inscription
function validateRegisterData(userData) {
    if (!userData.fullName) {
        showRegisterError('Le nom complet est requis');
        return false;
    }
    
    if (!userData.email || !isValidEmail(userData.email)) {
        showRegisterError('Email invalide');
        return false;
    }
    
    if (!userData.phone) {
        showRegisterError('Le numéro de téléphone est requis');
        return false;
    }
    
    if (!userData.password || userData.password.length < 6) {
        showRegisterError('Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }
    
    if (userData.password !== userData.confirmPassword) {
        showRegisterError('Les mots de passe ne correspondent pas');
        return false;
    }
    
    return true;
}

// Validation email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Afficher/masquer les erreurs
function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }
}

function hideLoginError() {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.classList.add('hidden');
    }
}

function showRegisterError(message) {
    const registerError = document.getElementById('registerError');
    if (registerError) {
        registerError.textContent = message;
        registerError.classList.remove('hidden');
    }
}

function hideRegisterError() {
    const registerError = document.getElementById('registerError');
    if (registerError) {
        registerError.classList.add('hidden');
    }
}

// Configuration des boutons de basculement de mot de passe
function setupPasswordToggles() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const icon = togglePassword.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    if (toggleNewPassword) {
        toggleNewPassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('newPassword');
            const icon = toggleNewPassword.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}