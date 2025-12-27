let score = 0;
let timeLeft = 30;
let gameInterval;
let spawnInterval;
let cakeInterval;
let hearts = [];
let gameActive = false;
let isPaused = false;
let currentDifficulty = 'medium';
let activeElements = []; 

// Configurações de dificuldade
const difficulties = {
    easy: {
        heartInterval: 900,
        cakeInterval: 3500,
        heartDuration: 1500,
        cakeDuration: 2000
    },
    medium: {
        heartInterval: 800,
        cakeInterval: 2000,
        heartDuration: 1200,
        cakeDuration: 1500
    },
    hard: {
        heartInterval: 600,
        cakeInterval: 1200,
        heartDuration: 900,
        cakeDuration: 1200
    }
};

// Sons
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function isPositionSafe(x, y, minDistance = 120) {
    for (let element of activeElements) {
        const distance = Math.sqrt(
            Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        );
        if (distance < minDistance) {
            return false;
        }
    }
    return true;
}

function getValidPosition() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let elementSize = 80;
    if (screenWidth <= 400) elementSize = 70;
    if (screenHeight >= 700) elementSize = 90;
    
    const halfElement = elementSize / 2;
    const margin = halfElement + 20;
    const headerHeight = 80; 
    
    const maxX = screenWidth - margin;
    const minX = margin;
    const maxY = screenHeight - margin;
    const minY = headerHeight + margin; 
    
    if (maxX <= minX || maxY <= minY) {
        return { x: screenWidth / 2, y: screenHeight / 2 };
    }
    
    let attempts = 0;
    let x, y;
    
    do {
        x = minX + Math.random() * (maxX - minX);
        y = minY + Math.random() * (maxY - minY);
        attempts++;
    } while (!isPositionSafe(x, y, 120) && attempts < 100); 
    
    return { x, y };
}

function playTapSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function startGame(difficulty = 'medium') {
    currentDifficulty = difficulty;
    
    score = 0;
    timeLeft = 30;
    hearts = [];
    activeElements = [];
    gameActive = true;
    isPaused = false;
    
    // UI Reset
    document.getElementById('pauseModal').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('elements-paused');
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    // Limpar elementos antigos se houver (sem apagar o header)
    clearGameElements();
    
    updateScore();
    updateTimer();
    
    startIntervals();
    spawnHeart(); 
}

function startIntervals() {
    const config = difficulties[currentDifficulty];

    // Timer do Jogo
    gameInterval = setInterval(() => {
        if (!gameActive || isPaused) return;
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Spawnar corações
    spawnInterval = setInterval(() => {
        if (!gameActive || isPaused) return;
        spawnHeart();
    }, config.heartInterval);
    
    // Spawnar bolos
    cakeInterval = setInterval(() => {
        if (!gameActive || isPaused) return;
        spawnCake();
    }, config.cakeInterval);
}

function togglePause() {
    if (!gameActive) return;

    const pauseModal = document.getElementById('pauseModal');
    const gameScreen = document.getElementById('gameScreen');

    if (isPaused) {
        // --- RETOMAR ---
        isPaused = false;
        pauseModal.classList.add('hidden');
        gameScreen.classList.remove('elements-paused'); 
        startIntervals();
    } else {
        // --- PAUSAR ---
        isPaused = true;
        pauseModal.classList.remove('hidden');
        gameScreen.classList.add('elements-paused'); 
        
        clearInterval(gameInterval);
        clearInterval(spawnInterval);
        clearInterval(cakeInterval);
    }
}

function clearGameElements() {
    const gameScreen = document.getElementById('gameScreen');
    const dynamicElements = gameScreen.querySelectorAll('.heart, .cake, .game-over');
    dynamicElements.forEach(el => el.remove());
}

function spawnHeart() {
    if (!gameActive || isPaused) return;
    
    const config = difficulties[currentDifficulty];
    const gameScreen = document.getElementById('gameScreen');
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '💖';
    
    const position = getValidPosition();
    
    let elementSize = 80;
    if (window.innerWidth <= 400) elementSize = 70;
    if (window.innerHeight >= 700) elementSize = 90;
    const halfSize = elementSize / 2;
    
    heart.style.left = (position.x - halfSize) + 'px';
    heart.style.top = (position.y - halfSize) + 'px';
    
    const elementData = { x: position.x, y: position.y, element: heart };
    activeElements.push(elementData);
    
    heart.onclick = () => {
        if (!gameActive || isPaused) return;
        if (!heart.classList.contains('clicked')) {
            heart.classList.add('clicked');
            score++;
            updateScore();
            playTapSound();
            
            const index = activeElements.findIndex(el => el.element === heart);
            if (index > -1) activeElements.splice(index, 1);
            
            setTimeout(() => {
                if (heart.parentNode) heart.remove();
            }, 400);
        }
    };
    
    gameScreen.appendChild(heart);
    hearts.push(heart);
    
    setTimeout(() => {
        if (!gameActive || isPaused) return; // Se pausar, não remove (CSS cuida)
        
        if (heart.parentNode && !heart.classList.contains('clicked')) {
            // Verifica se está pausado antes de remover no final da animação
            const checkPauseInterval = setInterval(() => {
                if(!isPaused) {
                    clearInterval(checkPauseInterval);
                    if (heart.parentNode) {
                        heart.style.animation = 'fadeIn 0.3s ease-out reverse';
                        const index = activeElements.findIndex(el => el.element === heart);
                        if (index > -1) activeElements.splice(index, 1);
                        setTimeout(() => { if (heart.parentNode) heart.remove(); }, 300);
                    }
                }
            }, 100);
        }
    }, config.heartDuration);
}

function spawnCake() {
    if (!gameActive || isPaused) return;
    
    const config = difficulties[currentDifficulty];
    const gameScreen = document.getElementById('gameScreen');
    const cake = document.createElement('div');
    cake.className = 'cake';
    cake.innerHTML = '🎂';
    
    const position = getValidPosition();
    
    let elementSize = 80;
    if (window.innerWidth <= 400) elementSize = 70;
    if (window.innerHeight >= 700) elementSize = 90;
    const halfSize = elementSize / 2;
    
    cake.style.left = (position.x - halfSize) + 'px';
    cake.style.top = (position.y - halfSize) + 'px';
    
    const elementData = { x: position.x, y: position.y, element: cake };
    activeElements.push(elementData);
    
    cake.onclick = () => {
        if (!gameActive || isPaused) return;
        const index = activeElements.findIndex(el => el.element === cake);
        if (index > -1) activeElements.splice(index, 1);
        gameOver();
    };
    
    gameScreen.appendChild(cake);
    hearts.push(cake);
    
    setTimeout(() => {
        if (!gameActive || isPaused) return;
        
        if (cake.parentNode) {
             const checkPauseInterval = setInterval(() => {
                if(!isPaused) {
                    clearInterval(checkPauseInterval);
                    if (cake.parentNode) {
                        cake.style.animation = 'fadeIn 0.3s ease-out reverse';
                        const index = activeElements.findIndex(el => el.element === cake);
                        if (index > -1) activeElements.splice(index, 1);
                        setTimeout(() => { if (cake.parentNode) cake.remove(); }, 300);
                    }
                }
             }, 100);
        }
    }, config.cakeDuration);
}

function gameOver() {
    gameActive = false;
    playGameOverSound();
    
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    const recordKey = `weddingGameRecord_${currentDifficulty}`;
    const record = parseInt(localStorage.getItem(recordKey) || '0');
    if (score > record) {
        localStorage.setItem(recordKey, score.toString());
    }
    
    const gameScreen = document.getElementById('gameScreen');
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>Oh não! 😱</h2>
        <div style="font-size: 5em;">🎂</div>
        <p>Você tocou no bolo!</p>
        <p style="font-size: 2em; font-weight: 600; margin: 20px 0;">Pontuação: ${score}</p>
        <div style="background: rgba(255, 255, 255, 0.2); padding: 12px 20px; border-radius: 15px; margin-bottom: 25px;">
            <p style="font-size: 1em; margin: 0;">🏆 Recorde (${getDifficultyName()}): ${Math.max(score, record)}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px;">
            <button onclick="restartGameFromOver()" style="margin: 0;">Jogar Novamente</button>
            <button onclick="goToMenu()" style="margin: 0; background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%);">Voltar ao Menu</button>
        </div>
    `;
    
    gameScreen.appendChild(gameOverDiv);
}

function updateScore() {
    document.getElementById('scoreDisplay').textContent = score;
}

function updateTimer() {
    document.getElementById('timerDisplay').textContent = timeLeft;
}

function endGame() {
    gameActive = false;
    
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    clearGameElements();
    
    const recordKey = `weddingGameRecord_${currentDifficulty}`;
    const record = parseInt(localStorage.getItem(recordKey) || '0');
    if (score > record) {
        localStorage.setItem(recordKey, score.toString());
    }
    
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('endScreen').classList.add('active');
    document.getElementById('finalScore').textContent = score + ' pontos';
    
    let message = '';
    if (score >= 50) message = 'Você é um amor de convidado! 💕';
    else if (score >= 30) message = 'Que performance romântica! 💐';
    else if (score >= 15) message = 'Você tem um coração de ouro! ✨';
    else message = 'O amor está no ar! 🌸';
    
    document.getElementById('messageDisplay').textContent = message;
    
    const currentRecord = Math.max(score, record);
    document.getElementById('recordDisplay').innerHTML = `🏆 Recorde (${getDifficultyName()}): ${currentRecord} pontos`;
}

function restartGame() {
    document.getElementById('endScreen').classList.remove('active');
    startGame(currentDifficulty);
}

function restartGameFromOver() {
    clearGameElements();
    startGame(currentDifficulty);
}

function goToMenu() {
    gameActive = false;
    isPaused = false;
    
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    document.getElementById('pauseModal').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('elements-paused');

    clearGameElements();
    
    document.getElementById('endScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
}

function getDifficultyName() {
    const names = { 'easy': 'Fácil', 'medium': 'Moderado', 'hard': 'Difícil' };
    return names[currentDifficulty] || 'Moderado';
}

document.addEventListener('touchmove', (e) => {
    if (document.getElementById('gameScreen').classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });

function exitGame() {
    window.location.href = '../index.html';
}