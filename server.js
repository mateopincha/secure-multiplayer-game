require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Deshabilitar x-powered-by de Express
app.disable('x-powered-by');

// Helmet configuración (sin modificar X-Powered-By)
app.use(helmet({
  contentSecurityPolicy: false, // evitar conflictos para pruebas
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// Middleware para asegurarnos de siempre enviar el header falso (muy arriba para que no se sobrescriba)
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP/7.4.3');
  next();
});

// No cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// Página principal
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// Rutas fCC
fccTestingRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

// Estado de jugadores y collectibles
const players = {};
const collectibles = [
  { id: 'col1', x: 100, y: 100, value: 1, width: 15, height: 15 },
  { id: 'col2', x: 300, y: 200, value: 2, width: 15, height: 15 },
];

const MOVE_SPEED = 5;

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  players[socket.id] = { x: 0, y: 0, score: 0, width: 20, height: 20, id: socket.id };
  socket.emit('init', { id: socket.id, players, collectibles });
  socket.broadcast.emit('playerJoined', { id: socket.id, player: players[socket.id] });

  const interval = setInterval(() => {
    io.emit('gameState', { players, collectibles });
  }, 50);

  socket.on('movePlayer', (direction) => {
    const player = players[socket.id];
    if (!player) return;

    switch (direction) {
      case 'up':
        player.y -= MOVE_SPEED;
        break;
      case 'down':
        player.y += MOVE_SPEED;
        break;
      case 'left':
        player.x -= MOVE_SPEED;
        break;
      case 'right':
        player.x += MOVE_SPEED;
        break;
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    clearInterval(interval);
  });
});

server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app;
