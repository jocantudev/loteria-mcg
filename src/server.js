require("dotenv").config();

const express = require("express");
const http = require("node:http");
const crypto = require("node:crypto");
const { Server } = require("socket.io");
const game = require("./gameState");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD || ADMIN_PASSWORD === "cambia-esta-clave-por-una-segura") {
  console.warn("AVISO: configura una contraseña administrativa fuerte en .env antes de publicar.");
}

const adminSessions = new Map(); // token -> expiración (ms)
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const CALL_INTERVAL_MS = Math.max(2000, Number(process.env.CALL_INTERVAL_MS) || 6000);
let autoCallTimer = null;

app.use(express.static("public"));

function cleanExpiredAdminSessions() {
  const now = Date.now();
  for (const [token, expiresAt] of adminSessions) {
    if (expiresAt <= now) adminSessions.delete(token);
  }
}

function broadcastState() {
  for (const connectedSocket of io.sockets.sockets.values()) {
    connectedSocket.emit("state:update", stateFor(connectedSocket));
  }
}

function stateFor(socket) {
  return {
    ...game.publicState(socket.data.playerId, { isAdmin: socket.data.isAdmin }),
    autoCalling: autoCallTimer !== null,
  };
}

function stopAutoCall() {
  if (autoCallTimer) clearInterval(autoCallTimer);
  autoCallTimer = null;
}

io.use((socket, next) => {
  cleanExpiredAdminSessions();
  const token = socket.handshake.auth?.adminToken;
  const expiresAt = typeof token === "string" ? adminSessions.get(token) : null;
  socket.data.isAdmin = Boolean(expiresAt && expiresAt > Date.now());
  next();
});

io.on("connection", socket => {
  socket.emit("state:update", stateFor(socket));

  socket.on("player:join", (payload, callback) => {
    try {
      const username = typeof payload === "string" ? payload : payload?.username;
      const player = game.addPlayer(username);
      game.setPlayerSocket(player.id, socket.id);
      socket.data.playerId = player.id;

      callback?.({ ok: true, player: { id: player.id, username: player.username } });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("player:resume", (playerId, callback) => {
    const player = typeof playerId === "string" ? game.getPlayer(playerId) : null;
    if (!player) {
      callback?.({ ok: false, error: "La sesión del jugador ya no está disponible." });
      return;
    }

    game.setPlayerSocket(player.id, socket.id);
    socket.data.playerId = player.id;
    callback?.({ ok: true, player: { id: player.id, username: player.username } });
    socket.emit("state:update", stateFor(socket));
  });

  socket.on("board:reserve", (boardId, callback) => {
    try {
      if (!socket.data.playerId) throw new Error("Primero debes introducir tu nombre.");
      game.reserveBoard(socket.data.playerId, boardId);
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
      socket.emit("state:update", stateFor(socket));
    }
  });

  socket.on("board:release", callback => {
    try {
      if (!socket.data.playerId) throw new Error("Primero debes introducir tu nombre.");
      game.releasePlayerBoard(socket.data.playerId);
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("game:mark-cell", (payload, callback) => {
    try {
      if (!socket.data.playerId) throw new Error("Primero debes introducir tu nombre.");
      game.setPlayerCellMarked(
        socket.data.playerId,
        payload?.cellIndex,
        payload?.marked
      );
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("game:claim-win", (claimed, callback) => {
    try {
      if (!socket.data.playerId) throw new Error("Primero debes introducir tu nombre.");
      game.setPlayerWinClaim(socket.data.playerId, claimed);
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("admin:start-game", callback => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }

    try {
      game.startGame();
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("admin:draw-card", callback => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }

    try {
      game.drawCard();
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("admin:auto-call", (enabled, callback) => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }

    stopAutoCall();
    if (enabled === true) {
      try {
        game.drawCard();
      } catch (error) {
        callback?.({ ok: false, error: error.message });
        return;
      }
      autoCallTimer = setInterval(() => {
        try {
          game.drawCard();
        } catch {
          stopAutoCall();
        }
        broadcastState();
      }, CALL_INTERVAL_MS);
    }
    callback?.({ ok: true });
    broadcastState();
  });

  socket.on("admin:login", (password, callback) => {
    if (!ADMIN_PASSWORD || typeof password !== "string" || password !== ADMIN_PASSWORD) {
      callback?.({ ok: false, error: "Contraseña incorrecta o no configurada." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.set(token, Date.now() + ADMIN_SESSION_MS);
    callback?.({ ok: true, token });
  });

  socket.on("admin:release", (boardId, callback) => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }

    try {
      game.releaseBoard(boardId);
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("admin:reset", callback => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }
    stopAutoCall();
    game.resetGame();
    callback?.({ ok: true });
    broadcastState();
  });

  socket.on("admin:remove-player", (playerId, callback) => {
    if (!socket.data.isAdmin) {
      callback?.({ ok: false, error: "No autorizado. Inicia sesión nuevamente." });
      return;
    }

    try {
      game.removePlayer(playerId);
      callback?.({ ok: true });
      broadcastState();
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    // Se conservan jugadores y reservas al desconectarse.
    // Sin base de datos, el estado existe solo hasta reiniciar el servidor.
  });
});

server.listen(PORT, () => {
  console.log(`Lotería disponible en http://localhost:${PORT}`);
  console.log(`Administración: http://localhost:${PORT}/admin.html`);
});
