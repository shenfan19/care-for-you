/* Paquete de contenido en español: frases de los personajes, biblioteca de frases, preguntas, recordatorios y textos de las enfermedades.
   Los identificadores de los elementos son los mismos que en los demás idiomas. {ta} pasa a él o ella, con mayúscula al empezar una frase. */
(function (CY) {
  const C = CY.content;
  const V = {};

  V.elder = {
    request: {
      thirst: ['…Tengo un poco de sed.', 'Eh, agua, por favor.'], hunger: ['¿Qué hora es? ¿Has comido ya?', 'Tengo el estómago un poco vacío.'], rest: ['Me siento un rato.', 'La espalda me da guerra otra vez.'],
      company: ['Estás ocupado… da igual.', '¿Vienes a sentarte conmigo?'], medicine: ['¿Es hora de mis pastillas?', 'No recuerdo si me las tomé.'], hygiene: ['Me vendría bien lavarme un poco.'], mobility: ['Tengo las piernas rígidas. ¿Un paseíto corto?'],
    },
    thanks: { water: ['Mm.'], feed: ['Bien, bien.'], meal: ['Delicioso. Cocinas muy bien.'], rest: ['Solo necesito apoyarme un momento.'], pet: ['…'], hand: ['Tus manos se han hecho tan grandes.'], medicine: ['Tomadas. Cuídate tú también.'], walk: ['Este aire me sienta bien.'], default: ['Mm.'] },
    glance: ['{ta} te miró desde la puerta, no dijo nada y se alejó.', '{ta} se sentó cerca, solo mirándote.', '{ta} tosió suavemente, como para decir algo, y no lo dijo.'],
    cares_back: ['{ta} dejó un vaso de agua junto a tu mano sin decir nada.', '{ta} subió discretamente la luz de tu escritorio.', '{ta} se acercó y te subió el abrigo que se te caía de los hombros.', '{ta} trajo un plato de fruta lavada y dijo: cómetela mientras está fresca.'],
    reveal: '{ta} te miró y dijo: das mil vueltas por mí, ¿no te cansas? Yo estoy bien. Tú también tienes que comer.',
  };
  V.parent = {
    request: {
      thirst: ['¿Me sirves un vaso de agua?', 'Tengo la garganta un poco seca.'], hunger: ['¿Has comido? Yo me arreglo con cualquier cosa.', 'Ya debe de ser hora de cocinar.'], rest: ['Descanso un poco, no te preocupes por mí.', 'Hoy estoy algo cansado.'],
      company: ['¿Cómo has estado últimamente?', 'Ven, habla un rato conmigo.'], medicine: ['¿Es hora de mi medicina?', 'Mira por mí, ¿me tomé las pastillas?'], hygiene: ['Voy primero a refrescarme.'],
    },
    thanks: { water: ['Con eso basta, gracias.'], feed: ['Come tú también.'], meal: ['Huele bien. No hacía falta.'], rest: ['Me tumbo un poco y estaré bien.'], pet: ['Vaya, qué mayor estás.'], hand: ['Tienes las manos frías.'], default: ['Bueno, bueno, no te ocupes de mí, sigue con tu trabajo.'] },
    glance: ['{ta} se quedó un momento en la puerta de la cocina, te miró y volvió a lo suyo.', '{ta} sostuvo el teléfono, a punto de preguntar algo, y lo dejó.', '{ta} pasó por detrás de ti, muy despacio.'],
    cares_back: ['{ta} dejó un cuenco de sopa junto a tu escritorio y dijo: tómatela mientras está caliente.', '{ta} rellenó tu taza con discreción.', '{ta} dijo: no te acuestes tarde, te dejé la luz encendida.', '{ta} dobló la ropa que te habías quitado.'],
    reveal: '{ta} te miró y dijo: aquí estoy bien. Tu propia vida también importa.',
  };
  V.aunt = {
    request: {
      thirst: ['Ay, ¿un poco de agua, cariño?', 'Me muero de sed, ¿hay agua?'], hunger: ['¿Está lista la cena? Déjame ayudar.', 'Tengo un poco de hambre, ¿hay algo?'], rest: ['Me siento un minuto, me duelen las piernas.', 'No aguanto más de pie, déjame descansar.'],
      company: ['¡Venga, venga, vamos a charlar!', '¿Por qué estás tan callado últimamente?'], medicine: ['¿Dónde puse las pastillas?', '¿Me toca la medicina ahora?'], hygiene: ['Voy a lavarme un poco la cara.'],
    },
    thanks: { water: ['Gracias, gracias.'], feed: ['Qué rico, qué rico.'], meal: ['Ay, qué maravilla.'], rest: ['Ahora sí, mucho mejor.'], pet: ['Ay, tú.'], hand: ['Qué buen chico.'], default: ['Ay, bien.'] },
    glance: ['{ta} asomó la cabeza por la puerta y te sonrió.', '{ta} te saludó con la mano mientras hablaba por teléfono en el salón.', '{ta} pasó con un plato de fruta y te hizo un gesto con la barbilla.'],
    cares_back: ['{ta} puso el trozo de carne más grande en tu cuenco.', '{ta} te metió un sobre rojo diciendo: tómalo, no lo rechaces.', '{ta} dijo: estás más flaco. Y te sirvió un cuenco de sopa.'],
    reveal: '{ta} te dio unas palmaditas en la mano y dijo: no pienses solo en nosotros. Que tú estés bien vale más que todo.',
  };
  V.sibling = {
    request: {
      thirst: ['Oye, ¿tienes agua?', 'Tengo sed. Sírveme una.'], hunger: ['Tengo hambre. ¿Pedimos algo?', '¿Hay algo de comer?'], rest: ['Voy a dormir un rato. No me despiertes.', 'Qué sueño.'],
      company: ['¿Qué haces?', '¿Jugamos a algo?', 'Sal a charlar un rato.'], medicine: ['Creo que toca la medicina.'], hygiene: ['Voy a ducharme.'],
    },
    thanks: { water: ['Vale.'], feed: ['Vale, te debo una comida.'], meal: ['No está mal. Te lo debo.'], rest: ['Gracias.'], pet: ['¿Qué.'], hand: ['…Qué cursi.'], chat: ['Ja. Me ha ayudado.'], default: ['Vale.'] },
    glance: ['{ta} se apoyó en el marco de la puerta y te miró un rato sin decir nada.', '{ta} te mandó un meme y luego se quedó callado.', '{ta} levantó la barbilla hacia ti.'],
    cares_back: ['{ta} dejó tu snack favorito en el escritorio, fingiendo que se le había caído por casualidad.', '{ta} dijo: yo vigilo esto, tú vete a dormir.', '{ta} metió tu paquete dentro.'],
    reveal: '{ta} dijo: no lo cargues todo tú solo. Aquí estoy.',
  };
  V.partner = {
    request: {
      thirst: ['¿Me traes un vaso de agua ya que te levantas?', 'Tengo un poco de sed.'], hunger: ['¿Qué quieres cenar?', 'Tengo un poco de hambre.'], rest: ['Estoy cansado, solo quiero apoyarme en ti un rato.'], company: ['Casi no hemos hablado hoy.', '¿Vienes a sentarte conmigo?'],
      hygiene: ['Voy primero a ducharme.'], medicine: ['¿Es hora de la medicina?', 'Mira por mí, ¿me tomé las pastillas?'],
    },
    thanks: { water: ['Gracias.'], meal: ['Delicioso. Gracias por cocinar.'], chat: ['Hablar contigo me sienta bien.'], pet: ['Mm, qué agradable.'], default: ['Gracias.'] },
    glance: ['{ta} te miró desde el otro lado de la habitación y sonrió.', '{ta} pasó y te tocó suavemente el hombro.', '{ta} se sentó a tu lado con dos tazas de té.'],
    cares_back: ['{ta} recalentó tu parte de la cena y la dejó a tu alcance.', '{ta} apagó la luz por ti y dijo: acuéstate pronto.', '{ta} dobló el abrigo que dejaste caer y lo puso en la silla.'],
    reveal: '{ta} dijo: llevas demasiado tiempo aguantando tú solo. Hoy me toca a mí.',
  };
  V.child = {
    request: {
      thirst: ['{title}, agua, por favor.', '¡Agua!'], hunger: ['Tengo hambre.', '{title}, quiero cenar.'], rest: ['Tengo sueño…', '{title}, quiero ir a la cama.'], company: ['{title}~', '{title}, mírame.'],
      play: ['¡Juega! ¡{title}, juega!', '{title}, ¿juegas un poquito conmigo?'], hygiene: ['Quiero bañarme.'], homework: ['No entiendo este.', 'Todavía tengo muchos deberes.'],
    },
    thanks: { water: ['Glu glu.'], feed: ['¡Rico!'], meal: ['¡Rico!'], play: ['Jejeje.'], soothe: ['…(cerró los ojos despacio)'], pet: ['Je.'], hand: ['Las manos de {title} están calentitas.'], bath: ['Chap chap.'], read: ['¡Otra vez, otra vez!'], homework: ['¡Ah, ya lo entendí!'], default: ['¡Sí!'] },
    glance: ['{ta} estaba en la puerta abrazando un juguete y te miraba.', '{ta} te saludó con la mano desde lejos.', '{ta} apoyó la cara en el marco de la puerta, con los ojos brillantes.'],
    cares_back: ['{ta} vino corriendo y te metió en la mano un caramelo que encontró quién sabe dónde.', '{ta} te tocó la cara y dijo: no llores, {title}. No estabas llorando.', '{ta} puso su osito favorito en tu silla.', '{ta} se puso de puntillas y te dio palmaditas en el hombro con la manita.'],
    reveal: '{ta} abrazó tu pierna, levantó la vista y dijo: {title}, yo te cuidaré.',
  };
  V.infant = {
    request: {
      thirst: ['{ta} abrió la boca y lloriqueó.'], hunger: ['{ta} rompió a llorar, las manitas buscando comida.', '{ta} lloraba chupándose un puñito.'], rest: ['{ta} se frotaba los ojos lloriqueando.'], company: ['{ta} estiraba las dos manitas esperando que lo cogieran.'],
      play: ['{ta} te miraba fijamente balbuceando.'], diaper: ['{ta} se retorcía y empezó a llorar.'], fever: ['{ta} tenía la carita roja y un llanto débil.'], hygiene: ['Quizá es hora del baño.'],
    },
    thanks: { feed: ['Glu, glu. {ta} come a gusto.'], diaper: ['{ta} hizo un sonidito de bienestar.'], soothe: ['{ta} cerró los ojos despacio.'], hug: ['{ta} escondió la cara en tus brazos.'], pet: ['{ta} soltó una risita.'], play: ['{ta} no paraba de reírse.'], bath: ['{ta} salpicó feliz.'], default: ['{ta} se calmó.'] },
    glance: ['{ta} estaba en la cuna con los ojos abiertos, mirándote.', '{ta} agitó una manita.'],
    cares_back: ['{ta} agarró uno de tus dedos y no lo soltaba.', '{ta} te sonrió con las encías sin dientes.'],
    reveal: '{ta} te miró y estiró la mano para tocarte la cara.',
    cry: ['Buaaa… buaaa…', 'Bua-bua-bua…', '{ta} lloraba sin poder parar.'],
  };
  V.toddler = {
    request: {
      thirst: ['{title}, agua.', '¡Beber!'], hunger: ['¡Hambre!', '{title}, comida.'], rest: ['Sueño…', '{title}, brazos, dormir.'], company: ['¡{title}! ¡{title}!', 'Mira, mira.'],
      play: ['¡Jugar! ¡Jugar!', '{title}, jugar juntos.'], diaper: ['{title}, mojado.', '{ta} tiró del pantalón arrugando la cara.'], fever: ['{title}, calor, mal.'], breath: ['{ta} tosió varias veces y respiraba rápido.'], hygiene: ['{title}, ¡baño, baño!'],
    },
    thanks: { feed: ['¡Rico! ¡Más!'], diaper: ['Mejor.'], soothe: ['{ta} cerró los ojos despacio.'], hug: ['Brazos, no soltar.'], pet: ['Ji ji.'], play: ['¡Otra vez, otra vez!'], water: ['Glu glu.'], bath: ['¡Chap chap!'], read: ['¡Otra! ¡Otra!'], default: ['¡Sí!'] },
    glance: ['{ta} estaba en la puerta abrazando un juguete.', '{ta} dio dos pasitos hacia ti y se paró.', '{ta} te saludó con la mano.'],
    cares_back: ['{ta} llegó tambaleándose y te metió una galleta en la mano.', '{ta} te dio palmaditas en la pierna y dijo: no llorar. No estabas llorando.', '{ta} puso el osito en tu silla.'],
    reveal: '{ta} abrazó tu pierna, levantó la vista y dijo: {title}, bien.',
    cry: ['¡Buaaa, {title}!', 'Buu-juu, ¡no, no!', '{ta} lloraba con la carita roja.'],
  };
  V.teen = {
    request: {
      thirst: ['¿Tienes agua?', 'Qué sed.'], hunger: ['Tengo hambre, ¿hay algo de comer?', '¿Qué hay para cenar?'], rest: ['Qué cansancio, no me molestes.'], company: ['…¿Estás ocupado?', 'Quiero contarte algo.'],
      homework: ['No entiendo este.', 'Demasiados deberes, qué rollo.'], fever: ['Creo que tengo fiebre.'], hygiene: ['Voy a ducharme.'],
    },
    thanks: { meal: ['Bueno. …Gracias.'], homework: ['Ah, así es como funciona.'], chat: ['…No era nada, pero me sienta bien decirlo.'], game: ['Vale, eso estuvo bien.'], pet: ['¿Qué.'], default: ['Mm.'] },
    glance: ['{ta} pasó con los auriculares puestos y luego volvió a pasar.', '{ta} se apoyó en el marco de la puerta, queriendo decir algo.'],
    cares_back: ['{ta} rellenó tu taza como si nada.', '{ta} dijo: no te pases. Y volvió rápido a su cuarto.'],
    reveal: '{ta} dijo: sé lo difícil que es para ti.',
  };
  V.cat = {
    request: {
      thirst: ['{ta} se quedó junto al bebedero, lo miró y luego te miró a ti.'], hunger: ['{ta} dio una vuelta a tus pies y maulló.'], company: ['{ta} saltó al escritorio y se sentó junto al teclado.'], play: ['{ta} trajo la pelotita gastada y la dejó a tus pies.'], clean: ['{ta} miró largamente el arenero con intención.'],
    },
    thanks: { water: ['{ta} se agachó y bebió.'], feed: ['{ta} hundió la cara en el plato, moviendo la cola.'], play: ['{ta} saltó y volvió a saltar.'], pet: ['{ta} entrecerró los ojos y ronroneó.'], hand: ['{ta} dio una vuelta en tus brazos y se echó.'], groom: ['{ta} se estiró ronroneando.'], clean: ['{ta} olfateó satisfecho.'], default: ['Miau.'] },
    glance: ['{ta} estaba tumbado en el alféizar y te echó un vistazo.', '{ta} vino, te dio un cabezazo en la mano y se fue.'],
    cares_back: ['{ta} se subió a tu regazo y se echó. Notaste que tenías los hombros rígidos.', '{ta} se sentó tranquilo a tu lado hasta que te levantaste.', '{ta} rozó el dorso de tu mano con la cola, como diciendo: es hora de descansar.'],
    reveal: 'Toda la tarde {ta} estuvo echado a tus pies, levantando la cabeza cada vez que te movías. Parece que te esperaba desde siempre.',
  };
  V.dog = {
    request: {
      thirst: ['{ta} se relamió mirando el cuenco vacío.'], hunger: ['{ta} se sentó junto al comedero, la cola barriendo el suelo.'], company: ['{ta} apoyó la barbilla en tu rodilla y te miró.'], play: ['{ta} trajo la correa y se plantó delante de ti.'],
    },
    thanks: { water: ['{ta} se bebió la mitad del cuenco.'], feed: ['{ta} lo acabó en tres bocados y levantó la vista.'], play: ['{ta} corrió una vuelta y regresó.'], walk: ['{ta} trotaba orgulloso a tu lado.'], pet: ['{ta} se tumbó enseñando la barriga.'], hand: ['{ta} se apoyó en ti sin moverse.'], groom: ['{ta} meneaba todo el cuerpo.'], default: ['Guau.'] },
    glance: ['{ta} estaba tumbado junto a la puerta y levantó la cabeza cuando te moviste.', '{ta} movió la cola y volvió a echarse.'],
    cares_back: ['{ta} dejó un juguete mojado a tus pies, dándote lo mejor que tenía.', 'Cada vez que suspirabas, {ta} se acercaba y te empujaba la mano con el hocico.', '{ta} se quedó junto a tu silla hasta que te levantaste.'],
    reveal: 'Toda la noche {ta} estuvo a tu lado y, cada vez que cambiabas de postura, él también. Te estuvo acompañando desde siempre.',
  };
  V.rabbit = {
    request: { thirst: ['{ta} lamió el biberón de agua vacío.'], hunger: ['{ta} se agazapó junto al comedero, moviendo la nariz.'], company: ['{ta} empujó tu pie y dio una pataleta.'], play: ['{ta} daba vueltas en la jaula, queriendo saltar fuera.'], clean: ['La jaula huele un poco.'] },
    thanks: { water: ['{ta} bebió varios sorbos.'], feed: ['{ta} mordisqueaba feliz.'], play: ['{ta} dio tres saltos y una vuelta.'], pet: ['{ta} entrecerró los ojos y aplastó las orejas.'], groom: ['{ta} se quedó muy quieto.'], clean: ['{ta} olfateó con aprobación.'], default: ['{ta} movió la nariz.'] },
    glance: ['{ta} levantó las orejas y te miró.'], cares_back: ['{ta} se echó tranquilo a tus pies.', '{ta} te lamió la mano.'], reveal: 'Toda la noche {ta} estuvo echado a tus pies, con las orejas siguiendo cada uno de tus movimientos.',
  };
  V.hamster = {
    request: { thirst: ['{ta} se agarraba al biberón. Está vacío.'], hunger: ['{ta} rebuscaba en el comedero vacío.'], play: ['{ta} te miraba desde la rueda.'], clean: ['Hay que cambiar el lecho.'] },
    thanks: { water: ['{ta} lamió rápido.'], feed: ['{ta} se llenó los dos mofletes.'], play: ['{ta} corrió a toda velocidad en la rueda.'], pet: ['{ta} se hizo un ovillo en tu palma.'], groom: ['{ta} chilló.'], clean: ['{ta} se metió en el lecho nuevo y no sale.'], default: ['{ta} chilló.'] },
    glance: ['{ta} se paró en la rueda y te miró.'], cares_back: ['{ta} empujó una pipa de girasol hacia ti.'], reveal: '{ta} duerme de día y corre toda la noche, como si vigilara por ti.',
  };
  V.bird = {
    request: { thirst: ['{ta} se paró junto al vasito de agua y piaba dos veces.'], hunger: ['{ta} piaba ante el comedero.'], play: ['{ta} saltaba de un lado a otro, queriendo volar fuera.'], clean: ['Hay que limpiar el fondo de la jaula.'] },
    thanks: { water: ['{ta} picoteó el agua.'], feed: ['{ta} picoteó muy en serio.'], play: ['{ta} dio una vuelta a la habitación y se posó en tu hombro.'], pet: ['{ta} ladeó la cabeza y se frotó contra tu dedo.'], groom: ['{ta} se esponjó contento.'], clean: ['{ta} sacudió las plumas.'], default: ['{ta} piaba.'] },
    glance: ['{ta} ladeó la cabeza y te miró.'], cares_back: ['{ta} se posó en tu hombro y tarareó una cancioncilla.'], reveal: '{ta} siempre canta cuando estás callado, como si temiera que estuvieras solo.',
  };
  V.fish = {
    request: { hunger: ['{ta} subió a la superficie con la boca abierta.'], clean: ['El agua de la pecera está turbia.'], oxygen: ['{ta} boqueaba en la superficie.'] },
    thanks: { feed: ['{ta} se lanzó y se lo tragó de un bocado.'], clean: ['El agua está clara y {ta} dio una vuelta feliz.'], default: ['{ta} soltó una burbuja.'] },
    glance: ['{ta} se pegó al cristal y te miró.'], cares_back: ['{ta} siguió tu dedo de un lado a otro.'], reveal: '{ta} solo nada en silencio, pero siempre que te acercas, viene hacia ti.',
  };
  V.turtle = {
    request: { thirst: ['El nivel del agua está un poco bajo.'], hunger: ['{ta} estiró el cuello, mirando el comedero.'], warmth: ['{ta} se quedó en una esquina sin moverse.'], clean: ['El agua está sucia.'] },
    thanks: { water: ['{ta} nadó despacio en círculo.'], feed: ['{ta} comió poco a poco.'], warm: ['{ta} estiró las cuatro patas bajo la lámpara.'], pet: ['{ta} encogió el cuello y lo sacó otra vez despacio.'], groom: ['{ta} parpadeó despacio.'], clean: ['{ta} chapoteó contenta.'], default: ['{ta} te miró.'] },
    glance: ['{ta} subió despacio a una piedra y te observó.'], cares_back: ['{ta} se arrastró despacio hasta el sitio más cercano a ti.'], reveal: '{ta} no dice nada y simplemente, despacio, siempre está ahí.',
  };
  V.snake = {
    request: { warmth: ['{ta} se enroscó en un rincón del terrario y casi no se movía.'], thirst: ['El cuenco de agua está seco.'], hunger: ['{ta} levantó la cabeza y sacó la lengua despacio.'] },
    thanks: { warm: ['{ta} se estiró despacio.'], water: ['{ta} se deslizó hasta el cuenco de agua.'], feed: ['{ta} se lo tragó en silencio.'], pet: ['{ta} giró despacio la cabeza y sacó la lengua.'], default: ['{ta} te miró.'] },
    glance: ['{ta} estaba enroscado bajo la lámpara, solo los ojos te seguían.', '{ta} cambió de sitio sin hacer ruido.'],
    cares_back: ['{ta} se enroscó tranquilo en el lado más cercano a ti, sin alboroto.', '{ta} se quedó perfectamente quieto mientras trabajabas, como si temiera molestarte.'],
    reveal: '{ta} no dijo nada, solo se quedó toda la tarde en el sitio más cercano a ti.',
  };
  V.plant = {
    request: { water: ['Las hojas están un poco caídas.', 'La tierra está seca.'], sun: ['{ta} se inclina hacia la ventana.'], fertilize: ['Las hojas nuevas crecen despacio.'], prune: ['Algunas hojas se han puesto amarillas.'] },
    thanks: { water: ['Las hojas se fueron desplegando despacio.'], sun: ['{ta} parece soltar un suspiro de alivio.'], fertilize: ['{ta} se ve mucho más animado.'], prune: ['{ta} se ve más ordenado.'], repot: ['{ta} se acomodó feliz en la maceta nueva.'], pet: ['Las hojas se movieron un poco.'], default: ['Las hojas se movieron un poco.'] },
    glance: ['El sol caía sobre las hojas y las sombras se movían despacio.', '{ta} sacó una hoja nueva.'], cares_back: ['{ta} abrió una florecita, mirando hacia ti.', 'Una hoja nueva se enroscó en forma de corazoncito.'], reveal: 'Cada vez que pasas, {ta} crece un poco hacia ti.',
  };

  const S = {
    elder01: '¿Has comido ya?', elder02: 'Hace frío fuera, abrígate más.', elder03: 'Nada, achaques de viejo.', elder04: 'Tú sigue con lo tuyo, no te ocupes de mí.', elder05: 'Cuando yo era joven…', elder06: 'Despacio, no te caigas.', elder07: 'Ten cuidado en el camino.', elder08: 'Yo no tengo hambre, come tú.', elder09: 'El viejo Zhang de al lado se fue otra vez a jugar al ajedrez.', elder10: 'Muchacho, ¿has comido?',
    parent01: '¿Has comido?', parent02: 'No te acuestes tarde. Duerme pronto.', parent03: 'Avísame cuando llegues.', parent04: '¿Te alcanza el dinero?', parent05: 'Tu vida la decides tú.', parent06: 'Estoy bien, no te preocupes.', parent07: 'Hace más frío, ponte otra capa.', parent08: '¿Vienes a cenar?',
    aunt01: 'Ay, tú.', aunt02: 'Come más, mira qué flaco estás.', aunt03: 'Ven, ven, siéntate y cuéntame.', aunt04: 'De pequeño eras tan travieso.', aunt05: 'Toma, no lo rechaces.', aunt06: '¿Y en qué andas ocupado últimamente?',
    sibling01: 'Vale, vale.', sibling02: 'Haz lo que creas mejor.', sibling03: 'Si necesitas ayuda, dilo.', sibling04: 'Te debo una comida.', sibling05: 'No te fuerces.', sibling06: '¿Libre este fin de semana?',
    child01: '¡Abrazo!', child02: 'Solo un poquito más de juego.', child03: '¡{title}, mírame!', child04: 'No quiero dormir.', child05: 'Cuando sea grande te cuidaré.', child06: '{title}~',
    cat01: 'Miau.', cat02: 'Te dio un cabezazo en la mano.', cat03: 'Se sentó en tu teclado y no se movió.', cat04: 'Dio una vuelta a tus pies.', cat05: 'Te pisó la barriga a mitad de la noche.',
    dog01: '¡Guau!', dog02: 'Daba vueltas a tu alrededor sin parar de mover la cola.', dog03: 'Llevó tu zapato hasta la puerta.', dog04: 'Te espera en la puerta cada vez que llegas a casa.', dog05: 'Apoyó la cabeza en tu pierna.',
    snake01: 'Se quedó enroscada, inmóvil, bajo la lámpara.', snake02: 'Sacó la lengua y te miró.', snake03: 'Se deslizó despacio desde la roca.', snake04: 'Mudó una capa de piel en silencio.',
    infant01: '{ta} soltó una risita.', infant02: '{ta} agarró tu dedo.', infant03: '{ta} te hizo una burbuja.', infant04: '{ta} se durmió en tus brazos.',
    toddler01: '¡Abrazo!', toddler02: '¡{title}, mira!', toddler03: '¡No, no!', toddler04: '¡Otra vez!', toddler05: '{title}, comida.',
    teen01: 'Sí, sí, ya lo sé.', teen02: 'No me molestes.', teen03: '…Gracias.', teen04: 'Puedo hacerlo yo solo.', teen05: 'Tengo algo que contarte.',
    rabbit01: 'Dio tres saltos.', rabbit02: 'Movió las orejas.', rabbit03: 'Se revolcó junto a tus pies.',
    hamster01: 'Corrió en la rueda toda la noche.', hamster02: 'Tenía los mofletes llenos.',
    bird01: 'Cantó una cancioncilla.', bird02: 'Se posó en tu hombro.',
    fish01: 'Soltó una burbuja.', fish02: 'Siguió tu dedo.',
    turtle01: 'Sacó despacio la cabeza.', turtle02: 'Tomaba el sol sobre la roca.',
    plant01: 'Crece hacia la ventana.', plant02: 'Sacó una hoja nueva.',
    partner01: '¿Cómo te fue el día?', partner02: 'Come tú primero, yo no tengo hambre.', partner03: 'No te pases.', partner04: '¿Qué quieres cenar?', partner05: 'Aquí estoy.', partner06: 'Vamos a pasear este fin de semana.',
  };

  const A = {
    ask_e01: ['Cuando de pequeño tenías fiebre, te llevé a la espalda durante kilómetros. ¿Te acuerdas?', ['Sí, aquel día llovía mucho.', 'Un poco. Cuéntame más.', 'No mucho, pero gracias.']],
    ask_e02: ['¿Duermes bien últimamente?', ['Bien, no te preocupes.', 'Un poco cansado, me estoy ajustando.', 'Siempre me acuesto tarde. No me imites.']],
    ask_e03: ['Cuando yo era joven…', ['Tómate tu tiempo, te escucho.', 'Eso me lo contaste cuando era pequeño.', '¿Y luego?']],
    ask_e04: ['¿Has comido hoy?', ['Sí, ¿y tú?', 'Todavía no, enseguida.', 'Perfecto, comamos juntos.']],
    ask_e05: ['¿Has vuelto a adelgazar?', ['No, es que la ropa me queda ancha.', 'Estoy ocupado, tendré cuidado.', 'Eres tú quien debería comer más.']],
    ask_e06: ['¿Soy una carga para ti, con este viejo cuerpo?', ['No, contigo me siento tranquilo.', 'Por favor, no pienses eso.', 'Somos familia.']],
    ask_e07: ['Venga, ¿una partida de ajedrez conmigo?', ['Claro, te doy tres piezas de ventaja.', 'En cuanto termine esto.', 'Hoy empiezo yo.']],
    ask_e08: ['Todavía guardo una de tus ropas de bebé.', ['¿De verdad? Me gustaría verla.', 'La has guardado todo este tiempo.', 'Guárdala bien, no la pierdas.']],
    ask_e09: ['¿Qué tal el tiempo hoy?', ['Bueno, vamos a pasear.', 'Algo frío, ponte más ropa.', '¿Por qué no vas a verlo?']],
    ask_e10: ['El sobre rojo que te di cuando te casaste, ¿lo tienes todavía?', ['Sí, lo guardo bien.', 'Déjame buscarlo.', 'Gracias por acordarte siempre.']],
    ask_p01: ['¿Has comido?', ['Sí, no te preocupes.', 'Todavía no, enseguida.', '¿Y tú?']],
    ask_p02: ['¿Estás cansado del trabajo últimamente?', ['Está bien, puedo con ello.', 'Algo cansado, pero aguanto.', 'Se pasará después de esta racha.']],
    ask_p03: ['Hace más frío, ¿llevas suficiente ropa?', ['Sí.', 'No, me pondré más luego.', 'Tú también, abrígate más.']],
    ask_p04: ['¿Puedes venir a cenar a casa?', ['Este fin de semana seguro.', 'Ahora no puedo, en unos días.', 'Me gustaría, déjame organizarme.']],
    ask_p05: ['Tú solo ahí fuera, ¿te cuidas?', ['Sí, no te preocupes.', 'A veces se me olvida.', 'La verdad, últimamente es mucho.']],
    ask_p06: ['¿Qué era lo que más miedo te daba de pequeño? ¿Te acuerdas?', ['La oscuridad.', 'Los truenos.', 'Lo olvidé, dímelo tú.']],
    ask_a01: ['Come más, mira qué flaco estás.', ['Vale, comeré.', 'No he adelgazado, lo recuerdas mal.', 'Come tú también.']],
    ask_a02: ['Te llevé a la feria del templo cuando eras pequeño. ¿Te acuerdas?', ['Sí, me compraste una figura de azúcar.', 'Un poquito.', 'Cuéntame ese día.']],
    ask_a03: ['¿Algo bonito últimamente?', ['Sí, déjame contarte.', 'Nada en especial.', 'Verte ya me alegra.']],
    ask_a04: ['¿Tienes a alguien especial?', ['Todavía no, sin prisa.', 'Mejor no hablemos de eso.', 'Sí, te lo presentaré.']],
    ask_s01: ['¿Te acuerdas de cuando nos peleábamos por el mando de la tele?', ['Sí, siempre hacías trampa.', 'Ja, me acuerdo.', 'Ahora te dejo ir primero.']],
    ask_s02: ['¿Algo divertido últimamente?', ['Sí, ya te lo contaré.', 'No, solo trabajo todos los días.', 'Tú primero.']],
    ask_s03: ['¿Libre este fin de semana? Salgamos.', ['Sí, ¿adónde?', 'Esta semana no, la próxima.', 'Vale, elige tú.']],
    ask_s04: ['¿Te has acostado tarde otra vez?', ['Me has pillado.', 'No, no adivines.', 'Esta noche pronto a la cama, lo prometo.']],
    ask_s05: ['Hoy tengo el estómago un poco revuelto. Me apetece algo caliente.', ['Te sirvo algo caliente.', '¿Quieres descansar primero?', '¿Necesitas que me quede?']],
    ask_s06: ['Estos días no me encuentro bien y estoy de mal humor. Ten paciencia conmigo.', ['No pasa nada, te dejo tranquilo.', '¿Quieres algo caliente para beber?', 'Dímelo cuando quieras.']],
    ask_s07: ['¿Cómo están mamá y papá últimamente?', ['Bien, ¿y tú?', 'Estoy algo preocupado, hablémoslo.', 'Los llamo esta semana.']],
    ask_c01: ['{title}, ¿tú también fuiste tan pequeño?', ['Sí, incluso más pequeño que tú.', 'Yo también hacía muchas preguntas.', '¡Adivina!']],
    ask_c02: ['{title}, ¿por qué se hace de noche?', ['Porque el sol se fue a dormir.', 'Porque la Tierra gira.', 'Vamos a buscarlo juntos.']],
    ask_c03: ['{title}, ¿hoy vuelves pronto?', ['Sí, lo intentaré.', 'No sé, pero te llamo.', 'Volveré pronto para jugar.']],
    ask_c04: ['{title}, hice un dibujo. ¿Quieres verlo?', ['¡Sí, enséñamelo!', 'Vale, dame dos minutos.', '¿Qué dibujaste?']],
    ask_c05: ['{title}, ¿puedo ser como tú cuando sea grande?', ['Serás aún mejor.', '¿En qué quieres parecerte?', 'Ser tú mismo es lo mejor.']],
    ask_t01: ['{title}, ¿qué es eso?', ['Eso es un pájaro.', '¿Qué crees que es?', 'Vamos a verlo.']],
    ask_t02: ['{title}, quiero esto.', ['Vale, toma.', 'Primero di por favor.', 'Este no, pero aquel sí.']],
    ask_t03: ['{title}, no te vayas.', ['No me voy, estoy aquí.', 'Vuelvo enseguida.', 'Ven conmigo.']],
    ask_t04: ['{title}, ¡lo conseguí!', ['¡Genial! Otra vez.', 'A ver.', '¿Lo hiciste tú solo?']],
    ask_g01: ['¿Eras así de joven?', ['Más o menos, yo también me enfadaba.', 'Yo era peor.', '¿Quieres que te cuente?']],
    ask_g02: ['No quiero ir al colegio.', ['¿Qué ha pasado?', 'Hoy descansa, mañana hablamos.', 'Te acompaño.']],
    ask_g03: ['¿Qué debería hacer en el futuro?', ['¿Qué te gusta ahora?', 'Sin prisa, piénsalo con calma.', 'Yo tampoco lo sabía de joven.']],
    ask_g04: ['¿Estás cansado?', ['Un poco, pero bien.', 'Te diste cuenta.', 'Cuando te veo, ya no.']],
    ask_m01: ['¿Qué tal tu día?', ['No estuvo mal, ¿y el tuyo?', 'Algo cansado, abrázame.', 'Comamos primero y hablemos despacio.']],
    ask_m02: ['¿Adónde quieres ir este fin de semana?', ['A pasear por el parque.', 'Quedarme durmiendo todo el día.', 'Elige tú, te acompaño.']],
    ask_m03: ['¿Te acuerdas de la primera vez que nos vimos?', ['Sí, llegaste tarde.', 'Un poquito.', 'Cuéntame otra vez ese día.']],
    ask_m04: ['¿Hay algo que te preocupe últimamente?', ['Un poco, te lo cuento luego.', 'No, solo cansancio.', 'Iba a hablarlo contigo.']],
  };

  const N = {
    n01: '¿Cuánto hace que no llamas a tu familia?', n02: 'Hay alguien con quien llevas mucho sin hablar, ¿verdad?', n03: '¿Has hablado hoy con alguien, y no del trabajo?', n04: '¿Cuándo viste a un amigo por última vez?', n05: 'Escribe a esa persona que acaba de venirte a la cabeza, no hace falta nada grande.',
    n06: 'Levántate, bebe agua y mira por la ventana.', n07: 'Llevas mucho rato sentado. Camina cinco minutos.', n08: '¿Cuánto hace que no invitas a un amigo a cenar?', n09: 'Escribe a alguien con quien llevas siglos sin hablar: ¿qué tal estás?', n10: 'Cena esta noche con tu familia, sin mirar el móvil.',
    n11: 'Llevas un rato sin moverte. Estírate.', n12: 'Mira a lo lejos y descansa los ojos.',
  };

  const conds = {
    diabetes: {
      lines: { request: { medicine: ['¿Es hora de las pastillas?', '{ta} miró la caja de pastillas y luego a ti.'], sugar: ['{ta} tocó el pequeño medidor de glucosa.', '¿Toca medirla?'] } },
      events: { dinner: { say: '¿Qué hay para cenar?', choices: [{ label: 'Cerdo estofado', reply: '{ta} comió contento. Sabías que no le convenía.' }, { label: 'Pescado al vapor con verduras', reply: '{ta} refunfuñó que estaba soso, pero se lo terminó.' }, { label: 'Papilla de cereales integrales con guarnición', reply: '{ta} asintió y dijo que valdría.' }] } },
    },
    hypertension: {
      lines: { request: { medicine: ['¿Es hora de las pastillas?', '{ta} miró la caja de pastillas.'], bp: ['Hoy todavía no me he tomado la tensión.', '{ta} se frotó las sienes.'] } },
      events: { salty: { say: '¿Le pongo sal al plato hoy?', choices: [{ label: 'Una buena pizca más', reply: '{ta} dijo que así sabe mejor. No dijiste nada.' }, { label: 'Poca sal y un chorrito de vinagre', reply: '{ta} lo probó y dijo que valdría.' }, { label: 'Sin sal y con mucho jengibre', reply: '{ta} frunció el ceño, pero limpió el plato.' }] } },
    },
    arthritis: { lines: { request: { joint: ['{ta} se frotó la rodilla y respiró hondo en silencio.', 'Va a cambiar el tiempo, me duelen otra vez las piernas.'] } } },
    cold: { lines: { request: { fever: ['{ta} tenía la cara caliente y ninguna energía.', '{ta} se recostó sin fuerzas, con la frente ardiendo.'] } } },
    asthma: { lines: { request: { breath: ['{ta} tosió varias veces y respiraba rápido.', '{ta} se llevó una mano al pecho, respirando con dificultad.'] } } },
    forgetful: { lines: { request: { reorient: ['¿Dónde puse las llaves?', '¿Qué día es hoy?', '{ta} se quedó en la puerta sin recordar adónde iba.'] } } },
  };

  C.registerPack('es', C.buildPack({ voices: V, sayings: S, asks: A, nudges: N, conds }));
})(globalThis.CY = globalThis.CY || {});
