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

// ✅ Seguridad con Helmet (permitimos encabezado personalizado)
app.use(helmet({
  hidePoweredBy: false,
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// ✅ Encabezado personalizado en todas las respuestas
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP/7.4.3');
  next();
});

// ✅ Evitar almacenamiento en caché
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ✅ Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// ✅ Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// ✅ Página principal
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// ✅ Endpoint de depuración de encabezados
app.get('/debug-headers', (req, res) => {
  res.setHeader('X-Powered-By', 'PHP/7.4.3');
  res.json({ headers: res.getHeaders() });
});

// ✅ Rutas de testing de freeCodeCamp
fccTestingRoutes(app);

// ✅ Middleware 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Configuración de servidor HTTP y socket.io
const portNum = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

// ✅ Estado de jugadores y coleccionables
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
      case 'up': player.y -= MOVE_SPEED; break;
      case 'down': player.y += MOVE_SPEED; break;
      case 'left': player.x -= MOVE_SPEED; break;
      case 'right': player.x += MOVE_SPEED; break;
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    clearInterval(interval);
  });
});

// ✅ Iniciar servidor
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