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

// Helmet con configuración personalizada para seguridad
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter()); // Protección contra XSS

// No cache en cliente
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Encabezado falso para simular PHP
app.use((req, res, next) => {
  res.set('X-Powered-By', 'PHP/7.4.3');
  next();
});

// Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// Página principal
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// Rutas de test de freeCodeCamp
fccTestingRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

// Estado de jugadores
const players = {};

// Ejemplo mínimo de collectibles
const collectibles = [
  { id: 'col1', x: 100, y: 100, value: 1, width: 15, height: 15 },
  { id: 'col2', x: 300, y: 200, value: 2, width: 15, height: 15 },
];

// Velocidad de movimiento por paso
const MOVE_SPEED = 5;

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  // Inicializar jugador
  players[socket.id] = { x: 0, y: 0, score: 0, width: 20, height: 20, id: socket.id };

  // Enviar init al jugador nuevo (puede usar para inicializar localmente)
  socket.emit('init', { id: socket.id, players, collectibles });

  // Informar a otros que un jugador se unió
  socket.broadcast.emit('playerJoined', { id: socket.id, player: players[socket.id] });

  // Intervalo para enviar estado completo (jugadores + collectibles) cada 50ms
  const interval = setInterval(() => {
    io.emit('gameState', { players, collectibles });
  }, 50);

  // Mover jugador según dirección
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

    // Aquí podrías agregar detección de colisiones con collectibles y actualización de puntuación
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
