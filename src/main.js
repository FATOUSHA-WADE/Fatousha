import 'tailwindcss/tailwind.css';
import './styles.css';

// Imports (seulement après vérification de l'authentification)
import { ContactsManager } from './modules/contacts.js';
import { MessagesManager } from './modules/messages.js';
import { showNotification, setupGlobalErrorHandling, showConfirmPopup, showError } from './modules/errors.js';
import { resizeImage, validatePhone, formatPhone } from './modules/utils.js';

// API_URL n'est pas défini
const API_URL = 'http://localhost:3000/api'; // ou votre URL d'API

// apiService n'est pas importé
import { ApiService } from './modules/api.js';
const apiService = new ApiService();


// Instances des managers
const contactsManager = new ContactsManager();
const messagesManager = new MessagesManager();

// CORRECTION: Fonction pour synchroniser les variables d'authentification
function syncAuthVariables() {
    window.currentUser = currentUser;
    window.isLoggedIn = isLoggedIn;
    
    if (currentUser) {
        localStorage.setItem('whatsapp_user', JSON.stringify(currentUser));
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
        // Charger les données de l'application
        await loadAppData();
        
        // Configurer les événements
        setupEventListeners();
        
        // Mettre à jour l'interface utilisateur
        updateUserInterface();
        
        // Afficher la vue des conversations
        showConversationsView();
        
        console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'app:', error);
        showNotification('Erreur lors de l\'initialisation', 'error');
    }
}

// Fonction showLoginInterface() appelée mais non définie
function showLoginInterface() {
    // Rediriger vers la page de connexion ou afficher le formulaire de connexion
    window.location.href = 'index.html';
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