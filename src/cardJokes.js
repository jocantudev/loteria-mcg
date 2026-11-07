const crypto = require("node:crypto");

// La clave es el nombre de la carta en minúsculas
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

const additionalJokes = {
  "el timer": ["Dice que faltan cinco minutos, como el taquero que ya casi te entrega la orden.", "Corre más rápido que uno cuando escucha que ya depositaron la quincena."],
  "archivos online": ["Están en la nube, pero para encontrarlos hace falta un chamán y tres contraseñas.", "Subí el archivo final y ahora hay más finales que en una telenovela."],
  "camara apagada": ["Anda en pijama de la cintura para abajo y en modo ejecutivo de la cintura para arriba.", "Dice que se descompuso la cámara, pero el peinado sabe la verdad."],
  "chat support": ["Le pregunté si ya quedó y me contestó: ahorita joven, ya casi.", "Su respuesta favorita es reinicia el equipo y échale ganas, campeón."],
  "cloudia paciente": ["Aguanta más preguntas repetidas que abuelita explicando la receta del mole.", "Le pidieron otro cambio de última hora y todavía dijo: sí, con mucho gusto."],
  "cloudia": ["Anda en la nube, pero bien aterrizada cuando llegan los pendientes.", "No trae paraguas, pero sí respaldo para cuando caiga el aguacero de tickets."],
  "correo urgente": ["Llegó a las seis y dice para ayer; ni el repartidor de tacos se avienta esa.", "Tiene tantas banderitas rojas que parece desfile, pero nadie lo ha leído."],
  "cubi potter": ["Con un abracadabra desaparece el pendiente, pero aparece otro en su lugar.", "Quiso convertir la junta en descanso, pero le salió una reunión recurrente."],
  "cubi sonriente": ["Sonríe aunque el lunes venga con todo y sin café de olla.", "Tiene una sonrisa tan firme que ni la junta de las siete se la quita."],
  "cubitec chambeador": ["Le entra a la chamba con ganas, aunque el café ya le pidió vacaciones.", "Saca pendientes como salen tortillas del comal: uno tras otro y sin descanso."],
  "el bug": ["Se esconde más que el último tamal cuando preguntan quién se lo comió.", "En mi máquina sí funciona; en la tuya ya organizó fiesta y rompió todo."],
  "el cafe": ["Sin cafecito no hay junta, nomás gente mirando al infinito.", "Está tan cargado que ya pidió acceso de administrador."],
  "el calendario": ["Tiene más cuadros ocupados que mesa de lotería en domingo.", "Me agendó una junta para buscar espacio y agendar otra junta."],
  "el cliente": ["Pidió algo sencillito y mandó una lista más larga que la cuenta de la taquería.", "Lo quiere para ayer, bonito, barato y que además prepare el café."],
  "el cursor": ["Anda más perdido que turista buscando la salida del metro.", "Desaparece justo cuando dices: miren, aquí está; qué oportuno el compadre."],
  "el deadline": ["Anda persiguiéndome más de cerca que el cobrador de la tanda.", "Llegó sin avisar, como visita cuando la casa está hecha un relajo."],
  "el excel": ["Tiene tantas fórmulas que ya debería cobrar como brujo.", "Le moví a una celda y se desacomodó hasta la lista del súper."],
  "el meeting productivo": ["Lo vieron una vez, pero nadie alcanzó a tomarle foto.", "Cuando por fin apareció, alguien dijo: ¿y si lo vemos en otra junta?"],
  "el mentimeter": ["Preguntó cómo estamos y salió una nube con puro necesito vacaciones.", "Pidió una palabra para describir la junta: varios escribieron cafecito."],
  "el micrófono": ["Lo dejé abierto y toda la junta se enteró de que ya estaban los tamales.", "Cuando quiero hablar se hace el sordo; cuando pido tacos, hasta eco tiene."],
  "el mouse": ["Corre de pantalla en pantalla como si le debiera a la tanda.", "Le di doble clic y se emocionó tanto que abrió tres ventanas."],
  "el mute": ["Me aventé el discurso de mi vida y al final me dijeron: estás en mute, compa.", "Es buenísimo guardando secretos, sobre todo cuando quieres contar algo."],
  "el reinicio": ["Apágalo y préndelo: el equivalente tecnológico de una sobadita.", "Cuando nada funciona, le damos su siestita al equipo y santo remedio."],
  "el reminder": ["Llega a recordarme el pendiente justo cuando ya me iba por mis taquitos.", "Me manda tantos avisos que ya lo invité al grupo familiar."],
  "el reporte": ["Lo pidieron con urgencia y ahora descansa tranquilo en una carpeta olvidada.", "Tiene más colores que piñata de posada y menos lectores que instructivo de licuadora."],
  "el snack": ["Desaparece de la mesa más rápido que los tacos en reunión familiar.", "Una galletita para aguantar la junta y otras cinco para aguantar el pendiente."],
  "el trabajo bajo presión": ["Con tanta presión ya solo falta que nos sirvan como café espresso.", "Dice que todo es para ayer; yo apenas voy por el desayuno de hoy."],
  "el trainer": ["Trae pila de sobra, como si desayunara café con café.", "Dice una última dinámica y ya llevamos tres como las últimas tortillas."],
  "error 404": ["Busqué el archivo y salió por tortillas; todavía no regresa.", "La página se fue de vacaciones y ni dejó recado en el refrigerador."],
  "la convivencia virtual": ["Cada quien puso botana en su casa y el silencio se conectó primero.", "Hicimos brindis virtual; lo único compartido fue la contraseña del wifi."],
  "la junta que pudo ser un correo": ["Duró una hora para decir: enterado, gracias y saludos.", "Traía agenda, presentación y hasta despedida, pero el mensaje cabía en un renglón."],
  "la oficina": ["Vine por la convivencia y terminé saludando al mismo monitor de siempre.", "El café sabe a aventura y la impresora solo trabaja cuando quiere."],
  "la silla gamer": ["Tiene más luces que puesto de feria, pero igual me recuerda que tengo espalda.", "Parece nave espacial, pero nomás me transporta de una junta a otra."],
  "la videollamada": ["Todos dicen te escucho perfecto justo antes de quedarse congelados.", "Se congeló mi cara y ahora parezco sorprendido durante toda la junta."],
  "laptop": ["Se calienta tanto que ya casi podemos ponerle el comal encima.", "Abrió tantas pestañas que ya necesita su propio menú de restaurante."],
  "las clases nocturnas": ["Uno estudia con ganas y los ojos ya están pidiendo su cobijita.", "El profe pregunta si hay dudas y mi almohada contesta que ya es hora."],
  "las facturas": ["Llegan más puntuales que la señora de los tamales, pero dan menos alegría.", "En cuanto cae la quincena se forman, como fila para los tacos gratis."],
  "las ideas": ["Llegan bañándome y se van cuando busco dónde anotarlas.", "Aparecen de madrugada como antojo de tacos: urgentes y difíciles de olvidar."],
  "las notas": ["Las escribí para no olvidar, ahora solo falta recordar dónde las dejé.", "Tengo notas en tantos lados que necesito una nota para encontrarlas."],
  "las vacaciones": ["Se pasan más rápido que el carrito de los elotes cuando no traes cambio.", "Uno vuelve bien descansado, hasta que abre el correo y se le baja el encanto."],
  "los audifonos": ["Me los puse para concentrarme y ahora canto bajito, según yo.", "Son mi letrero de ocupado, aunque por dentro ande escuchando cumbias."],
  "los mil pendientes": ["Se reproducen solitos, como los recipientes sin tapa en la cocina.", "Terminé uno y aparecieron tres; esto ya parece promoción de mercado."],
  "los premios": ["Todos levantaron la mano, hasta quien preguntó de qué se trataba.", "Si el premio es una junta extra, mejor pásenle el turno al compañero."],
  "multitasking": ["Estoy en la junta, contestando correos y buscando dónde dejé mi café.", "Hago tantas cosas a la vez que se me olvida cuál era la primera, compa."],
  "outlook": ["Tiene más correos sin leer que mensajes el grupo de la familia.", "Me avisa de otra junta justo cuando estaba archivando la invitación anterior."],
  "power point": ["Le puse tantas animaciones que la presentación ya parece baile de XV años.", "Otra diapositiva y ya alcanzamos a contar la historia desde la Independencia."],
  "reclutamiento": ["Piden experiencia en todo, nomás les faltó pedir que uno haga buenos tacos.", "Buscan al candidato ideal: que sepa de todo y también encuentre dónde estacionarse."],
  "teams": ["Sonó una notificación y todos revisamos, como cuando gritan ya llegaron los tacos.", "Tiene tantos chats que ya necesito un mapa y una torta para el camino."],
  "telegram": ["Mandé un sticker y ya hubo más conversación que en toda la junta.", "En el grupo mandan tantos stickers que ya tienen su propia lotería."],
  "wifi inestable": ["Se fue y vino más veces que visita buscando dónde estacionarse.", "Cuando voy ganando la discusión se corta; el wifi también quiere opinar."],
};

const FALLBACK_JOKE = "Esta carta no tiene chiste, pero tiene mucha actitud.";

function normalizeName(name) {
  return String(name).normalize("NFC").trim().toLowerCase();
}

function getJoke(cardName) {
  const name = normalizeName(cardName);
  if (!jokes[name]) return FALLBACK_JOKE;
  const options = [jokes[name], ...additionalJokes[name]];
  return options[crypto.randomInt(options.length)];
}

module.exports = { getJoke };
