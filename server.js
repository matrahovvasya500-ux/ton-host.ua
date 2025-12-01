const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Дозволити CORS для API
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Головна сторінка
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Умови використання
app.get('/terms.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms.html'));
});

// Політика конфіденційності
app.get('/privacy.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

// API для перевірки статусу
app.post('/api/check-status', (req, res) => {
    const { transactionId } = req.body;
    
    // Симуляція перевірки статусу
    const statuses = [
        { status: 'pending', message: 'Очікуємо отримання TON', progress: 25 },
        { status: 'processing', message: 'TON отримано, обробляється', progress: 50 },
        { status: 'confirming', message: 'Очікуємо підтвердження в мережі', progress: 75 },
        { status: 'completed', message: 'Кошти відправлені на картку', progress: 100 }
    ];
    
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
        success: true,
        transactionId,
        status: randomStatus.status,
        message: randomStatus.message,
        progress: randomStatus.progress,
        timestamp: new Date().toISOString()
    });
});

// API для створення обміну
app.post('/api/create-exchange', (req, res) => {
    const { tonAmount, cardNumber, uahAmount } = req.body;
    
    // Валідація даних
    if (!tonAmount || tonAmount < 5) {
        return res.status(400).json({
            success: false,
            message: 'Мінімальна сума обміну - 5 TON'
        });
    }
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        return res.status(400).json({
            success: false,
            message: 'Невірний номер картки'
        });
    }
    
    // Генерація ID транзакції
    const transactionId = 'TON-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // Фіксована TON адреса
    const tonAddress = "UQDlG-F7r-tTlW8UYnguUqc_7C33aQ0mogZuwB-qr879Xdnr";
    
    res.json({
        success: true,
        transaction: {
            id: transactionId,
            tonAmount: parseFloat(tonAmount),
            uahAmount: parseFloat(uahAmount),
            cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
            tonAddress: tonAddress,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 хвилин
        },
        message: 'Обмін створено. Надішліть TON на вказану адресу.'
    });
});

// API для отримання курсу
app.get('/api/exchange-rate', (req, res) => {
    res.json({
        success: true,
        rate: {
            ton_usd: 1.49,
            usd_uah: 37.45,
            ton_uah: 55.85,
            commission: 1,
            min_amount: 5,
            updated_at: new Date().toISOString()
        }
    });
});

// Обробка 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    console.log(`🌐 Відкрийте http://localhost:${PORT} в браузері`);
    console.log(`💎 TON Exchange UA готовий до роботи!`);
    console.log(`📊 Мінімальна сума: 5 TON`);
    console.log(`💰 Комісія: 1 TON (фіксована)`);
});