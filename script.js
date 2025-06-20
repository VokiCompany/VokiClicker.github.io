8document.addEventListener('DOMContentLoaded', () => {
    const hamster = document.getElementById('hamster');
    const scoreElement = document.getElementById('score');
    const energyElement = document.getElementById('energy');
    const dailyRewardTimerElement = document.getElementById('daily-reward-timer');
    const dailyCodeTimerElement = document.getElementById('daily-code-timer');
    const comboTimerElement = document.getElementById('combo-timer');
    const currentClicksElement = document.getElementById('current-clicks');
    const progressFillElement = document.getElementById('progress-fill');
    const promoInput = document.getElementById('promo-input');
    const promoButton = document.getElementById('promo-button');
    const skinsList = document.getElementById('skins-list');
    const boostButton = document.querySelector('.boost-button');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const changeUsernameBtn = document.getElementById('change-username-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const usernameInput = document.getElementById('username-input');
    const usernameDisplay = document.querySelector('.user-info h2');

    // Anti-autoclicker system
    let lastClickTime = 0;
    let clickIntervals = [];
    const MAX_CLICKS_PER_SECOND = 15;
    const BAN_DURATION = 3 * 24 * 60 * 60 * 1000;

    // Game variables
    let score = parseInt(localStorage.getItem('score')) || 0;
    let currentEnergy = 3000;
    const totalEnergy = 3000;
    let currentSkin = localStorage.getItem('currentSkin') || hamster.src;
    let ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || [1];
    let clickGoal = parseInt(localStorage.getItem('clickGoal')) || 100;
    let currentClicks = parseInt(localStorage.getItem('currentClicks')) || 0;
    let rewardMultiplier = parseInt(localStorage.getItem('rewardMultiplier')) || 1;
    let isBoostActive = false;
    let boostInterval;
    let usedPromoCodes = JSON.parse(localStorage.getItem('usedPromoCodes')) || [];
    let username = localStorage.getItem('username') || '';
    let autoClickerActive = localStorage.getItem('autoClickerActive') === 'true' || false;
    let autoClickerInterval;
    let clickMultiplier = parseInt(localStorage.getItem('clickMultiplier')) || 1;
    let clickMultiplierLevel = parseInt(localStorage.getItem('clickMultiplierLevel')) || 0;

    // Skins data
    const skins = [
        { id: 1, name: "Стандартный", price: 0, url: "img/Hamster.jpg" },
        { id: 7, name: "Автокликер", price: 100, url: "https://i.ibb.co/0jZR7J3/autoclicker-icon.png", type: "autoclicker" },
        { id: 8, name: "Удвоение кликов", price: 200, url: "https://i.ibb.co/4W2yYtJ/double-icon.png", type: "clickMultiplier" }
    ];

    // Create reward notification element
    const rewardNotification = document.createElement('div');
    rewardNotification.className = 'reward-notification';
    rewardNotification.id = 'reward-notification';
    document.body.appendChild(rewardNotification);

    // Initialize profile
    function initProfile() {
        usernameDisplay.textContent = username;
        const savedAvatar = localStorage.getItem('avatar');
        if (savedAvatar) {
            document.querySelector('.avatar').src = savedAvatar;
        }
    }

    // Change avatar
    changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const avatar = document.querySelector('.avatar');
                avatar.src = event.target.result;
                localStorage.setItem('avatar', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Change username
    changeUsernameBtn.addEventListener('click', () => {
        usernameInput.style.display = 'block';
        usernameInput.value = username;
        usernameInput.focus();
    });

    usernameInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            username = this.value.trim();
            localStorage.setItem('username', username);
            usernameDisplay.textContent = username;
        }
        this.style.display = 'none';
    });

    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function updateEnergyDisplay() {
        energyElement.textContent = `${currentEnergy}/${totalEnergy}`;
    }

    function createFloatingScore(x, y) {
        const floatingScore = document.createElement('div');
        floatingScore.className = 'floating-score';
        
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        floatingScore.style.left = `${x + scrollX}px`;
        floatingScore.style.top = `${y + scrollY}px`;
        floatingScore.textContent = `+${clickMultiplier}`;
        document.body.appendChild(floatingScore);
        
        setTimeout(() => {
            floatingScore.remove();
        }, 1000);
    }

    function updateClickProgress() {
        const progressPercent = (currentClicks / clickGoal) * 100;
        progressFillElement.style.width = `${progressPercent}%`;
        currentClicksElement.textContent = `${currentClicks}/${clickGoal}`;
        
        if (currentClicks >= clickGoal) {
            completeClickChallenge();
        }
    }

    function completeClickChallenge() {
        const reward = 5000 * rewardMultiplier;
        score += reward;
        scoreElement.textContent = formatNumber(score);
        localStorage.setItem('score', score);
        
        currentClicks = 0;
        clickGoal = Math.floor(clickGoal * 1.5);
        rewardMultiplier++;
        
        localStorage.setItem('currentClicks', currentClicks);
        localStorage.setItem('clickGoal', clickGoal);
        localStorage.setItem('rewardMultiplier', rewardMultiplier);
        
        updateClickProgress();
        
        rewardNotification.textContent = `Поздравляем! Вы заработали ${formatNumber(reward)} очков!`;
        rewardNotification.style.display = 'block';
        
        setTimeout(() => {
            rewardNotification.style.display = 'none';
        }, 2000);
        
        initShop();
    }

    function startTimer(timerElement, initialTimeInSeconds, callback) {
        let time = initialTimeInSeconds;
        const interval = setInterval(() => {
            if (time > 0) {
                time--;
                const minutes = Math.floor(time / 60);
                const seconds = time % 60;
                timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            } else {
                callback();
                clearInterval(interval);
                startTimer(timerElement, initialTimeInSeconds, callback);
            }
        }, 1000);
    }

    function rewardCallback() {
        const randomPoints = Math.floor(Math.random() * 10001) + 5000;
        score += randomPoints;
        scoreElement.textContent = formatNumber(score);
        localStorage.setItem('score', score);
        initShop();
    }

    function activateAutoClicker() {
        if (autoClickerActive) return;
        
        autoClickerActive = true;
        localStorage.setItem('autoClickerActive', 'true');
        
        autoClickerInterval = setInterval(() => {
            if (currentEnergy > 0) {
                const pointsToAdd = 1 * clickMultiplier;
                score += pointsToAdd;
                currentClicks += 1;
                currentEnergy--;
                
                scoreElement.textContent = formatNumber(score);
                updateEnergyDisplay();
                localStorage.setItem('score', score);
                localStorage.setItem('currentClicks', currentClicks);
                updateClickProgress();
            }
        }, 1000);
    }

    function upgradeClickMultiplier() {
        const basePrice = 250000;
        const priceIncrease = 100000 * clickMultiplierLevel;
        const totalPrice = basePrice + priceIncrease;
        
        if (score >= totalPrice) {
            score -= totalPrice;
            clickMultiplier++;
            clickMultiplierLevel++;
            
            scoreElement.textContent = formatNumber(score);
            localStorage.setItem('score', score);
            localStorage.setItem('clickMultiplier', clickMultiplier);
            localStorage.setItem('clickMultiplierLevel', clickMultiplierLevel);
            
            alert(`Уровень удвоения кликов повышен до ${clickMultiplier}x!`);
            initShop();
        } else {
            alert(`Недостаточно средств! Нужно ${formatNumber(totalPrice)} очков.`);
        }
    }

    function buySkin(skin) {
        if (score >= skin.price && !ownedSkins.includes(skin.id)) {
            score -= skin.price;
            ownedSkins.push(skin.id);
            scoreElement.textContent = formatNumber(score);
            localStorage.setItem('score', score);
            localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
            
            if (skin.type === "autoclicker") {
                activateAutoClicker();
            } else if (skin.type === "clickMultiplier") {
                upgradeClickMultiplier();
            }
            
            initShop();
        }
    }

    function selectSkin(skin) {
        if (skin.type) return;
        
        currentSkin = skin.url;
        hamster.src = currentSkin;
        localStorage.setItem('currentSkin', currentSkin);
        initShop();
    }

    function initShop() {
        skinsList.innerHTML = '';
        skins.forEach(skin => {
            const skinItem = document.createElement('div');
            skinItem.className = 'skin-item';
            
            const skinPreview = document.createElement('img');
            skinPreview.src = skin.url;
            skinPreview.className = 'skin-preview';
            skinPreview.alt = skin.name;
            
            const skinInfo = document.createElement('div');
            skinInfo.className = 'skin-info';
            
            if (skin.type === "autoclicker") {
                skinInfo.innerHTML = `
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-price">Цена: ${formatNumber(skin.price)}</div>
                    <div class="skin-desc">Автоматически кликает 1 раз в секунду</div>
                    <div class="skin-status">${autoClickerActive ? 'Активен' : 'Неактивен'}</div>
                `;
            } else if (skin.type === "clickMultiplier") {
                const basePrice = 250000;
                const priceIncrease = 100000 * clickMultiplierLevel;
                const totalPrice = basePrice + priceIncrease;
                
                skinInfo.innerHTML = `
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-price">Улучшение: ${formatNumber(totalPrice)}</div>
                    <div class="skin-desc">Текущий множитель: ${clickMultiplier}x</div>
                    <div class="skin-level">Уровень: ${clickMultiplierLevel}</div>
                `;
            } else {
                skinInfo.innerHTML = `
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-price">Цена: ${formatNumber(skin.price)}</div>
                `;
            }
            
            const buyButton = document.createElement('button');
            buyButton.className = 'buy-button';
            
            if (ownedSkins.includes(skin.id)) {
                if (skin.type) {
                    if (skin.type === "autoclicker") {
                        buyButton.textContent = autoClickerActive ? 'Активен' : 'Активировать';
                        buyButton.disabled = autoClickerActive;
                    } else if (skin.type === "clickMultiplier") {
                        buyButton.textContent = 'Улучшить';
                        const totalPrice = 250000 + (100000 * clickMultiplierLevel);
                        buyButton.disabled = score < totalPrice;
                        buyButton.onclick = () => upgradeClickMultiplier();
                    }
                } else {
                    if (currentSkin === skin.url) {
                        buyButton.textContent = 'Выбрано';
                        buyButton.disabled = true;
                    } else {
                        buyButton.textContent = 'Выбрать';
                        buyButton.onclick = () => selectSkin(skin);
                    }
                }
            } else {
                buyButton.textContent = 'Купить';
                buyButton.onclick = () => buySkin(skin);
                buyButton.disabled = score < skin.price;
            }
            
            skinItem.appendChild(skinPreview);
            skinItem.appendChild(skinInfo);
            skinItem.appendChild(buyButton);
            skinsList.appendChild(skinItem);
        });
    }

    function detectAutoclicker() {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime;
        lastClickTime = now;

        if (clickIntervals.length >= 10) {
            clickIntervals.shift();
        }
        clickIntervals.push(timeSinceLastClick);

        if (clickIntervals.length >= 5) {
            const averageInterval = clickIntervals.reduce((a, b) => a + b, 0) / clickIntervals.length;
            const clicksPerSecond = 1000 / averageInterval;

            if (clicksPerSecond > MAX_CLICKS_PER_SECOND && isTooRegular(clickIntervals)) {
                banPlayer();
                return true;
            }
        }
        return false;
    }

    function isTooRegular(intervals) {
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, interval) => {
            return acc + Math.pow(interval - avg, 2);
        }, 0) / intervals.length;

        return variance < 10;
    }

    function banPlayer() {
        const banUntil = Date.now() + BAN_DURATION;
        localStorage.setItem('bannedUntil', banUntil);
        showBanMessage();
    }

    function checkBanStatus() {
        const banUntil = localStorage.getItem('bannedUntil');
        if (banUntil && Date.now() < parseInt(banUntil)) {
            showBanMessage();
            return true;
        }
        return false;
    }

    function showBanMessage() {
        const banUntil = localStorage.getItem('bannedUntil');
        const banTimeLeft = (parseInt(banUntil) - Date.now()) / (1000 * 60 * 60 * 24);
        
        const banMessage = document.createElement('div');
        banMessage.style.position = 'fixed';
        banMessage.style.top = '0';
        banMessage.style.left = '0';
        banMessage.style.width = '100%';
        banMessage.style.height = '100%';
        banMessage.style.backgroundColor = 'rgba(0,0,0,0.9)';
        banMessage.style.color = 'white';
        banMessage.style.display = 'flex';
        banMessage.style.flexDirection = 'column';
        banMessage.style.justifyContent = 'center';
        banMessage.style.alignItems = 'center';
        banMessage.style.zIndex = '10000';
        banMessage.style.fontSize = '24px';
        banMessage.style.textAlign = 'center';
        banMessage.style.padding = '20px';
        
        banMessage.innerHTML = `
            <h1>Вы забанены!</h1>
            <p>Обнаружено использование автокликера.</p>
            <p>Бан истечет через: ${banTimeLeft.toFixed(1)} дней</p>
            <p>Попробуйте играть честно!</p>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(banMessage);
    }

    // Boost function
    boostButton.addEventListener('click', () => {
        if (score >= 100000 && !isBoostActive) {
            score -= 100000;
            scoreElement.textContent = formatNumber(score);
            localStorage.setItem('score', score);

            isBoostActive = true;
            boostButton.style.backgroundColor = 'red';

            boostInterval = setInterval(() => {
                score += 5;
                scoreElement.textContent = formatNumber(score);
                localStorage.setItem('score', score);
            }, 1);

            setTimeout(() => {
                clearInterval(boostInterval);
                isBoostActive = false;
                boostButton.style.backgroundColor = '#ff5722';
            }, 10000);
        }
    });

    // Promo code function
    promoButton.addEventListener('click', () => {
        const promo = promoInput.value.trim();
        let bonus = 0;
        let skinUrl = null;

        if (["VOKI", "PROMO500", "VokiToken"].includes(promo)) {
            if (usedPromoCodes.includes(promo)) {
                alert("Этот промокод уже был использован!");
                return;
            }
            usedPromoCodes.push(promo);
            localStorage.setItem('usedPromoCodes', JSON.stringify(usedPromoCodes));
        }

        if (promo === "VOKI") {
            bonus = 10000;
        } else if (promo === "BLUM") {
            skinUrl = "https://i.pinimg.com/736x/56/79/39/567939f537288a8ac91acdea1e0a355c.jpg";
        } else if (promo === "PROMO500") {
            bonus = 500;
        } else if (promo === "инструкция") {
            alert("Добро пожаловать в наш кликер! Мы вам сейчас всё расскажем. У вас есть аккаунт. Там можно сменить логин и аватар с помощью кнопок. У нас есть ещё ежедневный шифр. Потом Уровни. Ну, тут и так понятно. Потом, главная часть - сам кликер! Здесь нужно нажимать и зарабатывать очки, чтобы потом их можно было обменивать в VokiToken'ы. 1000000 очков= 1 VokiToken. Есть ещё энергия. Если энергия закончится, то тогда её придётся восполнять иначе, вы не сможете зарабатывать очки. Но есть и коды! Они нужны для многого, например для восполнения очков. Но... Нужно ещё знать что вводить! Также, чтобы вывести очки надо сделать скриншот кликера, скопировать свой адрес Ton Space, зайти в бота @VokiClickerVuvodBot и скинуть адрес и скриншот. Конец инструкции.")
        } else if (promo === "VokiToken") {
            bonus = 1000000;
        } else if (promo === "+79046987198") {
            alert("Ты админ! Вот тебе бонус:")
            bonus = 999999999999;
        }

        if (bonus > 0 || skinUrl) {
            if (bonus > 0) {
                score += bonus;
                scoreElement.textContent = formatNumber(score);
                localStorage.setItem('score', score);
            }
            if (skinUrl) {
                currentSkin = img/hamster.jpg;
                hamster.src = currentSkin;
                localStorage.setItem('currentSkin', currentSkin);
            }
            promoInput.value = "";
            alert(bonus > 0 && skinUrl ? `Промокод активирован! +${bonus} очков и новый скин применён!` : 
                 bonus > 0 ? `Промокод активирован! +${bonus} очков!` : 
                 "Промокод активирован! Новый скин применён!");
            initShop();
        } else {
            alert("Неверный промокод!");
        }
    });

    // Disable boost button if not enough points
    setInterval(() => {
        boostButton.disabled = score < 100000 || isBoostActive;
    }, 1000);

    // Hamster click handler
    hamster.addEventListener('click', (event) => {
        if (checkBanStatus()) return;
        
        if (detectAutoclicker()) return;
        
        if (currentEnergy > 0) {
            const pointsToAdd = 1 * clickMultiplier;
            score += pointsToAdd;
            currentClicks += 1;
            localStorage.setItem('currentClicks', currentClicks);
            currentEnergy--;
            scoreElement.textContent = formatNumber(score);
            updateEnergyDisplay();
            createFloatingScore(event.clientX, event.clientY);
            localStorage.setItem('score', score);
            updateClickProgress();
            initShop();
        }
    });

    // Energy regeneration
    setInterval(() => {
        if (currentEnergy < totalEnergy) {
            currentEnergy++;
            updateEnergyDisplay();
        }
    }, 5000);

    // Passive income
    setInterval(() => {
        score += 2000;
        scoreElement.textContent = formatNumber(score);
        localStorage.setItem('score', score);
        initShop();
    }, 60000);

    // Initialize timers
    startTimer(dailyRewardTimerElement, 750, rewardCallback);
    startTimer(dailyCodeTimerElement, 450, rewardCallback);
    startTimer(comboTimerElement, 30, rewardCallback);

    // Check ban status on load
    if (checkBanStatus()) {
        return;
    }

    // Activate autoclicker if owned
    if (ownedSkins.includes(7)) {
        activateAutoClicker();
    }

    // Initialize profile, shop and progress
    initProfile();
    initShop();
    updateClickProgress();
    updateEnergyDisplay();
    scoreElement.textContent = formatNumber(score);
    hamster.src = currentSkin;
});
