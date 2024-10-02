const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const users = [
    { username: 'jogador1', password: 'senha1' },
    { username: 'jogador2', password: 'senha2' }
];

let connectedPlayers = [];
const deck = ['A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠',
              'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥',
              'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦',
              'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣'];

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    socket.on('login', (data) => {
        const user = users.find(u => u.username === data.username && u.password === data.password);
        if (user && !connectedPlayers.includes(data.username)) {
            connectedPlayers.push(data.username);
            socket.username = data.username;
            socket.emit('loginResult', { success: true });

            if (connectedPlayers.length === 2) {
                startGame();
            }
        } else {
            socket.emit('loginResult', { success: false });
        }
    });

    socket.on('logout', () => {
        if (socket.username) {
            connectedPlayers = connectedPlayers.filter(player => player !== socket.username);
            console.log(`${socket.username} fez logout`);
            socket.username = null;
        }
    });

    socket.on('playCard', (card) => {
        io.emit('cardPlayed', card);
        const otherPlayer = connectedPlayers.find(player => player !== socket.username);
        io.to(otherPlayer).emit('turnChange');

        if (deck.length === 0) {
            io.emit('gameOver', determineWinner());
        }
    });

    socket.on('disconnect', () => {
        connectedPlayers = connectedPlayers.filter(player => player !== socket.username);
        console.log('Um usuário se desconectou');
    });
});

function startGame() {
    shuffleDeck();
    const player1Cards = deck.splice(0, 5);
    const player2Cards = deck.splice(0, 5);

    io.to(connectedPlayers[0]).emit('gameStart', player1Cards);
    io.to(connectedPlayers[1]).emit('gameStart', player2Cards);
}

function determineWinner() {
    // Lógica simplificada para determinar o vencedor
    return connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)];
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
