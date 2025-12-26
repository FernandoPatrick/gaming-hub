
const imagens = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg', 'img6.jpg', 'img7.jpg', 'img8.jpg', 'img9.jpg', 'img10.jpg'];
// const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'];

// Define se está usando imagens (true) ou emojis (false)
const usarImagens = true;

const pastaImagens = 'images/';

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let jogadas = 0;
let tempo = 0;
let intervalo;
let podeJogar = true;

function iniciarJogo(dificuldade) {
    let numPares;
    
    if (dificuldade === 'facil') {
        numPares = 3;
    } else if (dificuldade === 'medio') {
        numPares = 6;
    } else {
        numPares = 10;
    }

    document.getElementById('menu').classList.add('hidden');
    document.getElementById('vitoria').classList.add('hidden');
    document.getElementById('btn-voltar').classList.remove('hidden');
    
    const gameBoard = document.getElementById('game-board');
    gameBoard.className = 'game-board ' + dificuldade;
    gameBoard.style.display = 'grid';
    
    criarCartas(numPares);
    resetarJogo();
    iniciarCronometro();
}

function criarCartas(numPares) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    // Escolhe entre imagens ou emojis
    const conteudos = usarImagens ? imagens : emojis;
    const conteudosEscolhidos = conteudos.slice(0, numPares);
    cards = [...conteudosEscolhidos, ...conteudosEscolhidos];
    cards.sort(() => Math.random() - 0.5);
    
    cards.forEach((conteudo, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.conteudo = conteudo;
        
        // Se for imagem, cria tag img com o caminho da pasta, senão usa span com emoji
        if (usarImagens) {
            card.innerHTML = `<img class="card-content" src="${pastaImagens}${conteudo}" alt="Card">`;
        } else {
            card.innerHTML = `<span class="card-content">${conteudo}</span>`;
        }
        
        card.onclick = () => virarCarta(card);
        gameBoard.appendChild(card);
    });
}

function virarCarta(card) {
    if (!podeJogar || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        jogadas++;
        document.getElementById('jogadas').textContent = jogadas;
        podeJogar = false;
        
        setTimeout(verificarPar, 600);
    }
}

function verificarPar() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.conteudo === card2.dataset.conteudo) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        
        if (matchedPairs === cards.length / 2) {
            setTimeout(mostrarVitoria, 500);
        }
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }
    
    flippedCards = [];
    podeJogar = true;
}

function iniciarCronometro() {
    intervalo = setInterval(() => {
        tempo++;
        document.getElementById('tempo').textContent = tempo;
    }, 1000);
}

function resetarJogo() {
    clearInterval(intervalo);
    flippedCards = [];
    matchedPairs = 0;
    jogadas = 0;
    tempo = 0;
    podeJogar = true;
    document.getElementById('tempo').textContent = '0';
    document.getElementById('jogadas').textContent = '0';
}

function mostrarVitoria() {
    clearInterval(intervalo);
    document.getElementById('game-board').style.display = 'none';
    document.getElementById('btn-voltar').classList.add('hidden');
    document.getElementById('vitoria').classList.remove('hidden');
    document.getElementById('tempo-final').textContent = tempo;
    document.getElementById('jogadas-final').textContent = jogadas;
}

function voltarMenu() {
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('game-board').style.display = 'none';
    document.getElementById('btn-voltar').classList.add('hidden');
    document.getElementById('vitoria').classList.add('hidden');
    resetarJogo();
}