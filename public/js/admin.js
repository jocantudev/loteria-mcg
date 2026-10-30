let socket = io();
let adminToken = null;
let currentState = { players: [], boards: [] };

const loginSection = document.querySelector("#login-section");
const adminSection = document.querySelector("#admin-section");
const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#password");
const playersContainer = document.querySelector("#players");
const boardsContainer = document.querySelector("#boards");
const resetButton = document.querySelector("#reset-button");
const startButton = document.querySelector("#start-button");
const gameStatus = document.querySelector("#game-status");
const callerSection = document.querySelector("#caller-section");
const drawButton = document.querySelector("#draw-button");
const autoButton = document.querySelector("#auto-button");
const callerStatus = document.querySelector("#caller-status");
const currentCardBox = document.querySelector("#current-card");
const calledCardsList = document.querySelector("#called-cards");
const voiceToggle = document.querySelector("#voice-toggle");
const currentJoke = document.querySelector("#current-joke");

let spokenCount = null; // evita repetir en voz alta cartas ya cantadas al recargar

function pickSpanishVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find(voice => voice.lang.toLowerCase().startsWith("es-mx")) ||
    voices.find(voice => voice.lang.toLowerCase().startsWith("es")) ||
    null
  );
}

function speakCard(card) {
  if (!("speechSynthesis" in window) || !voiceToggle.checked) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${card.name}. ${card.joke}`);
  utterance.lang = "es-MX";
  const voice = pickSpanishVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

voiceToggle.addEventListener("change", () => {
  if (!voiceToggle.checked) window.speechSynthesis?.cancel();
});
const winClaimsList = document.querySelector("#win-claims");
const noWinClaims = document.querySelector("#no-win-claims");
const message = document.querySelector("#message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function attachStateListeners(activeSocket) {
  activeSocket.on("connect", () => showMessage("Conectado al servidor."));
  activeSocket.on("connect_error", () => showMessage("Error de conexión.", true));
  activeSocket.on("state:update", state => {
    currentState = state;
    render();
  });
}

attachStateListeners(socket);

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  socket.emit("admin:login", passwordInput.value, result => {
    if (!result?.ok) {
      showMessage(result?.error || "No se pudo iniciar sesión.", true);
      return;
    }

    adminToken = result.token;
    socket.disconnect();

    socket = io({ auth: { adminToken } });
    attachStateListeners(socket);

    loginSection.hidden = true;
    adminSection.hidden = false;
    passwordInput.value = "";
    showMessage("Sesión administrativa iniciada.");
  });
});

function adminAction(eventName, ...args) {
  socket.emit(eventName, ...args, result => {
    showMessage(
      result?.ok ? "Operación completada." :
      result?.error || "La operación falló.",
      !result?.ok
    );
  });
}

resetButton.addEventListener("click", () => {
  if (confirm("¿Reiniciar la partida y liberar todas las tablas? Los jugadores permanecerán en la lista.")) {
    adminAction("admin:reset");
  }
});

startButton.addEventListener("click", () => {
  if (confirm("¿Iniciar la partida? La selección de tablas quedará bloqueada.")) {
    adminAction("admin:start-game");
  }
});

drawButton.addEventListener("click", () => adminAction("admin:draw-card"));
autoButton.addEventListener("click", () => {
  adminAction("admin:auto-call", !currentState.autoCalling);
});

function renderCaller() {
  const started = currentState.phase === "playing";
  callerSection.hidden = !started;
  if (!started) return;

  const remaining = currentState.remainingCards ?? 0;
  const called = currentState.calledCards || [];
  if (spokenCount === null) spokenCount = called.length;
  if (called.length > spokenCount && currentState.currentCard) {
    speakCard(currentState.currentCard);
  }
  spokenCount = called.length;
  currentJoke.textContent = currentState.currentCard?.joke || "";
  drawButton.disabled = remaining === 0 || Boolean(currentState.autoCalling);
  autoButton.disabled = remaining === 0 && !currentState.autoCalling;
  autoButton.textContent = currentState.autoCalling
    ? "Detener canto automático"
    : "Iniciar canto automático";
  callerStatus.textContent = remaining === 0
    ? "Se cantaron todas las cartas."
    : `Cartas cantadas: ${called.length} · Restantes: ${remaining}`;

  currentCardBox.replaceChildren();
  if (currentState.currentCard) {
    const image = document.createElement("img");
    image.src = currentState.currentCard.image;
    image.alt = currentState.currentCard.name;
    const name = document.createElement("strong");
    name.textContent = currentState.currentCard.name;
    currentCardBox.append(image, name);
  }

  calledCardsList.replaceChildren(...called.map(card => {
    const item = document.createElement("li");
    item.textContent = card.name;
    return item;
  }));
}

function render() {
  renderCaller();
  const gameStarted = currentState.phase === "playing";
  startButton.disabled = gameStarted;
  startButton.textContent = gameStarted ? "Partida en curso" : "Iniciar partida";
  resetButton.textContent = gameStarted
    ? "Reiniciar partida y liberar tablas"
    : "Liberar todas las tablas";
  gameStatus.textContent = gameStarted
    ? "Partida en curso. La selección de tablas está bloqueada."
    : "Selección de tablas abierta.";

  const winClaims = currentState.winClaims || [];
  noWinClaims.hidden = winClaims.length > 0;
  winClaimsList.replaceChildren(...winClaims.map(claim => {
    const item = document.createElement("li");
    item.textContent = `${claim.username} — Tabla ${claim.boardId}`;
    return item;
  }));

  playersContainer.replaceChildren();
  boardsContainer.replaceChildren();

  for (const player of currentState.players) {
    const row = document.createElement("div");
    row.className = "player-row";

    const label = document.createElement("span");
    label.textContent = `${player.username} — ${
      player.boardId ? `Tabla ${player.boardId}` : "Sin tabla"
    }${player.winClaimOrder ? ` — ¡Ganó! (#${player.winClaimOrder})` : ""}`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Eliminar jugador";
    removeButton.className = "danger";
    removeButton.disabled = gameStarted;
    removeButton.addEventListener("click", () => {
      if (confirm(`¿Eliminar a ${player.username} y liberar su tabla?`)) {
        adminAction("admin:remove-player", player.id);
      }
    });

    row.append(label, removeButton);
    playersContainer.append(row);
  }

  for (const board of currentState.boards) {
    const owner = currentState.players.find(player => player.id === board.playerId);
    const card = document.createElement("article");
    card.className = `board-card${owner ? " occupied" : ""}`;

    const title = document.createElement("h3");
    title.textContent = `Tabla ${board.id}`;

    const status = document.createElement("p");
    status.textContent = owner ? `Reservada por ${owner.username}` : "Disponible";

    const releaseButton = document.createElement("button");
    releaseButton.textContent = "Liberar tabla";
    releaseButton.disabled = !owner || gameStarted;
    releaseButton.addEventListener("click", () => {
      adminAction("admin:release", board.id);
    });

    card.append(title, status, releaseButton);
    boardsContainer.append(card);
  }
}
