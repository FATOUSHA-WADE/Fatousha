//const API_URL = 'http://localhost:3000';
const API_URL = 'https://json-backend-1-waeu.onrender.com';


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

export const apiService = {
  async getContacts() {
    const res = await fetch('http://localhost:3000/contacts');
    if (!res.ok) throw new Error('Erreur chargement contacts');
    return await res.json();
  },
  async getChats() {
    const res = await fetch('http://localhost:3000/chats');
    if (!res.ok) throw new Error('Erreur chargement chats');
    return await res.json();
  },
  async createContact(contact) {
    const res = await fetch('http://localhost:3000/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!res.ok) throw new Error('Erreur ajout contact');
    return await res.json();
  },
  async deleteContact(id) {
    const res = await fetch(`http://localhost:3000/contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression contact');
  },
  async createChat(chat) {
    const res = await fetch('http://localhost:3000/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chat)
    });
    if (!res.ok) throw new Error('Erreur création chat');
    return await res.json();
  },
  async createMessage(message) {
    // Ici, tu ajoutes le message dans le chat correspondant
    // On suppose que chaque chat a un tableau messages
    // Tu dois faire un PATCH ou PUT sur le chat concerné

    // 1. Récupérer le chat
    const chatRes = await fetch(`http://localhost:3000/chats/${message.chatId}`);
    if (!chatRes.ok) throw new Error('Erreur récupération chat');
    const chat = await chatRes.json();

    // 2. Ajouter le message
    chat.messages = chat.messages || [];
    chat.messages.push(message);

    // 3. Mettre à jour le chat
    const res = await fetch(`http://localhost:3000/chats/${message.chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chat)
    });
    if (!res.ok) throw new Error('Erreur ajout message');
    return message;
  }
  // ... autres méthodes pour chats ...
};

export async function fetchContacts() {
  const res = await fetch(`${API_URL}/contacts`);
  if (!res.ok) throw new Error('Erreur chargement contacts');
  return await res.json();
}

export async function addContact(contact) {
  const res = await fetch(`${API_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact)
  });
  if (!res.ok) throw new Error('Erreur ajout contact');
  return await res.json();
}

export async function deleteContact(id) {
  const res = await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression contact');
}

export async function fetchChats() {
  const res = await fetch(`${API_URL}/chats`);
  if (!res.ok) throw new Error('Erreur chargement chats');
  return await res.json();
}

export async function updateChat(chat) {
  const res = await fetch(`${API_URL}/chats/${chat.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat)
  });
  if (!res.ok) throw new Error('Erreur mise à jour chat');
  return await res.json();
}