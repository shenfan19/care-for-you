/* Deutsches Inhaltspaket: Sätze der Figuren, Satzsammlung, Fragen, Erinnerungen an das echte Leben und Texte der Krankheiten.
   Die IDs der Einträge sind in allen Sprachen gleich. {ta} wird zu er, sie oder es, am Satzanfang großgeschrieben. */
(function (CY) {
  const C = CY.content;
  const V = {};

  V.elder = {
    request: {
      thirst: ['…Ich habe ein bisschen Durst.', 'Ähm, etwas Wasser, bitte.'], hunger: ['Wie spät ist es? Hast du schon gegessen?', 'Mein Magen ist ein wenig leer.'], rest: ['Ich setze mich kurz.', 'Mein Rücken meldet sich wieder.'],
      company: ['Du hast zu tun… schon gut.', 'Setzt du dich zu mir?'], medicine: ['Ist es Zeit für meine Tabletten?', 'Ich weiß nicht mehr, ob ich sie genommen habe.'], hygiene: ['Ich könnte mich mal waschen.'], mobility: ['Meine Beine sind steif. Vielleicht ein kleiner Spaziergang?'],
    },
    thanks: { water: ['Mm.'], feed: ['Gut, gut.'], meal: ['Köstlich. Du kochst gut.'], rest: ['Ich muss mich nur kurz anlehnen.'], pet: ['…'], hand: ['Deine Hände sind so groß geworden.'], medicine: ['Genommen. Denk auch an dich.'], walk: ['Die Luft tut mir gut.'], default: ['Mm.'] },
    glance: ['{ta} sah dich von der Tür aus an, sagte nichts und ging wieder.', '{ta} saß in der Nähe und sah dich einfach an.', '{ta} hüstelte leise, als wollte {ta} etwas sagen, und ließ es dann.'],
    cares_back: ['{ta} stellte wortlos ein Glas Wasser neben deine Hand.', '{ta} drehte leise die Schreibtischlampe etwas heller.', '{ta} kam herüber und zog dir den Mantel wieder über die Schultern.', '{ta} brachte einen Teller gewaschenes Obst: iss es, solange es frisch ist.'],
    reveal: '{ta} sah dich an und sagte: du läufst ständig um mich herum, wirst du nicht müde? Mir geht es gut. Du musst auch essen.',
  };
  V.parent = {
    request: {
      thirst: ['Kannst du mir ein Glas Wasser einschenken?', 'Mein Hals ist etwas trocken.'], hunger: ['Hast du gegessen? Ich komme schon zurecht.', 'Es ist wohl Zeit zum Kochen.'], rest: ['Ich ruhe mich kurz aus, mach dir keine Gedanken.', 'Heute bin ich etwas müde.'],
      company: ['Wie geht es dir in letzter Zeit?', 'Komm, sprich ein bisschen mit mir.'], medicine: ['Ist es Zeit für meine Medizin?', 'Schau mal für mich, habe ich meine Tabletten genommen?'], hygiene: ['Ich mache mich erst kurz frisch.'],
    },
    thanks: { water: ['Das reicht, danke.'], feed: ['Iss du auch.'], meal: ['Das duftet. Das hättest du nicht tun müssen.'], rest: ['Ich lege mich kurz hin, dann geht es wieder.'], pet: ['Oh, wie groß du geworden bist.'], hand: ['Deine Hände sind kalt.'], default: ['Schon gut, kümmere dich nicht um mich, mach deine Arbeit.'] },
    glance: ['{ta} blieb kurz in der Küchentür stehen, sah dich an und ging wieder an die Arbeit.', '{ta} hielt das Telefon, wollte etwas fragen und legte es wieder weg.', '{ta} ging ganz leise hinter dir vorbei.'],
    cares_back: ['{ta} stellte eine Schale Suppe an deinen Schreibtisch und sagte: trink sie, solange sie heiß ist.', '{ta} füllte deine Tasse unauffällig nach.', '{ta} sagte: bleib nicht zu lange auf, ich habe dir das Licht angelassen.', '{ta} legte die Kleidung zusammen, die du ausgezogen hattest.'],
    reveal: '{ta} sah dich an und sagte: hier ist alles gut. Dein eigenes Leben zählt auch.',
  };
  V.aunt = {
    request: {
      thirst: ['Ach, ein Schluck Wasser, Liebes?', 'Ich verdurste, gibt es Wasser?'], hunger: ['Ist das Essen fertig? Lass mich helfen.', 'Ich habe ein bisschen Hunger, gibt es was?'], rest: ['Ich setze mich eine Minute, die Beine tun weh.', 'Ich kann nicht mehr stehen, lass mich ausruhen.'],
      company: ['Komm, komm, lass uns plaudern!', 'Warum bist du in letzter Zeit so still?'], medicine: ['Wo habe ich nur die Tabletten hingelegt?', 'Muss ich jetzt meine Medizin nehmen?'], hygiene: ['Ich wasche mir schnell das Gesicht.'],
    },
    thanks: { water: ['Danke, danke.'], feed: ['Köstlich, köstlich.'], meal: ['Ach, wunderbar.'], rest: ['So, jetzt geht es besser.'], pet: ['Ach, du.'], hand: ['Du liebes Kind.'], default: ['Ach, gut.'] },
    glance: ['{ta} lugte um die Tür und lächelte dich an.', '{ta} winkte dir zu, während {ta} im Wohnzimmer telefonierte.', '{ta} ging mit einem Teller Obst vorbei und nickte dir zu.'],
    cares_back: ['{ta} legte dir das größte Stück Fleisch in die Schale.', '{ta} steckte dir einen roten Umschlag zu: nimm, lehn nicht ab.', '{ta} sagte: du siehst dünner aus. Dann füllte {ta} dir eine Schale Suppe.'],
    reveal: '{ta} klopfte dir auf die Hand und sagte: denk nicht nur an uns. Dass es dir gut geht, ist mehr wert als alles.',
  };
  V.sibling = {
    request: {
      thirst: ['Hey, hast du Wasser?', 'Durst. Schenk mir eins ein.'], hunger: ['Hunger. Bestellen wir was?', 'Gibt es was zu essen?'], rest: ['Ich penne kurz. Weck mich nicht.', 'So müde.'],
      company: ['Was machst du gerade?', 'Lust auf eine Runde irgendwas?', 'Komm raus und quatsch ein bisschen mit mir.'], medicine: ['Ist wohl Zeit für die Tabletten.'], hygiene: ['Ich hüpfe mal unter die Dusche.'],
    },
    thanks: { water: ['Okay.'], feed: ['Okay, ich schulde dir ein Essen.'], meal: ['Nicht schlecht. Das schulde ich dir.'], rest: ['Danke.'], pet: ['Was.'], hand: ['…Voll kitschig.'], chat: ['Ha. Das hat geholfen.'], default: ['Okay.'] },
    glance: ['{ta} lehnte am Türrahmen und sah dich eine Weile wortlos an.', '{ta} schickte dir ein Meme und war dann still.', '{ta} hob das Kinn in deine Richtung.'],
    cares_back: ['{ta} ließ deinen Lieblingssnack auf dem Schreibtisch liegen, als hätte {ta} ihn zufällig vergessen.', '{ta} sagte: ich pass hier auf, geh du schlafen.', '{ta} nahm dein Paket mit rein.'],
    reveal: '{ta} sagte: trag nicht alles allein. Ich bin da.',
  };
  V.partner = {
    request: {
      thirst: ['Bringst du mir ein Glas Wasser mit, wenn du aufstehst?', 'Ich habe etwas Durst.'], hunger: ['Was möchtest du zum Abendessen?', 'Ich habe ein bisschen Hunger.'], rest: ['Ich bin müde, ich will mich nur kurz an dich lehnen.'], company: ['Wir haben heute kaum geredet.', 'Setzt du dich zu mir?'],
      hygiene: ['Ich dusche erst mal.'], medicine: ['Ist es Zeit für die Medizin?', 'Schau mal für mich, habe ich die Tabletten genommen?'],
    },
    thanks: { water: ['Danke.'], meal: ['Köstlich. Danke fürs Kochen.'], chat: ['Mit dir zu reden tut mir gut.'], pet: ['Mm, das ist schön.'], default: ['Danke.'] },
    glance: ['{ta} sah dich quer durch den Raum an und lächelte.', '{ta} ging vorbei und berührte sanft deine Schulter.', '{ta} setzte sich mit zwei Tassen Tee neben dich.'],
    cares_back: ['{ta} wärmte deinen Teil vom Abendessen auf und stellte ihn in Reichweite.', '{ta} machte das Licht für dich aus und sagte: geh früh schlafen.', '{ta} legte den Mantel zusammen, den du hast fallen lassen, und hängte ihn über den Stuhl.'],
    reveal: '{ta} sagte: du hältst schon zu lange alles allein zusammen. Heute bin ich dran.',
  };
  V.child = {
    request: {
      thirst: ['{title}, Wasser bitte.', 'Wasser!'], hunger: ['Ich habe Hunger.', '{title}, ich will essen.'], rest: ['Ich bin müde…', '{title}, ich will ins Bett.'], company: ['{title}~', '{title}, guck mich an.'],
      play: ['Spielen! {title}, spielen!', '{title}, spielst du ein bisschen mit mir?'], hygiene: ['Ich will baden.'], homework: ['Die hier verstehe ich nicht.', 'Ich habe noch so viele Hausaufgaben.'],
    },
    thanks: { water: ['Gluck gluck.'], feed: ['Lecker!'], meal: ['Lecker!'], play: ['Hihihi.'], soothe: ['…(schloss langsam die Augen)'], pet: ['Hihi.'], hand: ['{title}s Hände sind warm.'], bath: ['Plitsch platsch.'], read: ['Nochmal, nochmal!'], homework: ['Ah, jetzt versteh ich es!'], default: ['Ja!'] },
    glance: ['{ta} stand mit einem Spielzeug im Arm an der Tür und sah dich an.', '{ta} winkte dir von weitem zu.', '{ta} drückte das Gesicht an den Türrahmen, die Augen leuchteten.'],
    cares_back: ['{ta} kam gelaufen und drückte dir ein Bonbon in die Hand, von irgendwoher.', '{ta} berührte dein Gesicht und sagte: nicht weinen, {title}. Du hattest gar nicht geweint.', '{ta} legte den liebsten Teddy auf deinen Stuhl.', '{ta} stellte sich auf die Zehenspitzen und klopfte dir mit der kleinen Hand auf die Schulter.'],
    reveal: '{ta} umarmte dein Bein, sah zu dir hoch und sagte: {title}, ich werde mich um dich kümmern.',
  };
  V.infant = {
    request: {
      thirst: ['{ta} machte den Mund auf und quengelte.'], hunger: ['{ta} brach in Tränen aus, die kleinen Hände suchten nach Essen.', '{ta} weinte und saugte an einer kleinen Faust.'], rest: ['{ta} rieb sich die Augen und quengelte.'], company: ['{ta} streckte beide Händchen aus und wartete darauf, hochgenommen zu werden.'],
      play: ['{ta} starrte dich an und brabbelte.'], diaper: ['{ta} wand sich und fing an zu weinen.'], fever: ['{ta} hatte ein rotes Gesichtchen und weinte schwach.'], hygiene: ['Vielleicht ist es Zeit fürs Bad.'],
    },
    thanks: { feed: ['Gluck, gluck. {ta} trinkt zufrieden.'], diaper: ['{ta} gab ein wohliges Geräusch von sich.'], soothe: ['{ta} schloss langsam die Augen.'], hug: ['{ta} vergrub das Gesicht in deinen Armen.'], pet: ['{ta} kicherte.'], play: ['{ta} kicherte und kicherte.'], bath: ['{ta} planschte glücklich.'], default: ['{ta} beruhigte sich.'] },
    glance: ['{ta} lag im Bettchen, die Augen offen, und sah dich an.', '{ta} wedelte mit einem Händchen.'],
    cares_back: ['{ta} griff einen deiner Finger und ließ nicht los.', '{ta} lächelte dich mit zahnlosem Mund an.'],
    reveal: '{ta} sah dich an und streckte die Hand aus, um dein Gesicht zu berühren.',
    cry: ['Wääh… wääh…', 'Wä-wä-wä…', '{ta} weinte und konnte nicht aufhören.'],
  };
  V.toddler = {
    request: {
      thirst: ['{title}, Wasser.', 'Trinken!'], hunger: ['Hunger!', '{title}, Essen.'], rest: ['Müde…', '{title}, Arm, schlafen.'], company: ['{title}! {title}!', 'Guck, guck.'],
      play: ['Spielen! Spielen!', '{title}, zusammen spielen.'], diaper: ['{title}, nass.', '{ta} zog an der Hose und verzog das Gesicht.'], fever: ['{title}, heiß, bäh.'], breath: ['{ta} hustete einige Male und atmete schnell.'], hygiene: ['{title}, baden, baden!'],
    },
    thanks: { feed: ['Lecker! Mehr!'], diaper: ['Besser.'], soothe: ['{ta} schloss langsam die Augen.'], hug: ['Arm, nicht loslassen.'], pet: ['Hihi.'], play: ['Nochmal nochmal!'], water: ['Gluck gluck.'], bath: ['Platsch platsch!'], read: ['Nochmal! Nochmal!'], default: ['Ja!'] },
    glance: ['{ta} stand mit einem Spielzeug im Arm an der Tür.', '{ta} tapste zwei Schritte auf dich zu und blieb stehen.', '{ta} winkte dir zu.'],
    cares_back: ['{ta} kam herangewackelt und drückte dir einen Keks in die Hand.', '{ta} klopfte dir aufs Bein und sagte: nicht weinen. Du hattest gar nicht geweint.', '{ta} legte den Teddy auf deinen Stuhl.'],
    reveal: '{ta} umarmte dein Bein, sah zu dir hoch und sagte: {title}, gut.',
    cry: ['Wääh, {title}!', 'Buhuhu, nein, nein!', '{ta} weinte mit knallrotem Gesicht.'],
  };
  V.teen = {
    request: {
      thirst: ['Hast du Wasser?', 'Mega durstig.'], hunger: ['Ich habe Hunger, gibt es was zu essen?', 'Was gibt es heute Abend?'], rest: ['So müde, lass mich in Ruhe.'], company: ['…Hast du Zeit?', 'Ich muss dir was sagen.'],
      homework: ['Die hier verstehe ich nicht.', 'So viele Hausaufgaben, nervt.'], fever: ['Ich glaube, ich habe Fieber.'], hygiene: ['Ich gehe duschen.'],
    },
    thanks: { meal: ['Na gut. …Danke.'], homework: ['Ah, so geht das.'], chat: ['…Es war nichts, aber es hilft, es zu sagen.'], game: ['Okay, das war lustig.'], pet: ['Was.'], default: ['Mm.'] },
    glance: ['{ta} ging mit Kopfhörern vorbei und kam wieder zurück.', '{ta} lehnte am Türrahmen und wollte etwas sagen.'],
    cares_back: ['{ta} füllte deine Tasse auf, als wäre nichts.', '{ta} sagte: übernimm dich nicht. Dann ging {ta} schnell zurück ins Zimmer.'],
    reveal: '{ta} sagte: ich weiß schon, wie schwer es für dich ist.',
  };
  V.cat = {
    request: {
      thirst: ['{ta} stand am Wassernapf, sah ihn an und dann dich.'], hunger: ['{ta} strich einmal um deine Füße und miaute.'], company: ['{ta} sprang auf den Schreibtisch und setzte sich neben die Tastatur.'], play: ['{ta} brachte das abgenutzte Bällchen und legte es dir vor die Füße.'], clean: ['{ta} warf dem Katzenklo einen langen, bedeutungsvollen Blick zu.'],
    },
    thanks: { water: ['{ta} beugte sich vor und trank.'], feed: ['{ta} vergrub das Gesicht im Napf, der Schwanz wedelte.'], play: ['{ta} sprang los und sprang zurück.'], pet: ['{ta} kniff die Augen zusammen und schnurrte.'], hand: ['{ta} drehte sich einmal in deinen Armen und legte sich hin.'], groom: ['{ta} streckte sich schnurrend.'], clean: ['{ta} schnupperte zufrieden.'], default: ['Miau.'] },
    glance: ['{ta} lag auf dem Fensterbrett und warf dir einen Blick zu.', '{ta} kam, stupste deine Hand mit dem Kopf an und ging wieder.'],
    cares_back: ['{ta} kletterte auf deinen Schoß und legte sich hin. Du merkst, dass deine Schultern verspannt waren.', '{ta} saß still neben dir, bis du aufstandest.', '{ta} strich mit dem Schwanz über deinen Handrücken, als wollte {ta} sagen: Zeit zum Ausruhen.'],
    reveal: 'Den ganzen Nachmittag lag {ta} zu deinen Füßen und hob den Kopf, sobald du dich bewegtest. {ta} hatte die ganze Zeit auf dich gewartet.',
  };
  V.dog = {
    request: {
      thirst: ['{ta} leckte sich die Lefzen und sah den leeren Napf an.'], hunger: ['{ta} saß neben dem Futternapf, der Schwanz fegte über den Boden.'], company: ['{ta} legte das Kinn auf dein Knie und sah dich an.'], play: ['{ta} brachte die Leine und stellte sich vor dich.'],
    },
    thanks: { water: ['{ta} trank den halben Napf leer.'], feed: ['{ta} hatte in drei Bissen alles weg und sah auf.'], play: ['{ta} sauste eine Runde und kam zurück.'], walk: ['{ta} trabte stolz neben dir her.'], pet: ['{ta} rollte sich auf den Rücken und zeigte den Bauch.'], hand: ['{ta} lehnte sich an dich und rührte sich nicht.'], groom: ['{ta} wedelte mit dem ganzen Hinterteil.'], default: ['Wuff.'] },
    glance: ['{ta} lag an der Tür und hob den Kopf, als du dich bewegtest.', '{ta} wedelte mit dem Schwanz und legte sich wieder hin.'],
    cares_back: ['{ta} legte ein nasses Spielzeug vor deine Füße und gab dir damit das Beste, was {ta} hatte.', 'Immer wenn du seufztest, kam {ta} und stupste deine Hand an.', '{ta} blieb neben deinem Stuhl, bis du aufstandest.'],
    reveal: 'Den ganzen Abend blieb {ta} bei dir, und jedes Mal, wenn du dich anders hinsetztest, tat es {ta} auch. {ta} hatte dir die ganze Zeit Gesellschaft geleistet.',
  };
  V.rabbit = {
    request: { thirst: ['{ta} leckte an der leeren Trinkflasche.'], hunger: ['{ta} hockte am Futternapf, die Nase zuckte.'], company: ['{ta} stupste deinen Fuß an und klopfte einmal auf.'], play: ['{ta} drehte Runden im Käfig und wollte draußen hoppeln.'], clean: ['Der Käfig riecht ein wenig.'] },
    thanks: { water: ['{ta} trank mehrere Schlucke.'], feed: ['{ta} knabberte zufrieden.'], play: ['{ta} hoppelte dreimal und drehte sich im Kreis.'], pet: ['{ta} kniff die Augen zu und legte die Ohren an.'], groom: ['{ta} hielt ganz still.'], clean: ['{ta} schnupperte zustimmend.'], default: ['{ta} zuckte mit der Nase.'] },
    glance: ['{ta} stellte die Ohren auf und sah dich an.'], cares_back: ['{ta} lag ruhig zu deinen Füßen.', '{ta} leckte deine Hand.'], reveal: 'Die ganze Nacht lag {ta} zu deinen Füßen, die Ohren folgten jeder deiner Bewegungen.',
  };
  V.hamster = {
    request: { thirst: ['{ta} klammerte sich an die Trinkflasche. Sie ist leer.'], hunger: ['{ta} wühlte im leeren Napf.'], play: ['{ta} sah dich vom Laufrad aus an.'], clean: ['Die Einstreu muss gewechselt werden.'] },
    thanks: { water: ['{ta} leckte flink.'], feed: ['{ta} stopfte sich beide Backen voll.'], play: ['{ta} rannte mit voller Geschwindigkeit im Laufrad.'], pet: ['{ta} rollte sich in deiner Handfläche zusammen.'], groom: ['{ta} quiekte.'], clean: ['{ta} tauchte in die neue Einstreu und kommt nicht mehr raus.'], default: ['{ta} quiekte.'] },
    glance: ['{ta} hielt im Laufrad inne und sah dich an.'], cares_back: ['{ta} schob dir einen Sonnenblumenkern hin.'], reveal: '{ta} schläft tagsüber und rennt die ganze Nacht, als würde {ta} für dich Wache halten.',
  };
  V.bird = {
    request: { thirst: ['{ta} stand am Wasserbecher und zwitscherte zweimal.'], hunger: ['{ta} zwitscherte am Futterspender.'], play: ['{ta} hüpfte hin und her und wollte draußen fliegen.'], clean: ['Der Käfigboden muss gereinigt werden.'] },
    thanks: { water: ['{ta} pickte im Wasser.'], feed: ['{ta} pickte sehr ernsthaft.'], play: ['{ta} flog eine Runde durch den Raum und landete auf deiner Schulter.'], pet: ['{ta} legte den Kopf schief und rieb sich an deinem Finger.'], groom: ['{ta} plusterte sich zufrieden auf.'], clean: ['{ta} schüttelte das Gefieder.'], default: ['{ta} zwitscherte.'] },
    glance: ['{ta} legte den Kopf schief und sah dich an.'], cares_back: ['{ta} landete auf deiner Schulter und summte ein kleines Lied.'], reveal: '{ta} singt immer, wenn du still bist, als hätte {ta} Angst, du seist allein.',
  };
  V.fish = {
    request: { hunger: ['{ta} schwamm mit offenem Maul an die Oberfläche.'], clean: ['Das Wasser im Becken ist trüb.'], oxygen: ['{ta} schnappte an der Oberfläche nach Luft.'] },
    thanks: { feed: ['{ta} schoss heran und schluckte es in einem Zug.'], clean: ['Das Wasser ist klar und {ta} schwamm eine fröhliche Runde.'], default: ['{ta} blies eine Blase.'] },
    glance: ['{ta} drückte sich ans Glas und sah dich an.'], cares_back: ['{ta} folgte deinem Finger hin und her.'], reveal: '{ta} schwimmt einfach nur still, aber wenn du näher kommst, schwimmt {ta} zu dir.',
  };
  V.turtle = {
    request: { thirst: ['Der Wasserstand ist etwas niedrig.'], hunger: ['{ta} streckte den Hals und musterte den Napf.'], warmth: ['{ta} lag regungslos in einer Ecke.'], clean: ['Das Wasser ist schmutzig.'] },
    thanks: { water: ['{ta} schwamm langsam einen Kreis.'], feed: ['{ta} fraß Stück für Stück.'], warm: ['{ta} streckte alle vier Beine unter der Lampe aus.'], pet: ['{ta} zog den Hals ein und streckte ihn langsam wieder heraus.'], groom: ['{ta} blinzelte langsam.'], clean: ['{ta} paddelte vergnügt.'], default: ['{ta} sah dich an.'] },
    glance: ['{ta} kletterte langsam auf einen Stein und beobachtete dich.'], cares_back: ['{ta} kroch langsam an die Stelle, die dir am nächsten war.'], reveal: '{ta} sagt nichts und ist einfach, langsam, immer da.',
  };
  V.snake = {
    request: { warmth: ['{ta} lag zusammengerollt in einer Ecke des Terrariums und rührte sich kaum.'], thirst: ['Der Wassernapf ist leer.'], hunger: ['{ta} hob den Kopf und züngelte langsam.'] },
    thanks: { warm: ['{ta} streckte sich langsam.'], water: ['{ta} glitt zum Wassernapf.'], feed: ['{ta} schluckte es still hinunter.'], pet: ['{ta} drehte langsam den Kopf und züngelte.'], default: ['{ta} sah dich an.'] },
    glance: ['{ta} lag unter der Lampe zusammengerollt, nur die Augen folgten dir.', '{ta} wechselte lautlos den Platz.'],
    cares_back: ['{ta} rollte sich ruhig auf der Seite zusammen, die dir am nächsten war, ohne Aufhebens.', '{ta} blieb völlig still, während du arbeitest, als fürchtete {ta}, dich zu stören.'],
    reveal: '{ta} sagte nichts, blieb nur den ganzen Nachmittag an der Stelle, die dir am nächsten war.',
  };
  V.plant = {
    request: { water: ['Die Blätter hängen ein bisschen.', 'Die Erde ist trocken.'], sun: ['{ta} neigt sich zum Fenster.'], fertilize: ['Die neuen Blätter wachsen langsam.'], prune: ['Einige Blätter sind gelb geworden.'] },
    thanks: { water: ['Die Blätter breiteten sich langsam aus.'], sun: ['{ta} scheint erleichtert aufzuatmen.'], fertilize: ['{ta} sieht viel lebendiger aus.'], prune: ['{ta} sieht ordentlicher aus.'], repot: ['{ta} machte es sich im neuen Topf gemütlich.'], pet: ['Die Blätter bewegten sich leicht.'], default: ['Die Blätter bewegten sich leicht.'] },
    glance: ['Sonnenlicht fiel auf die Blätter und die Schatten wanderten langsam.', '{ta} hat ein neues Blatt getrieben.'], cares_back: ['{ta} öffnete eine winzige Blüte, dir zugewandt.', 'Ein neues Blatt rollte sich zu einem kleinen Herz.'], reveal: 'Jedes Mal, wenn du vorbeikommst, wächst {ta} ein Stück mehr zu dir hin.',
  };

  const S = {
    elder01: 'Hast du schon gegessen?', elder02: 'Draußen ist es kalt, zieh dich wärmer an.', elder03: 'Nichts, nur alte Beschwerden.', elder04: 'Mach du nur, kümmere dich nicht um mich.', elder05: 'Als ich jung war…', elder06: 'Langsam, fall nicht hin.', elder07: 'Pass auf der Straße auf.', elder08: 'Ich habe keinen Hunger, iss du.', elder09: 'Der alte Zhang von nebenan ist wieder Schach spielen gegangen.', elder10: 'Junger Mann, hast du gegessen?',
    parent01: 'Hast du gegessen?', parent02: 'Bleib nicht so lange auf. Schlaf früh.', parent03: 'Sag Bescheid, wenn du ankommst.', parent04: 'Reicht dein Geld?', parent05: 'Dein Leben entscheidest du selbst.', parent06: 'Mir geht es gut, mach dir keine Sorgen.', parent07: 'Es wird kälter, zieh noch eine Schicht an.', parent08: 'Kommst du zum Abendessen?',
    aunt01: 'Ach, du.', aunt02: 'Iss mehr, schau wie dünn du bist.', aunt03: 'Komm, komm, setz dich und erzähl.', aunt04: 'Als du klein warst, warst du so frech.', aunt05: 'Nimm, lehn nicht ab.', aunt06: 'Womit bist du in letzter Zeit beschäftigt?',
    sibling01: 'Ja, ja.', sibling02: 'Mach, wie du denkst.', sibling03: 'Sag, wenn du Hilfe brauchst.', sibling04: 'Ich schulde dir ein Essen.', sibling05: 'Zwing dich nicht.', sibling06: 'Hast du am Wochenende Zeit?',
    child01: 'Umarmung!', child02: 'Nur noch ein bisschen spielen.', child03: '{title}, guck mich an!', child04: 'Ich will nicht schlafen.', child05: 'Wenn ich groß bin, kümmere ich mich um dich.', child06: '{title}~',
    cat01: 'Miau.', cat02: 'Sie stupste deine Hand mit dem Kopf an.', cat03: 'Sie saß auf deiner Tastatur und rührte sich nicht.', cat04: 'Sie strich einmal um deine Füße.', cat05: 'Sie trat mitten in der Nacht auf deinen Bauch.',
    dog01: 'Wuff!', dog02: 'Er lief um dich herum, der Schwanz stand nie still.', dog03: 'Er trug deinen Schuh zur Tür.', dog04: 'Er wartet an der Tür, wenn du nach Hause kommst.', dog05: 'Er legte den Kopf auf dein Bein.',
    snake01: 'Sie lag regungslos zusammengerollt unter der Lampe.', snake02: 'Sie züngelte und sah dich an.', snake03: 'Sie glitt langsam vom Stein.', snake04: 'Sie häutete sich leise.',
    infant01: '{ta} kicherte.', infant02: '{ta} griff nach deinem Finger.', infant03: '{ta} blies dir eine Blase.', infant04: '{ta} schlief in deinen Armen ein.',
    toddler01: 'Umarmung!', toddler02: '{title}, guck!', toddler03: 'Nein nein!', toddler04: 'Nochmal!', toddler05: '{title}, Essen.',
    teen01: 'Ja ja, ich weiß.', teen02: 'Lass mich in Ruhe.', teen03: '…Danke.', teen04: 'Ich schaff das allein.', teen05: 'Ich muss dir was sagen.',
    rabbit01: 'Es hoppelte dreimal.', rabbit02: 'Seine Ohren zuckten.', rabbit03: 'Es wälzte sich zu deinen Füßen.',
    hamster01: 'Es lief die ganze Nacht im Laufrad.', hamster02: 'Seine Backen waren prall gefüllt.',
    bird01: 'Er sang ein kleines Lied.', bird02: 'Er landete auf deiner Schulter.',
    fish01: 'Er blies eine Blase.', fish02: 'Er folgte deinem Finger.',
    turtle01: 'Sie streckte langsam den Kopf heraus.', turtle02: 'Sie sonnte sich auf dem Stein.',
    plant01: 'Sie wächst zum Fenster hin.', plant02: 'Sie hat ein neues Blatt getrieben.',
    partner01: 'Wie war dein Tag?', partner02: 'Iss du zuerst, ich habe keinen Hunger.', partner03: 'Übernimm dich nicht.', partner04: 'Was möchtest du zum Abendessen?', partner05: 'Ich bin da.', partner06: 'Lass uns am Wochenende spazieren gehen.',
  };

  const A = {
    ask_e01: ['Als du klein warst und Fieber hattest, habe ich dich kilometerweit auf dem Rücken getragen. Erinnerst du dich?', ['Ja, an dem Tag hat es stark geregnet.', 'Ein bisschen. Erzähl mehr.', 'Nicht wirklich, aber danke.']],
    ask_e02: ['Schläfst du in letzter Zeit gut?', ['Gut, mach dir keine Sorgen.', 'Etwas müde, ich stelle mich um.', 'Immer zu spät im Bett. Mach es mir nicht nach.']],
    ask_e03: ['Als ich jung war…', ['Lass dir Zeit, ich höre zu.', 'Das hast du mir erzählt, als ich klein war.', 'Und dann?']],
    ask_e04: ['Hast du heute schon gegessen?', ['Ja, und du?', 'Noch nicht, gleich.', 'Passt, lass uns zusammen essen.']],
    ask_e05: ['Hast du wieder abgenommen?', ['Nein, die Kleidung ist nur weit.', 'Ich bin beschäftigt, ich achte darauf.', 'Du solltest mehr essen.']],
    ask_e06: ['Bin ich dir eine Last, mit meinem alten Körper?', ['Nein, mit dir fühle ich mich sicher.', 'Bitte denk das nicht.', 'Wir sind eine Familie.']],
    ask_e07: ['Komm, eine Partie Schach mit mir?', ['Gern, ich gebe dir drei Steine Vorgabe.', 'Wenn ich das hier fertig habe.', 'Heute fange ich an.']],
    ask_e08: ['Ich habe noch ein Kleidungsstück von dir als Baby aufgehoben.', ['Wirklich? Ich würde es gern sehen.', 'Du hast es die ganze Zeit aufbewahrt.', 'Leg es sicher weg, verlier es nicht.']],
    ask_e09: ['Wie ist das Wetter heute?', ['Schön, gehen wir spazieren.', 'Etwas kalt, zieh dich wärmer an.', 'Schau doch selbst nach.']],
    ask_e10: ['Ist der rote Umschlag, den ich dir zur Hochzeit gab, noch da?', ['Ja, ich bewahre ihn gut auf.', 'Ich suche ihn mal.', 'Danke, dass du immer daran denkst.']],
    ask_p01: ['Hast du gegessen?', ['Ja, mach dir keine Sorgen.', 'Noch nicht, gleich.', 'Und du?']],
    ask_p02: ['Ist die Arbeit in letzter Zeit anstrengend?', ['Es geht, ich schaffe das.', 'Etwas müde, aber ich halte durch.', 'Nach dieser Phase wird es leichter.']],
    ask_p03: ['Es wird kälter, hast du genug Kleidung dabei?', ['Ja.', 'Nein, ich ziehe später mehr an.', 'Du auch, zieh dich wärmer an.']],
    ask_p04: ['Kannst du zum Abendessen nach Hause kommen?', ['Dieses Wochenende bestimmt.', 'Gerade nicht, in ein paar Tagen.', 'Ich würde gern, ich organisiere es.']],
    ask_p05: ['Alleine da draußen, sorgst du gut für dich?', ['Ja, mach dir keine Sorgen.', 'Manchmal vergesse ich es.', 'Ehrlich gesagt ist es zuletzt viel.']],
    ask_p06: ['Wovor hattest du als Kind am meisten Angst? Weißt du es noch?', ['Vor der Dunkelheit.', 'Vor Gewitter.', 'Habe ich vergessen, sag du es mir.']],
    ask_a01: ['Iss mehr, schau wie dünn du bist.', ['Okay, ich esse.', 'Ich bin nicht dünner geworden, du irrst dich.', 'Iss du auch mit.']],
    ask_a02: ['Ich habe dich als Kind auf den Tempelmarkt mitgenommen. Erinnerst du dich?', ['Ja, du hast mir eine Zuckerfigur gekauft.', 'Ein bisschen.', 'Erzähl mir von dem Tag.']],
    ask_a03: ['Gibt es etwas Schönes in letzter Zeit?', ['Ja, lass mich erzählen.', 'Nichts Besonderes.', 'Dich zu sehen freut mich schon.']],
    ask_a04: ['Hast du jemanden an deiner Seite?', ['Noch nicht, keine Eile.', 'Lass uns nicht darüber reden.', 'Ja, ich bringe die Person mal mit.']],
    ask_s01: ['Weißt du noch, wie wir uns um die Fernbedienung gestritten haben?', ['Ja, du hast immer gemogelt.', 'Ha, ich erinnere mich.', 'Jetzt darfst du zuerst.']],
    ask_s02: ['Etwas Lustiges in letzter Zeit?', ['Ja, ich erzähle es dir mal.', 'Nein, nur Arbeit jeden Tag.', 'Du zuerst.']],
    ask_s03: ['Hast du am Wochenende Zeit? Lass uns rausgehen.', ['Ja, wohin?', 'Diese Woche nicht, nächste.', 'Okay, such du aus.']],
    ask_s04: ['Warst du wieder lange auf?', ['Erwischt.', 'Nein, rate nicht.', 'Heute Nacht früh ins Bett, versprochen.']],
    ask_s05: ['Mein Bauch ist heute etwas flau. Ich hätte gern etwas Warmes.', ['Ich schenke dir etwas Heißes ein.', 'Willst du dich erst ausruhen?', 'Soll ich bei dir bleiben?']],
    ask_s06: ['Mir geht es gerade nicht gut und ich bin schlecht gelaunt. Hab Nachsicht.', ['Kein Problem, ich lasse dir Ruhe.', 'Möchtest du etwas Warmes trinken?', 'Sag Bescheid, wann immer.']],
    ask_s07: ['Wie geht es Mama und Papa in letzter Zeit?', ['Gut, und dir?', 'Ich mache mir etwas Sorgen, lass uns darüber reden.', 'Ich rufe sie diese Woche an.']],
    ask_c01: ['{title}, warst du auch mal so klein wie ich?', ['Ja, sogar kleiner.', 'Ich habe auch viele Fragen gestellt.', 'Rate mal!']],
    ask_c02: ['{title}, warum wird der Himmel dunkel?', ['Weil die Sonne schlafen gegangen ist.', 'Weil sich die Erde dreht.', 'Lass uns zusammen nachschauen.']],
    ask_c03: ['{title}, kommst du heute früh nach Hause?', ['Ja, ich versuche es.', 'Nicht sicher, aber ich rufe an.', 'Ich komme früh, um zu spielen.']],
    ask_c04: ['{title}, ich habe ein Bild gemalt. Willst du es sehen?', ['Ja, zeig her!', 'Okay, gib mir zwei Minuten.', 'Was hast du gemalt?']],
    ask_c05: ['{title}, kann ich so werden wie du, wenn ich groß bin?', ['Du wirst noch besser.', 'Wie ich in welcher Hinsicht?', 'Du selbst zu sein ist am besten.']],
    ask_t01: ['{title}, was ist das?', ['Das ist ein Vogel.', 'Was denkst du, was es ist?', 'Lass uns nachschauen gehen.']],
    ask_t02: ['{title}, will das.', ['Okay, hier.', 'Sag erst bitte.', 'Das nicht, aber das da.']],
    ask_t03: ['{title}, nicht weggehen.', ['Ich gehe nicht, ich bin hier.', 'Ich bin gleich wieder da.', 'Komm mit.']],
    ask_t04: ['{title}, ich kann das!', ['Toll! Nochmal.', 'Lass mal sehen.', 'Hast du es ganz allein gemacht?']],
    ask_g01: ['Warst du als junger Mensch auch so?', ['Ungefähr, ich war auch genervt.', 'Ich war noch schlimmer.', 'Willst du es hören?']],
    ask_g02: ['Ich will nicht zur Schule.', ['Was ist passiert?', 'Bleib heute zu Hause, wir reden morgen.', 'Ich gehe mit dir.']],
    ask_g03: ['Was soll ich später machen?', ['Was magst du gerade?', 'Keine Eile, denk in Ruhe nach.', 'Ich wusste es als Jugendlicher auch nicht.']],
    ask_g04: ['Bist du müde?', ['Ein bisschen, aber es geht.', 'Du hast es bemerkt.', 'Nicht, wenn ich dich sehe.']],
    ask_m01: ['Wie war dein Tag?', ['Nicht schlecht, und deiner?', 'Etwas müde, nimm mich in den Arm.', 'Lass uns erst essen und dann in Ruhe reden.']],
    ask_m02: ['Wohin möchtest du am Wochenende?', ['Im Park spazieren.', 'Den ganzen Tag zu Hause schlafen.', 'Such du aus, ich komme mit.']],
    ask_m03: ['Weißt du noch, wann wir uns zum ersten Mal trafen?', ['Ja, du warst zu spät.', 'Ein bisschen.', 'Erzähl mir den Tag nochmal.']],
    ask_m04: ['Beschäftigt dich in letzter Zeit etwas?', ['Ein wenig, ich erzähle es dir später.', 'Nein, nur müde.', 'Ich wollte gerade mit dir reden.']],
  };

  const N = {
    n01: 'Wie lange hast du deine Familie nicht mehr angerufen?', n02: 'Es gibt jemanden, mit dem du lange keinen Kontakt hattest, oder?', n03: 'Hast du heute mit jemandem gesprochen, nicht über die Arbeit?', n04: 'Wann hast du zuletzt einen Freund getroffen?', n05: 'Schreib der Person, die dir gerade eingefallen ist, es muss nichts Großes sein.',
    n06: 'Steh auf, trink Wasser, schau aus dem Fenster.', n07: 'Du sitzt schon lange. Geh fünf Minuten spazieren.', n08: 'Wie lange ist es her, dass du einen Freund zum Essen eingeladen hast?', n09: 'Schreib jemandem, mit dem du ewig nicht gesprochen hast: wie geht es dir?', n10: 'Iss heute Abend mit deiner Familie, ohne aufs Handy zu schauen.',
    n11: 'Du hast dich eine Weile nicht bewegt. Streck dich.', n12: 'Schau in die Ferne und lass deine Augen ausruhen.',
  };

  const conds = {
    diabetes: {
      lines: { request: { medicine: ['Ist es Zeit für die Tabletten?', '{ta} sah die Tablettenbox an, dann dich.'], sugar: ['{ta} berührte das kleine Blutzuckergerät.', 'Ist es Zeit zu messen?'] } },
      events: { dinner: { say: 'Was gibt es zum Abendessen?', choices: [{ label: 'Geschmortes Schweinefleisch', reply: '{ta} aß mit Genuss. Du wusstest, dass es nicht gut für {ta} war.' }, { label: 'Gedämpfter Fisch mit Gemüse', reply: '{ta} murrte, es sei zu fad, und aß trotzdem auf.' }, { label: 'Vollkornbrei mit Beilagen', reply: '{ta} nickte und sagte, das gehe schon.' }] } },
    },
    hypertension: {
      lines: { request: { medicine: ['Ist es Zeit für die Tabletten?', '{ta} sah die Tablettenbox an.'], bp: ['Ich habe heute noch nicht den Blutdruck gemessen.', '{ta} rieb sich die Schläfen.'] } },
      events: { salty: { say: 'Soll ich heute Salz ins Essen tun?', choices: [{ label: 'Eine gute Prise mehr', reply: '{ta} sagte, so schmecke es besser. Du hast nichts gesagt.' }, { label: 'Wenig Salz, einen Spritzer Essig', reply: '{ta} probierte und sagte, das gehe schon.' }, { label: 'Kein Salz, dafür viel Ingwer', reply: '{ta} runzelte die Stirn und aß den Teller leer.' }] } },
    },
    arthritis: { lines: { request: { joint: ['{ta} rieb sich das Knie und holte leise Luft.', 'Das Wetter schlägt um, meine Beine tun wieder weh.'] } } },
    cold: { lines: { request: { fever: ['{ta} hatte ein heißes Gesicht und keine Kraft.', '{ta} lehnte schlaff da, die Stirn war heiß.'] } } },
    asthma: { lines: { request: { breath: ['{ta} hustete einige Male und atmete schnell.', '{ta} drückte eine Hand auf die Brust und atmete schwer.'] } } },
    forgetful: { lines: { request: { reorient: ['Wo habe ich nur meine Schlüssel hingelegt?', 'Welcher Tag ist heute?', '{ta} stand an der Tür und wusste nicht mehr, wohin {ta} wollte.'] } } },
  };

  C.registerPack('de', C.buildPack({ voices: V, sayings: S, asks: A, nudges: N, conds }));
})(globalThis.CY = globalThis.CY || {});
