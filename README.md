# Lotería web (MVP)

Aplicación sencilla de lotería con Node.js, Express, Socket.IO y HTML/CSS/JavaScript sin framework. No utiliza base de datos: el estado de la partida vive en la memoria RAM del servidor.

## Requisitos

- Node.js 18 o posterior
- npm

## Instalación

```bash
npm install
cp .env.example .env
```

Edita `.env` y establece una contraseña administrativa segura:

```dotenv
PORT=3000
ADMIN_PASSWORD=pon-aqui-una-clave-larga-y-unica
```

Inicia el servidor:

```bash
npm run dev
```

Abre:
- Jugadores: http://localhost:3000
- Administración: http://localhost:3000/admin.html

## Assets de tablas

Por defecto se esperan 54 imágenes:

```text
public/assets/tablas/tabla-01.png
public/assets/tablas/tabla-02.png
...
public/assets/tablas/tabla-54.png
```

Ajusta `TOTAL_BOARDS` en `.env` si tienes otro número de tablas, por ejemplo `TOTAL_BOARDS=36`. Cambia el código de `src/gameState.js` si los archivos usan nombres distintos.

Puedes colocar las imágenes de las cartas individuales en `public/assets/cartas/`; esta versión todavía no implementa el sorteo de cartas.

## Limitaciones importantes

- Las reservas se borran al reiniciar el proceso Node.js.
- Está diseñada para ejecutarse en una sola instancia de Node.js.
- La sesión del jugador se recupera al recargar la página mediante un identificador guardado en `sessionStorage`, siempre que el servidor siga ejecutándose y la sesión siga activa. El nombre del jugador no es una identidad autenticada.
- El administrador puede iniciar la partida después de que al menos un jugador haya reservado una tabla. Esto bloquea la selección y muestra a cada jugador su tabla asignada; los participantes sin tabla reciben un aviso. Reiniciar la partida libera las tablas y abre de nuevo la selección.
- Durante la partida, cada jugador ve únicamente su propia tabla 4×4 y puede marcar o desmarcar sus casillas. Las marcas se conservan en el servidor mientras el proceso siga activo, incluso si el jugador recarga la página; no se comparten con otros jugadores ni sobreviven al reinicio del servidor.
- Durante la partida, cada jugador puede avisar que ganó (y cancelar el aviso). El administrador ve la lista ordenada según la llegada de los avisos al servidor; los demás jugadores no ven los avisos ajenos. El administrador debe verificar manualmente que la tabla sea ganadora.
- Al iniciar la partida el servidor baraja las cartas de `public/assets/cartas/` (jpg, png o webp; el nombre sale del archivo) y el administrador las canta sin repetir, una a una o en modo automático (`CALL_INTERVAL_MS`, por defecto 6000 ms, mínimo 2000). Los jugadores ven la carta cantada, pero no se marca nada automáticamente. Reiniciar la partida detiene el canto y vuelve a barajar en el siguiente inicio.
- Cada carta cantada se pronuncia en voz alta en el panel del administrador, seguida de un chiste fijo definido en `src/cardJokes.js` (las cartas sin chiste usan una frase genérica). La voz usa la síntesis de voz del navegador (voz en español si está disponible), por lo que el administrador debe dejar la pestaña abierta, tener el sonido activado y haber hecho clic en la página; se puede silenciar con «Voz y chistes».
- El panel de administración usa una contraseña compartida y un token temporal en memoria. Antes de exponerla públicamente, añade limitación de intentos, HTTPS y una política de seguridad más robusta.
- Si publicas la app, configura `ADMIN_PASSWORD` como secreto del proveedor; no subas `.env` a Git.

## Eventos principales

- `player:join`
- `board:reserve`
- `board:release`
- `game:mark-cell`
- `game:claim-win`
- `admin:start-game`
- `admin:draw-card`
- `admin:auto-call`
- `admin:login`
- `admin:release`
- `admin:reset`
- `admin:remove-player`
- `state:update`
