const API_URL = 'https://json-backend-2-kyx1.onrender.com';
// const API_URL = 'http://localhost:3000';
//mame

// Centralisation de toutes les opérations API
class ApiService {
async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Contacts
async getContacts() {
    return this.request('/contacts');
}

async createContact(contact) {
    return this.request('/contacts', {
        method: 'POST',
        body: JSON.stringify(contact)
    });
}

async updateContact(id, contact) {
    return this.request(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact)
    });
}

async deleteContact(id) {
    return this.request(`/contacts/${id}`, {
        method: 'DELETE'
    });
}

// Chats
async getChats() {
    return this.request('/chats');
}

async createChat(chat) {
    return this.request('/chats', {
        method: 'POST',
        body: JSON.stringify(chat)
    });
}

async updateChat(id, chat) {
    return this.request(`/chats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(chat)
    });
}

// Messages
async getMessages(chatId) {
    return this.request(`/messages?chatId=${chatId}`);
}

async createMessage(message) {
    return this.request('/messages', {
        method: 'POST',
        body: JSON.stringify(message)
    });
}

// Users
async getUsers() {
    return this.request('/users');
}
}

// Exporter la classe et créer une instance
export { ApiService };
export const apiService = new ApiService();