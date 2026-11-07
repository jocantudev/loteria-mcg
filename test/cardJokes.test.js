const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { getJoke } = require("../src/cardJokes");
const game = require("../src/gameState");

const cardsDir = path.join(__dirname, "..", "public", "assets", "cartas");
const cardNames = fs.readdirSync(cardsDir)
  .filter(file => /\.(jpe?g|png|webp)$/i.test(file))
  .map(file => path.parse(file).name.normalize("NFC").replace(/^lotería[-_]MCG[-_]?/i, "").trim());

test("cada carta tiene al menos tres chistes diferentes, incluido el original", () => {
  const originalRandomInt = crypto.randomInt;
  try {
    assert.ok(cardNames.length > 0);
    for (const name of cardNames) {
      const options = [0, 1, 2].map(index => {
        crypto.randomInt = limit => {
          assert.ok(limit >= 3, `${name} necesita al menos tres chistes`);
          return index;
        };
        return getJoke(name);
      });
      assert.equal(new Set(options).size, 3, `${name} necesita tres chistes diferentes`);
      assert.ok(options.every(joke => joke && joke !== "Esta carta no tiene chiste, pero tiene mucha actitud."));
    }

    crypto.randomInt = () => 0;
    assert.equal(getJoke(" EL BUG "), "No es un error, es una característica no documentada.");
    assert.equal(getJoke("el micro\u0301fono"), "Nunca funciona cuando hablas, pero sí cuando estornudas.");
    assert.equal(getJoke("carta desconocida"), "Esta carta no tiene chiste, pero tiene mucha actitud.");
  } finally {
    crypto.randomInt = originalRandomInt;
  }
});

test("el chiste se elige al cantar y permanece estable durante la partida", () => {
  const originalRandomInt = crypto.randomInt;
  try {
    const player = game.addPlayer("Jugador");
    game.reserveBoard(player.id, game.publicState().boards[0].id);
    game.startGame();

    crypto.randomInt = () => 0;
    const first = game.drawCard().currentCard;
    assert.equal(first.joke, getJoke(first.name));

    crypto.randomInt = () => 1;
    assert.notEqual(first.joke, getJoke(first.name));
    assert.equal(game.publicState().currentCard.joke, first.joke);
    const second = game.drawCard().currentCard;
    assert.equal(second.joke, getJoke(second.name));
    assert.equal(game.publicState().calledCards[0].joke, first.joke);
  } finally {
    crypto.randomInt = originalRandomInt;
    game.resetGame();
  }
});
