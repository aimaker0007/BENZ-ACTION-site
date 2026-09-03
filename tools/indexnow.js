#!/usr/bin/env node
/* ============================================================
   BENZ-ACTION — Notification IndexNow
   ------------------------------------------------------------
   Prévient Bing, Yandex, Seznam et Naver qu'une ou plusieurs
   pages ont changé, sans attendre leur passage naturel.
   (Google ne participe pas à IndexNow.)

   USAGE
     node tools/indexnow.js              -> soumet toutes les URL du sitemap
     node tools/indexnow.js <url> [...]  -> soumet seulement ces URL

   La clé est le nom du fichier .txt publié à la racine de _deploy/.
   Elle est trouvée automatiquement ; ne pas la renommer ni la
   supprimer, sinon les soumissions sont rejetées.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEPLOY = path.join(__dirname, '..', '_deploy');
const HOST = 'benzaction.com';
const ORIGIN = 'https://' + HOST;

/* Retrouve la clé : un fichier <32 caractères hex>.txt à la racine du site */
function findKey() {
  const candidates = fs.readdirSync(DEPLOY)
    .filter(f => /^[a-f0-9]{8,128}\.txt$/i.test(f));
  if (candidates.length === 0) {
    throw new Error(
      'Aucun fichier de clé IndexNow trouvé dans _deploy/.\n' +
      'Créez-en un : node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"\n' +
      'puis enregistrez cette valeur dans _deploy/<valeur>.txt'
    );
  }
  if (candidates.length > 1) {
    throw new Error('Plusieurs fichiers de clé trouvés : ' + candidates.join(', ') + '. Gardez-en un seul.');
  }
  const file = candidates[0];
  const key = path.basename(file, '.txt');
  const content = fs.readFileSync(path.join(DEPLOY, file), 'utf8').trim();
  if (content !== key) {
    throw new Error('Le fichier ' + file + ' doit contenir exactement la clé (' + key + '), or il contient : ' + content);
  }
  return { key, keyLocation: ORIGIN + '/' + file };
}

/* URL du sitemap */
function sitemapUrls() {
  const xml = fs.readFileSync(path.join(DEPLOY, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

function submit(payload) {
  const body = JSON.stringify(payload);
  const opts = {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const { key, keyLocation } = findKey();
  const urls = process.argv.slice(2).length ? process.argv.slice(2) : sitemapUrls();

  if (!urls.length) throw new Error('Aucune URL à soumettre.');

  console.log('Clé      : ' + key);
  console.log('Fichier  : ' + keyLocation);
  console.log('URL      : ' + urls.length);

  const res = await submit({ host: HOST, key, keyLocation, urlList: urls });

  // 200 = accepte, 202 = accepte mais cle en cours de validation
  if (res.status === 200 || res.status === 202) {
    console.log('\n✓ Soumission acceptée (HTTP ' + res.status + ')');
    if (res.status === 202) console.log('  202 = URL reçues, validation de la clé en cours.');
  } else {
    console.error('\n✗ Refus (HTTP ' + res.status + ') : ' + res.body);
    console.error('  403 = clé introuvable ou invalide à ' + keyLocation);
    console.error('  422 = URL hors du domaine ' + HOST);
    process.exitCode = 1;
  }
}

main().catch(e => { console.error('Erreur : ' + e.message); process.exitCode = 1; });
