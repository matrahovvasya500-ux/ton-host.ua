// Конфігурація
const CONFIG = {
    TON_USD_RATE: 1.49,
    USD_UAH_RATE: 37.45,
    TON_UAH_RATE: 1.49 * 37.45, // 55.8505
    FIXED_COMMISSION: 1, // 1 TON фіксована комісія
    MIN_TON_AMOUNT: 5, // Мінімум 5 TON
    TON_ADDRESS: "UQDlG-F7r-tTlW8UYnguUqc_7C33aQ0mogZuwB-qr879Xdnr",
    SUPPORT_EMAIL: "support@ton-exchange.ua"
};

// Глобальні змінні
let currentTransaction = null;

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Головна функція ініціалізації
function initApp() {
    // Ініціалізація елементів
    const elements = {
        tonAmountInput: document.getElementById('tonAmount'),
        exchangeAmountSpan: document.getElementById('exchangeAmount'),
        finalAmountSpan: document.getElementById('finalAmount'),
        commissionAmountSpan: document.getElementById('commissionAmount'),
        cardNumberInput: document.getElementById('cardNumber'),
        tonAddressSpan: document.getElementById('tonAddress'),
        copyBtn: document.getElementById('copyBtn'),
        qrBtn: document.getElementById('qrBtn'),
        exchangeBtn: document.getElementById('exchangeBtn'),
        statusBox: document.getElementById('statusBox'),
        statusText: document.getElementById('statusText'),
        qrModal: document.getElementById('qrModal'),
        qrCodeDiv: document.getElementById('qrCode')
    };

    // Встановлення початкових значень
    elements.tonAddressSpan.textContent = CONFIG.TON_ADDRESS;
    calculateExchange(elements);

    // Обробники подій
    setupEventListeners(elements);

    // Завантаження збереженої транзакції
    loadSavedTransaction(elements);

    // Налаштування гарячих клавіш
    setupHotkeys(elements);

    console.log('TON Exchange UA ініціалізовано! Мінімум: ' + CONFIG.MIN_TON_AMOUNT + ' TON');
}

// Розрахунок обміну
function calculateExchange(elements) {
    const tonAmount = parseFloat(elements.tonAmountInput.value) || 0;
    
    // Валідація мінімальної суми
    if (tonAmount < CONFIG.MIN_TON_AMOUNT) {
        elements.tonAmountInput.value = CONFIG.MIN_TON_AMOUNT;
        showNotification(`Мінімальна сума обміну - ${CONFIG.MIN_TON_AMOUNT} TON`, 'warning');
        return calculateExchange(elements);
    }
    
    // Перевірка на комісію
    if (tonAmount <= CONFIG.FIXED_COMMISSION) {
        elements.tonAmountInput.style.borderColor = 'var(--danger)';
        elements.tonAmountInput.style.backgroundColor = '#fff5f5';
    } else {
        elements.tonAmountInput.style.borderColor = '';
        elements.tonAmountInput.style.backgroundColor = '';
    }
    
    // Розрахунок сум
    const totalUAH = tonAmount * CONFIG.TON_UAH_RATE;
    const finalUAH = (tonAmount - CONFIG.FIXED_COMMISSION) * CONFIG.TON_UAH_RATE;
    
    // Оновлення інтерфейсу
    elements.exchangeAmountSpan.textContent = formatCurrency(totalUAH, 'UAH');
    elements.finalAmountSpan.textContent = formatCurrency(finalUAH, 'UAH');
    elements.commissionAmountSpan.textContent = CONFIG.FIXED_COMMISSION;
}

// Форматування валюти
function formatCurrency(amount, currency) {
    const formattedAmount = amount.toFixed(2);
    switch (currency) {
        case 'UAH':
            return `${formattedAmount} ₴`;
        case 'USD':
            return `$${formattedAmount}`;
        default:
            return formattedAmount;
    }
}

// Форматування номера картки
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    input.value = value.substring(0, 19);
}

// Валідація форми
function validateForm(elements) {
    const tonAmount = parseFloat(elements.tonAmountInput.value);
    const cardNumber = elements.cardNumberInput.value.replace(/\s/g, '');
    
    // Перевірка суми TON
    if (tonAmount < CONFIG.MIN_TON_AMOUNT) {
        showNotification(`Мінімальна сума обміну - ${CONFIG.MIN_TON_AMOUNT} TON`, 'error');
        elements.tonAmountInput.focus();
        return false;
    }
    
    if (tonAmount <= CONFIG.FIXED_COMMISSION) {
        showNotification(`Сума повинна бути більшою за комісію (${CONFIG.FIXED_COMMISSION} TON)`, 'error');
        elements.tonAmountInput.focus();
        return false;
    }
    
    // Перевірка номера картки
    if (!cardNumber || cardNumber.length < 16) {
        showNotification('Будь ласка, введіть правильний номер картки (16 цифр)', 'error');
        elements.cardNumberInput.focus();
        return false;
    }
    
    // Проста перевірка формату картки
    if (!isValidCardNumber(cardNumber)) {
        showNotification('Будь ласка, введіть номер картки Visa, Mastercard або українського банку', 'error');
        elements.cardNumberInput.focus();
        return false;
    }
    
    return true;
}

// Перевірка номера картки
function isValidCardNumber(number) {
    // Перевірка починання (Visa, Mastercard, МІР, українські карти)
    const cardPatterns = [
        /^4[0-9]{12}(?:[0-9]{3})?$/, // Visa
        /^5[1-5][0-9]{14}$/, // Mastercard
        /^6(?:011|5[0-9]{2})[0-9]{12}$/, // Discover
        /^3[47][0-9]{13}$/, // American Express
        /^(?:220[0-4])\d{12}$/ // МІР
    ];
    
    return cardPatterns.some(pattern => pattern.test(number)) || 
           (number.length >= 16 && number.length <= 19); // Загальна перевірка
}

// Показ сповіщення
function showNotification(message, type = 'info') {
    // Видаляємо старі сповіщення
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Створюємо нове сповіщення
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Стилі для сповіщення
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--primary)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Автоматичне видалення через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Анімації
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Обробка обміну
function processExchange(elements) {
    if (!validateForm(elements)) return;
    
    const tonAmount = parseFloat(elements.tonAmountInput.value);
    const finalUAH = (tonAmount - CONFIG.FIXED_COMMISSION) * CONFIG.TON_UAH_RATE;
    const cardNumber = elements.cardNumberInput.value;
    
    // Блокування кнопки
    elements.exchangeBtn.disabled = true;
    elements.exchangeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обробка...';
    
    // Створення ID транзакції
    const transactionId = 'TON-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // Створення об'єкта транзакції
    currentTransaction = {
        id: transactionId,
        tonAmount: tonAmount,
        uahAmount: finalUAH,
        cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
        tonAddress: CONFIG.TON_ADDRESS,
        timestamp: new Date().toLocaleString('uk-UA'),
        status: 'очікує оплати',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('uk-UA') // 30 хвилин
    };
    
    // Збереження транзакції
    saveTransaction(currentTransaction);
    
    // Показ статусу
    showStatus(elements, currentTransaction);
    
    // Симуляція обробки
    setTimeout(() => {
        completeExchange(elements, currentTransaction);
    }, 2000);
}

// Показ статусу
function showStatus(elements, transaction) {
    elements.statusBox.style.display = 'block';
    
    elements.statusText.innerHTML = `
        <div style="margin-bottom: 15px;">
            <strong style="color: var(--primary);">📋 Інструкції для обміну:</strong>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="margin-bottom: 10px;">
                <strong>1. Надішліть точно ${transaction.tonAmount} TON</strong><br>
                <small style="color: var(--gray);">На адресу:</small>
            </div>
            <div style="background: var(--light); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 14px; margin: 10px 0;">
                ${transaction.tonAddress}
            </div>
            
            <div style="margin: 15px 0;">
                <strong>2. Чекайте 2 підтвердження в мережі TON</strong><br>
                <small style="color: var(--gray);">(приблизно 2-5 хвилин)</small>
            </div>
            
            <div style="margin: 15px 0;">
                <strong>3. Ви отримаєте на картку:</strong><br>
                <span style="font-size: 18px; color: var(--success); font-weight: bold;">
                    ${transaction.uahAmount.toFixed(2)} ₴
                </span><br>
                <small style="color: var(--gray);">Картка: ${transaction.cardNumber}</small>
            </div>
        </div>
        
        <div style="font-size: 14px; color: var(--gray); text-align: center;">
            <i class="fas fa-clock"></i> Виплата відбувається автоматично протягом 5-15 хвилин
        </div>
    `;
    
    elements.statusBox.scrollIntoView({ behavior: 'smooth' });
}

// Завершення обміну
function completeExchange(elements, transaction) {
    // Оновлення транзакції
    transaction.status = 'очікує отримання TON';
    saveTransaction(transaction);
    
    // Оновлення статусу
    elements.statusText.innerHTML = `
        <div style="color: var(--success);">
            <div style="font-size: 24px; margin-bottom: 15px; text-align: center;">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong style="font-size: 18px;">Обмін успішно зареєстровано!</strong>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px;">
                    <strong>ID операції:</strong><br>
                    <span style="font-family: monospace; color: var(--primary);">${transaction.id}</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Сума обміну:</strong><br>
                    <span style="color: var(--dark);">
                        ${transaction.tonAmount} TON → ${transaction.uahAmount.toFixed(2)} ₴
                    </span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Картка для виплати:</strong><br>
                    <span style="color: var(--dark);">${transaction.cardNumber}</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Статус:</strong><br>
                    <span style="color: var(--warning);">${transaction.status}</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Термін дії:</strong><br>
                    <span style="color: var(--gray);">До ${transaction.expiresAt}</span>
                </div>
            </div>
            
            <div style="background: var(--info-light); padding: 15px; border-radius: 8px; font-size: 14px;">
                <strong>Наступні кроки:</strong><br>
                1. Надішліть ${transaction.tonAmount} TON на вказану адресу<br>
                2. Кошти будуть зараховані автоматично<br>
                3. Ви отримаєте підтвердження на пошту<br>
                4. Моніторити статус: ${transaction.id}
            </div>
        </div>
    `;
    
    // Оновлення кнопки
    elements.exchangeBtn.innerHTML = '<i class="fas fa-redo"></i> Новий обмін';
    elements.exchangeBtn.disabled = false;
    
    // Зміна обробника кнопки
    elements.exchangeBtn.onclick = function() {
        if (confirm('Скинути форму та розпочати новий обмін?')) {
            resetForm(elements);
        }
    };
    
    showNotification('Обмін зареєстровано! Надішліть TON на вказану адресу.', 'success');
}

// Скидання форми
function resetForm(elements) {
    elements.tonAmountInput.value = CONFIG.MIN_TON_AMOUNT;
    elements.cardNumberInput.value = '';
    elements.statusBox.style.display = 'none';
    elements.exchangeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Підтвердити обмін';
    elements.exchangeBtn.onclick = function() { processExchange(elements); };
    
    calculateExchange(elements);
    showNotification('Форма скинута. Можете розпочати новий обмін.', 'info');
}

// Збереження транзакції
function saveTransaction(transaction) {
    try {
        localStorage.setItem('tonExchangeTransaction', JSON.stringify(transaction));
        localStorage.setItem('tonExchangeTimestamp', Date.now().toString());
    } catch (e) {
        console.error('Помилка збереження транзакції:', e);
    }
}

// Завантаження збереженої транзакції
function loadSavedTransaction(elements) {
    try {
        const savedTransaction = localStorage.getItem('tonExchangeTransaction');
        const savedTimestamp = localStorage.getItem('tonExchangeTimestamp');
        
        if (savedTransaction && savedTimestamp) {
            const transaction = JSON.parse(savedTransaction);
            const hoursAgo = Math.floor((Date.now() - parseInt(savedTimestamp)) / (1000 * 60 * 60));
            
            // Показуємо тільки якщо менше 24 годин
            if (hoursAgo < 24) {
                if (confirm(`Знайдено активний обмін ${transaction.id} (${hoursAgo} годин тому). Хочете продовжити?`)) {
                    elements.tonAmountInput.value = transaction.tonAmount;
                    elements.cardNumberInput.value = transaction.cardNumber;
                    calculateExchange(elements);
                    
                    currentTransaction = transaction;
                    showStatus(elements, transaction);
                }
            }
        }
    } catch (e) {
        console.error('Помилка завантаження транзакції:', e);
    }
}

// Налаштування обробників подій
function setupEventListeners(elements) {
    // Розрахунок при зміні суми
    elements.tonAmountInput.addEventListener('input', () => calculateExchange(elements));
    
    // Форматування номера картки
    elements.cardNumberInput.addEventListener('input', function() {
        formatCardNumber(this);
    });
    
    // Копіювання адреси
    elements.copyBtn.addEventListener('click', function() {
        copyToClipboard(CONFIG.TON_ADDRESS, elements.copyBtn);
    });
    
    // QR код
    elements.qrBtn.addEventListener('click', function() {
        showQRCode(elements.qrModal, elements.qrCodeDiv);
    });
    
    // Закриття QR коду
    elements.qrModal.addEventListener('click', function(e) {
        if (e.target === elements.qrModal) {
            closeQRCode(elements.qrModal);
        }
    });
    
    // Обмін
    elements.exchangeBtn.addEventListener('click', () => processExchange(elements));
    
    // Гарячі клавіші для суми
    elements.tonAmountInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.value = parseFloat(this.value) + 1;
            calculateExchange(elements);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newValue = parseFloat(this.value) - 1;
            if (newValue >= CONFIG.MIN_TON_AMOUNT) {
                this.value = newValue;
                calculateExchange(elements);
            }
        }
        
        // Ctrl+Enter для швидкого обміну
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            elements.exchangeBtn.click();
        }
    });
}

// Копіювання в буфер обміну
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text)
        .then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Скопійовано!';
            button.style.background = 'linear-gradient(135deg, var(--success) 0%, #20c997 100%)';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
            }, 2000);
            
            showNotification('Адресу скопійовано в буфер обміну!', 'success');
        })
        .catch(err => {
            console.error('Помилка копіювання:', err);
            showNotification('Не вдалося скопіювати. Спробуйте вручну.', 'error');
        });
}

// Показ QR коду
function showQRCode(modal, qrCodeDiv) {
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=ton://transfer/${CONFIG.TON_ADDRESS}&choe=UTF-8&chld=H|0`;
    
    qrCodeDiv.innerHTML = `
        <img src="${qrUrl}" alt="QR код для TON" 
             style="width: 250px; height: 250px; border-radius: 10px; border: 2px solid var(--gray-light);">
        <p style="margin-top: 15px; font-size: 12px; color: var(--gray); word-break: break-all;">
            <i class="fas fa-wallet"></i> ${CONFIG.TON_ADDRESS}
        </p>
    `;
    
    modal.style.display = 'flex';
}

// Закриття QR коду
function closeQRCode(modal) {
    modal.style.display = 'none';
}

// Глобальна функція для закриття QR
window.closeQR = function() {
    closeQRCode(document.getElementById('qrModal'));
};

// Налаштування гарячих клавіш
function setupHotkeys(elements) {
    document.addEventListener('keydown', function(e) {
        // Ctrl+D для демо даних
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            elements.tonAmountInput.value = "10";
            elements.cardNumberInput.value = "5375 4111 1111 1111";
            calculateExchange(elements);
            showNotification('Демо дані завантажено!', 'info');
        }
        
        // Ctrl+H для допомоги
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            alert(`Гарячі клавіші:\n\n↑/↓ - Змінити кількість TON\nCtrl+Enter - Швидкий обмін\nCtrl+D - Демо дані\nCtrl+H - Ця довідка`);
        }
    });
}

// Додаємо стилі для сповіщень у head
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        }
        
        .notification-error {
            background: var(--danger);
            color: white;
        }
        
        .notification-success {
            background: var(--success);
            color: white;
        }
        
        .notification-warning {
            background: var(--warning);
            color: #333;
        }
        
        .notification-info {
            background: var(--primary);
            color: white;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    </style>
`);