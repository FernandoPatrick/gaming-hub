// Configurações do jogo
const emojis = ['💍', '💘', '💐', '🎉', '💑', '💞', '💖'];
const messages = [
    "Fale alguma mensagem para os noivos no microfone! 🎤",
    "Você será padrinho no próximo casamento! 🤵",
    "Sua missão é tirar uma foto com os noivos! 📸",
    "Você é o próximo a se casar! 💒",
    "Você ganhou um abraço dos noivos! 🤗",
    "Bebês a caminho! 👶",
    "Hora de fazer um brinde especial! 🥂",
    "Encontre alguém com a mesma inical do seu nome e tire uma selfie! 📸",
    "Você encontrará o amor! 💘",
    "Faça um story do fornecedor que mais gostou e marque eles no instagram! 🤳",
    "Você vai pegar o buquê! 💐",
    "Missão: contar uma piada para os convidados! 😄",
    "Você ganhou o direito de escolher a próxima música! 🎵",
    "Tire uma selfie com 3 convidados! 🤳",
    "Cante uma música no karaokê! 🎤"
];

// Elementos do DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const gameScreen = document.getElementById('gameScreen');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const spinBtn = document.getElementById('spinBtn');
const returnBtn = document.getElementById('returnBtn');
const resultMessage = document.getElementById('resultMessage');
const historyList = document.getElementById('historyList');
const spinSound = document.getElementById('spinSound');

// Estado do jogo
let isSpinning = false;
let history = [];

// Inicialização
function init() {
    loadHistory();
    displayHistory();
    createSlotItems();
}

// Criar itens nas colunas do slot
function createSlotItems() {
    const slots = document.querySelectorAll('.slot-items');
    
    slots.forEach(slot => {
        slot.innerHTML = '';
        // Criar múltiplas repetições para efeito de rolagem infinita
        for (let i = 0; i < 20; i++) {
            const item = document.createElement('div');
            item.className = 'slot-item';
            item.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            slot.appendChild(item);
        }
    });
}

// Navegação entre telas
startBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    gameScreen.classList.add('active');
});

backBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

returnBtn.addEventListener('click', () => {
    gameScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
    resultMessage.classList.remove('show');
    resultMessage.textContent = '';
});

// Função principal de girar
spinBtn.addEventListener('click', async () => {
    if (isSpinning) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    resultMessage.classList.remove('show');
    resultMessage.textContent = '';
    
    // Tocar som (opcional)
    try {
        spinSound.currentTime = 0;
        spinSound.play().catch(() => {});
    } catch (e) {}
    
    // Animar as colunas
    const columns = document.querySelectorAll('.slot-column');
    
    // Iniciar o giro de todas as colunas ao mesmo tempo
    columns.forEach(col => col.classList.add('spinning'));
    
    // Parar cada coluna em sequência com delay
    await stopColumnSmooth(columns[0], 800);
    await stopColumnSmooth(columns[1], 400);
    await stopColumnSmooth(columns[2], 400);
    
    // Mostrar resultado após todas pararem
    setTimeout(() => {
        showResult();
        isSpinning = false;
        spinBtn.disabled = false;
    }, 200);
});

// Parar uma coluna com animação suave
function stopColumnSmooth(column, delayBeforeStop) {
    return new Promise(resolve => {
        const items = column.querySelector('.slot-items');
        const children = items.children;
        const itemHeight = children[0].offsetHeight;
        
        // Aguardar o delay antes de começar a parar
        setTimeout(() => {
            // Remover classe de spinning para parar o loop infinito
            column.classList.remove('spinning');
            
            // Escolher um emoji aleatório para parar
            const randomIndex = Math.floor(Math.random() * emojis.length);
            const targetEmoji = emojis[randomIndex];
            
            // Encontrar a primeira ocorrência do emoji escolhido
            let targetPosition = 0;
            for (let i = 0; i < children.length; i++) {
                if (children[i].textContent === targetEmoji) {
                    targetPosition = i;
                    break;
                }
            }
            
            // Calcular posição final (centralizar o emoji)
            const finalPosition = -(targetPosition * itemHeight);
            
            // Aplicar transição muito suave para desacelerar e parar
            items.style.transition = 'transform 0.8s cubic-bezier(0.15, 0.65, 0.35, 1)';
            items.style.transform = `translateY(${finalPosition}px)`;
            
            // Aguardar a animação de parada terminar
            setTimeout(() => {
                items.style.transition = '';
                resolve();
            }, 800);
            
        }, delayBeforeStop);
    });
}

// Mostrar resultado
function showResult() {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    resultMessage.textContent = randomMessage;
    resultMessage.classList.add('show');
    
    // Adicionar ao histórico
    addToHistory(randomMessage);
}

// Adicionar ao histórico
function addToHistory(message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const entry = {
        message: message,
        time: timestamp
    };
    
    history.unshift(entry);
    
    // Manter apenas as últimas 5 entradas
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    saveHistory();
    displayHistory();
}

// Salvar histórico no localStorage
function saveHistory() {
    try {
        localStorage.setItem('weddingSlotHistory', JSON.stringify(history));
    } catch (e) {
        console.log('Não foi possível salvar o histórico');
    }
}

// Carregar histórico do localStorage
function loadHistory() {
    try {
        const saved = localStorage.getItem('weddingSlotHistory');
        if (saved) {
            history = JSON.parse(saved);
        }
    } catch (e) {
        console.log('Não foi possível carregar o histórico');
    }
}

// Exibir histórico na tela
function displayHistory() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-item">Nenhuma sorte ainda. Gire para começar!</div>';
        return;
    }
    
    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<strong>${entry.time}</strong> - ${entry.message}`;
        historyList.appendChild(item);
    });
}

// Inicializar o jogo quando a página carregar
init();