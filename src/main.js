let currentUser = null;
let currentChat = null;
let appData = null;
let isNewChatViewActive = false;

// Configuration Tailwind


// Fonction pour charger les données JSON
async function loadAppData() {
    try {
        const response = await fetch('src/data.json')

        if (!response.ok) throw new Error('Erreur lors du chargement des données');
        appData = await response.json();
        renderChatList();
    } catch (e) {
        console.warn('Impossible de charger les données JSON, utilisation des données de secours.');
        setupFallbackData();
        renderChatList();
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    loadAppData();
    setupEventListeners();
});

// Données de secours
function setupFallbackData() {
    appData = {
        users: [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrateur' },
            { id: 2, username: 'user1', password: 'pass123', name: 'Utilisateur 1' }
        ]
        
    };
}

// Configuration des événements
function setupEventListeners() {
    // Bouton nouvelle discussion
    document.getElementById('new-chat-btn').addEventListener('click', showNewChatView);
    
    // Bouton retour
    document.getElementById('back-to-chats').addEventListener('click', showConversationsView);
    
    // Recherche de contacts
    document.getElementById('contact-search').addEventListener('input', filterContacts);
    
    // Clics sur les contacts
    document.addEventListener('click', function(e) {
        const contactItem = e.target.closest('.contact-item');
        if (contactItem && contactItem.dataset.name) {
            startNewConversation(contactItem.dataset.name, contactItem.dataset.phone);
        }
    });
}

// Afficher la vue nouvelle discussion
function showNewChatView() {
    document.getElementById('conversations-view').classList.add('hidden');
    document.getElementById('new-chat-view').classList.remove('hidden');
    isNewChatViewActive = true;
    
    // Focus sur la barre de recherche
    setTimeout(() => {
        document.getElementById('contact-search').focus();
    }, 100);
}

// Afficher la vue des conversations
function showConversationsView() {
    document.getElementById('new-chat-view').classList.add('hidden');
    document.getElementById('conversations-view').classList.remove('hidden');
    isNewChatViewActive = false;
    
    // Nettoyer la recherche
    document.getElementById('contact-search').value = '';
    filterContacts();
}

// Filtrer les contacts
function filterContacts() {
    const searchTerm = document.getElementById('contact-search').value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        const name = item.querySelector('.font-semibold').textContent.toLowerCase();
        const phone = item.dataset.phone ? item.dataset.phone.toLowerCase() : '';
        
        const isVisible = name.includes(searchTerm) || phone.includes(searchTerm);
        item.style.display = isVisible ? 'flex' : 'none';
    });
}

// Démarrer une nouvelle conversation
function startNewConversation(contactName, contactPhone) {
    // Vérifier si une conversation existe déjà avec ce contact
    let existingChat = appData.chats.find(chat => 
        chat.name === contactName || chat.phone === contactPhone
    );
    
    if (!existingChat) {
        // Créer une nouvelle conversation
        const newChat = {
            id: Date.now(),
            name: contactName,
            phone: contactPhone,
            lastMessage: "Nouvelle conversation",
            time: getCurrentTime(),
            unread: 0,
            type: "contact",
            avatar: contactName.charAt(0).toUpperCase(),
            messages: []
        };
        
        appData.chats.unshift(newChat);
        existingChat = newChat;
    }
    
    // Retourner à la vue des conversations et ouvrir le chat
    showConversationsView();
    renderChatList();
    openChat(existingChat);
    
    showNotification(`Conversation avec ${contactName} ouverte`, 'success');
}

// Rendu de la liste des conversations
function renderChatList() {
    const chatList = document.getElementById('conversations-list');
    chatList.innerHTML = '';

    appData.chats.forEach(chat => {
        const chatElement = createChatElement(chat);
        chatList.appendChild(chatElement);
    });
}

// Création d'un élément de conversation
function createChatElement(chat) {
    const chatElement = document.createElement('div');
    chatElement.className = 'p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 chat-item animate-fadeIn';
    chatElement.onclick = () => openChat(chat);

    const avatarColor = getAvatarColor(chat.type);
    const unreadBadge = chat.unread > 0 ? 
        `<div class="bg-whatsapp text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">${chat.unread}</div>` : '';

    chatElement.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold shadow-md">
                ${chat.avatar}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h3 class="font-semibold text-gray-900 truncate">${chat.name}</h3>
                    <div class="flex flex-col items-end space-y-1">
                        <span class="text-xs text-gray-500">${chat.time}</span>
                        ${unreadBadge}
                    </div>
                </div>
                <p class="text-sm text-gray-600 truncate mt-1">${chat.lastMessage}</p>
            </div>
        </div>
    `;

    return chatElement;
}

// Obtenir la couleur de l'avatar selon le type
function getAvatarColor(type) {
    return type === 'group' ? 'bg-blue-500' : 'bg-green-500';
}

// Ouverture d'une conversation
function openChat(chat) {
    currentChat = chat;
    console.log('Chat ouvert:', chat.name);
    showNotification(`Chat avec ${chat.name} ouvert`, 'info');
}

// Obtenir l'heure actuelle formatée
function getCurrentTime() {
    return new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Affichage des notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-fadeIn ${getNotificationClass(type)}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate-fadeOut');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Classes CSS pour les notifications
function getNotificationClass(type) {
    const classes = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    return classes[type] || classes.info;
}

// Raccourcis clavier
document.addEventListener('keydown', function(e) {
    // Échap pour retourner aux conversations depuis la vue nouvelle discussion
    if (e.key === 'Escape' && isNewChatViewActive) {
        showConversationsView();
    }
    
    // Ctrl/Cmd + N pour nouvelle discussion
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!isNewChatViewActive) {
            showNewChatView();
        }
    }
});

console.log('WhatsApp Clone avec Nouvelle Discussion - Chargé avec succès !');