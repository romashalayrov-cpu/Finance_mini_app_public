// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Инициализация Telegram Web App
    tg.ready();
    tg.expand();
    
    // Настройка темы
    tg.setHeaderColor('#0088cc');
    tg.setBackgroundColor('#ffffff');
    
    // Отображение информации о пользователе
    displayUserInfo();
    
    // Загрузка данных
    loadDashboardData();
    
    // Настройка обработчиков модальных окон
    setupModalHandlers();
}

function displayUserInfo() {
    const user = tg.initDataUnsafe?.user;
    const userNameElement = document.getElementById('userName');
    
    if (user) {
        const displayName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        userNameElement.textContent = displayName;
    } else {
        userNameElement.textContent = 'Пользователь';
    }
}

async function loadDashboardData() {
    try {
        // Загрузка статистики
        await loadStatistics();
        
        // Загрузка графика активности
        loadActivityChart();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

async function loadStatistics() {
    try {
        // Здесь будет API запрос к вашему боту
        const response = await fetch('/api/statistics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                init_data: tg.initData,
                user: tg.initDataUnsafe?.user
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            updateStatistics(data);
        } else {
            // Заглушка для демонстрации
            updateStatistics({
                totalUsers: 1250,
                activeUsers: 847
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Заглушка для демонстрации
        updateStatistics({
            totalUsers: 1250,
            activeUsers: 847
        });
    }
}

function updateStatistics(data) {
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('activeUsers').textContent = data.activeUsers || 0;
}

function loadActivityChart() {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Простой график активности (заглушка)
    const data = [65, 78, 90, 85, 92, 88, 95];
    const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    drawSimpleChart(ctx, data, labels);
}

function drawSimpleChart(ctx, data, labels) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Находим максимальное значение
    const maxValue = Math.max(...data);
    
    // Рисуем оси
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Рисуем график
    ctx.strokeStyle = '#0088cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const stepX = (width - 2 * padding) / (data.length - 1);
    const stepY = (height - 2 * padding) / maxValue;
    
    data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - value * stepY;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Рисуем точки
    ctx.fillStyle = '#0088cc';
    data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - value * stepY;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Функции для модальных окон
function setupModalHandlers() {
    // Обработчики закрытия модальных окон
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        tg.MainButton.hide();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        tg.MainButton.hide();
    }
}

// Функции действий
function sendMessage() {
    openModal('messageModal');
}

function showUsers() {
    openModal('usersModal');
    loadUsersList();
}

function showSettings() {
    openModal('settingsModal');
    loadSettings();
}

async function sendBroadcastMessage() {
    const messageText = document.getElementById('messageText').value.trim();
    
    if (!messageText) {
        showNotification('Введите текст сообщения', 'error');
        return;
    }
    
    try {
        // Здесь будет API запрос к вашему боту
        const response = await fetch('/api/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: messageText,
                init_data: tg.initData,
                user: tg.initDataUnsafe?.user
            })
        });
        
        if (response.ok) {
            showNotification('Сообщение отправлено!', 'success');
            closeModal('messageModal');
            document.getElementById('messageText').value = '';
        } else {
            showNotification('Ошибка отправки сообщения', 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        showNotification('Ошибка отправки сообщения', 'error');
    }
}

async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Загрузка пользователей...</div>';
    
    try {
        // Здесь будет API запрос к вашему боту
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                init_data: tg.initData,
                user: tg.initDataUnsafe?.user
            })
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            // Заглушка для демонстрации
            displayUsers([
                { id: 1, first_name: 'Иван', last_name: 'Иванов', username: 'ivan', status: 'online' },
                { id: 2, first_name: 'Мария', last_name: 'Петрова', username: 'maria', status: 'offline' },
                { id: 3, first_name: 'Алексей', last_name: 'Сидоров', username: 'alex', status: 'online' }
            ]);
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        // Заглушка для демонстрации
        displayUsers([
            { id: 1, first_name: 'Иван', last_name: 'Иванов', username: 'ivan', status: 'online' },
            { id: 2, first_name: 'Мария', last_name: 'Петрова', username: 'maria', status: 'offline' },
            { id: 3, first_name: 'Алексей', last_name: 'Сидоров', username: 'alex', status: 'online' }
        ]);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="loading">Пользователи не найдены</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-avatar">
                ${user.first_name.charAt(0)}${user.last_name ? user.last_name.charAt(0) : ''}
            </div>
            <div class="user-details">
                <div class="user-name">${user.first_name} ${user.last_name || ''}</div>
                <div class="user-status">@${user.username} • ${user.status}</div>
            </div>
        </div>
    `).join('');
}

function loadSettings() {
    // Загрузка настроек из localStorage или API
    const autoReply = localStorage.getItem('autoReply') === 'true';
    const notifications = localStorage.getItem('notifications') === 'true';
    
    document.getElementById('autoReply').checked = autoReply;
    document.getElementById('notifications').checked = notifications;
}

function saveSettings() {
    const autoReply = document.getElementById('autoReply').checked;
    const notifications = document.getElementById('notifications').checked;
    
    // Сохранение настроек
    localStorage.setItem('autoReply', autoReply);
    localStorage.setItem('notifications', notifications);
    
    showNotification('Настройки сохранены!', 'success');
    closeModal('settingsModal');
}

// Утилиты
function showNotification(message, type = 'info') {
    // Используем Telegram Web App API для уведомлений
    if (type === 'success') {
        tg.showAlert(message);
    } else if (type === 'error') {
        tg.showAlert(message);
    } else {
        tg.showAlert(message);
    }
}

// Обработка событий Telegram Web App
tg.onEvent('themeChanged', function() {
    // Обновляем тему при изменении
    document.body.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    document.body.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
    document.body.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
    document.body.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
    document.body.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
    document.body.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
});

// Экспорт функций для использования в HTML
window.sendMessage = sendMessage;
window.showUsers = showUsers;
window.showSettings = showSettings;
window.sendBroadcastMessage = sendBroadcastMessage;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
