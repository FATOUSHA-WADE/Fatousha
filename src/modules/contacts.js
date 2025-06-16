import { apiService } from './api.js';
import { showNotification, showError, hideError } from './errors.js';

export class ContactsManager {
  constructor() {
      this.contacts = [];
  }

  async loadContacts() {
      try {
          this.contacts = await apiService.getContacts();
          this.renderContactList();
          return this.contacts;
      } catch (error) {
          console.error('Erreur lors du chargement des contacts:', error);
          showNotification('Erreur lors du chargement des contacts', 'error');
          return [];
      }
  }

  async addContact(contactData) {
      try {
          // Validation
          if (!contactData.prenom || !contactData.nom || !contactData.phone) {
              throw new Error('Veuillez remplir les champs obligatoires');
          }

          // Formater le téléphone
          let formattedPhone = contactData.phone.replace(/\s/g, '');
          if (!formattedPhone.startsWith('+')) {
              formattedPhone = '+221' + formattedPhone;
          }

          // Vérifier si le contact existe déjà
          if (this.contacts.find(c => c.phone === formattedPhone)) {
              throw new Error('Ce numéro existe déjà dans vos contacts');
          }

          const newContact = {
              name: `${contactData.prenom} ${contactData.nom}`,
              firstName: contactData.prenom,
              lastName: contactData.nom,
              firstNamePhonetic: contactData.prenomPhonetique,
              lastNamePhonetic: contactData.nomPhonetique,
              company: contactData.entreprise,
              phone: formattedPhone,
              avatar: contactData.avatar,
              addedBy: window.currentUser?.id,
              createdAt: new Date().toISOString(),
              isUserAdded: true
          };

          const savedContact = await apiService.createContact(newContact);
          this.contacts.push(savedContact);
          this.renderContactList();
            
          showNotification('Contact ajouté avec succès', 'success');
          return savedContact;
      } catch (error) {
          console.error('Erreur lors de l\'ajout du contact:', error);
          throw error;
      }
  }

  async deleteContact(contactId) {
      try {
          await apiService.deleteContact(contactId);
          this.contacts = this.contacts.filter(c => c.id !== contactId);
          this.renderContactList();
          showNotification('Contact supprimé', 'success');
      } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          showError('Erreur lors de la suppression', 'error');
      }
  }

  renderContactList() {
      const contactsList = document.getElementById('contacts-list');
      if (!contactsList) return;

      // Trier les contacts par nom
      const sortedContacts = [...this.contacts].sort((a, b) => {
          const nameA = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
          const nameB = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
          return nameA.localeCompare(nameB);
      });

      // Grouper par première lettre
      const groupedContacts = {};
      sortedContacts.forEach(contact => {
          const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
          const firstLetter = name.charAt(0).toUpperCase();
          if (!groupedContacts[firstLetter]) {
              groupedContacts[firstLetter] = [];
          }
          groupedContacts[firstLetter].push(contact);
      });

      // Générer le HTML
      let html = '';
      Object.keys(groupedContacts).sort().forEach(letter => {
          html += `
              <div class="px-4 py-2 bg-gray-50>
                  <h4 class="text-sm font-medium text-gray-600">${letter}</h4>
              </div>
          `;
            
          groupedContacts[letter].forEach(contact => {
              const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
                
              html += `
                  <div class="flex items-center p-4 hover:bg-gray-50 cursor-pointer contact-item" 
                       data-name="${name}" 
                       data-phone="${contact.phone}"
                       data-contact-id="${contact.id}">
                      ${contact.avatar ? 
                          `<img src="${contact.avatar}" alt="${name}" class="w-12 h-12 rounded-full mr-3 object-cover">` :
                          `<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                              <span class="text-white font-bold text-lg">${name.charAt(0).toUpperCase()}</span>
                          </div>`
                      }
                      <div class="flex-1">
                          <div class="font-medium text-gray-900">${name}</div>
                          <div class="text-sm text-gray-500">${contact.phone}</div>
                          ${contact.company ? `<div class="text-xs text-gray-400">${contact.company}</div>` : ''}
                      </div>
                  </div>
              `;
          });
      });

      contactsList.innerHTML = html;
      this.attachContactEvents();
  }

  attachContactEvents() {
      const contactItems = document.querySelectorAll('.contact-item');
      contactItems.forEach(item => {
          item.addEventListener('click', () => {
              const name = item.dataset.name;
              const phone = item.dataset.phone;
              const contactId = item.dataset.contactId;
                
              // Émettre un événement personnalisé
              document.dispatchEvent(new CustomEvent('startChat', {
                  detail: { name, phone, contactId }
              }));
          });
      });
  }

  filterContacts(searchTerm) {
      const contactItems = document.querySelectorAll('#contacts-list .contact-item');
      const sectionHeaders = document.querySelectorAll('#contacts-list .bg-gray-50');
        
      if (!searchTerm) {
          contactItems.forEach(item => item.style.display = 'flex');
          sectionHeaders.forEach(header => header.style.display = 'block');
          return;
      }
        
      sectionHeaders.forEach(header => header.style.display = 'none');
        
      contactItems.forEach(item => {
          const name = item.dataset.name.toLowerCase();
          const phone = item.dataset.phone.toLowerCase();
            
          if (name.includes(searchTerm) || phone.includes(searchTerm)) {
              item.style.display = 'flex';
              const section = item.previousElementSibling;
              if (section && section.classList.contains('bg-gray-50')) {
                  section.style.display = 'block';
              }
          } else {
              item.style.display = 'none';
          }
      });
  }
}