// --- Configurações Iniciais ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos da UI
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');
const finalLevelEl = document.getElementById('final-level');
const winScoreEl = document.getElementById('win-score');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen');
const pauseScreen = document.getElementById('pause-screen');

// Botões de Ação do Jogo
document.getElementById('btn-start').addEventListener('click', startNewGame);
document.getElementById('btn-restart').addEventListener('click', startNewGame);
document.getElementById('btn-play-again').addEventListener('click', startNewGame);

// Controles de Pausa
document.getElementById('btn-pause-toggle').addEventListener('click', togglePause);
document.getElementById('btn-resume').addEventListener('click', togglePause);

// Evento de Clique (Mouse PC)
canvas.addEventListener('click', launchBall);

// --- Variáveis do Jogo ---
let animationId;
let score = 0;
let level = 1;
let lives = 2;
let isGameOver = false;
let isPaused = false;
let ballOnPaddle = true; 
const maxLevels = 10;

// Ajusta o tamanho do canvas
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Definições de Objetos
const paddle = {
    width: 100,
    height: 15,
    x: 0,
    y: 0,
    color: '#00d2ff'
};

const ball = {
    x: 0,
    y: 0,
    radius: 8,
    speed: 0,
    dx: 0,
    dy: 0,
    color: '#fff'
};

const brickConfig = {
    rowCount: 5,
    colCount: 5,
    padding: 8,
    offsetTop: 80,
    offsetLeft: 20,
    height: 20,
    colors: ['#ff416c', '#ff4b2b', '#ff9f00', '#00d2ff', '#a8ff78']
};

let bricks = [];

// --- Sistema de Áudio ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    if (type === 'hit') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start();
        oscillator.stop(now + 0.1);
    } else if (type === 'brick') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600 + (level * 20), now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start();
        oscillator.stop(now + 0.1);
    } else if (type === 'win' || type === 'levelup') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        oscillator.start();
        oscillator.stop(now + 0.6);
    } else if (type === 'lose') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(50, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        oscillator.start();
        oscillator.stop(now + 0.3);
    }
}

// --- Funções Lógicas ---

function createBricks() {
    bricks = [];
    const availableWidth = canvas.width - (2 * brickConfig.offsetLeft); 
    const brickWidth = (availableWidth - (brickConfig.padding * (brickConfig.colCount - 1))) / brickConfig.colCount;
    const rows = Math.min(4 + Math.floor(level / 2), 8); 

    for (let c = 0; c < brickConfig.colCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < rows; r++) {
            const brickX = (c * (brickWidth + brickConfig.padding)) + brickConfig.offsetLeft;
            const brickY = (r * (brickConfig.height + brickConfig.padding)) + brickConfig.offsetTop;
            
            bricks[c][r] = { 
                x: brickX, 
                y: brickY, 
                w: brickWidth,
                h: brickConfig.height,
                status: 1, 
                color: brickConfig.colors[r % brickConfig.colors.length] 
            };
        }
    }
    brickConfig.activeRowCount = rows;
}

function updateUI() {
    scoreEl.innerText = score;
    levelEl.innerText = level;
    livesEl.innerText = '❤️'.repeat(Math.max(0, lives));
}

function resetBallAndPaddle() {
    paddle.width = canvas.width * 0.25;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 100;

    ballOnPaddle = true;
    
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    
    const baseSpeed = canvas.width < 400 ? 4 : 5;
    const speedMultiplier = 1 + ((level - 1) * 0.15); 
    ball.speed = baseSpeed * speedMultiplier;
}

function launchBall() {
    // Só lança se o jogo não estiver pausado e não for game over
    if (ballOnPaddle && !isPaused && !isGameOver && !startScreen.classList.contains('active')) {
        ballOnPaddle = false;
        ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -ball.speed;
    }
}

function startNewGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    winScreen.classList.remove('active');
    pauseScreen.classList.remove('active');
    
    score = 0;
    level = 1;
    lives = 2;
    isGameOver = false;
    isPaused = false;
    
    resizeCanvas();
    updateUI();
    createBricks();
    resetBallAndPaddle();
    
    cancelAnimationFrame(animationId);
    update();
}

function nextLevel() {
    if (level >= maxLevels) {
        winGame();
        return;
    }
    level++;
    playSound('levelup');
    isPaused = true;
    setTimeout(() => {
        isPaused = false;
        createBricks();
        resetBallAndPaddle();
        updateUI();
        update();
    }, 1000);
}

function togglePause() {
    if (isGameOver || startScreen.classList.contains('active')) return;

    isPaused = !isPaused;

    if (isPaused) {
        pauseScreen.classList.add('active');
        cancelAnimationFrame(animationId);
    } else {
        pauseScreen.classList.remove('active');
        update();
    }
}

// --- Movimento ---

function movePaddle(clientX) {
    if (isPaused || isGameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const relativeX = (clientX - rect.left) * scaleX;
    
    let paddleX = relativeX - paddle.width / 2;
    
    if (paddleX < 0) paddleX = 0;
    else if (paddleX + paddle.width > canvas.width) paddleX = canvas.width - paddle.width;
    
    paddle.x = paddleX;
}

// Evento de Toque
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Impede arrastar a tela do navegador
    movePaddle(e.touches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    movePaddle(e.touches[0].clientX);
    // Lança a bola ao tocar na tela
    launchBall();
}, { passive: false });

canvas.addEventListener('mousemove', (e) => {
    movePaddle(e.clientX);
});

// --- Desenho e Loop ---

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
}

function drawLaunchInstruction() {
    if (ballOnPaddle) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillText("Toque para Lançar 👆", paddle.x + paddle.width/2, paddle.y - 20);
    }
}

function drawBricks() {
    let activeBricks = 0;
    for (let c = 0; c < brickConfig.colCount; c++) {
        for (let r = 0; r < brickConfig.activeRowCount; r++) {
            if (!bricks[c] || !bricks[c][r]) continue;
            
            const b = bricks[c][r];
            if (b.status === 1) {
                activeBricks++;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, b.w, b.h, 4);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    if (activeBricks === 0 && !isGameOver && !isPaused) {
        cancelAnimationFrame(animationId);
        nextLevel();
    }
}

function update() {
    if (isGameOver || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawLaunchInstruction();
    
    if (ballOnPaddle) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
        animationId = requestAnimationFrame(update);
        return;
    }

    // Colisões
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
        playSound('hit');
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
        playSound('hit');
    } 
    
    // Colisão Paddle
    if (ball.dy > 0 &&
        ball.x > paddle.x - ball.radius &&
        ball.x < paddle.x + paddle.width + ball.radius &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height) {
        
        let collidePoint = ball.x - (paddle.x + paddle.width/2);
        collidePoint = collidePoint / (paddle.width/2);
        let angle = collidePoint * (Math.PI/3);
        
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
        ball.y = paddle.y - ball.radius - 2;
        playSound('hit');
    }
    else if (ball.y + ball.radius > canvas.height) {
        playSound('lose');
        lives--;
        updateUI();
        
        if (lives > 0) {
            resetBallAndPaddle();
        } else {
            gameOver();
            return;
        }
    }

    // Colisão Tijolos
    for (let c = 0; c < brickConfig.colCount; c++) {
        for (let r = 0; r < brickConfig.activeRowCount; r++) {
            if (!bricks[c] || !bricks[c][r]) continue;
            
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x + ball.radius > b.x && ball.x - ball.radius < b.x + b.w && 
                    ball.y + ball.radius > b.y && ball.y - ball.radius < b.y + b.h) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10 * level;
                    updateUI();
                    playSound('brick');
                }
            }
        }
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    animationId = requestAnimationFrame(update);
}

function gameOver() {
    isGameOver = true;
    finalScoreEl.innerText = score;
    finalLevelEl.innerText = level;
    gameOverScreen.classList.add('active');
}

function winGame() {
    isGameOver = true;
    winScoreEl.innerText = score;
    playSound('win');
    winScreen.classList.add('active');
}