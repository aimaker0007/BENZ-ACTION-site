/* ============================================================
   BENZ-ACTION — CONTENU DU SITE (le seul fichier à modifier)
   ============================================================

   COMMENT AJOUTER VOS MÉDIAS :
   1. Déposez vos fichiers dans le dossier  assets/media/
        - photos  : .jpg / .webp        (ex: drift.jpg)
        - vidéos   : .mp4               (ex: tonneau.mp4)
        - affiches : .jpg / .png         (ex: desert-storm.jpg)
   2. Dans la liste ci-dessous, remplacez les "" par le chemin du fichier,
        toujours préfixé par  assets/media/
        Exemple :  src: "assets/media/drift.jpg"
   3. Enregistrez ce fichier et rafraîchissez la page (Ctrl + F5).

   RÈGLES SIMPLES :
   - Laisser  src: ""  => un emplacement stylisé "REVOLUTION" s'affiche.
   - type: "photo"  => image.   type: "video"  => vidéo lisible au clic.
   - Une VIDÉO peut aussi venir de YouTube : mettez l'identifiant dans
        youtube: "ABC123"  (l'ID après v= ou youtu.be/). Voir exemple g4.
   - stunt : choisir une ou plusieurs catégories parmi :
        automobile | combat | height | pyrotechnics | safety
   ============================================================ */


/* ---------- GALERIE (photos + vidéos) ---------- */
window.BENZ_GALLERY = [

    // VIDÉOS de vos réalisations (fichiers locaux)
    { id: "g1", type: "video", stunt: ["automobile", "combat", "pyrotechnics"],
      src: "assets/media/clip-escape-outland.mp4",
      poster: "assets/media/poster-escape-outland.jpg",
      youtube: "",
      caption_fr: "Escape from the Outland (2025) — action", caption_en: "Escape from the Outland (2025) — action" },

    { id: "g2", type: "video", stunt: ["combat", "safety"],
      src: "assets/media/clip-trauma-code.mp4",
      poster: "assets/media/poster-trauma-code.jpg",
      youtube: "",
      caption_fr: "The Trauma Code (2025) — combat", caption_en: "The Trauma Code (2025) — combat" },

    { id: "g3", type: "video", stunt: ["automobile", "combat"],
      src: "assets/media/clip-ransomed.mp4",
      poster: "assets/media/poster-ransomed.jpg",
      youtube: "",
      caption_fr: "Ransomed — séquence d'action", caption_en: "Ransomed — action sequence" },

    { id: "g4", type: "video", stunt: ["combat", "pyrotechnics"],
      src: "assets/media/clip-china.mp4",
      poster: "",
      youtube: "",
      caption_fr: "Production internationale — bande démo", caption_en: "International production — demo reel" },

    { id: "g5", type: "video", stunt: ["automobile"],
      src: "assets/media/clip-biker.mp4", poster: "", youtube: "",
      caption_fr: "Backstage — cascade moto sur le plateau", caption_en: "Behind the scenes — motorcycle stunt on set" },

    { id: "g6", type: "video", stunt: ["combat", "safety"],
      src: "assets/media/clip-action-01.mp4", poster: "", youtube: "",
      caption_fr: "Backstage — l'équipe en pleine action", caption_en: "Behind the scenes — the crew in full action" },

    { id: "g7", type: "video", stunt: ["combat"],
      src: "assets/media/clip-action-02.mp4", poster: "", youtube: "",
      caption_fr: "Backstage — préparation d'une cascade sur le plateau", caption_en: "Behind the scenes — stunt prep on set" },

    { id: "g8", type: "video", stunt: ["automobile"],
      src: "assets/media/clip-car-flip.mp4", poster: "", youtube: "",
      caption_fr: "Tonneau de voiture — cascade automobile", caption_en: "Car flip — vehicle stunt" },

    { id: "g9", type: "video", stunt: ["pyrotechnics"],
      src: "assets/media/clip-fire-stunt.mp4", poster: "", youtube: "",
      caption_fr: "Cascade de feu — pyrotechnie", caption_en: "Fire stunt — pyrotechnics" },

    // PHOTOS / affiches (catégorisées)
    { id: "g10", type: "photo", stunt: ["pyrotechnics", "combat"],
      src: "assets/media/poster-raqqa.jpg", poster: "", youtube: "",
      caption_fr: "Raqqa (2024)", caption_en: "Raqqa (2024)" },

    { id: "g11", type: "photo", stunt: ["automobile"],
      src: "assets/media/poster-escape-outland.jpg", poster: "", youtube: "",
      caption_fr: "Escape from the Outland (2025)", caption_en: "Escape from the Outland (2025)" },

    { id: "g12", type: "photo", stunt: ["combat", "safety"],
      src: "assets/media/poster-trauma-code.jpg", poster: "", youtube: "",
      caption_fr: "The Trauma Code (2025)", caption_en: "The Trauma Code (2025)" },

    { id: "g13", type: "photo", stunt: ["automobile", "combat"],
      src: "assets/media/poster-ransomed.jpg", poster: "", youtube: "",
      caption_fr: "Ransomed (2024)", caption_en: "Ransomed (2024)" }

    // POUR AJOUTER UN MÉDIA : copiez une ligne ci-dessus, mettez une virgule
    // après la précédente, donnez un id unique (g10, g11…) et vos infos.
];


/* ---------- FILMOGRAPHIE / RÉFÉRENCES (films & projets) ----------
   poster : affiche du film (assets/media/...). Vide => emplacement stylisé.
   link   : lien externe optionnel (IMDb, YouTube, site du film).
   productionType : feature | series | commercial | musicvideo | international
*/
window.BENZ_FILMOGRAPHY = [

    { title: "Escape from the Outland", year: 2025, productionType: "feature",
      poster: "assets/media/poster-escape-outland.jpg",
      link: "",
      stunt: ["automobile", "combat", "pyrotechnics"],
      role_fr: "Coordination cascades & action design",
      role_en: "Stunt coordination & action design" },

    { title: "The Trauma Code", year: 2025, productionType: "series",
      poster: "assets/media/poster-trauma-code.jpg",
      link: "",
      stunt: ["combat", "safety"],
      role_fr: "Chorégraphies de combat & sécurité plateau",
      role_en: "Fight choreography & set safety" },

    { title: "Raqqa", year: 2024, productionType: "feature",
      poster: "assets/media/poster-raqqa.jpg",
      link: "",
      stunt: ["pyrotechnics", "combat", "safety"],
      role_fr: "Pyrotechnie, combat & coordination sécurité",
      role_en: "Pyrotechnics, combat & safety coordination" },

    { title: "Ransomed", year: 2024, productionType: "feature",
      poster: "assets/media/poster-ransomed.jpg",
      link: "",
      stunt: ["automobile", "combat"],
      role_fr: "Cascades automobiles & combat",
      role_en: "Car stunts & combat" },

    { title: "The Moderator", year: 2022, productionType: "feature",
      poster: "assets/media/poster-moderator.jpg",
      link: "",
      stunt: ["automobile", "combat", "safety"],
      role_fr: "Cascades & coordination action",
      role_en: "Stunts & action coordination" },

    { title: "Redemption Day", year: 2021, productionType: "feature",
      poster: "assets/media/poster-redemption-day.jpg",
      link: "",
      stunt: ["pyrotechnics", "safety"],
      role_fr: "Pyrotechnie & sécurité plateau",
      role_en: "Pyrotechnics & set safety" },

    { title: "Catharsys — The Afina Tales", year: 2018, productionType: "feature",
      poster: "assets/media/poster-catharsys.jpg",
      link: "",
      stunt: ["combat", "height"],
      role_fr: "Combat & voltige",
      role_en: "Combat & aerial work" }

    // POUR AJOUTER UN FILM : copiez un bloc ci-dessus, ajoutez une virgule
    // après le précédent, et renseignez titre, année, affiche, etc.
];


/* ---------- LOGOS PARTENAIRES (texte) ---------- */
window.BENZ_PARTNERS = [
    "ESCAPE FROM THE OUTLAND", "THE TRAUMA CODE", "RAQQA", "RANSOMED", "STUDIO OUARZAZATE"
];


/* ---------- TÉMOIGNAGES ---------- */
window.BENZ_TESTIMONIALS = [
    { quote_fr: "Une équipe d'une rigueur absolue. La séquence de poursuite a été livrée sans la moindre alerte sécurité.",
      quote_en: "A team of absolute rigor. The chase sequence was delivered without a single safety incident.",
      name: "Réalisateur / Director", role_fr: "Long-métrage international", role_en: "International feature film" },
    { quote_fr: "La pyrotechnie de Benz-Action a donné une dimension spectaculaire à nos plans tout en restant parfaitement maîtrisée.",
      quote_en: "Benz-Action's pyrotechnics gave our shots a spectacular dimension while staying perfectly controlled.",
      name: "Productrice / Producer", role_fr: "Société de production", role_en: "Production company" },
    { quote_fr: "Réactifs, précis, internationaux. Ils comprennent le langage des productions exigeantes.",
      quote_en: "Responsive, precise, international. They speak the language of demanding productions.",
      name: "1er Assistant Réal. / 1st AD", role_fr: "Série TV", role_en: "TV series" }
];
