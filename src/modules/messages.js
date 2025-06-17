import { apiService } from './api.js';
import { showNotification } from './errors.js';

export class MessagesManager {
    constructor() {
        this.chats = [];
        this.currentChat = null;
        this.chatDrafts = {};
    }

    async loadChats() {
        try {
            const chats = await apiService.getChats();
            this.chats = chats;
            this.renderChatList();
            return this.chats;
        } catch (error) {
            console.error('Erreur lors du chargement des chats:', error);
            showNotification('Erreur lors du chargement des conversations', 'error');
            return [];
        }
    }

    async createChat(name, phone, contactId) {
        try {
            let chat = this.chats.find(c => c.phone === phone);
            
            if (!chat) {
                const newChat = {
                    name: name,
                    phone: phone,
                    contactId: contactId,
                    avatar: null,
                    lastMessage: '',
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0,
                    messages: [],
                    isActive: true,
                    createdAt: new Date().toISOString()
                };

                chat = await apiService.createChat(newChat);
                this.chats.push(chat);
                this.renderChatList();
            }

            return chat;
        } catch (error) {
            console.error('Erreur lors de la création du chat:', error);
            throw error;
        }
    }

    async sendMessage(text) {
        if (!this.currentChat || !text.trim()) return;

        try {
            const message = {
                chatId: this.currentChat.id,
                from: 'me',
                to: this.currentChat.phone,
                text: text.trim(),
                time: new Date().toISOString(),
                status: 'sent'
            };

            const savedMessage = await apiService.createMessage(message);

            // Mettre à jour le chat local
            if (!this.currentChat.messages) {
                this.currentChat.messages = [];
            }
            this.currentChat.messages.push(savedMessage);
            this.currentChat.lastMessage = savedMessage.text;
            this.currentChat.lastMessageTime = savedMessage.time;

            // Mettre à jour le chat dans la liste locale
            const idx = this.chats.findIndex(c => c.id === this.currentChat.id);
            if (idx !== -1) {
                this.chats[idx] = { ...this.currentChat };
            }

            // Mettre à jour le chat sur le serveur
            await apiService.updateChat(this.currentChat.id, this.currentChat);

            // Réafficher la conversation et la liste
            this.loadChatMessages(this.currentChat);
            this.renderChatList();

            // Supprimer le brouillon pour ce chat
            delete this.chatDrafts[this.currentChat.id];

            return savedMessage;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            showNotification('Erreur lors de l\'envoi du message', 'error');
        }
    }

    openChat(chat) {
        this.currentChat = chat;
        
        // Mettre à jour l'en-tête du chat
        const chatHeaderAvatar = document.getElementById('chat-header-avatar');
        const chatHeaderName = document.getElementById('chat-header-name');
        
        if (chatHeaderAvatar && chatHeaderName) {
            chatHeaderName.textContent = chat.name;
            
            if (chat.avatar) {
                chatHeaderAvatar.src = chat.avatar;
            } else {
                chatHeaderAvatar.src = this.generateDefaultAvatar(chat.name);
            }
        }
        
        this.loadChatMessages(chat);

        // Marquer comme lu
        if (chat.unreadCount > 0) {
            chat.unreadCount = 0;
            apiService.updateChat(chat.id, chat);
            this.renderChatList();
        }

        // Charger le brouillon
        const messageInput = document.querySelector('footer input[type="text"]');
        if (messageInput) {
            messageInput.value = this.chatDrafts[chat.id] || '';
        }
    }

    loadChatMessages(chat) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        let html = '';
        
        if (chat.messages && chat.messages.length > 0) {
            chat.messages.forEach(message => {
                const isOwn = message.from === 'me';
                const messageClass = isOwn ? 'ml-auto bg-green-500 text-white' : 'mr-auto bg-white';
                const time = new Date(message.time).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                html += `
                    <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4">
                        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${messageClass} shadow">
                            <p class="text-sm">${this.escapeHtml(message.text)}</p>
                            <p class="text-xs mt-1 opacity-70">${time}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center text-gray-500">
                        <i class="fas fa-comments text-4xl mb-4"></i>
                        <p>Aucun message pour le moment</p>
                        <p class="text-sm">Commencez la conversation !</p>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.innerHTML = html;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    renderChatList() {
        const conversationsList = document.getElementById('conversations-list');
        if (!conversationsList) return;
        
        // Trier les chats par dernière activité
        const sortedChats = [...this.chats]
            .filter(chat => chat.isActive)
            .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        let html = '';
        
        if (sortedChats.length === 0) {
            html = `
                <div class="flex items-center justify-center h-32 text-gray-500">
                    <div class="text-center">
                        <i class="fas fa-comments text-3xl mb-2"></i>
                        <p>Aucune conversation</p>
                    </div>
                </div>
            `;
        } else {
            sortedChats.forEach(chat => {
                const lastMessageTime = chat.lastMessageTime ? 
                    new Date(chat.lastMessageTime).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }) : '';
                
                const unreadBadge = chat.unreadCount > 0
                  ? `<span class="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2">${chat.unreadCount}</span>`
                  : '';
                
                const draft = this.chatDrafts[chat.id];
                const draftHtml = draft
                  ? `<span class="text-xs text-red-500 font-semibold">Brouillon: ${this.escapeHtml(draft)}</span>`
                  : '';
                
                html += `
                    <div class="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 chat-item" 
                         data-chat-id="${chat.id}">
                        ${chat.avatar ? 
                            `<img src="${chat.avatar}" alt="${chat.name}" class="w-12 h-12 rounded-full mr-3 object-cover">` :
                            `<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <span class="text-white font-bold text-lg">${chat.name.charAt(0).toUpperCase()}</span>
                            </div>`
                        }
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h3 class="font-medium text-gray-900 truncate">${chat.name}</h3>
                                <div class="flex items-center">
                                    <span class="text-xs text-gray-500">${lastMessageTime}</span>
                                    ${unreadBadge}
                                </div>
                            </div>
                            <p class="text-sm text-gray-500 truncate">
                              ${draftHtml || chat.lastMessage || 'Nouvelle conversation'}
                            </p>
                        </div>
                    </div>
                `;
            });
        }
        
        conversationsList.innerHTML = html;
        this.attachChatEvents();
    }

    attachChatEvents() {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) {
                    this.openChat(chat);
                }
            });
        });
    }

    saveDraft(chatId, text) {
        // Ne sauvegarde le brouillon que si le champ n'est pas vide
        if (text.trim()) {
            this.chatDrafts[chatId] = text;
        } else {
            delete this.chatDrafts[chatId];
        }
        // Ne pas appeler renderChatList ici pour éviter l'affichage du brouillon en temps réel
    }

    generateDefaultAvatar(name) {
        const firstLetter = name.charAt(0).toUpperCase();
        const colors = ['#E0E7FF', '#FEE2E2', '#ECFDF5', '#FEF3C7', '#F3E8FF'];
        const textColors = ['#4F46E5', '#DC2626', '#059669', '#D97706', '#7C3AED'];
        const colorIndex = name.length % colors.length;
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='${encodeURIComponent(colors[colorIndex])}'/%3E%3Ctext x='24' y='30' font-family='Arial' font-size='18' font-weight='bold' text-anchor='middle' fill='${encodeURIComponent(textColors[colorIndex])}'%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async deleteChat(chatId) {
        try {
            const chat = this.chats.find(c => c.id === chatId);
            if (chat) {
                chat.isActive = false;
                await apiService.updateChat(chatId, chat);
                this.chats = this.chats.filter(c => c.id !== chatId);
                this.renderChatList();
                
                if (this.currentChat && this.currentChat.id === chatId) {
                    this.currentChat = null;
                    document.getElementById('chat-header-name').textContent = '';
                    document.getElementById('chat-messages').innerHTML = '';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du chat:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}