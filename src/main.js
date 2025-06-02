import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'

document.addEventListener('DOMContentLoaded', function() {
  let data = { contacts: [], groups: [], messages: {}, archivedContacts: [], diffusionContacts: [] };
  let state = { currentChat: null, section: 'contacts', selectedMembers: [], filteredItems: [], editingGroup: null };
  
  const elements = ['navMessages', 'navGroups', 'navArchives', 'btnNouveau', 'addGroupBtn', 
    'sectionTitle', 'contactsList', 'contactForm', 'groupForm', 'editGroupForm', 'quickContactForm', 'messages', 'messageInput', 
    'sendBtn', 'chatName', 'chatStatus', 'chatAvatar', 'membersList', 'editMembersList', 'search', 'archiveBtn', 'showArchivesBtn', 'editGroupBtn']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id.replace(/([A-Z])/g, '-$1').toLowerCase()) }), {});
  
  const templates = ['contact', 'member', 'message']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(`${id}-template`) }), {});
  
  const getFirstLetter = name => name ? name.charAt(0).toUpperCase() : '?';
  const validatePhoneNumber = phone => /^\d+$/.test(phone.replace(/\s+/g, ''));
  const formatTime = date => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  const showPopup = (type, title, message, onConfirm = null) => {
    const modal = document.getElementById('popup-modal');
    const titleEl = document.getElementById('popup-title');
    const messageEl = document.getElementById('popup-message');
    const confirmBtn = document.getElementById('popup-confirm');
    const cancelBtn = document.getElementById('popup-cancel');
  
    titleEl.textContent = title;
    messageEl.textContent = message;
  
    confirmBtn.onclick = () => {
      modal.classList.add('hidden');
      if (onConfirm) onConfirm();
    };
  
    cancelBtn.onclick = () => modal.classList.add('hidden');
  
    modal.classList.remove('hidden');
  };

  const updateActiveTab = (activeSection) => {
  const tabs = ['nav-messages', 'nav-groups', 'nav-archives', 'nav-diffusion'];
  tabs.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.remove('bg-yellow-500'); // Supprimer la classe active
  });

  const sectionMap = { contacts: 'nav-messages', groups: 'nav-groups', archives: 'nav-archives', diffusion: 'nav-diffusion' };
  const activeTab = document.getElementById(sectionMap[activeSection]);
  if (activeTab) activeTab.classList.add('bg-yellow-500'); // Ajouter la classe active
};

  const generateUniqueName = (baseName) => {
    const existingNames = data.contacts.map(c => c.name.toLowerCase());
    let name = baseName;
    let counter = 1;
    
    while (existingNames.includes(name.toLowerCase())) {
      name = `${baseName}${counter}`;
      counter++;
    }
    
    return name;
  };

  const phoneExists = (phone) => {
    return data.contacts.some(c => c.phone === phone);
  };
  
  const resetChatInterface = () => {
    elements.chatName.textContent = 'Sélectionnez une conversation';
    elements.chatStatus.textContent = '';
    elements.chatAvatar.innerHTML = '';
    elements.chatAvatar.className = 'w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold';
    elements.messageInput.disabled = true;
    elements.sendBtn.disabled = true;
    elements.editGroupBtn.classList.add('hidden');
    elements.messages.innerHTML = '<div class="text-center text-gray-500 text-sm">Sélectionnez une conversation pour commencer à discuter</div>';
  };

  const setupEvents = () => {
    const diffusionBtn = document.getElementById('nav-diffusion');
if(diffusionBtn) {
  diffusionBtn.onclick = () => switchSection('diffusion');
}

    elements.navMessages.onclick = () => switchSection('contacts');
    elements.navGroups.onclick = () => switchSection('groups');
    elements.navArchives.onclick = () => switchSection('archives');
    elements.btnNouveau.onclick = () => showForm('contact');
    elements.addGroupBtn.onclick = () => showForm('group');
    
    elements.archiveBtn.onclick = () => {
      if (state.currentChat && state.currentChat.type === 'contact' && state.section === 'contacts') {
        showPopup('confirm', 'Archiver le contact', `Êtes-vous sûr de vouloir archiver "${state.currentChat.name}" ?`, 
          () => archiveAction(state.currentChat.id, false));
      } else {
        showPopup('error', 'Erreur', 'Veuillez sélectionner un contact à archiver');
      }
    };

    elements.editGroupBtn.onclick = () => {
      if (state.currentChat && state.currentChat.type === 'group') {
        showEditGroupForm();
      }
    };
    
    elements.showArchivesBtn.onclick = () => switchSection('archives');
    
    ['cancel-contact', 'cancel-group', 'cancel-edit-group', 'cancel-quick-contact'].forEach(id => 
      document.getElementById(id).onclick = () => hideForm(id.split('-')[1] === 'edit' ? 'edit-group' : id.split('-')[1]));
    
    document.getElementById('save-contact').onclick = saveContact;
    document.getElementById('save-group').onclick = saveGroup;
    document.getElementById('save-edit-group').onclick = saveEditGroup;
    document.getElementById('save-quick-contact').onclick = saveQuickContact;
    document.getElementById('add-new-contact-btn').onclick = () => showForm('quick-contact');
    document.getElementById('add-new-contact-edit-btn').onclick = () => showForm('quick-contact');
    
    elements.sendBtn.onclick = sendMessage;
    elements.messageInput.onkeypress = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage(); // Appeler la fonction pour envoyer le message
      }
    };
    elements.search.oninput = handleSearch;
    elements.search.onkeypress = handleSearchEnter;
    document.getElementById('contact-phone').oninput = e => e.target.value = e.target.value.replace(/[^\d\s]/g, '');
    document.getElementById('quick-contact-phone').oninput = e => e.target.value = e.target.value.replace(/[^\d\s]/g, '');
    elements.deleteContactBtn = document.getElementById('delete-contact-btn');

    elements.deleteContactBtn.onclick = () => {
      if (state.currentChat && state.currentChat.type === 'contact') {
        showPopup(
          'confirm',
          'Supprimer le contact',
          `Êtes-vous sûr de vouloir supprimer "${state.currentChat.name}" ?`,
          () => deleteContact(state.currentChat.id)
        );
      } else {
        showPopup('error', 'Erreur', 'Veuillez sélectionner un contact à supprimer.');
      }
    };
    document.getElementById('delete-messages-btn').onclick = () => {
      if (state.currentChat && data.messages[state.currentChat.id]) {
        showPopup(
          'confirm',
          'Supprimer les messages',
          `Voulez-vous vraiment supprimer tous les messages de "${state.currentChat.name}" ?`,
          () => {
            data.messages[state.currentChat.id] = [];
            saveData();
            renderMessages(state.currentChat.id);
            renderContactsList();
          }
        );
      } else {
        showPopup('error', 'Erreur', 'Aucun contact sélectionné.');
      }
    };
    
document.getElementById('add-diffusion-contact-btn').addEventListener('click', () => {
  showPopup('confirm', 'Ajouter un contact', 'Entrez le nom du contact à ajouter à la diffusion.', (name) => {
    if (!name) return;

    const contact = {
      id: Date.now(),
      name,
    };

    data.diffusionContacts.push(contact); // Ajouter le contact à la liste de diffusion
    saveData();
    renderDiffusionContacts(); // Mettre à jour l'affichage
  });
});

// Gestion des cases à cocher
document.getElementById('diffusion-contact-list').addEventListener('change', (e) => {
  if (e.target.classList.contains('diffusion-checkbox')) {
    const contactId = e.target.dataset.id;
    if (e.target.checked) {
      state.selectedMembers.push(contactId); // Ajouter le contact sélectionné
    } else {
      state.selectedMembers = state.selectedMembers.filter(id => id !== contactId); // Retirer le contact
    }
  }
});

document.getElementById('add-diffusion-contact-btn').addEventListener('click', () => {
  showPopup('confirm', 'Ajouter un contact', 'Entrez le nom du contact à ajouter à la diffusion.', (name) => {
    if (!name) return;

    const contact = {
      id: Date.now(),
      name,
    };

    data.diffusionContacts.push(contact); // Ajouter le contact à la liste de diffusion
    saveData();
    renderDiffusionContacts(); // Mettre à jour l'affichage
  });
});

// Gestion des cases à cocher
document.getElementById('diffusion-contact-list').addEventListener('change', (e) => {
  if (e.target.classList.contains('diffusion-checkbox')) {
    const contactId = e.target.dataset.id;
    if (e.target.checked) {
      state.selectedMembers.push(contactId); // Ajouter le contact sélectionné
    } else {
      state.selectedMembers = state.selectedMembers.filter(id => id !== contactId); // Retirer le contact
    }
  }
});

document.getElementById('nav-diffusion').addEventListener('click', () => {
  document.getElementById('diffusion-form').classList.remove('hidden'); // Afficher le formulaire de diffusion
  renderDiffusionContacts(); // Mettre à jour l'affichage des contacts
});

  };

const handleSearch = e => {
  const searchTerm = e.target.value.toLowerCase().trim();
  const items = getCurrentItems();

  if (searchTerm === '*') {
    // Afficher tous les contacts par ordre alphabétique
    state.filteredItems = items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (searchTerm === '') {
    // Réinitialiser la recherche
    state.filteredItems = [];
  } else {
    // Rechercher par nom ou numéro de téléphone
    state.filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) || 
      (item.phone && item.phone.includes(searchTerm))
    );
  }

  renderContactsList();
};

  const handleSearchEnter = e => {
    if (e.key === 'Enter') {
      const searchTerm = e.target.value.toLowerCase().trim();
      if (searchTerm === '*') {
        const items = getCurrentItems();
        state.filteredItems = items;
        renderContactsList();
      }
    }
  };

  const getCurrentItems = () => {
    if (state.section === 'diffusion') {
      return data.diffusionContacts; // Retourner uniquement les contacts ajoutés à la diffusion
    }
    return data[state.section === 'archives' ? 'archivedContacts' : state.section];
  };
    
  const switchSection = section => {
    state.section = section;
    updateActiveTab(section);
    const titles = { contacts: 'Discussions', groups: 'Groupes', archives: 'Archives', diffusion: 'Diffusion' };
    elements.sectionTitle.textContent = titles[section] || '';
  
    // Gérer la visibilité du formulaire de diffusion
    const diffusionForm = document.getElementById('diffusion-form');
    const contactsList = document.getElementById('contacts-list'); // Liste des contacts
    if (diffusionForm) {
      diffusionForm.style.display = section === 'diffusion' ? 'block' : 'none';
    }
  
    // Cacher la liste des contacts dans la section diffusion
    if (contactsList) {
      contactsList.style.display = section === 'diffusion' ? 'none' : 'block';
    }
  
    elements.addGroupBtn.classList.toggle('hidden', section !== 'groups');
    elements.search.value = '';
    state.filteredItems = [];
    hideAllForms();
    render();
  };
  
  const archiveAction = (contactId, isUnarchive = false) => {
  const sourceArray = isUnarchive ? data.archivedContacts : data.contacts;
  const targetArray = isUnarchive ? data.contacts : data.archivedContacts;
  const index = sourceArray.findIndex(c => c.id === contactId);

  if (index === -1) return;

  const contact = sourceArray[index];
  const processedContact = isUnarchive
    ? Object.fromEntries(Object.entries(contact).filter(([key]) => key !== 'archivedAt'))
    : { ...contact, archivedAt: new Date().toISOString() };

  targetArray.push(processedContact);
  sourceArray.splice(index, 1);

  if (state.currentChat?.id === contactId) {
    state.currentChat = null;
    resetChatInterface();
  }

  saveData();
  render();
};

  const showEditGroupForm = () => {
  if (!state.currentChat || state.currentChat.type !== 'group') return;

  const group = data.groups.find(g => g.id === state.currentChat.id);
  const admin = group.members.find(m => m.id === 'admin');

  if (!admin || admin.name !== 'Moi (Admin)') {
    showPopup('Erreur', 'Seul l\'admin peut modifier ce groupe.');
    return;
  }

  state.editingGroup = state.currentChat; // Définir le groupe en cours de modification
  state.selectedMembers = state.currentChat.members.map(m => m.id); // Initialiser les membres sélectionnés
  hideAllForms();
  elements.editGroupForm.classList.remove('hidden'); // Afficher le formulaire de modification
  renderEditMembersList(); // Afficher la liste des membres
};

  const showForm = type => {
    hideAllForms();
    elements.addGroupBtn.classList.add('hidden');
    elements[`${type.replace('-', '')}Form`].classList.remove('hidden');
    elements.contactsList.style.display = 'none';
    if (type === 'group') renderMembersList();
    if (type === 'edit-group') renderEditMembersList();
  };
  
  const hideForm = type => {
    const formName = type.replace('-', '');
    elements[`${formName}Form`].classList.add('hidden');
    elements.contactsList.style.display = 'block';
    clearForm(type);
    if (type === 'group' || type === 'edit-group') state.selectedMembers = [];
    if (type === 'edit-group') state.editingGroup = null;
  };
  
  const hideAllForms = () => ['contactForm', 'groupForm', 'editGroupForm', 'quickContactForm'].forEach(form => elements[form].classList.add('hidden'));
  
  const clearForm = type => {
    if (type === 'contact') {
      ['name', 'phone'].forEach(field => document.getElementById(`contact-${field}`).value = '');
    } else if (type === 'group') {
      document.getElementById('group-name').value = '';
    } else if (type === 'quick-contact') {
      ['name', 'phone'].forEach(field => document.getElementById(`quick-contact-${field}`).value = '');
    }
  };
  
  const saveContact = () => {
  const [name, phone] = ['name', 'phone'].map(f => document.getElementById(`contact-${f}`).value.trim());

  if (!name || !phone) return;

  if (!validatePhoneNumber(phone)) {
    showPopup('error', 'Erreur', 'Le numéro de téléphone ne doit contenir que des chiffres.');
    return;
  }

  if (phoneExists(phone)) {
    showPopup('error', 'Erreur', 'Ce numéro de téléphone existe déjà.');
    return;
  }

  const uniqueName = generateUniqueName(name);
  const contact = {
    id: Date.now(),
    name: uniqueName,
    phone,
    type: 'contact',
    lastMessage: 'Nouveau contact',
    timestamp: formatTime(new Date()),
    online: Math.random() > 0.5,
    hasUnreadMessages: true,
    draftMessage: '' // Ajouter la propriété pour le brouillon
  };

  data.contacts.push(contact);
  data.messages[contact.id] = [];

  saveData();
  hideForm('contact');
  render();
};

  const saveQuickContact = () => {
    const [name, phone] = ['name', 'phone'].map(f => document.getElementById(`quick-contact-${f}`).value.trim());
    
    if (!name || !phone) return;
    
    if (!validatePhoneNumber(phone)) {
      showPopup('error', 'Erreur', 'Le numéro de téléphone ne doit contenir que des chiffres.');
      return;
    }

    if (phoneExists(phone)) {
      showPopup('error', 'Erreur', 'Ce numéro de téléphone existe déjà.');
      return;
    }
    
    const uniqueName = generateUniqueName(name);
    const contact = {
      id: Date.now(), 
      name: uniqueName, 
      phone, 
      type: 'contact',
      lastMessage: 'Nouveau contact',
      timestamp: formatTime(new Date()),
      online: Math.random() > 0.5,
      hasUnreadMessages: false
    };
  
    data.contacts.push(contact);
    data.messages[contact.id] = [];
    state.selectedMembers.push(contact.id);
    
    saveData();
    hideForm('quick-contact');
    
    if (elements.groupForm.classList.contains('hidden') && elements.editGroupForm.classList.contains('hidden')) {
      render();
    } else if (!elements.groupForm.classList.contains('hidden')) {
      renderMembersList();
    } else if (!elements.editGroupForm.classList.contains('hidden')) {
      renderEditMembersList();
    }
  };
  
  const saveGroup = () => {
    const name = document.getElementById('group-name').value.trim();
    if (!name) return;
    
    if (state.selectedMembers.length < 1) {
      showPopup('error', 'Erreur', 'Vous devez sélectionner au moins un membre en plus de vous-même.');
      return;
    }
    
    const group = {
      id: Date.now(), 
      name, 
      type: 'group',
      lastMessage: 'Groupe créé',
      timestamp: formatTime(new Date()),
      members: [
        { id: 'admin', name: 'Moi (Admin)' },
        ...state.selectedMembers.map(id => {
          const contact = data.contacts.find(c => c.id === id);
          return contact ? { id: contact.id, name: contact.name } : null;
        }).filter(Boolean)
      ],
      hasUnreadMessages: false
    };

    data.groups.push(group);
    data.messages[group.id] = [];

    saveData();
    hideForm('group');
    state.selectedMembers = [];
    render();
  };

  const saveEditGroup = () => {
  if (!state.editingGroup) {
    console.error('Aucun groupe en cours de modification.');
    return;
  }

  const updatedMembers = state.selectedMembers.map(id => {
    const contact = data.contacts.find(c => c.id === id);
    return contact ? { id: contact.id, name: contact.name, role: 'simple' } : null;
  }).filter(Boolean);

  const group = data.groups.find(g => g.id === state.editingGroup.id);
  if (group) {
    group.members = [{ id: 'admin', name: 'Moi (Admin)', role: 'admin' }, ...updatedMembers];
    group.lastMessage = 'Membres mis à jour';
    group.timestamp = formatTime(new Date());
  } else {
    console.error('Groupe introuvable.');
    return;
  }

  saveData(); // Sauvegarder les modifications
  hideForm('edit-group');
  state.selectedMembers = [];
  state.editingGroup = null;
  render();
};

  const sendMessage = () => {
  const messageText = elements.messageInput.value.trim();
  if (!messageText || !state.currentChat) return;

  const newMessage = {
    sender: 'Moi',
    text: messageText,
    time: formatTime(new Date())
  };

  if (state.currentChat.type === 'contact') {
    data.messages[state.currentChat.id].push(newMessage);
  } else if (state.currentChat.type === 'group') {
    data.messages[state.currentChat.id].push(newMessage);
  } else if (state.currentChat.type === 'diffusion') {
    state.currentChat.members.forEach(member => {
      if (!data.messages[member.id]) data.messages[member.id] = [];
      data.messages[member.id].push(newMessage);
    });
  }

  const chat = [...data.contacts, ...data.groups].find(item => item.id === state.currentChat.id);
  if (chat) {
    chat.lastMessage = messageText;
    chat.timestamp = newMessage.time;
    chat.hasUnreadMessages = true;
    chat.draftMessage = ''; // Effacer le brouillon
  }

  elements.messageInput.value = '';
  saveData();
  renderMessages(state.currentChat.id);
  renderContactsList();
};

  const renderContactsList = () => {
  const list = elements.contactsList;
  list.innerHTML = '';
  const items = state.filteredItems.length ? state.filteredItems : getCurrentItems();

  items.forEach(item => {
    const contactEl = templates.contact.content.cloneNode(true);
    contactEl.querySelector('.contact-name').textContent = item.name;

    // Afficher le brouillon ou le dernier message
    const messageEl = contactEl.querySelector('.contact-message');
    if (item.draftMessage) {
      messageEl.textContent = `Brouillon: ${item.draftMessage}`;
      messageEl.style.color = 'red'; // Afficher en rouge
    } else {
      messageEl.textContent = item.lastMessage || '';
      messageEl.style.color = ''; // Réinitialiser la couleur
    }

    const timeEl = contactEl.querySelector('.contact-time');
    if (state.section === 'archives') {
      timeEl.textContent = ''; // Supprimer l'heure dans les archives

      // Ajouter une icône pour désarchiver
      const unarchiveIcon = document.createElement('button');
      unarchiveIcon.className = 'text-blue-500 hover:text-blue-700 ml-2';
      unarchiveIcon.innerHTML = '<i class="fas fa-box-open"></i>'; // Icône d'archivage
      unarchiveIcon.onclick = () => {
        showPopup(
          'confirm',
          'Désarchiver le contact',
          `Voulez-vous désarchiver "${item.name}" ?`,
          () => archiveAction(item.id, true) // Désarchiver le contact
        );
      };
      timeEl.parentElement.appendChild(unarchiveIcon);
    } else {
      timeEl.textContent = item.timestamp || '';
    }

    contactEl.querySelector('.contact-avatar').textContent = getFirstLetter(item.name);

    // Ajouter un indicateur de message non lu
    const unreadIndicator = document.createElement('div');
    unreadIndicator.className = 'w-3 h-3 bg-green-500 rounded-full ml-2';
    unreadIndicator.style.display = item.hasUnreadMessages ? 'inline-block' : 'none'; // Afficher uniquement si non lu
    timeEl.parentElement.appendChild(unreadIndicator);

    contactEl.querySelector('.contact-item').onclick = () => {
      selectChat(item.id);
      // Marquer le message comme lu
      item.hasUnreadMessages = false;
      saveData();
      renderContactsList(); // Mettre à jour l'affichage
    };

    list.appendChild(contactEl);
  });
};

  const renderMembersList = () => {
    const list = elements.membersList;
    list.innerHTML = '';
    data.contacts.forEach(contact => {
      const el = templates.member.content.cloneNode(true);
      el.querySelector('.member-name').textContent = contact.name;
      el.querySelector('.member-avatar').textContent = getFirstLetter(contact.name);
      const checkbox = el.querySelector('.member-checkbox');
      checkbox.checked = state.selectedMembers.includes(contact.id);
      checkbox.onchange = () => {
        if (checkbox.checked) state.selectedMembers.push(contact.id);
        else state.selectedMembers = state.selectedMembers.filter(id => id !== contact.id);
      };
      list.appendChild(el);
    });
  };

  const renderEditMembersList = () => {
  const list = document.getElementById('edit-members-list');
  list.innerHTML = '';

  const group = data.groups.find(g => g.id === state.editingGroup.id);
  if (!group) return;

  const admin = group.members.find(m => m.id === 'admin');
  const isAdmin = admin && admin.name === 'Moi (Admin)';

  group.members.forEach(member => {
    const el = document.createElement('div');
    el.className = 'member-item flex items-center p-2 border-b hover:bg-gray-100';

    el.innerHTML = `
      <div class="flex-1">
        <div class="text-sm font-semibold">${member.name}</div>
        <div class="text-xs text-gray-500">${member.role === 'admin' ? 'Admin' : 'Simple'}</div>
      </div>
      ${isAdmin && member.role !== 'admin' ? `
        <button class="text-red-500 hover:text-red-700 remove-member-btn" data-id="${member.id}">
          Retirer
        </button>
      ` : ''}
      ${isAdmin ? `
        <button class="text-blue-500 hover:text-blue-700 change-role-btn" data-id="${member.id}">
          ${member.role === 'admin' ? 'Rendre Simple' : 'Rendre Admin'}
        </button>
      ` : ''}
    `;

    list.appendChild(el);
  });

  list.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.onclick = () => removeMemberFromGroup(btn.dataset.id);
  });

  list.querySelectorAll('.change-role-btn').forEach(btn => {
    btn.onclick = () => changeMemberRole(btn.dataset.id);
  });
};

  const selectChat = id => {
  const allItems = [...data.contacts, ...data.groups];
  const selected = allItems.find(item => item.id === id);
  if (!selected) return;

  state.currentChat = selected;
  if (!data.messages[selected.id]) {
    data.messages[selected.id] = [];
  }

  elements.chatName.textContent = selected.name;

  // Supprimer l'élément existant contenant la liste des membres
  const existingMemberList = document.getElementById('group-member-list');
  if (existingMemberList) {
    existingMemberList.remove();
  }

  // Afficher les membres sous le nom du groupe
  if (selected.type === 'group') {
    const memberList = document.createElement('div');
    memberList.id = 'group-member-list'; // Ajout d'un ID pour éviter les doublons
    memberList.className = 'text-xs text-gray-500 mt-1';
    memberList.textContent = `Membres: ${selected.members.map(m => m.name).join(', ')}`;
    elements.chatName.parentElement.appendChild(memberList);
  }

  elements.chatAvatar.textContent = getFirstLetter(selected.name);
  elements.chatAvatar.className = 'w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold';
  elements.messageInput.disabled = false;
  elements.sendBtn.disabled = false;
  elements.editGroupBtn.classList.remove('hidden');

  elements.messageInput.value = selected.draftMessage || '';
  renderMessages(id);
};

  const renderMessages = chatId => {
  const container = elements.messages;
  container.innerHTML = '';
  
  const msgs = data.messages[chatId] || [];
  if (msgs.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 text-sm">Aucun message pour l’instant.</div>';
    return;
  }
  
  msgs.forEach(msg => {
    const msgEl = templates.message.content.cloneNode(true);
    const bubble = msgEl.querySelector('.message-bubble');
    const textEl = msgEl.querySelector('.message-text');
    const timeEl = msgEl.querySelector('.message-time');
  
    textEl.textContent = msg.text;
    timeEl.textContent = msg.time;
  
    // Appliquer les styles en fonction de l'expéditeur
    if (msg.sender === 'Moi') {
      bubble.classList.add('bg-green-500', 'text-white', 'self-end'); // Message envoyé (à droite)
      bubble.style.marginLeft = 'auto'; // Positionner à droite
    } else {
      bubble.classList.add('bg-white', 'text-black', 'self-start'); // Message reçu (à gauche)
      bubble.style.marginRight = 'auto'; // Positionner à gauche
    }
  
    container.appendChild(msgEl);
  });
  
  container.scrollTop = container.scrollHeight; // Faire défiler vers le bas
};

  const saveData = () => {
    localStorage.setItem('chat-app-data', JSON.stringify(data));
  };

  const loadData = () => {
    const saved = localStorage.getItem('chat-app-data');
    if (saved) {
      data = JSON.parse(saved);
    }
  };

  const render = () => {
  renderContactsList();
  if (state.currentChat) {
    renderMessages(state.currentChat.id);
    selectChat(state.currentChat.id); 
  }
};

  const deleteContact = (contactId) => {
    const index = data.contacts.findIndex(c => c.id === contactId);
    if (index === -1) return;
  
    data.contacts.splice(index, 1);
    delete data.messages[contactId];
  
    if (state.currentChat?.id === contactId) {
      state.currentChat = null;
      resetChatInterface();
    }
  
    saveData();
    render();
  };
  
  const renderDiffusionContacts = () => {
  const list = document.getElementById('diffusion-contact-list');
  list.innerHTML = ''; // Vider la liste avant de la remplir

  if (!data.diffusionContacts || data.diffusionContacts.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-500 text-sm">Aucun contact ajouté à la diffusion.</div>';
    return;
  }

  // Afficher uniquement les contacts ajoutés à la diffusion
  data.diffusionContacts.forEach(contact => {
    const contactEl = document.createElement('div');
    contactEl.className = 'w-full h-12 p-2 border-b-2 border-yellow-600 shadow flex items-center';
    contactEl.innerHTML = `
      <div class="flex-1">
        <div class="text-sm font-semibold">${contact.name}</div>
      </div>
      <div>
        <input type="checkbox" class="diffusion-checkbox" data-id="${contact.id}" />
      </div>
    `;
    list.appendChild(contactEl);
  });
};

// Exemple de structure des membres dans un groupe
const group = {
  id: 'group1',
  name: 'Groupe Exemple',
  members: [
    { id: 'admin', name: 'Moi (Admin)', role: 'admin' },
    { id: 'member1', name: 'Membre 1', role: 'simple' },
    { id: 'member2', name: 'Membre 2', role: 'simple' }
  ]
};

const removeMemberFromGroup = memberId => {
  const group = data.groups.find(g => g.id === state.editingGroup?.id);
  if (!group) return;

  const admin = group.members.find(m => m.id === 'admin');
  if (!admin || admin.name !== 'Moi (Admin)') {
    showPopup('Erreur', 'Seul l\'admin peut retirer un membre.');
    return;
  }

  const member = group.members.find(m => m.id === memberId);
  if (!member) return;

  showPopup(
    'Retirer le membre',
    `Êtes-vous sûr de vouloir retirer "${member.name}" du groupe ?`,
    () => {
      group.members = group.members.filter(m => m.id !== memberId);
      saveData();
      renderEditMembersList();
    }
  );
};

const changeMemberRole = memberId => {
  const group = data.groups.find(g => g.id === state.editingGroup?.id);
  if (!group) return;

  const admin = group.members.find(m => m.id === 'admin');
  if (!admin || admin.name !== 'Moi (Admin)') {
    showPopup('Erreur', 'Seul l\'admin peut changer le rôle d\'un membre.');
    return;
  }

  const member = group.members.find(m => m.id === memberId);
  if (!member) return;

  showPopup(
    'Changer le rôle',
    `Êtes-vous sûr de vouloir changer le rôle de "${member.name}" ?`,
    () => {
      member.role = member.role === 'admin' ? 'simple' : 'admin';
      saveData();
      renderEditMembersList();
    }
  );
};

const showAddMemberPopup = () => {
  const modal = document.getElementById('popup-modal');
  const titleEl = document.getElementById('popup-title');
  const messageEl = document.getElementById('popup-message');
  const confirmBtn = document.getElementById('popup-confirm');
  const cancelBtn = document.getElementById('popup-cancel');

  titleEl.textContent = 'Ajouter des membres';
  messageEl.innerHTML = `
    <div>
      <label class="block text-sm font-medium mb-2">Sélectionnez des membres:</label>
      <div id="add-members-list" class="max-h-32 overflow-auto border rounded p-2">
        ${data.contacts.map(contact => `
          <div class="flex items-center mb-2">
            <input type="checkbox" class="mr-2 add-member-checkbox" data-id="${contact.id}">
            <span>${contact.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  confirmBtn.textContent = 'Ajouter';
  confirmBtn.onclick = () => {
    const selectedIds = Array.from(document.querySelectorAll('.add-member-checkbox:checked')).map(cb => cb.dataset.id);
    const group = data.groups.find(g => g.id === state.editingGroup.id);
    if (group) {
      selectedIds.forEach(id => {
        const contact = data.contacts.find(c => c.id === id);
        if (contact && !group.members.some(m => m.id === contact.id)) {
          group.members.push({ id: contact.id, name: contact.name, role: 'simple' });
        }
      });
      saveData();
      renderEditMembersList();
    }
    modal.classList.add('hidden');
  };

  cancelBtn.onclick = () => modal.classList.add('hidden');
  modal.classList.remove('hidden');
};

elements.messageInput.onblur = () => {
  if (state.currentChat) {
    const chat = [...data.contacts, ...data.groups].find(item => item.id === state.currentChat.id);
    if (chat) {
      const draftMessage = elements.messageInput.value.trim();
      if (draftMessage) {
        chat.draftMessage = draftMessage; // Enregistrer le brouillon uniquement si du texte est présent
        saveData(); // Sauvegarder les données
        renderContactsList(); // Mettre à jour l'affichage des contacts
      }
    }
  }
};
  loadData();
  setupEvents();
  switchSection('contacts');
});