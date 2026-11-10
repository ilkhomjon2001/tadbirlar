// POST /api/taklif — ustoz qo'shgan tadbirni «kutilmoqda» holatida saqlaydi va
// tasdiqlash so'rovini Telegramga yuboradi. Tasdiqlanmaguncha jadvalga chiqmaydi.
const U = require('./_umumiy.js');

const TUR = { taqdimot: 'Taqdimot', ekskursiya: 'Ekskursiya', musobaqa: 'Musobaqa',
  kun: 'Ochiq kun', maktab: 'Loyiha kuni' };
const FAN = { robo: 'Robototexnika', it: 'IT', ai: 'AI', boshqa: 'Boshqa' };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ xato: 'faqat POST' });
  if (!U.sozlanganmi()) return res.status(503).json({ xato: 'server hali sozlanmagan' });

  let d = req.body;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
  if (!d || typeof d !== 'object') return res.status(400).json({ xato: "ma'lumot yuborilmadi" });

  const t = {
    nom: U.matn(d.nom, 90),
    izoh: U.matn(d.izoh, 900),
    kerak: U.matn(d.kerak, 400),
    kim: U.matn(d.kim, 60),
    tur: TUR[d.tur] ? d.tur : 'taqdimot',
    fan: FAN[d.fan] ? d.fan : 'boshqa',
    oy: U.matn(d.oy, 8),
    kun: U.matn(d.kun, 2),
    sana: U.matn(d.sana, 10),
    hafta: U.matn(d.hafta, 20),
    oyIdx: Number.isInteger(d.oyIdx) && d.oyIdx >= 0 && d.oyIdx < 12 ? d.oyIdx : 0,
    sinflar: Array.isArray(d.sinflar)
      ? d.sinflar.filter((x) => /^([1-9]|1[0-2])-sinf$/.test(x)).slice(0, 12) : [],
  };
  if (t.nom.length < 4) return res.status(400).json({ xato: 'tadbir nomi qisqa' });
  if (t.izoh.length < 10) return res.status(400).json({ xato: "nima bo'lishini yozing" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.sana)) return res.status(400).json({ xato: 'sana xato' });

  let ro;
  try { ro = await U.kvOqi(); } catch (e) { return res.status(503).json({ xato: 'baza javob bermadi' }); }
  if (ro.length >= U.CHEGARA) return res.status(507).json({ xato: "baza to'lib qoldi" });
  // Bir xil tadbir ikki marta yuborilmasin (bir xil nom, sana va yuboruvchi).
  if (ro.some((x) => x.nom === t.nom && x.sana === t.sana && x.kim === t.kim && x.holat !== 'rad'))
    return res.status(409).json({ xato: 'bu tadbir allaqachon yuborilgan' });

  t.id = 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  t.holat = 'kutilmoqda';
  t.qoshilgan = true;
  t.vaqt = new Date().toISOString();
  ro.push(t);
  try { await U.kvYoz(ro); } catch (e) { return res.status(503).json({ xato: 'saqlanmadi' }); }

  const baza = U.manzil(req);
  const ha = `${baza}/api/qaror?id=${t.id}&q=ok&t=${U.imzo(t.id, 'ok')}`;
  const yoq = `${baza}/api/qaror?id=${t.id}&q=no&t=${U.imzo(t.id, 'no')}`;
  const kimlar = t.sinflar.length ? t.sinflar.join(', ') : 'Butun maktab';
  await U.telegram(
    `<b>Yangi tadbir taklifi</b>\n\n`
    + `<b>${U.esc(t.nom)}</b>\n`
    + `${U.esc(TUR[t.tur])} · ${U.esc(t.kun)}-${U.esc(t.oy)} (${U.esc(t.hafta)})\n`
    + `${U.esc(kimlar)} · ${U.esc(FAN[t.fan])}\n`
    + (t.kim ? `Kim qo'shmoqchi: <b>${U.esc(t.kim)}</b>\n` : '')
    + `\n${U.esc(t.izoh)}`
    + (t.kerak ? `\n\nKerak: ${U.esc(t.kerak)}` : '')
    + `\n\n<a href="${ha}">TASDIQLASH</a>\n<a href="${yoq}">RAD ETISH</a>`);

  return res.status(200).json({ ok: true, id: t.id, holat: t.holat });
};
