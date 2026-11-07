const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { getJoke } = require("./cardJokes");

const CARDS_DIR = path.join(__dirname, "..", "public", "assets", "cartas");
const BOARDS_DIR = path.join(__dirname, "..", "public", "assets", "tablas");

// Las cartas se leen de la carpeta; el nombre visible sale del nombre del archivo.
function loadCards() {
  if (!fs.existsSync(CARDS_DIR)) return [];
  return fs
    .readdirSync(CARDS_DIR)
    .filter(file => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((file, index) => {
      // macOS puede devolver los nombres con acentos descompuestos (NFD).
      const name = path
        .parse(file)
        .name.normalize("NFC")
        .replace(/^lotería[-_]MCG[-_]?/i, "")
        .trim();
      return {
        id: String(index + 1),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        image: `/assets/cartas/${encodeURIComponent(file)}`,
      };
    });
}

const cards = loadCards();
let deck = []; // cartas pendientes, ya barajadas
let calledCards = []; // cartas cantadas, en orden

const players = new Map();
const boards = new Map();
let phase = "selection";
const winClaims = []; // ids de jugadores en el orden en que reclamaron ganar

const TOTAL_BOARDS = Number(process.env.TOTAL_BOARDS) || 25;
const boardFiles = new Set(fs.readdirSync(BOARDS_DIR));

for (let i = 1; i <= TOTAL_BOARDS; i++) {
  const id = String(i).padStart(2, "0");
  if (!boardFiles.has(`tabla-${id}.jpg`)) continue;
  boards.set(id, {
    id,
    image: `/assets/tablas/tabla-${id}.jpg`,
    playerId: null,
  });
}

function publicState(viewerPlayerId = null, { isAdmin = false } = {}) {
  const claimOrder = playerId => winClaims.indexOf(playerId) + 1 || null;

  const state = {
    phase,
    players: Array.from(players.values()).map(({ id, username, boardId, markedCells }) => ({
      id,
      username,
      boardId,
      markedCells: id === viewerPlayerId ? [...markedCells] : [],
      winClaimOrder: id === viewerPlayerId || isAdmin ? claimOrder(id) : null,
    })),
    boards: Array.from(boards.values()).map((board) => ({ ...board })),
    calledCards: calledCards.map(card => ({ ...card })),
    currentCard: calledCards.length ? { ...calledCards[calledCards.length - 1] } : null,
    remainingCards: deck.length,
  };

  if (isAdmin) {
    state.winClaims = winClaims.map((playerId, index) => {
      const player = players.get(playerId);
      return {
        order: index + 1,
        playerId,
        username: player.username,
        boardId: player.boardId,
      };
    });
  }

  return state;
}

function addPlayer(username) {
  if (phase !== "selection") {
    throw new Error("La partida ya comenzó. No se pueden agregar jugadores.");
  }

  const normalized = String(username ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized || normalized.length > 24) {
    throw new Error("El nombre debe tener entre 1 y 24 caracteres.");
  }

  const player = {
    id: crypto.randomUUID(),
    username: normalized,
    boardId: null,
    markedCells: [],
  };

  players.set(player.id, player);
  return { ...player };
}

function reserveBoard(playerId, boardId) {
  if (phase !== "selection") {
    throw new Error("La partida ya comenzó. La selección de tablas está bloqueada.");
  }

  const player = players.get(playerId);
  const board = boards.get(String(boardId));

  if (!player) throw new Error("Jugador no válido. Vuelve a entrar.");
  if (!board) throw new Error("La tabla no existe.");
  if (player.boardId) throw new Error("Ya tienes una tabla reservada.");
  if (board.playerId) throw new Error("Esta tabla ya está ocupada.");

  // Esta operación síncrona en el event loop evita reservas duplicadas
  // en una única instancia de Node.js.
  board.playerId = player.id;
  player.boardId = board.id;
  player.markedCells = [];

  return publicState();
}

function setPlayerCellMarked(playerId, cellIndex, marked) {
  if (phase !== "playing") throw new Error("La partida todavía no ha comenzado.");

  const player = players.get(playerId);
  if (!player) throw new Error("Jugador no válido. Vuelve a entrar.");
  if (!player.boardId) throw new Error("No tienes una tabla asignada.");
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= 16) {
    throw new Error("La casilla seleccionada no es válida.");
  }
  if (typeof marked !== "boolean") {
    throw new Error("El estado de selección no es válido.");
  }

  const markedCells = new Set(player.markedCells);
  if (marked) markedCells.add(cellIndex);
  else markedCells.delete(cellIndex);
  player.markedCells = [...markedCells].sort((a, b) => a - b);

  return publicState();
}

function setPlayerWinClaim(playerId, claimed) {
  if (phase !== "playing") throw new Error("La partida todavía no ha comenzado.");

  const player = players.get(playerId);
  if (!player) throw new Error("Jugador no válido. Vuelve a entrar.");
  if (!player.boardId) throw new Error("No tienes una tabla asignada.");
  if (typeof claimed !== "boolean") throw new Error("El estado de victoria no es válido.");

  const index = winClaims.indexOf(playerId);
  if (claimed && index === -1) winClaims.push(playerId);
  else if (!claimed && index !== -1) winClaims.splice(index, 1);
}

function releasePlayerBoard(playerId) {
  if (phase !== "selection") {
    throw new Error("La partida ya comenzó. No se pueden cambiar las tablas.");
  }

  const player = players.get(playerId);
  if (!player) throw new Error("Jugador no válido. Vuelve a entrar.");
  if (!player.boardId) throw new Error("No tienes una tabla seleccionada.");

  const board = boards.get(player.boardId);
  if (board?.playerId === player.id) board.playerId = null;
  player.boardId = null;

  return publicState();
}

function releaseBoard(boardId) {
  if (phase !== "selection") {
    throw new Error("La partida ya comenzó. Reinicia la partida para cambiar las tablas.");
  }

  const board = boards.get(String(boardId));
  if (!board) throw new Error("La tabla no existe.");

  if (board.playerId) {
    const player = players.get(board.playerId);
    if (player) player.boardId = null;
    board.playerId = null;
  }

  return publicState();
}

function startGame() {
  if (phase !== "selection") throw new Error("La partida ya está en curso.");
  if (![...players.values()].some(player => player.boardId)) {
    throw new Error("Al menos un jugador debe seleccionar una tabla antes de iniciar.");
  }

  phase = "playing";
  calledCards = [];
  deck = [...cards];
  // Fisher-Yates con aleatoriedad criptográfica.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return publicState();
}

function drawCard() {
  if (phase !== "playing") throw new Error("La partida todavía no ha comenzado.");
  if (!deck.length) throw new Error("Ya se cantaron todas las cartas.");

  const card = deck.pop();
  calledCards.push({ ...card, joke: getJoke(card.name) });
  return publicState();
}

function resetGame() {
  deck = [];
  calledCards = [];
  winClaims.length = 0;
  for (const board of boards.values()) board.playerId = null;
  for (const player of players.values()) {
    player.boardId = null;
    player.markedCells = [];
  }
  phase = "selection";
  return publicState();
}

function removePlayer(playerId) {
  if (phase !== "selection") {
    throw new Error("No se pueden eliminar jugadores durante la partida.");
  }

  const player = players.get(playerId);
  if (!player) throw new Error("El jugador no existe.");

  if (player.boardId) {
    const board = boards.get(player.boardId);
    if (board) board.playerId = null;
  }

  const claimIndex = winClaims.indexOf(playerId);
  if (claimIndex !== -1) winClaims.splice(claimIndex, 1);

  players.delete(playerId);
  return publicState();
}

function getPlayer(playerId) {
  return players.get(playerId);
}

function setPlayerSocket(playerId, socketId) {
  const player = players.get(playerId);
  if (player) player.socketId = socketId;
}

function getPlayerBySocket(socketId) {
  return Array.from(players.values()).find((p) => p.socketId === socketId);
}

function removePlayerBySocket(socketId) {
  const player = getPlayerBySocket(socketId);
  if (!player) return publicState();
  return removePlayer(player.id);
}

module.exports = {
  publicState,
  addPlayer,
  reserveBoard,
  setPlayerCellMarked,
  setPlayerWinClaim,
  releasePlayerBoard,
  releaseBoard,
  startGame,
  drawCard,
  resetGame,
  removePlayer,
  getPlayer,
  setPlayerSocket,
  getPlayerBySocket,
  removePlayerBySocket,
};
