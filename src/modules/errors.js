
export function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

export function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

export function showNotification(message, type = 'info') {
    // Créer une notification toast
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    notification.classList.add(bgColor, 'text-white');
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Suppression automatique après 5 secondes
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

export function showConfirmPopup(message, onConfirm) {
    const popup = document.getElementById('custom-popup');
    const msg = document.getElementById('custom-popup-message');
    const okBtn = document.getElementById('custom-popup-ok');
    const cancelBtn = document.getElementById('custom-popup-cancel');
    
    if (!popup || !msg || !okBtn || !cancelBtn) {
        // Fallback vers confirm natif si les éléments n'existent pas
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    
    msg.textContent = message;
    popup.classList.remove('hidden');

    // Nettoyer les anciens listeners
    okBtn.onclick = null;
    cancelBtn.onclick = null;

    okBtn.onclick = () => {
        popup.classList.add('hidden');
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    cancelBtn.onclick = () => {
        popup.classList.add('hidden');
    };
}

// Gestion des erreurs globales
export function setupGlobalErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Erreur globale:', e.error);
        showNotification('Une erreur inattendue s\'est produite', 'error');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promesse rejetée:', e.reason);
        showNotification('Erreur de traitement des données', 'error');
    });
}