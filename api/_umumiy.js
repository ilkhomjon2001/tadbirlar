// Umumiy yordamchilar: KV baza, imzo va Telegram.
// Sozlamalar Vercel'ning Environment Variables bo'limida turadi, kodda emas.
const crypto = require('crypto');

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const KALIT = process.env.KV_KALIT || 'tadbirlar';
const TG_TOKEN = process.env.TG_TOKEN || '';
const TG_ADMIN = process.env.TG_ADMIN || '';
const IMZO_KALIT = process.env.IMZO_KALIT || '';
const CHEGARA = 500;            // bazada saqlanadigan eng ko'p tadbir

function sozlanganmi() {
  return Boolean(KV_URL && KV_TOKEN && IMZO_KALIT);
}

async function kvOqi() {
  if (!KV_URL) return [];
  const j = await fetch(`${KV_URL}/get/${encodeURIComponent(KALIT)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  });
  if (!j.ok) throw new Error(`KV o'qilmadi: ${j.status}`);
  const d = await j.json();
  if (!d || d.result == null) return [];
  try {
    const x = JSON.parse(d.result);
    return Array.isArray(x) ? x : [];
  } catch (e) {
    return [];
  }
}

async function kvYoz(ro) {
  const j = await fetch(`${KV_URL}/set/${encodeURIComponent(KALIT)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(ro.slice(-CHEGARA)),
  });
  if (!j.ok) throw new Error(`KV yozilmadi: ${j.status}`);
}

/** Telegramdagi tasdiqlash havolasi uchun imzo — faqat shu tadbir va shu qaror uchun. */
function imzo(id, qaror) {
  return crypto.createHmac('sha256', IMZO_KALIT).update(`${id}:${qaror}`).digest('hex').slice(0, 24);
}

function imzoTogri(id, qaror, t) {
  const kutilgan = Buffer.from(imzo(id, qaror));
  const kelgan = Buffer.from(String(t || ''));
  return kutilgan.length === kelgan.length && crypto.timingSafeEqual(kutilgan, kelgan);
}

async function telegram(matn) {
  if (!TG_TOKEN || !TG_ADMIN) return false;
  try {
    const j = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_ADMIN, text: matn, parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      }),
    });
    return j.ok;
  } catch (e) {
    return false;
  }
}

function manzil(req) {
  if (process.env.SAYT_MANZIL) return process.env.SAYT_MANZIL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `https://${host}`;
}

const esc = (x) => String(x == null ? '' : x)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Matnni tozalash: ortiqcha bo'shliqlarsiz, uzunligi chegaralangan. */
function matn(x, uzun) {
  return String(x == null ? '' : x).split(/\s+/).join(' ').trim().slice(0, uzun);
}

/** Oddiy javob sahifasi (Telegramdagi havola brauzerda ochiladi). */
function sahifa(res, kod, sarlavha, izoh) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(kod).send(`<!doctype html><html lang="uz"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(sarlavha)}</title><style>
:root{color-scheme:light dark;--fon:#f5f6f8;--mato:#fff;--siyoh:#141e2b;--xira:#56657a;
  --chiziq:#d5dbe3}
@media (prefers-color-scheme:dark){:root{--fon:#111822;--mato:#19212d;--siyoh:#e9eef5;
  --xira:#9daabb;--chiziq:#2c3645}}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--fon);
  color:var(--siyoh);font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.karta{max-width:460px;background:var(--mato);border:1px solid var(--chiziq);border-radius:16px;
  padding:28px 26px}
h1{margin:0 0 8px;font-size:20px;letter-spacing:-.02em}
p{margin:0;color:var(--xira);font-size:14.5px}
</style></head><body><div class="karta"><h1>${esc(sarlavha)}</h1><p>${izoh}</p></div></body></html>`);
}

module.exports = { kvOqi, kvYoz, imzo, imzoTogri, telegram, manzil, matn, esc, sahifa,
  sozlanganmi, CHEGARA };
