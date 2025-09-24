import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let players = {};
let collectibles = [];

// Escuchar actualizaciones de estado del juego desde el servidor
socket.on('gameState', (state) => {
  players = state.players;
  collectibles = state.collectibles;
  drawGame();
});

// Función para dibujar todo
function drawGame() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar jugadores
  for (const id in players) {
    const player = players[id];
    context.fillStyle = 'blue'; // o usa player.color si tienes
    context.fillRect(player.x, player.y, 20, 20); // ejemplo: avatar cuadrado 20x20
    context.fillStyle = 'white';
    context.fillText(`Score: ${player.score}`, player.x, player.y - 5);
  }

  // Dibujar coleccionables
  context.fillStyle = 'gold';
  collectibles.forEach(c => {
    context.beginPath();
    context.arc(c.x + 10, c.y + 10, 10, 0, 2 * Math.PI);
    context.fill();
  });
}

// Control de movimiento del jugador por teclado
window.addEventListener('keydown', (e) => {
  let direction;
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      direction = 'right';
      break;
    default:
      return;
  }
  // Enviar movimiento al servidor
  socket.emit('movePlayer', direction);
});
