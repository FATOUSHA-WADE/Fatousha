export function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function resizeImage(file, maxWidth = 200, maxHeight = 200, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calculer les nouvelles dimensions
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            // Redimensionner
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir en base64
            const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(resizedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

export function formatPhone(phone) {
    let formatted = phone.replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
        formatted = '+221' + formatted;
    }
    return formatted;
}

export function validatePhone(phone) {
    const phoneRegex = /^[0-9\s\-\+\(\)]{8,15}$/;
    return phoneRegex.test(phone);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}