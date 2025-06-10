// Ajouter ces imports en haut de votre main.js :
import './style.css'
import './data.json'
// Variables globales
let whatsappData = {};

// Fonction pour charger les données JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        whatsappData = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Données de fallback en cas d'erreur
        whatsappData = {
            header: { title: "WhatsApp", unreadCount: 45 },
            searchPlaceholder: "Rechercher ou démarrer une discussion",
            tabs: [
                { id: "all", label: "Toutes", active: true },
                { id: "unread", label: "Non lues", active: false },
                { id: "favorites", label: "Favoris", active: false },
                { id: "groups", label: "Groupes", active: false }
            ],
            conversations: [],
            businessPromo: {
                title: "WhatsApp Business sur le Web",
                subtitle: "Développez, organisez et gérez votre compte professionnel."
            },
            encryption: {
                message: "Vos messages personnels sont chiffrés de bout en bout"
            }
        };
        initializeApp();
    }
}

// Fonction pour initialiser l'application
function initializeApp() {
    updateHeader();
    updateSearchPlaceholder();
    renderTabs();
    renderConversations();
    updateBusinessPromo();
    updateEncryptionMessage();
    
    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Fonction pour mettre à jour l'en-tête
function updateHeader() {
    const titleElement = document.getElementById('app-title');
    const unreadCountElement = document.getElementById('unread-count');
    
    if (titleElement) {
        titleElement.textContent = whatsappData.header.title;
    }
    
    if (unreadCountElement) {
        unreadCountElement.textContent = whatsappData.header.unreadCount;
    }
}

// Fonction pour mettre à jour le placeholder de recherche
function updateSearchPlaceholder() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = whatsappData.searchPlaceholder;
    }
}

// Fonction pour rendre les onglets
function renderTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    whatsappData.tabs.forEach(tab => {
        const tabElement = document.createElement('button');
        tabElement.className = `px-4 py-2 rounded-full text-sm font-medium ${
            tab.active
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
        }`;
        tabElement.textContent = tab.label;
        tabElement.onclick = () => handleTabClick(tab.id);
        
        tabsContainer.appendChild(tabElement);
    });
}

// Fonction pour rendre les conversations
function renderConversations() {
    const conversationsContainer = document.getElementById('conversations-container');
    if (!conversationsContainer) return;
    
    conversationsContainer.innerHTML = '';
    
    whatsappData.conversations.forEach(conversation => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'px-4 py-3 hover:bg-gray-50 cursor-pointer';
        conversationElement.onclick = () => handleConversationClick(conversation.id);
        
        conversationElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-medium text-gray-900 truncate">
                            ${conversation.name}
                        </h3>
                        <span class="text-xs text-gray-500">${conversation.time}</span>
                    </div>
                    <div class="flex items-center space-x-1 mt-1">
                        ${renderConversationContent(conversation)}
                    </div>
                </div>
            </div>
        `;
        
        conversationsContainer.appendChild(conversationElement);
    });
}

// Fonction pour rendre le contenu d'une conversation
function renderConversationContent(conversation) {
    let content = '';
    
    if (conversation.hasVoiceNote) {
        content += `
            <div class="w-3 h-3 text-green-600">
                <svg viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 1a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1zM3 6a3 3 0 1 1 6 0v1H3V6z"/>
                </svg>
            </div>
            <span class="text-xs text-gray-500">${conversation.voiceDuration}</span>
        `;
    }
    
    if (conversation.messageType === 'photo') {
        content += `
            <i data-lucide="camera" class="w-3 h-3 text-gray-500"></i>
            <span class="text-xs text-gray-500">Photo</span>
        `;
    }
    
    if (conversation.messageType === 'sticker') {
        content += `
            <div class="w-3 h-3 text-gray-500">😊</div>
            <span class="text-xs text-gray-500">Sticker</span>
        `;
    }
    
    if (conversation.messageType === 'media' && conversation.mediaCount) {
        content += `<span class="text-xs text-gray-500">${conversation.mediaCount}</span>`;
    }
    
    if (conversation.lastMessage) {
        content += `<span class="text-xs text-gray-500 truncate">${conversation.lastMessage}</span>`;
    }
    
    return content;
}

// Fonction pour mettre à jour la promotion business
function updateBusinessPromo() {
    const businessTitle = document.getElementById('business-title');
    const businessSubtitle = document.getElementById('business-subtitle');
    
    if (businessTitle) {
        businessTitle.textContent = whatsappData.businessPromo.title;
    }
    
    if (businessSubtitle) {
        businessSubtitle.textContent = whatsappData.businessPromo.subtitle;
    }
}

// Fonction pour mettre à jour le message de chiffrement
function updateEncryptionMessage() {
    const encryptionMessage = document.getElementById('encryption-message');
    if (encryptionMessage) {
        encryptionMessage.textContent = whatsappData.encryption.message;
    }
}

// Gestionnaire de clic sur les onglets
function handleTabClick(tabId) {
    // Mettre à jour l'état actif des onglets
    whatsappData.tabs.forEach(tab => {
        tab.active = tab.id === tabId;
    });
    
    // Re-rendre les onglets
    renderTabs();
    
    // Ici vous pourriez ajouter la logique pour filtrer les conversations
    console.log('Onglet sélectionné:', tabId);
}

// Gestionnaire de clic sur les conversations
function handleConversationClick(conversationId) {
    console.log('Conversation sélectionnée:', conversationId);
    // Ici vous pourriez ajouter la logique pour ouvrir la conversation
}

// Gestionnaire de recherche
function handleSearch(query) {
    console.log('Recherche:', query);
    // Ici vous pourriez ajouter la logique de recherche
}

// Ajouter un écouteur d'événement pour la recherche
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            handleSearch(e.target.value);
        });
    }
});

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', loadData);

// Fonction utilitaire pour déboguer
function debugData() {
    console.log('Données WhatsApp:', whatsappData);
}