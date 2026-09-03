#!/usr/bin/env node
/* ============================================================
   BENZ-ACTION — Pré-rendu statique (build step)
   ------------------------------------------------------------
   Lit assets/data.js et injecte le HTML des sections pilotées
   par les données (filmographie, partenaires, témoignages,
   galerie) directement dans les pages statiques.

   POURQUOI : script.js remplit ces sections côté navigateur.
   Les robots qui n'exécutent pas JavaScript (GPTBot, ClaudeBot,
   PerplexityBot...) voyaient donc des pages vides. Ce script
   met le même HTML dans le fichier livré ; script.js le
   réécrit ensuite à l'identique côté client (filtres, animations).

   USAGE :  node tools/prerender.js
   Le script est IDEMPOTENT : on peut le relancer autant de fois
   que voulu. Il tourne automatiquement au déploiement
   (voir .github/workflows/pages.yml).

   IMPORTANT : assets/data.js reste le SEUL fichier de contenu
   à modifier. Ce script recopie simplement ces données.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEPLOY = path.join(__dirname, '..', '_deploy');

/* ---------- 1. Charger les données ---------- */
function loadData() {
  const src = fs.readFileSync(path.join(DEPLOY, 'assets', 'data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'data.js' });
  return sandbox.window;
}

/* ---------- 2. Helpers (identiques à script.js) ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function media(base, p) {
  return p ? base + p : '';
}

/* ---------- 3. Renderers (miroir exact de script.js) ---------- */

function renderFilmography(DATA, lang, base, limit) {
  let items = (DATA.BENZ_FILMOGRAPHY || []).slice();
  if (limit) items = items.slice(0, limit);

  const typeLabel = {
    feature: { en: 'Feature film', fr: 'Long-métrage' },
    series: { en: 'Series', fr: 'Série' },
    commercial: { en: 'Commercial', fr: 'Publicité' }
  };

  let html = '<div class="films">';
  items.forEach(function (f, i) {
    const role = lang === 'fr' ? f.role_fr : f.role_en;
    const tl = typeLabel[f.productionType];
    const kind = tl ? (lang === 'fr' ? tl.fr : tl.en) : '';
    const inner =
      (f.poster
        ? '<img src="' + esc(media(base, f.poster)) + '" alt="' + esc(f.title) + ' (' + f.year + ') — poster" loading="lazy">'
        : '<div class="film__grad"></div>') +
      '<div class="film__grad"></div>' +
      '<div class="film__meta">' +
      '<span class="film__year">' + f.year + (kind ? ' · ' + esc(kind) : '') + '</span>' +
      '<h3 class="film__title">' + esc(f.title) + '</h3>' +
      '<p class="film__role">' + esc(role) + '</p>' +
      '</div>';
    html += f.link
      ? '<a class="film" href="' + esc(f.link) + '" target="_blank" rel="noopener" data-reveal style="--d:' + (i % 4) * 0.08 + 's">' + inner + '</a>'
      : '<article class="film" data-reveal style="--d:' + (i % 4) * 0.08 + 's">' + inner + '</article>';
  });
  html += '</div>';
  return html;
}

function renderPartners(DATA) {
  const names = DATA.BENZ_PARTNERS || [];
  const spans = names.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('');
  return '<div class="partners__track">' + spans + spans + '</div>';
}

function renderTestimonials(DATA, lang) {
  let html = '';
  (DATA.BENZ_TESTIMONIALS || []).forEach(function (t, i) {
    const q = lang === 'fr' ? t.quote_fr : t.quote_en;
    const role = lang === 'fr' ? t.role_fr : t.role_en;
    html += '<article class="quote" data-reveal style="--d:' + i * 0.1 + 's"><p>' + esc(q) + '</p>' +
      '<footer><cite>' + esc(t.name) + '</cite><small>' + esc(role) + '</small></footer></article>';
  });
  return html;
}

function renderGallery(DATA, lang, base, limit, withFilters) {
  let items = (DATA.BENZ_GALLERY || []).slice();
  if (limit) items = items.slice(0, limit);

  const cats = [
    { id: 'all', en: 'All', fr: 'Tout' },
    { id: 'automobile', en: 'Automobile', fr: 'Automobile' },
    { id: 'combat', en: 'Combat', fr: 'Combat' },
    { id: 'height', en: 'Heights / Aerial', fr: 'Hauteur / Voltige' },
    { id: 'pyrotechnics', en: 'Pyrotechnics', fr: 'Pyrotechnie' },
    { id: 'safety', en: 'Safety', fr: 'Sécurité' }
  ];

  let html = '';
  if (withFilters) {
    html += '<div class="gal-filters" role="group">';
    cats.forEach(function (c, i) {
      html += '<button type="button" data-filter="' + c.id + '"' + (i === 0 ? ' class="is-active"' : '') + '>' +
        esc(lang === 'fr' ? c.fr : c.en) + '</button>';
    });
    html += '</div>';
  }
  html += '<div class="gal-grid">';
  items.forEach(function (g, i) {
    const cap = lang === 'fr' ? g.caption_fr : g.caption_en;
    const stunts = (g.stunt || []).join(' ');
    html += '<figure class="gal-item" data-stunts="' + esc(stunts) + '" data-reveal style="--d:' + (i % 3) * 0.08 + 's">';
    if (g.type === 'video' && g.src) {
      html += '<video controls playsinline preload="metadata"' +
        (g.poster ? ' poster="' + esc(media(base, g.poster)) + '"' : '') + '>' +
        '<source src="' + esc(media(base, g.src)) + '" type="video/mp4">' +
        '<p class="gal-fallback">' + (lang === 'fr' ? 'Votre navigateur ne peut pas lire cette vidéo.' : 'Your browser cannot play this video.') + '</p>' +
        '</video>';
    } else if (g.src) {
      html += '<img src="' + esc(media(base, g.src)) + '" alt="' + esc(cap) + '" loading="lazy">';
    }
    html += '<figcaption>' + esc(cap) + '</figcaption></figure>';
  });
  html += '</div>';
  return html;
}

/* ---------- 4. Injection dans le HTML ---------- */
/* Trouve <div ... data-ATTR ...> ... </div> et remplace son contenu.
   Gère les <div> imbriqués via un compteur de profondeur, ce qui rend
   l'opération réversible/rejouable (idempotente). */
function injectMount(html, attr, produce) {
  // Ouvre sur <div ...> contenant l'attribut, en évitant data-attr-autre-chose
  const openRe = new RegExp('<div\\b[^>]*\\b' + attr + '(?=[\\s=>])[^>]*>', 'g');
  let out = html;
  let m;
  let guard = 0;

  while ((m = openRe.exec(out)) !== null) {
    if (++guard > 50) throw new Error('Boucle inattendue sur ' + attr);

    const openTag = m[0];
    const contentStart = m.index + openTag.length;

    // Recherche du </div> correspondant
    const tagRe = /<div\b[^>]*>|<\/div>/g;
    tagRe.lastIndex = contentStart;
    let depth = 1;
    let t;
    let contentEnd = -1;
    while ((t = tagRe.exec(out)) !== null) {
      if (t[0] === '</div>') {
        depth--;
        if (depth === 0) { contentEnd = t.index; break; }
      } else {
        depth++;
      }
    }
    if (contentEnd === -1) throw new Error('Balise </div> manquante pour ' + attr);

    // Attributs du conteneur (data-limit, data-filters)
    const limitMatch = openTag.match(/data-limit="(\d+)"/);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 0;
    const withFilters = /data-filters="true"/.test(openTag);

    const generated = produce({ limit: limit, withFilters: withFilters });

    out = out.slice(0, contentStart) + generated + out.slice(contentEnd);

    // Reprend la recherche après le bloc réécrit
    openRe.lastIndex = contentStart + generated.length;
  }
  return out;
}

/* ---------- 4b. Données structurées (JSON-LD) ---------- */
/* Générées ici pour rester synchronisées avec assets/data.js.
   Injectées avant </head> dans une balise marquée data-generated,
   remplacée à chaque exécution. */

const ORG_ID = 'https://benzaction.com/#organization';
/* Au générique, les films créditent la personne (Youness Benzakour),
   pas la société. Le nœud Person est déclaré dans le bloc JSON-LD
   statique de chaque page ; Google fusionne les blocs d'une même page,
   donc la référence par @id se résout. */
const FOUNDER_ID = 'https://benzaction.com/#founder';
const SITE = 'https://benzaction.com/';

/* Les 6 disciplines : contenu fixe (pas dans data.js) */
const SERVICES = [
  { slug: 'car-mechanical-stunts',
    en: ['Car & Mechanical Stunts', 'Controlled rolls and barrel rolls, vehicle jumps and ramps, drifts and precision pursuits, calculated crashes, vehicle prep and rigging.'],
    fr: ['Cascades automobiles et mécaniques', 'Tonneaux contrôlés, sauts et rampes, drifts et poursuites de précision, chocs calculés, préparation et rigging véhicules.'] },
  { slug: 'stunt-coordination',
    en: ['Stunt Coordination', 'Technical script analysis, risk assessment, pre-visualization, casting and directing stunt performers, coordination with direction and production.'],
    fr: ['Coordination de cascades', 'Analyse technique du scénario, évaluation des risques, prévisualisation, casting et direction des cascadeurs, coordination avec la réalisation et la production.'] },
  { slug: 'fight-choreography',
    en: ['Fight Choreography', 'Unarmed and bladed combat, realistic or stylized screen fighting, movement work with lead actors, tuning impacts and reactions.'],
    fr: ['Chorégraphie de combat', 'Combat à mains nues et armes blanches, combat réaliste ou stylisé, travail du mouvement avec les comédiens, réglage des impacts et réactions.'] },
  { slug: 'stunt-double-performer',
    en: ['Stunt Double / Performer', 'Physical and morphological doubling, reproducing actors body language, full stunts on high-risk sequences, continuity with the set.'],
    fr: ['Doublure cascade', 'Doublure physique et morphologique, reproduction de la gestuelle des comédiens, cascades intégrales sur séquences à risque, continuité avec le plateau.'] },
  { slug: 'pyrotechnics-physical-fx',
    en: ['Pyrotechnics & Physical FX', 'Ground and aerial explosions, walls of fire and simulated blazes, bullet impacts and squibs, colored smoke, sparks, vehicle destruction.'],
    fr: ['Pyrotechnie et effets physiques', 'Explosions au sol et aériennes, murs de feu et incendies simulés, impacts de balles et squibs, fumées colorées, étincelles, destruction de véhicules.'] },
  { slug: 'set-safety-coordination',
    en: ['Set Safety Coordination', 'Risk audit and safety plan, validation of protective devices, briefings and perimeter control, continuous on-set safety presence.'],
    fr: ['Coordination sécurité plateau', 'Audit des risques et plan de sécurité, validation des dispositifs de protection, briefings et contrôle du périmètre, présence sécurité continue sur le plateau.'] }
];

function schemaServices(lang, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: lang === 'fr' ? 'Services de cascades et action design' : 'Stunt & Action Design Services',
    url: pageUrl,
    provider: { '@id': ORG_ID },
    itemListElement: SERVICES.map(function (s, i) {
      const t = lang === 'fr' ? s.fr : s.en;
      return {
        '@type': 'Offer',
        position: i + 1,
        itemOffered: {
          '@type': 'Service',
          name: t[0],
          description: t[1],
          serviceType: s.en[0],
          provider: { '@id': ORG_ID },
          areaServed: ['Morocco', 'Maghreb', 'International'],
          url: pageUrl + '#' + s.slug
        }
      };
    })
  };
}

function schemaFilmography(DATA, lang, pageUrl) {
  const TYPE = { feature: 'Movie', series: 'TVSeries', commercial: 'CreativeWork' };
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'fr' ? 'Films & réalisations — BENZ-ACTION' : 'Films & credits — BENZ-ACTION',
    url: pageUrl,
    numberOfItems: (DATA.BENZ_FILMOGRAPHY || []).length,
    itemListElement: (DATA.BENZ_FILMOGRAPHY || []).map(function (f, i) {
      const work = {
        '@type': TYPE[f.productionType] || 'CreativeWork',
        name: f.title,
        datePublished: String(f.year),
        // contributor et non productionCompany : BENZ-ACTION a fourni les
        // services cascades, elle n'a pas produit ces films. La personne est
        // citée en plus de la société, parce que c'est elle qui est créditée
        // au générique et sur IMDb — c'est le pont entre les deux entités.
        contributor: [{ '@id': ORG_ID }, { '@id': FOUNDER_ID }]
      };
      if (f.poster) work.image = SITE + f.poster;
      if (f.link) work.sameAs = f.link;
      const role = lang === 'fr' ? f.role_fr : f.role_en;
      if (role) work.description = role + ' — BENZ-ACTION.';
      return { '@type': 'ListItem', position: i + 1, item: work };
    })
  };
}

/* uploadDate : novembre 2025, indiqué par le client au mois près.
   Le jour est fixé au 1er faute de date exacte — à préciser si elle
   est retrouvée. Sans uploadDate, Google refuse d'indexer la vidéo.
   duration : mesurée sur le fichier (133,61 s = 2 min 13 s).
   thumbnailUrl : le still 1280x720 du showreel, qui correspond au
   format paysage de la vidéo et à l'affiche réellement montrée sur la
   page. Ne pas y remettre une affiche de film portrait.
   embedUrl est volontairement absent : la vidéo est auto-hébergée en
   <video>, il n'existe pas d'URL de lecteur ; contentUrl suffit. */
function schemaShowreel(lang, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lang === 'fr' ? 'Showreel BENZ-ACTION 2025' : 'BENZ-ACTION Showreel 2025',
    description: lang === 'fr'
      ? 'Cascades automobiles, combats, cascades de feu et chutes, filmés sur de vraies productions au Maroc et à l’international.'
      : 'Car stunts, screen fights, fire stunts and falls, filmed on real productions in Morocco and abroad.',
    thumbnailUrl: [SITE + 'assets/media/still-showreel.webp'],
    contentUrl: SITE + 'assets/media/showreel-2025.mp4',
    uploadDate: '2025-11-01',
    duration: 'PT2M13S',
    inLanguage: lang,
    publisher: { '@id': ORG_ID }
  };
}

function injectSchema(html, obj) {
  const block = '<script type="application/ld+json" data-generated="1">' +
    JSON.stringify(obj) + '</script>';
  const existing = /<script type="application\/ld\+json" data-generated="1">[\s\S]*?<\/script>\r?\n?/;
  let out = html.replace(existing, '');
  return out.replace('</head>', block + '\r\n</head>');
}

/* ---------- 5. Pages cibles ----------
   schema : 'services' | 'films' | 'showreel' (optionnel) */
const PAGES = [
  { file: 'index.html', lang: 'en', base: '', url: SITE },
  { file: 'accueil.html', lang: 'fr', base: '', url: SITE + 'accueil.html' },
  { file: 'references.html', lang: 'fr', base: '', url: SITE + 'references.html', schema: 'films' },
  { file: 'galerie.html', lang: 'fr', base: '', url: SITE + 'galerie.html' },
  { file: 'en/references.html', lang: 'en', base: '../', url: SITE + 'en/references.html', schema: 'films' },
  { file: 'en/gallery.html', lang: 'en', base: '../', url: SITE + 'en/gallery.html' },
  // pages sans conteneurs de données, mais avec schéma spécifique
  { file: 'services.html', lang: 'fr', base: '', url: SITE + 'services.html', schema: 'services' },
  { file: 'en/services.html', lang: 'en', base: '../', url: SITE + 'en/services.html', schema: 'services' },
  { file: 'showreel.html', lang: 'fr', base: '', url: SITE + 'showreel.html', schema: 'showreel' },
  { file: 'en/showreel.html', lang: 'en', base: '../', url: SITE + 'en/showreel.html', schema: 'showreel' }
];

/* ---------- 6. Exécution ---------- */
function main() {
  const DATA = loadData();

  const counts = {
    films: (DATA.BENZ_FILMOGRAPHY || []).length,
    partners: (DATA.BENZ_PARTNERS || []).length,
    testimonials: (DATA.BENZ_TESTIMONIALS || []).length,
    gallery: (DATA.BENZ_GALLERY || []).length
  };
  console.log('Données : %d films, %d partenaires, %d témoignages, %d médias galerie',
    counts.films, counts.partners, counts.testimonials, counts.gallery);

  let touched = 0;

  PAGES.forEach(function (page) {
    const full = path.join(DEPLOY, page.file);
    if (!fs.existsSync(full)) {
      console.warn('  ! introuvable, ignoré : ' + page.file);
      return;
    }

    const before = fs.readFileSync(full, 'utf8');
    let html = before;
    const done = [];

    if (html.indexOf('data-filmography') !== -1) {
      html = injectMount(html, 'data-filmography', function (o) {
        return renderFilmography(DATA, page.lang, page.base, o.limit);
      });
      done.push('filmographie');
    }
    if (html.indexOf('data-partners') !== -1) {
      html = injectMount(html, 'data-partners', function () {
        return renderPartners(DATA);
      });
      done.push('partenaires');
    }
    if (html.indexOf('data-testimonials') !== -1) {
      html = injectMount(html, 'data-testimonials', function () {
        return renderTestimonials(DATA, page.lang);
      });
      done.push('témoignages');
    }
    if (html.indexOf('data-gallery') !== -1) {
      html = injectMount(html, 'data-gallery', function (o) {
        return renderGallery(DATA, page.lang, page.base, o.limit, o.withFilters);
      });
      done.push('galerie');
    }

    if (page.schema === 'services') {
      html = injectSchema(html, schemaServices(page.lang, page.url));
      done.push('schéma services');
    } else if (page.schema === 'films') {
      html = injectSchema(html, schemaFilmography(DATA, page.lang, page.url));
      done.push('schéma films');
    } else if (page.schema === 'showreel') {
      html = injectSchema(html, schemaShowreel(page.lang, page.url));
      done.push('schéma showreel');
    }

    if (html !== before) {
      fs.writeFileSync(full, html, 'utf8');
      touched++;
      console.log('  ✓ %s [%s]', page.file, done.join(', '));
    } else {
      console.log('  = %s (déjà à jour) [%s]', page.file, done.join(', '));
    }
  });

  console.log('Pré-rendu terminé : %d fichier(s) mis à jour.', touched);
}

main();
