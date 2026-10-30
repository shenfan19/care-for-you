/* Pack de contenu français : répliques des personnages, bibliothèque de phrases, questions, rappels et textes des maladies.
   Les identifiants des éléments sont les mêmes que dans les autres langues. {ta} devient il ou elle, en majuscule en début de phrase. */
(function (CY) {
  const C = CY.content;
  const V = {};

  V.elder = {
    request: {
      thirst: ["…J'ai un peu soif.", "Euh, de l'eau, s'il te plaît."], hunger: ["Quelle heure est-il ? Tu as mangé ?", "J'ai l'estomac un peu vide."], rest: ["Je m'assieds un moment.", "Mon dos recommence."],
      company: ["Tu es occupé… laisse, ce n'est rien.", "Viens t'asseoir près de moi ?"], medicine: ["C'est l'heure de mes cachets ?", "Je ne sais plus si je les ai pris."], hygiene: ["Je me laverais bien un peu."], mobility: ["Mes jambes sont raides. Une petite marche, peut-être ?"],
    },
    thanks: { water: ["Mm."], feed: ["Bien, bien."], meal: ["Délicieux. Tu cuisines bien."], rest: ["Il me suffit de m'appuyer un instant."], pet: ["…"], hand: ["Tes mains sont devenues si grandes."], medicine: ["Pris. Pense à toi aussi."], walk: ["Cet air me fait du bien."], default: ["Mm."] },
    glance: ["{ta} vous a regardé depuis la porte, sans rien dire, puis s'est éloigné.", "{ta} s'est assis tout près et vous regarde, simplement.", "{ta} a toussé doucement, comme pour dire quelque chose, puis non."],
    cares_back: ["{ta} a posé un verre d'eau près de votre main sans un mot.", "{ta} a discrètement monté la lampe de votre bureau.", "{ta} est venu remonter le manteau qui glissait de vos épaules.", "{ta} a apporté une assiette de fruits lavés : mange-les tant qu'ils sont frais."],
    reveal: "{ta} vous a regardé et a dit : tu tournes autour de moi, tu n'es pas fatigué ? Moi ça va. Il faut que tu manges aussi.",
  };
  V.parent = {
    request: {
      thirst: ["Tu peux me servir un verre d'eau ?", "J'ai la gorge un peu sèche."], hunger: ["Tu as mangé ? Moi je me débrouille.", "Il doit être l'heure de cuisiner."], rest: ["Je me repose un peu, ne t'occupe pas de moi.", "Un peu fatigué aujourd'hui."],
      company: ["Comment ça va, ces temps-ci ?", "Viens, parle avec moi un moment."], medicine: ["C'est l'heure de mon médicament ?", "Regarde pour moi : j'ai pris mes cachets ?"], hygiene: ["Je vais d'abord me rafraîchir."],
    },
    thanks: { water: ["Ça suffit, merci."], feed: ["Mange aussi."], meal: ["Ça sent bon. Tu n'étais pas obligé."], rest: ["Je m'allonge un peu, et ça ira."], pet: ["Oh, regarde comme tu as grandi."], hand: ["Tes mains sont froides."], default: ["Là, là, ne t'occupe pas de moi, continue ton travail."] },
    glance: ["{ta} s'est arrêté un instant à la porte de la cuisine, vous a regardé, puis est retourné à son travail.", "{ta} tenait le téléphone, prêt à demander quelque chose, puis l'a reposé.", "{ta} est passé derrière vous, très doucement."],
    cares_back: ["{ta} a posé un bol de soupe près de votre bureau : bois-la tant qu'elle est chaude.", "{ta} a discrètement rempli votre tasse.", "{ta} a dit : ne veille pas trop, j'ai laissé la lumière pour toi.", "{ta} a plié les vêtements que vous aviez enlevés."],
    reveal: "{ta} vous a regardé et a dit : ici, tout va bien. Ta propre vie compte aussi.",
  };
  V.aunt = {
    request: {
      thirst: ["Oh, un verre d'eau, mon chéri ?", "Je meurs de soif, tu as de l'eau ?"], hunger: ["Le dîner est prêt ? Laisse-moi t'aider.", "J'ai un peu faim, il y a quelque chose ?"], rest: ["Je m'assieds une minute, j'ai mal aux jambes.", "Je ne tiens plus debout, laisse-moi me reposer."],
      company: ["Viens, viens, on bavarde !", "Pourquoi es-tu si silencieux ces temps-ci ?"], medicine: ["Où ai-je mis mes cachets ?", "C'est l'heure de mon médicament ?"], hygiene: ["Je vais me passer un peu d'eau sur le visage."],
    },
    thanks: { water: ["Merci, merci."], feed: ["Délicieux, délicieux."], meal: ["Oh, quel régal."], rest: ["Voilà, ça va mieux."], pet: ["Oh, toi alors."], hand: ["Cher enfant."], default: ["Oh, bien."] },
    glance: ["{ta} a passé la tête par la porte et vous a souri.", "{ta} vous a fait signe en téléphonant dans le salon.", "{ta} est passé avec une assiette de fruits et vous a fait un petit signe."],
    cares_back: ["{ta} a mis le plus gros morceau de viande dans votre bol.", "{ta} vous a glissé une enveloppe rouge : prends, ne refuse pas.", "{ta} a dit : tu as maigri. Puis vous a servi un bol de soupe."],
    reveal: "{ta} vous a tapoté la main : ne pense pas qu'à nous. Que tu ailles bien, ça vaut tout le reste.",
  };
  V.sibling = {
    request: {
      thirst: ["Hé, t'as de l'eau ?", "Soif. Sers-m'en une."], hunger: ["J'ai faim. On commande ?", "Il y a quelque chose à manger ?"], rest: ["Je fais une sieste. Ne me réveille pas.", "Trop sommeil."],
      company: ["Tu fais quoi ?", "Une partie de quelque chose ?", "Viens qu'on discute un peu."], medicine: ["C'est l'heure des cachets, non ?"], hygiene: ["Je vais prendre une douche."],
    },
    thanks: { water: ["Bon."], feed: ["OK, je te dois un repas."], meal: ["Pas mal. Je te le revaudrai."], rest: ["Merci."], pet: ["Quoi."], hand: ["…Trop cucul."], chat: ["Ha. Ça m'a fait du bien."], default: ["OK."] },
    glance: ["{ta} s'est appuyé au chambranle et vous a regardé un moment sans un mot.", "{ta} vous a envoyé un mème puis plus rien.", "{ta} a relevé le menton dans votre direction."],
    cares_back: ["{ta} a laissé votre goûter préféré sur le bureau, en faisant semblant de l'avoir oublié là.", "{ta} a dit : je m'en occupe, va dormir.", "{ta} a rentré votre colis."],
    reveal: "{ta} a dit : ne porte pas tout tout seul. Je suis là.",
  };
  V.partner = {
    request: {
      thirst: ["Tu peux me ramener un verre d'eau en passant ?", "J'ai un peu soif."], hunger: ["Qu'est-ce que tu veux pour le dîner ?", "J'ai un peu faim."], rest: ["Je suis fatigué, j'ai juste envie de m'appuyer sur toi."], company: ["On s'est à peine parlé aujourd'hui.", "Viens t'asseoir près de moi ?"],
      hygiene: ["Je prends une douche d'abord."], medicine: ["C'est l'heure du médicament ?", "Regarde pour moi : j'ai pris mes cachets ?"],
    },
    thanks: { water: ["Merci."], meal: ["Délicieux. Merci d'avoir cuisiné."], chat: ["Parler avec toi me fait du bien."], pet: ["Mm, c'est agréable."], default: ["Merci."] },
    glance: ["{ta} vous a regardé de l'autre côté de la pièce et a souri.", "{ta} est passé et a doucement touché votre épaule.", "{ta} s'est assis à côté de vous avec deux tasses de thé."],
    cares_back: ["{ta} a réchauffé votre part du dîner et l'a laissée à portée de main.", "{ta} a éteint la lumière pour vous : couche-toi tôt.", "{ta} a plié le manteau que vous aviez laissé tomber et l'a posé sur la chaise."],
    reveal: "{ta} a dit : tu tiens tout seul depuis trop longtemps. Aujourd'hui, c'est mon tour.",
  };
  V.child = {
    request: {
      thirst: ["{title}, de l'eau s'il te plaît.", "De l'eau !"], hunger: ["J'ai faim.", "{title}, je veux manger."], rest: ["J'ai sommeil…", "{title}, je veux aller au lit."], company: ["{title}~", "{title}, regarde-moi."],
      play: ["On joue ! {title}, on joue !", "{title}, tu joues un peu avec moi ?"], hygiene: ["Je veux prendre un bain."], homework: ["Je ne comprends pas celui-là.", "J'ai encore plein de devoirs."],
    },
    thanks: { water: ["Glou glou."], feed: ["Miam !"], meal: ["Miam !"], play: ["Hihihi."], soothe: ["…(a lentement fermé les yeux)"], pet: ["Hi."], hand: ["Tes mains sont chaudes, {title}."], bath: ["Splich splach."], read: ["Encore, encore !"], homework: ["Ah, j'ai compris !"], default: ["Oui !"] },
    glance: ["{ta} se tenait à la porte, serrant un jouet, et vous regardait.", "{ta} vous a fait signe de loin.", "{ta} a collé sa joue au chambranle, les yeux brillants."],
    cares_back: ["{ta} est accouru et vous a glissé un bonbon dans la main, trouvé on ne sait où.", "{ta} vous a touché la joue : ne pleure pas, {title}. Vous ne pleuriez pas.", "{ta} a posé son nounours préféré sur votre chaise.", "{ta} s'est mis sur la pointe des pieds et vous a tapoté l'épaule d'une petite main."],
    reveal: "{ta} a serré votre jambe, a levé les yeux et dit : {title}, je m'occuperai de toi.",
  };
  V.infant = {
    request: {
      thirst: ["{ta} a ouvert la bouche et geint."], hunger: ["{ta} a éclaté en sanglots, les petites mains cherchant à manger.", "{ta} pleurait en suçant un petit poing."], rest: ["{ta} se frottait les yeux en geignant."], company: ["{ta} tendait ses deux petites mains, attendant qu'on le prenne."],
      play: ["{ta} vous fixait en babillant."], diaper: ["{ta} se tortillait et s'est mis à pleurer."], fever: ["{ta} avait la petite figure rouge et un pleur faible."], hygiene: ["Il est peut-être temps pour le bain."],
    },
    thanks: { feed: ["Glou, glou. {ta} mange de bon cœur."], diaper: ["{ta} a fait un petit bruit de bien-être."], soothe: ["{ta} a lentement fermé les yeux."], hug: ["{ta} a enfoui son visage dans vos bras."], pet: ["{ta} a gloussé."], play: ["{ta} gloussait sans arrêt."], bath: ["{ta} a joyeusement éclaboussé."], default: ["{ta} s'est calmé."] },
    glance: ["{ta} était dans le berceau, les yeux ouverts, et vous regardait.", "{ta} a agité une petite main."],
    cares_back: ["{ta} a attrapé l'un de vos doigts et ne le lâche pas.", "{ta} vous a souri de ses gencives sans dents."],
    reveal: "{ta} vous a regardé et a tendu la main pour toucher votre visage.",
    cry: ["Ouiiin… ouiiin…", "Wa wa wa…", "{ta} pleurait sans pouvoir s'arrêter."],
  };
  V.toddler = {
    request: {
      thirst: ["{title}, eau.", "Boire !"], hunger: ["Faim !", "{title}, manger."], rest: ["Dodo…", "{title}, câlin, dodo."], company: ["{title} ! {title} !", "Regarde, regarde."],
      play: ["Jouer ! Jouer !", "{title}, jouer ensemble."], diaper: ["{title}, mouillé.", "{ta} a tiré sur son pantalon en fronçant le nez."], fever: ["{title}, chaud, pas bien."], breath: ["{ta} a toussé plusieurs fois et respirait vite."], hygiene: ["{title}, bain, bain !"],
    },
    thanks: { feed: ["Bon ! Encore !"], diaper: ["Mieux."], soothe: ["{ta} a lentement fermé les yeux."], hug: ["Câlin, pas lâcher."], pet: ["Hi hi."], play: ["Encore encore !"], water: ["Glou glou."], bath: ["Splash splash !"], read: ["Encore ! Encore !"], default: ["Oui !"] },
    glance: ["{ta} se tenait à la porte, serrant un jouet.", "{ta} a fait deux pas hésitants vers vous, puis s'est arrêté.", "{ta} vous a fait coucou."],
    cares_back: ["{ta} est arrivé en titubant et vous a enfoncé un biscuit dans la main.", "{ta} vous a tapoté la jambe : pas pleurer. Vous ne pleuriez pas.", "{ta} a posé son ours en peluche sur votre chaise."],
    reveal: "{ta} a serré votre jambe, a levé les yeux et dit : {title}, bien.",
    cry: ["Ouin, {title} !", "Bouh-hou, non, non !", "{ta} pleurait, le visage tout rouge."],
  };
  V.teen = {
    request: {
      thirst: ["T'as de l'eau ?", "Trop soif."], hunger: ["J'ai faim, il y a quelque chose ?", "On mange quoi ce soir ?"], rest: ["Trop fatigué, laisse-moi."], company: ["…Tu es occupé ?", "J'ai un truc à te dire."],
      homework: ["Je ne comprends pas celui-là.", "Trop de devoirs, ça me saoule."], fever: ["Je crois que j'ai de la fièvre."], hygiene: ["Je vais prendre une douche."],
    },
    thanks: { meal: ["Bon. …Merci."], homework: ["Ah, c'est comme ça que ça marche."], chat: ["…C'était rien, mais ça fait du bien de le dire."], game: ["OK, c'était sympa."], pet: ["Quoi."], default: ["Mm."] },
    glance: ["{ta} est passé avec un casque sur les oreilles, puis est repassé.", "{ta} s'est adossé au chambranle, voulant dire quelque chose."],
    cares_back: ["{ta} a rempli votre tasse, comme si de rien n'était.", "{ta} a dit : ne te surmène pas. Puis est vite retourné dans sa chambre."],
    reveal: "{ta} a dit : je sais bien que c'est dur pour toi.",
  };
  V.cat = {
    request: {
      thirst: ["{ta} s'est tenu près de la gamelle d'eau, l'a regardée, puis vous a regardé."], hunger: ["{ta} a tourné une fois autour de vos pieds et a miaulé."], company: ["{ta} a sauté sur le bureau et s'est assis près du clavier."], play: ["{ta} a apporté la petite balle usée et l'a déposée à vos pieds."], clean: ["{ta} a longuement regardé la litière, d'un air entendu."],
    },
    thanks: { water: ["{ta} s'est penché et a bu."], feed: ["{ta} a plongé le museau dans la gamelle, la queue ondulante."], play: ["{ta} a bondi, puis rebondi."], pet: ["{ta} a plissé les yeux et ronronné."], hand: ["{ta} a tourné une fois dans vos bras et s'est couché."], groom: ["{ta} s'est étiré en ronronnant."], clean: ["{ta} a reniflé, satisfait."], default: ["Miaou."] },
    glance: ["{ta} était allongé sur le rebord de la fenêtre et vous a jeté un coup d'œil.", "{ta} est venu cogner votre main de la tête, puis est reparti."],
    cares_back: ["{ta} est monté sur vos genoux et s'est couché. Vous avez remarqué que vos épaules étaient raides.", "{ta} est resté tranquillement à côté de vous jusqu'à ce que vous vous leviez.", "{ta} a frôlé le dos de votre main de la queue, comme pour dire : il est temps de te reposer."],
    reveal: "Tout l'après-midi, {ta} est resté couché à vos pieds, levant la tête à chacun de vos mouvements. Il vous attendait depuis toujours.",
  };
  V.dog = {
    request: {
      thirst: ["{ta} s'est léché les babines en regardant la gamelle vide."], hunger: ["{ta} s'est assis près de la gamelle, la queue balayant le sol."], company: ["{ta} a posé le menton sur votre genou et vous a regardé."], play: ["{ta} a apporté la laisse et s'est planté devant vous."],
    },
    thanks: { water: ["{ta} a lapé la moitié de la gamelle."], feed: ["{ta} a tout avalé en trois bouchées et a levé la tête."], play: ["{ta} a fait un tour de course et est revenu."], walk: ["{ta} trottait fièrement à côté de vous."], pet: ["{ta} s'est retourné pour montrer le ventre."], hand: ["{ta} s'est appuyé contre vous sans bouger."], groom: ["{ta} remuait tout l'arrière-train."], default: ["Ouaf."] },
    glance: ["{ta} était couché près de la porte et a levé la tête quand vous avez bougé.", "{ta} a remué la queue et s'est recouché."],
    cares_back: ["{ta} a posé un jouet mouillé à vos pieds, comme pour vous offrir ce qu'il a de mieux.", "Chaque fois que vous soupiriez, {ta} venait pousser votre main du museau.", "{ta} est resté près de votre chaise jusqu'à ce que vous vous leviez."],
    reveal: "Toute la soirée {ta} est resté contre vous et, chaque fois que vous changiez de position, il changeait aussi. Il vous tenait compagnie depuis toujours.",
  };
  V.rabbit = {
    request: { thirst: ["{ta} a léché le biberon d'eau vide."], hunger: ["{ta} s'est accroupi près de la gamelle, le nez frémissant."], company: ["{ta} a poussé votre pied et tapé une fois du pied."], play: ["{ta} tournait dans la cage, voulant bondir dehors."], clean: ["La cage sent un peu."] },
    thanks: { water: ["{ta} a bu plusieurs gorgées."], feed: ["{ta} croquait avec bonheur."], play: ["{ta} a fait trois bonds et un tour sur lui-même."], pet: ["{ta} a plissé les yeux et aplati les oreilles."], groom: ["{ta} est resté très immobile."], clean: ["{ta} a reniflé d'un air approbateur."], default: ["{ta} a remué le nez."] },
    glance: ["{ta} a dressé les oreilles et vous a regardé."], cares_back: ["{ta} s'est couché tranquillement à vos pieds.", "{ta} vous a léché la main."], reveal: "Toute la nuit {ta} est resté couché à vos pieds, les oreilles suivant chacun de vos mouvements.",
  };
  V.hamster = {
    request: { thirst: ["{ta} s'accrochait au biberon. Il est vide."], hunger: ["{ta} fouillait la gamelle vide."], play: ["{ta} vous regardait depuis la roue."], clean: ["La litière doit être changée."] },
    thanks: { water: ["{ta} a lapé vite."], feed: ["{ta} s'est rempli les deux joues."], play: ["{ta} a couru à toute vitesse dans la roue."], pet: ["{ta} s'est roulé en boule dans votre paume."], groom: ["{ta} a couiné."], clean: ["{ta} a plongé dans la nouvelle litière et n'en sort plus."], default: ["{ta} a couiné."] },
    glance: ["{ta} s'est arrêté sur la roue et vous a regardé."], cares_back: ["{ta} a poussé une graine de tournesol vers vous."], reveal: "{ta} dort le jour et court toute la nuit, comme pour veiller sur vous.",
  };
  V.bird = {
    request: { thirst: ["{ta} s'est posé près de la coupe d'eau et a piaillé deux fois."], hunger: ["{ta} piaillait devant la mangeoire."], play: ["{ta} sautillait d'un côté à l'autre, voulant voler dehors."], clean: ["Il faut nettoyer le fond de la cage."] },
    thanks: { water: ["{ta} a picoré l'eau."], feed: ["{ta} picorait très sérieusement."], play: ["{ta} a fait un tour de la pièce et s'est posé sur votre épaule."], pet: ["{ta} a penché la tête et frotté votre doigt."], groom: ["{ta} s'est gonflé de plaisir."], clean: ["{ta} a secoué ses plumes."], default: ["{ta} a piaillé."] },
    glance: ["{ta} a penché la tête et vous a regardé."], cares_back: ["{ta} s'est posé sur votre épaule et a fredonné un petit air."], reveal: "{ta} chante toujours quand vous êtes silencieux, comme s'il craignait de vous savoir seul.",
  };
  V.fish = {
    request: { hunger: ["{ta} est remonté à la surface, la bouche ouverte."], clean: ["L'eau de l'aquarium est trouble."], oxygen: ["{ta} cherchait de l'air à la surface."] },
    thanks: { feed: ["{ta} a foncé et l'a avalé d'un coup."], clean: ["L'eau est claire et {ta} a fait un tour joyeux."], default: ["{ta} a lâché une bulle."] },
    glance: ["{ta} s'est collé à la vitre et vous a regardé."], cares_back: ["{ta} a suivi votre doigt de long en large."], reveal: "{ta} nage simplement en silence, mais dès que vous approchez, il vient vers vous.",
  };
  V.turtle = {
    request: { thirst: ["Le niveau d'eau est un peu bas."], hunger: ["{ta} a tendu le cou en fixant la gamelle."], warmth: ["{ta} est resté dans un coin sans bouger."], clean: ["L'eau est sale."] },
    thanks: { water: ["{ta} a lentement nagé en rond."], feed: ["{ta} a mangé petit à petit."], warm: ["{ta} a étendu ses quatre pattes sous la lampe."], pet: ["{ta} a rentré le cou, puis l'a lentement ressorti."], groom: ["{ta} a lentement cligné des yeux."], clean: ["{ta} a pagayé avec plaisir."], default: ["{ta} vous a regardé."] },
    glance: ["{ta} est lentement monté sur un rocher et vous observait."], cares_back: ["{ta} a lentement rampé jusqu'à l'endroit le plus proche de vous."], reveal: "{ta} ne dit rien et est simplement, lentement, toujours là.",
  };
  V.snake = {
    request: { warmth: ["{ta} s'est lové dans un coin du terrarium et ne bouge presque pas."], thirst: ["La gamelle d'eau est vide."], hunger: ["{ta} a relevé la tête et lentement tiré la langue."] },
    thanks: { warm: ["{ta} s'est lentement étiré."], water: ["{ta} a glissé jusqu'à la gamelle d'eau."], feed: ["{ta} l'a avalé en silence."], pet: ["{ta} a lentement tourné la tête et tiré la langue."], default: ["{ta} vous a regardé."] },
    glance: ["{ta} était lové sous la lampe, seuls les yeux vous suivaient.", "{ta} a silencieusement changé de place."],
    cares_back: ["{ta} s'est lové tranquillement du côté le plus proche de vous, sans bruit.", "{ta} est resté parfaitement immobile pendant que vous travailliez, comme par peur de vous déranger."],
    reveal: "{ta} n'a rien dit, mais est resté tout l'après-midi à l'endroit le plus proche de vous.",
  };
  V.plant = {
    request: { water: ["Les feuilles s'affaissent un peu.", "La terre est sèche."], sun: ["{ta} se penche vers la fenêtre."], fertilize: ["Les nouvelles feuilles poussent lentement."], prune: ["Quelques feuilles ont jauni."] },
    thanks: { water: ["Les feuilles se sont lentement dépliées."], sun: ["{ta} semble soupirer de soulagement."], fertilize: ["{ta} a l'air bien plus vigoureux."], prune: ["{ta} a l'air plus net."], repot: ["{ta} s'est installé avec bonheur dans son nouveau pot."], pet: ["Les feuilles ont légèrement bougé."], default: ["Les feuilles ont légèrement bougé."] },
    glance: ["Le soleil tombait sur les feuilles et les ombres bougeaient lentement.", "{ta} a fait une nouvelle feuille."], cares_back: ["{ta} a ouvert une minuscule fleur, tournée vers vous.", "Une nouvelle feuille s'est enroulée en petit cœur."], reveal: "Chaque fois que vous passez, {ta} pousse un peu plus vers vous.",
  };

  const S = {
    elder01: "Tu as mangé ?", elder02: "Il fait froid dehors, mets plus de vêtements.", elder03: "Rien, juste de vieux ennuis.", elder04: "Vas-y, ne t'occupe pas de moi.", elder05: "Quand j'étais jeune…", elder06: "Doucement, ne tombe pas.", elder07: "Fais attention sur la route.", elder08: "Je n'ai pas faim, mange toi.", elder09: "Le vieux Zhang d'à côté est reparti jouer aux échecs.", elder10: "Jeune homme, tu as mangé ?",
    parent01: "Tu as mangé ?", parent02: "Ne veille pas trop. Couche-toi tôt.", parent03: "Dis-moi quand tu es arrivé.", parent04: "Tu as assez d'argent ?", parent05: "Ta vie, c'est à toi de décider.", parent06: "Je vais bien, ne t'inquiète pas.", parent07: "Il fait plus froid, mets une couche de plus.", parent08: "Tu viens dîner ?",
    aunt01: "Oh, toi alors.", aunt02: "Mange plus, regarde comme tu es maigre.", aunt03: "Viens, viens, assieds-toi et parle.", aunt04: "Petit, tu étais si espiègle.", aunt05: "Prends, ne refuse pas.", aunt06: "Qu'est-ce qui t'occupe en ce moment ?",
    sibling01: "Bon, bon.", sibling02: "Fais comme tu veux.", sibling03: "Dis-le si tu as besoin d'aide.", sibling04: "Je te dois un repas.", sibling05: "Ne te force pas.", sibling06: "Libre ce week-end ?",
    child01: "Câlin !", child02: "Encore un peu de jeu.", child03: "{title}, regarde-moi !", child04: "Je ne veux pas dormir.", child05: "Quand je serai grand, je m'occuperai de toi.", child06: "{title}~",
    cat01: "Miaou.", cat02: "Il a cogné votre main de la tête.", cat03: "Il s'est assis sur votre clavier et refuse de bouger.", cat04: "Il a tourné une fois autour de vos pieds.", cat05: "Il a marché sur votre ventre au milieu de la nuit.",
    dog01: "Ouaf !", dog02: "Il tournait autour de vous, la queue en mouvement perpétuel.", dog03: "Il a apporté votre chaussure à la porte.", dog04: "Il vous attend à la porte chaque fois que vous rentrez.", dog05: "Il a posé la tête sur votre jambe.",
    snake01: "Il est resté lové, immobile, sous la lampe.", snake02: "Il a tiré la langue et vous a regardé.", snake03: "Il a lentement glissé du rocher.", snake04: "Il a discrètement mué.",
    infant01: "{ta} a gloussé.", infant02: "{ta} a attrapé votre doigt.", infant03: "{ta} a fait une bulle pour vous.", infant04: "{ta} s'est endormi dans vos bras.",
    toddler01: "Câlin !", toddler02: "{title}, regarde !", toddler03: "Non non !", toddler04: "Encore !", toddler05: "{title}, manger.",
    teen01: "Oui oui, je sais.", teen02: "Fiche-moi la paix.", teen03: "…Merci.", teen04: "Je peux le faire seul.", teen05: "J'ai un truc à te dire.",
    rabbit01: "Il a fait trois bonds.", rabbit02: "Ses oreilles ont frémi.", rabbit03: "Il s'est roulé près de vos pieds.",
    hamster01: "Il a couru dans la roue toute la nuit.", hamster02: "Il avait les joues pleines à craquer.",
    bird01: "Il a chanté un petit air.", bird02: "Il s'est posé sur votre épaule.",
    fish01: "Il a lâché une bulle.", fish02: "Il a suivi votre doigt.",
    turtle01: "Elle a lentement sorti la tête.", turtle02: "Elle se prélassait sur le rocher.",
    plant01: "Elle pousse vers la fenêtre.", plant02: "Elle a fait une nouvelle feuille.",
    partner01: "Comment s'est passée ta journée ?", partner02: "Mange d'abord, je n'ai pas faim.", partner03: "Ne te surmène pas.", partner04: "Qu'est-ce que tu veux pour dîner ?", partner05: "Je suis là.", partner06: "Allons nous promener ce week-end.",
  };

  const A = {
    ask_e01: ["Quand tu avais de la fièvre, petit, je t'ai porté sur le dos pendant des kilomètres. Tu t'en souviens ?", ["Oui, il pleuvait fort ce jour-là.", "Un peu. Raconte-moi encore.", "Pas vraiment, mais merci."]],
    ask_e02: ["Tu dors bien en ce moment ?", ["Bien, ne t'inquiète pas.", "Un peu fatigué, je m'ajuste.", "Toujours debout tard. Ne m'imite pas."]],
    ask_e03: ["Quand j'étais jeune…", ["Prends ton temps, j'écoute.", "Tu me l'as déjà raconté quand j'étais petit.", "Et ensuite ?"]],
    ask_e04: ["Tu as mangé aujourd'hui ?", ["Oui, et toi ?", "Pas encore, bientôt.", "Parfait, mangeons ensemble."]],
    ask_e05: ["Tu as encore maigri ?", ["Non, ce sont les vêtements qui sont larges.", "Je suis occupé, je ferai attention.", "C'est toi qui devrais manger plus."]],
    ask_e06: ["Est-ce que je te suis un fardeau, avec ma vieille carcasse ?", ["Non, avec toi je me sens solide.", "S'il te plaît, ne pense pas ça.", "On est une famille."]],
    ask_e07: ["Allez, une partie d'échecs avec moi ?", ["Bien sûr, je te laisse trois pions.", "Après avoir fini ça.", "Aujourd'hui, c'est moi qui commence."]],
    ask_e08: ["Je garde encore un de tes vêtements de bébé.", ["Vraiment ? J'aimerais le voir.", "Tu l'as gardé tout ce temps.", "Range-le bien, ne le perds pas."]],
    ask_e09: ["Quel temps fait-il aujourd'hui ?", ["Beau, allons marcher.", "Un peu froid, mets plus de vêtements.", "Pourquoi ne pas aller voir ?"]],
    ask_e10: ["L'enveloppe rouge que je t'ai donnée à ton mariage, tu l'as encore ?", ["Oui, je la garde précieusement.", "Je vais la chercher.", "Merci de t'en souvenir."]],
    ask_p01: ["Tu as mangé ?", ["Oui, ne t'inquiète pas.", "Pas encore, bientôt.", "Et toi ?"]],
    ask_p02: ["Ton travail te fatigue en ce moment ?", ["Ça va, je gère.", "Un peu fatigué, mais je tiens.", "Ça ira mieux après cette période."]],
    ask_p03: ["Il fait plus froid, tu as assez de vêtements ?", ["Oui.", "Non, j'en ajouterai tout à l'heure.", "Toi aussi, mets-en plus."]],
    ask_p04: ["Tu peux venir dîner à la maison ?", ["Ce week-end, c'est sûr.", "Impossible pour l'instant, dans quelques jours.", "J'aimerais, je vais m'arranger."]],
    ask_p05: ["Tout seul, tu prends soin de toi ?", ["Oui, ne t'inquiète pas.", "Parfois j'oublie.", "Honnêtement, c'est beaucoup en ce moment."]],
    ask_p06: ["De quoi avais-tu le plus peur, petit ? Tu t'en souviens ?", ["Du noir.", "Du tonnerre.", "J'ai oublié, dis-moi."]],
    ask_a01: ["Mange plus, regarde comme tu es maigre.", ["D'accord, je mange.", "Je n'ai pas maigri, tu te trompes.", "Mange aussi."]],
    ask_a02: ["Je t'ai emmené à la fête du temple quand tu étais petit. Tu te souviens ?", ["Oui, tu m'avais acheté une figurine en sucre.", "Un peu.", "Raconte-moi ce jour-là."]],
    ask_a03: ["Quelque chose de joyeux en ce moment ?", ["Oui, laisse-moi te raconter.", "Rien de spécial.", "Te voir me suffit."]],
    ask_a04: ["Tu as quelqu'un dans ta vie ?", ["Pas encore, pas d'urgence.", "Ne parlons pas de ça.", "Oui, je te le présenterai."]],
    ask_s01: ["Tu te souviens quand on se battait pour la télécommande ?", ["Oui, tu trichais toujours.", "Ha, je m'en souviens.", "Maintenant, tu passes en premier."]],
    ask_s02: ["Il y a du nouveau et d'amusant ?", ["Oui, je te le raconterai.", "Non, du travail tous les jours.", "Toi d'abord."]],
    ask_s03: ["Libre ce week-end ? On sort un peu.", ["Oui, où ça ?", "Pas cette semaine, la prochaine.", "OK, choisis."]],
    ask_s04: ["Tu t'es encore couché tard ?", ["Tu m'as eu.", "Non, ne devine pas.", "Ce soir je me couche tôt, promis."]],
    ask_s05: ["J'ai un peu mal au ventre aujourd'hui. J'aimerais quelque chose de chaud.", ["Je te sers quelque chose de chaud.", "Tu veux d'abord te reposer ?", "Tu veux que je reste ?"]],
    ask_s06: ["Je ne me sens pas bien ces jours-ci et je suis de mauvaise humeur. Sois indulgent.", ["Pas de souci, je te laisse du calme.", "Une boisson chaude ?", "Dis-moi quand tu veux."]],
    ask_s07: ["Comment vont papa et maman en ce moment ?", ["Bien, et toi ?", "Je m'inquiète un peu, parlons-en.", "Je les appelle cette semaine."]],
    ask_c01: ["{title}, tu étais aussi petit que moi ?", ["Oui, même plus petit.", "Je posais aussi plein de questions.", "Devine !"]],
    ask_c02: ["{title}, pourquoi le ciel devient noir ?", ["Parce que le soleil est parti dormir.", "Parce que la Terre tourne.", "Cherchons ensemble."]],
    ask_c03: ["{title}, tu rentres tôt aujourd'hui ?", ["Oui, je vais essayer.", "Pas sûr, mais je t'appelle.", "Je rentrerai tôt pour jouer."]],
    ask_c04: ["{title}, j'ai fait un dessin. Tu veux le voir ?", ["Oui, montre !", "D'accord, deux minutes.", "Qu'est-ce que tu as dessiné ?"]],
    ask_c05: ["{title}, quand je serai grand, je pourrai être comme toi ?", ["Tu seras encore mieux.", "Comme moi en quoi ?", "Être toi-même, c'est le mieux."]],
    ask_t01: ["{title}, c'est quoi ça ?", ["C'est un oiseau.", "Qu'est-ce que tu en penses ?", "Allons voir."]],
    ask_t02: ["{title}, je veux ça.", ["D'accord, tiens.", "Dis d'abord s'il te plaît.", "Pas celui-là, mais celui-là oui."]],
    ask_t03: ["{title}, pars pas.", ["Je ne pars pas, je suis là.", "Je reviens tout de suite.", "Viens avec moi."]],
    ask_t04: ["{title}, j'ai réussi !", ["Bravo ! Encore une fois.", "Montre-moi.", "Tu l'as fait tout seul ?"]],
    ask_g01: ["Tu étais comme ça quand tu étais jeune ?", ["À peu près, moi aussi j'étais agacé.", "J'étais encore pire.", "Tu veux que je te raconte ?"]],
    ask_g02: ["Je ne veux pas aller à l'école.", ["Qu'est-ce qui s'est passé ?", "Reste aujourd'hui, on en parle demain.", "Je t'accompagne."]],
    ask_g03: ["Je devrais faire quoi plus tard ?", ["Qu'est-ce que tu aimes en ce moment ?", "Pas de hâte, réfléchis tranquillement.", "Moi non plus je ne savais pas, jeune."]],
    ask_g04: ["Tu es fatigué ?", ["Un peu, mais ça va.", "Tu l'as remarqué.", "Plus quand je te vois."]],
    ask_m01: ["Comment s'est passée ta journée ?", ["Pas mal, et toi ?", "Un peu fatigué, fais-moi un câlin.", "Mangeons d'abord et parlons doucement."]],
    ask_m02: ["Où veux-tu aller ce week-end ?", ["Une promenade au parc.", "Rester à dormir toute la journée.", "Choisis, je te suis."]],
    ask_m03: ["Tu te souviens de notre première rencontre ?", ["Oui, tu étais en retard.", "Un peu.", "Raconte-moi encore ce jour-là."]],
    ask_m04: ["Quelque chose te préoccupe en ce moment ?", ["Un peu, je t'en parlerai.", "Non, juste fatigué.", "J'allais t'en parler."]],
  };

  const N = {
    n01: "Depuis combien de temps n'as-tu pas appelé ta famille ?", n02: "Il y a quelqu'un avec qui tu n'es plus en contact depuis longtemps, non ?", n03: "As-tu parlé à quelqu'un aujourd'hui, pas pour le travail ?", n04: "Quand as-tu vu un ami pour la dernière fois ?", n05: "Envoie un message à la personne qui vient de te venir à l'esprit, rien de grand.",
    n06: "Lève-toi, bois de l'eau, regarde par la fenêtre.", n07: "Tu es assis depuis longtemps. Marche cinq minutes.", n08: "Depuis quand n'as-tu pas invité un ami à dîner ?", n09: "Écris à quelqu'un que tu n'as pas vu depuis longtemps : comment vas-tu ?", n10: "Dîne ce soir avec ta famille, sans regarder ton téléphone.",
    n11: "Tu n'as pas bougé depuis un moment. Étire-toi.", n12: "Regarde au loin et repose tes yeux.",
  };

  const conds = {
    diabetes: {
      lines: { request: { medicine: ["C'est l'heure des cachets ?", "{ta} a regardé la boîte de cachets, puis vous."], sugar: ["{ta} a touché le petit appareil de glycémie.", "C'est l'heure de contrôler ?"] } },
      events: { dinner: { say: "Qu'est-ce qu'on mange ce soir ?", choices: [{ label: "Porc braisé", reply: "{ta} a mangé avec plaisir. Vous saviez que ce n'était pas bon pour lui." }, { label: "Poisson vapeur et légumes verts", reply: "{ta} a grommelé que c'était trop fade, mais a tout fini." }, { label: "Bouillie de céréales complètes et accompagnements", reply: "{ta} a hoché la tête en disant que ça irait." }] } },
    },
    hypertension: {
      lines: { request: { medicine: ["C'est l'heure des cachets ?", "{ta} a regardé la boîte de cachets."], bp: ["Je n'ai pas encore pris ma tension aujourd'hui.", "{ta} s'est massé les tempes."] } },
      events: { salty: { say: "Je mets du sel dans le plat aujourd'hui ?", choices: [{ label: "Une bonne pincée en plus", reply: "{ta} a dit que c'était meilleur ainsi. Vous n'avez rien dit." }, { label: "Peu de sel, un filet de vinaigre", reply: "{ta} a goûté en disant que ça passerait." }, { label: "Sans sel, beaucoup de gingembre", reply: "{ta} a froncé les sourcils, puis a vidé l'assiette." }] } },
    },
    arthritis: { lines: { request: { joint: ["{ta} se massait le genou en inspirant doucement.", "Le temps change, mes jambes me font encore mal."] } } },
    cold: { lines: { request: { fever: ["{ta} avait le visage chaud et aucune énergie.", "{ta} était affalé, le front brûlant."] } } },
    asthma: { lines: { request: { breath: ["{ta} a toussé plusieurs fois et respirait vite.", "{ta} pressait une main sur la poitrine, respirant lourdement."] } } },
    forgetful: { lines: { request: { reorient: ["Où ai-je mis mes clés ?", "On est quel jour ?", "{ta} se tenait à la porte, sans se rappeler où aller."] } } },
  };

  /* 补齐：这几句原先只有中文 */
  Object.assign(V.elder.thanks, { bath: ["Bien propre, merci."], chat: ["Ça me fait du bien de parler avec toi."] });
  Object.assign(V.parent.thanks, { chat: ["Parler avec toi m'apaise."] });
  Object.assign(V.aunt.thanks, { chat: ["Quelle bonne discussion !"] });
  Object.assign(V.partner.request, { mobility: ["J'ai mal au dos, j'ai envie de bouger un peu."] });

  C.registerPack('fr', C.buildPack({ voices: V, sayings: S, asks: A, nudges: N, conds }));
})(globalThis.CY = globalThis.CY || {});
