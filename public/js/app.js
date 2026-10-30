const socket = io();

const joinSection = document.querySelector("#join-section");
const joinForm = document.querySelector("#join-form");
const usernameInput = document.querySelector("#username");
const gameSection = document.querySelector("#game-section");
const selectionView = document.querySelector("#selection-view");
const playingView = document.querySelector("#playing-view");
const boardsContainer = document.querySelector("#boards");
const playerStatus = document.querySelector("#player-status");
const playingStatus = document.querySelector("#playing-status");
const playerBoard = document.querySelector("#player-board");
const playerCaller = document.querySelector("#player-caller");
const winButton = document.querySelector("#win-button");
const winStatus = document.querySelector("#win-status");
const message = document.querySelector("#message");

let playerId = sessionStorage.getItem("loteriaPlayerId");
let currentState = { players: [], boards: [] };
let joined = false;
let resumePending = Boolean(playerId);

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

socket.on("connect", () => {
  if (!playerId) {
    showMessage("Conectado al servidor.");
    return;
  }

  resumePending = true;
  showMessage("Recuperando tu sesión...");
  socket.emit("player:resume", playerId, result => {
    resumePending = false;
    if (!result?.ok) {
      sessionStorage.removeItem("loteriaPlayerId");
      playerId = null;
      showMessage(result?.error || "No se pudo recuperar tu sesión. Vuelve a entrar.", true);
      return;
    }

    joined = true;
    joinSection.hidden = true;
    gameSection.hidden = false;
    showMessage(`Bienvenido de nuevo, ${result.player.username}.`);
    renderBoards();
  });
});
socket.on("connect_error", () => showMessage("No se pudo conectar al servidor.", true));

joinForm.addEventListener("submit", event => {
  event.preventDefault();
  if (resumePending) {
    showMessage("Recuperando tu sesión. Espera un momento.", true);
    return;
  }
  if (!socket.connected) {
    showMessage("Conectando al servidor. Intenta nuevamente en un momento.", true);
    return;
  }

  if (currentState.phase === "playing") {
    showMessage("La partida ya comenzó. No se pueden agregar jugadores.", true);
    return;
  }

  socket.emit("player:join", usernameInput.value, result => {
    if (!result?.ok) {
      showMessage(result?.error || "No se pudo entrar.", true);
      return;
    }

    playerId = result.player.id;
    sessionStorage.setItem("loteriaPlayerId", playerId);
    joined = true;
    joinSection.hidden = true;
    gameSection.hidden = false;
    showMessage(`Bienvenido, ${result.player.username}.`);
    renderBoards();
  });
});

winButton.addEventListener("click", () => {
  const me = currentState.players.find(player => player.id === playerId);
  socket.emit("game:claim-win", !me?.winClaimOrder, result => {
    if (!result?.ok) showMessage(result?.error || "No se pudo registrar tu aviso.", true);
  });
});

socket.on("state:update", state => {
  currentState = state;
  renderBoards();
});

function renderBoards() {
  if (!joined) return;

  const me = currentState.players.find(player => player.id === playerId);
  if (currentState.phase === "playing") {
    selectionView.hidden = true;
    playingView.hidden = false;
    boardsContainer.replaceChildren();
    playerBoard.replaceChildren();
    playerBoard.classList.remove("image-missing");

    playerCaller.replaceChildren();
    if (currentState.currentCard) {
      const label = document.createElement("span");
      label.textContent = "Carta cantada:";
      const image = document.createElement("img");
      image.src = currentState.currentCard.image;
      image.alt = currentState.currentCard.name;
      const name = document.createElement("strong");
      name.textContent = currentState.currentCard.name;
      playerCaller.append(label, image, name);
    }

    const hasClaimed = Boolean(me?.winClaimOrder);
    winButton.parentElement.hidden = !me?.boardId;
    winButton.textContent = hasClaimed ? "Cancelar aviso de victoria" : "¡Lotería! Ya gané";
    winButton.classList.toggle("danger", hasClaimed);
    winStatus.textContent = hasClaimed
      ? "Avisaste al administrador que ganaste. Espera su confirmación."
      : "";

    if (!me?.boardId) {
      playingStatus.textContent = "La partida comenzó, pero no tienes una tabla asignada. Contacta al administrador.";
      return;
    }

    const board = currentState.boards.find(item => item.id === me.boardId);
    playingStatus.textContent = `Juega con la tabla ${me.boardId}.`;
    if (board) {
      const image = document.createElement("img");
      image.src = board.image;
      image.alt = `Tu tabla de lotería, número ${board.id}`;
      image.loading = "eager";
      image.onerror = () => {
        image.hidden = true;
        playerBoard.classList.add("image-missing");
        showMessage(`No se pudo cargar la imagen de tu tabla ${board.id}.`, true);
      };

      const cells = document.createElement("div");
      cells.className = "player-board-grid";
      cells.setAttribute("role", "group");
      cells.setAttribute("aria-label", `Casillas de la tabla ${board.id}`);

      const markedCells = new Set(me.markedCells || []);
      for (let cellIndex = 0; cellIndex < 16; cellIndex++) {
        const cell = document.createElement("button");
        const isMarked = markedCells.has(cellIndex);
        cell.type = "button";
        cell.className = "player-board-cell";
        cell.setAttribute("aria-label", `Casilla ${cellIndex + 1}`);
        cell.setAttribute("aria-pressed", String(isMarked));
        cell.classList.toggle("is-marked", isMarked);
        cell.addEventListener("click", () => {
          socket.emit("game:mark-cell", {
            cellIndex,
            marked: !cell.classList.contains("is-marked"),
          }, result => {
            if (!result?.ok) {
              showMessage(result?.error || "No se pudo actualizar la casilla.", true);
            }
          });
        });
        cells.append(cell);
      }

      playerBoard.append(image, cells);
    }
    return;
  }

  playingView.hidden = true;
  selectionView.hidden = false;
  boardsContainer.replaceChildren();
  playerStatus.textContent = me?.boardId
    ? `Tu tabla seleccionada es la ${me.boardId}.`
    : "Todavía no has seleccionado una tabla.";

  for (const board of currentState.boards) {
    const owner = currentState.players.find(player => player.id === board.playerId);
    const card = document.createElement("article");
    card.className = "board-card";

    const image = document.createElement("img");
    image.src = board.image;
    image.alt = `Tabla ${board.id}`;
    image.loading = "lazy";
    image.onerror = () => {
      image.hidden = true;
      card.classList.add("image-missing");
    };

    const title = document.createElement("h3");
    title.textContent = `Tabla ${board.id}`;

    const status = document.createElement("p");
    if (board.playerId === playerId) {
      status.textContent = "Tu tabla";
      card.classList.add("mine");
    } else if (owner) {
      status.textContent = `Ocupada por ${owner.username}`;
      card.classList.add("occupied");
    } else {
      status.textContent = "Disponible";
    }

    const button = document.createElement("button");
    if (board.playerId === playerId) {
      button.textContent = "Desocupar tabla";
      button.classList.add("danger");
      button.addEventListener("click", () => {
        socket.emit("board:release", result => {
          if (!result?.ok) {
            showMessage(result?.error || "No se pudo desocupar la tabla.", true);
          } else {
            showMessage(`Has desocupado la tabla ${board.id}.`);
          }
        });
      });
    } else {
      button.textContent = board.playerId ? "Ocupada" : "Elegir tabla";
      button.disabled = Boolean(board.playerId) || !me || Boolean(me.boardId);
      button.addEventListener("click", () => {
        socket.emit("board:reserve", board.id, result => {
          if (!result?.ok) {
            showMessage(result?.error || "No se pudo reservar la tabla.", true);
          } else {
            showMessage(`Has elegido la tabla ${board.id}.`);
          }
        });
      });
    }

    card.append(image, title, status, button);
    boardsContainer.append(card);
  }
}
