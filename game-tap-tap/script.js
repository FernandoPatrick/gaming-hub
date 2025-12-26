let score = 0;
let timeLeft = 30;
let gameInterval;
let spawnInterval;
let cakeInterval;
let hearts = [];
let gameActive = false;
let currentDifficulty = 'medium';
let activeElements = []; // Para rastrear posições dos elementos ativos

// Configurações de dificuldade
const difficulties = {
    easy: {
        heartInterval: 900,      // Corações aparecem mais devagar
        cakeInterval: 3500,      // Bolos aparecem bem menos
        heartDuration: 1500,     // Corações ficam mais tempo na tela
        cakeDuration: 2000       // Bolos ficam mais tempo
    },
    medium: {
        heartInterval: 800,
        cakeInterval: 2000,
        heartDuration: 1200,
        cakeDuration: 1500
    },
    hard: {
        heartInterval: 600,      // Corações aparecem mais rápido
        cakeInterval: 1200,      // Bolos aparecem MUITO mais
        heartDuration: 900,      // Corações somem mais rápido
        cakeDuration: 1200       // Bolos somem mais rápido
    }
};

// Sons (usando Web Audio API para criar efeitos simples)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Função para verificar se uma posição colide com elementos existentes
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

// Função para gerar uma posição válida
function getValidPosition() {
    // Obter dimensões reais dos elementos baseado no CSS
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Tamanho do elemento varia com a tela
    let elementSize = 80;
    if (screenWidth <= 400) {
        elementSize = 70;
    }
    if (screenHeight >= 700) {
        elementSize = 90;
    }
    
    // Margem menor mas segura
    const halfElement = elementSize / 2;
    const margin = halfElement + 20; // metade do elemento + 20px de segurança
    const headerHeight = 80; // Altura do header
    
    const maxX = screenWidth - margin;
    const minX = margin;
    const maxY = screenHeight - margin;
    const minY = headerHeight + margin; // Abaixo do header
    
    // Garantir que temos espaço suficiente para spawnar
    if (maxX <= minX || maxY <= minY) {
        // Tela muito pequena, usar valores seguros no centro
        return {
            x: screenWidth / 2,
            y: screenHeight / 2
        };
    }
    
    let attempts = 0;
    let x, y;
    
    // Tentar até 100 vezes encontrar uma posição válida
    do {
        x = minX + Math.random() * (maxX - minX);
        y = minY + Math.random() * (maxY - minY);
        attempts++;
    } while (!isPositionSafe(x, y, 120) && attempts < 100); // Distância mínima de 120px entre centros
    
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
    // Definir dificuldade
    currentDifficulty = difficulty;
    const config = difficulties[difficulty];
    
    // Resetar variáveis
    score = 0;
    timeLeft = 30;
    hearts = [];
    activeElements = []; // Limpar posições
    gameActive = true;
    
    // Trocar telas
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    // Atualizar displays
    updateScore();
    updateTimer();
    
    // Iniciar timers
    gameInterval = setInterval(() => {
        if (!gameActive) return;
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Spawnar corações (velocidade baseada na dificuldade)
    spawnInterval = setInterval(() => {
        if (!gameActive) return;
        spawnHeart();
    }, config.heartInterval);
    
    // Spawnar bolos (frequência baseada na dificuldade)
    cakeInterval = setInterval(() => {
        if (!gameActive) return;
        spawnCake();
    }, config.cakeInterval);
    
    spawnHeart(); // Spawnar primeiro coração imediatamente
}

function spawnHeart() {
    if (!gameActive) return;
    
    const config = difficulties[currentDifficulty];
    const gameScreen = document.getElementById('gameScreen');
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '💖';
    
    // Obter posição válida (sem colisões)
    const position = getValidPosition();
    
    // Obter tamanho real do elemento
    let elementSize = 80;
    if (window.innerWidth <= 400) elementSize = 70;
    if (window.innerHeight >= 700) elementSize = 90;
    const halfSize = elementSize / 2;
    
    // Centralizar o elemento na posição
    heart.style.left = (position.x - halfSize) + 'px';
    heart.style.top = (position.y - halfSize) + 'px';
    
    // Registrar posição do elemento (centro)
    const elementData = { x: position.x, y: position.y, element: heart };
    activeElements.push(elementData);
    
    // Adicionar evento de clique
    heart.onclick = () => {
        if (!gameActive) return;
        if (!heart.classList.contains('clicked')) {
            heart.classList.add('clicked');
            score++;
            updateScore();
            playTapSound();
            
            // Remover da lista de elementos ativos IMEDIATAMENTE
            const index = activeElements.findIndex(el => el.element === heart);
            if (index > -1) activeElements.splice(index, 1);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 400);
        }
    };
    
    gameScreen.appendChild(heart);
    hearts.push(heart);
    
    // Remover coração após duração baseada na dificuldade
    setTimeout(() => {
        if (heart.parentNode && !heart.classList.contains('clicked')) {
            heart.style.animation = 'fadeIn 0.3s ease-out reverse';
            
            // Remover da lista de elementos ativos
            const index = activeElements.findIndex(el => el.element === heart);
            if (index > -1) activeElements.splice(index, 1);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 300);
        }
    }, config.heartDuration);
}

function spawnCake() {
    if (!gameActive) return;
    
    const config = difficulties[currentDifficulty];
    const gameScreen = document.getElementById('gameScreen');
    const cake = document.createElement('div');
    cake.className = 'cake';
    cake.innerHTML = '🎂';
    
    // Obter posição válida (sem colisões)
    const position = getValidPosition();
    
    // Obter tamanho real do elemento
    let elementSize = 80;
    if (window.innerWidth <= 400) elementSize = 70;
    if (window.innerHeight >= 700) elementSize = 90;
    const halfSize = elementSize / 2;
    
    // Centralizar o elemento na posição
    cake.style.left = (position.x - halfSize) + 'px';
    cake.style.top = (position.y - halfSize) + 'px';
    
    // Registrar posição do elemento (centro)
    const elementData = { x: position.x, y: position.y, element: cake };
    activeElements.push(elementData);
    
    // Adicionar evento de clique - GAME OVER!
    cake.onclick = () => {
        if (!gameActive) return;
        // Remover da lista de elementos ativos ANTES de game over
        const index = activeElements.findIndex(el => el.element === cake);
        if (index > -1) activeElements.splice(index, 1);
        gameOver();
    };
    
    gameScreen.appendChild(cake);
    hearts.push(cake);
    
    // Remover bolo após duração baseada na dificuldade
    setTimeout(() => {
        if (cake.parentNode) {
            cake.style.animation = 'fadeIn 0.3s ease-out reverse';
            
            // Remover da lista de elementos ativos
            const index = activeElements.findIndex(el => el.element === cake);
            if (index > -1) activeElements.splice(index, 1);
            
            setTimeout(() => {
                if (cake.parentNode) {
                    cake.remove();
                }
            }, 300);
        }
    }, config.cakeDuration);
}

function gameOver() {
    gameActive = false;
    playGameOverSound();
    
    // Parar intervals
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    // Atualizar recorde específico da dificuldade
    const recordKey = `weddingGameRecord_${currentDifficulty}`;
    const record = parseInt(localStorage.getItem(recordKey) || '0');
    if (score > record) {
        localStorage.setItem(recordKey, score.toString());
    }
    
    // Mostrar tela de game over
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
    
    // Parar intervals
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    // Remover todos os elementos
    const gameScreen = document.getElementById('gameScreen');
    while (gameScreen.firstChild) {
        gameScreen.removeChild(gameScreen.firstChild);
    }
    
    // Recriar header para próximo jogo
    gameScreen.innerHTML = `
        <div class="game-header">
            <div class="score">❤️ <span id="scoreDisplay">0</span></div>
            <div class="timer">⏱️ <span id="timerDisplay">30</span>s</div>
        </div>
    `;
    
    // Atualizar recorde específico da dificuldade
    const recordKey = `weddingGameRecord_${currentDifficulty}`;
    const record = parseInt(localStorage.getItem(recordKey) || '0');
    if (score > record) {
        localStorage.setItem(recordKey, score.toString());
    }
    
    // Mostrar tela final
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('endScreen').classList.add('active');
    document.getElementById('finalScore').textContent = score + ' pontos';
    
    // Mensagem personalizada
    let message = '';
    if (score >= 50) {
        message = 'Você é um amor de convidado! 💕';
    } else if (score >= 30) {
        message = 'Que performance romântica! 💐';
    } else if (score >= 15) {
        message = 'Você tem um coração de ouro! ✨';
    } else {
        message = 'O amor está no ar! 🌸';
    }
    document.getElementById('messageDisplay').textContent = message;
    
    // Mostrar recorde da dificuldade atual
    const currentRecord = Math.max(score, record);
    document.getElementById('recordDisplay').innerHTML = `🏆 Recorde (${getDifficultyName()}): ${currentRecord} pontos`;
}

function restartGame() {
    document.getElementById('endScreen').classList.remove('active');
    startGame(currentDifficulty); // Jogar novamente com a mesma dificuldade
}

function restartGameFromOver() {
    // Limpar a tela de game over
    const gameScreen = document.getElementById('gameScreen');
    while (gameScreen.firstChild) {
        gameScreen.removeChild(gameScreen.firstChild);
    }
    
    // Recriar header
    gameScreen.innerHTML = `
        <div class="game-header">
            <div class="score">❤️ <span id="scoreDisplay">0</span></div>
            <div class="timer">⏱️ <span id="timerDisplay">30</span>s</div>
        </div>
    `;
    
    // Iniciar novo jogo com a mesma dificuldade
    startGame(currentDifficulty);
}

function goToMenu() {
    // Limpar qualquer resto de jogo
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(cakeInterval);
    
    // Limpar a tela de jogo
    const gameScreen = document.getElementById('gameScreen');
    while (gameScreen.firstChild) {
        gameScreen.removeChild(gameScreen.firstChild);
    }
    
    // Recriar header para próximo jogo
    gameScreen.innerHTML = `
        <div class="game-header">
            <div class="score">❤️ <span id="scoreDisplay">0</span></div>
            <div class="timer">⏱️ <span id="timerDisplay">30</span>s</div>
        </div>
    `;
    
    // Voltar para o menu inicial
    document.getElementById('endScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
}

function getDifficultyName() {
    const names = {
        'easy': 'Fácil',
        'medium': 'Moderado',
        'hard': 'Difícil'
    };
    return names[currentDifficulty] || 'Moderado';
}

// Prevenir scroll em mobile durante o jogo
document.addEventListener('touchmove', (e) => {
    if (document.getElementById('gameScreen').classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });

function exitGame() {
    // Redireciona para o arquivo index.html na pasta anterior (menu principal)
    window.location.href = '../index.html';
}