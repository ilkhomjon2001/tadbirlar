// Umumiy yordamchilar: Supabase bazasi, imzo va Telegram.
// Sozlamalar Vercel'ning Environment Variables bo'limida turadi, kodda emas.
// Bazaga faqat shu funksiyalar murojaat qiladi — kalit brauzerga hech qachon chiqmaydi.
const crypto = require('crypto');

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_PROJECT_URL || '').replace(/\/+$/, '');
const SB_KALIT = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const JADVAL = process.env.SB_JADVAL || 'tadbirlar';
const TG_TOKEN = process.env.TG_TOKEN || '';
const TG_ADMIN = process.env.TG_ADMIN || '';
const IMZO_KALIT = process.env.IMZO_KALIT || '';
const CHEGARA = 500;            // bazada saqlanadigan eng ko'p tadbir

function sozlanganmi() {
  return Boolean(SB_URL && SB_KALIT && IMZO_KALIT);
}

function boshlar(qosh) {
  return Object.assign({
    apikey: SB_KALIT,
    Authorization: `Bearer ${SB_KALIT}`,
    'Content-Type': 'application/json',
  }, qosh || {});
}

/** PostgREST so'rovi. `yol` — jadvaldan keyingi qism, masalan "?holat=eq.tasdiq". */
async function sb(yol, sozlama) {
  const j = await fetch(`${SB_URL}/rest/v1/${JADVAL}${yol}`,
    Object.assign({ cache: 'no-store' }, sozlama, { headers: boshlar((sozlama || {}).headers) }));
  if (!j.ok) {
    const matn = await j.text().catch(() => '');
    throw new Error(`Supabase ${j.status}: ${matn.slice(0, 200)}`);
  }
  const t = await j.text();
  return t ? JSON.parse(t) : [];
}

/** Bazadagi qatorni sahifa kutadigan ko'rinishga o'tkazadi. */
function qatordan(r) {
  return {
    id: r.id, holat: r.holat, nom: r.nom, izoh: r.izoh || '', kerak: r.kerak || '',
    kim: r.kim || '', tur: r.tur, fan: r.fan, oy: r.oy, oyIdx: r.oy_idx, kun: r.kun,
    sana: r.sana, hafta: r.hafta || '', sinflar: Array.isArray(r.sinflar) ? r.sinflar : [],
    vaqt: r.vaqt, qarorVaqt: r.qaror_vaqt,
  };
}

async function tasdiqlanganlar() {
  const r = await sb('?holat=eq.tasdiq&select=*&order=sana.asc&limit=' + CHEGARA);
  return r.map(qatordan);
}

async function bitta(id) {
  const r = await sb(`?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return r.length ? qatordan(r[0]) : null;
}

async function bormi(nom, sana, kim) {
  const s = (x) => encodeURIComponent(`"${String(x).replace(/"/g, '')}"`);
  const r = await sb(`?nom=eq.${s(nom)}&sana=eq.${encodeURIComponent(sana)}`
    + `&kim=eq.${s(kim || '')}&holat=neq.rad&select=id&limit=1`);
  return r.length > 0;
}

async function qoshish(t) {
  const r = await sb('?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([{
      id: t.id, holat: t.holat, nom: t.nom, izoh: t.izoh, kerak: t.kerak, kim: t.kim,
      tur: t.tur, fan: t.fan, oy: t.oy, oy_idx: t.oyIdx, kun: t.kun, sana: t.sana,
      hafta: t.hafta, sinflar: t.sinflar,
    }]),
  });
  return r;
}

async function holatYoz(id, holat) {
  return sb(`?id=eq.${encodeURIComponent(id)}&select=id`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ holat, qaror_vaqt: new Date().toISOString() }),
  });
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

module.exports = { tasdiqlanganlar, bitta, bormi, qoshish, holatYoz, imzo, imzoTogri,
  telegram, manzil, matn, esc, sahifa, sozlanganmi, CHEGARA };
