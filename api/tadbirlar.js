// GET /api/tadbirlar — tasdiqlangan tadbirlar ro'yxati. Sahifa shu yerdan o'qiydi.
// Tasdiqlanmagan va rad etilganlar bu yerda ko'rinmaydi.
const U = require('./_umumiy.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ xato: 'faqat GET' });
  if (!U.sozlanganmi()) return res.status(200).json({ tadbirlar: [], sozlanmagan: true });

  let ro;
  try { ro = await U.kvOqi(); } catch (e) { return res.status(503).json({ xato: 'baza javob bermadi' }); }
  const tasdiq = ro.filter((t) => t.holat === 'tasdiq').map((t) => ({
    kod: t.id, qoshilgan: true, nom: t.nom, izoh: t.izoh, kerak: t.kerak, kim: t.kim,
    tur: t.tur, fan: t.fan, oy: t.oy, oyIdx: t.oyIdx, kun: t.kun, sana: t.sana,
    hafta: t.hafta, sinflar: t.sinflar || [], vaqtMatn: (t.qarorVaqt || t.vaqt || '').slice(0, 10),
  }));
  return res.status(200).json({ tadbirlar: tasdiq, yangilandi: new Date().toISOString() });
};
