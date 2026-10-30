// Chistes estáticos por carta. La clave es el nombre de la carta en minúsculas
// (el nombre del archivo sin el prefijo "lotería-MCG_").
const jokes = {
  "el timer": "Dice que faltan cinco minutos, pero nadie le cree desde 2019.",
  "archivos online": "Siempre están en la nube, menos cuando los necesitas.",
  "camara apagada": "Hoy participa en la reunión solo con su alma y su foto de perfil.",
  "chat support": "Ya casi te resuelve el problema; te pide que esperes un momentito, por tres horas.",
  "cloudia paciente": "Tiene tanta paciencia que ya se tomó el juguito de paciencia completo.",
  "cloudia": "Es la única nube que nunca anuncia lluvia, solo tickets.",
  "correo urgente": "Si todo es urgente, entonces nada es urgente. Pero igual respóndelo.",
  "cubi potter": "El mago que desaparece los pendientes... justo antes de la entrega.",
  "cubi sonriente": "Sonríe incluso cuando se cae el sistema. Eso es talento.",
  "cubitec chambeador": "Trabaja tanto que ya no sabe si es lunes o es siempre.",
  "el bug": "No es un error, es una característica no documentada.",
  "el cafe": "El verdadero motor de la empresa. Sin él, el sistema ni arranca.",
  "el calendario": "Está lleno de reuniones, pero ninguna sirve para dormir.",
  "el cliente": "Siempre tiene la razón, aunque cambie de opinión tres veces por hora.",
  "el cursor": "Se mueve solo cuando compartes pantalla y no quieres que nadie lo vea.",
  "el deadline": "Se acerca más rápido que la quincena y paga menos.",
  "el excel": "Una fórmula, mil errores y un solo archivo llamado final_final_v3.",
  "el meeting productivo": "Existe, pero casi nunca se deja ver. Dicen que es como el yeti.",
  "el mentimeter": "Pregunta qué opinas y luego muestra una nube de palabras con puro 'ok'.",
  "el micrófono": "Nunca funciona cuando hablas, pero sí cuando estornudas.",
  "el mouse": "Se escapó de la alfombrilla y nadie sabe en qué pantalla quedó.",
  "el mute": "Eres el rey de la sala, solo que nadie escuchó nada de lo que dijiste.",
  "el reinicio": "La solución a todo en sistemas. Funciona hasta con los problemas de la vida.",
  "el reminder": "Te recuerda lo que olvidaste, justo cuando ya era tarde.",
  "el reporte": "Nadie lo lee, pero todos juran que es importantísimo.",
  "el snack": "Dura menos que una reunión corta, pero levanta el ánimo de todo el equipo.",
  "el trabajo bajo presión": "Los diamantes se hacen así. Los dolores de cabeza también.",
  "el trainer": "Tiene más energía que todo el equipo junto, y eso que apenas es lunes.",
  "error 404": "Fue a buscar mi motivación y tampoco la encontró.",
  "la convivencia virtual": "Todos con la cámara apagada, divirtiéndose muchísimo. Se nota.",
  "la junta que pudo ser un correo": "Y ni siquiera era un correo importante.",
  "la oficina": "Ese lugar al que vas a conectarte a videollamadas.",
  "la silla gamer": "Se siente muy profesional, hasta que se cae el respaldo en plena junta.",
  "la videollamada": "Hola, hola, ¿me escuchan? ¿Me ven? ¡Ya se congeló!",
  "laptop": "Tiene cien pestañas abiertas y la batería al uno por ciento.",
  "las clases nocturnas": "Aprender de noche es genial, si logras mantener los ojos abiertos.",
  "las facturas": "Llegan puntuales, justo cuando el sueldo ya se fue.",
  "las ideas": "Brillantes en la regadera, desaparecen al sentarte a trabajar.",
  "las notas": "Las anotaste con mucho cuidado, y no las vuelves a encontrar jamás.",
  "las vacaciones": "Tan esperadas, y se acaban antes de que termines de desempacar.",
  "los audifonos": "Son la señal universal de 'no me hables, estoy concentrado en la música'.",
  "los mil pendientes": "No son mil, son mil uno. Hoy se sumó otro.",
  "los premios": "Todos quieren ganar, pero pocos quieren entregar el reporte a tiempo.",
  "multitasking": "Hacer diez cosas a la vez, y todas a medias. Habilidad nivel experto.",
  "outlook": "Tiene ochocientos correos sin leer y los va a dejar así por prudencia.",
  "power point": "Cuarenta diapositivas para decir lo que cabía en una sola frase.",
  "reclutamiento": "Buscan a alguien con diez años de experiencia en una tecnología de hace tres.",
  "teams": "Sonó la notificación, pero nunca sabes de qué chat viene.",
  "telegram": "Un mensaje corto, un stiker y cinco minutos de risas escondidas.",
  "wifi inestable": "Se va justo cuando ibas a decir algo brillante.",
};

const FALLBACK_JOKE = "Esta carta no tiene chiste, pero tiene mucha actitud.";

function normalizeName(name) {
  return String(name).normalize("NFC").trim().toLowerCase();
}

function getJoke(cardName) {
  return jokes[normalizeName(cardName)] || FALLBACK_JOKE;
}

module.exports = { getJoke };
