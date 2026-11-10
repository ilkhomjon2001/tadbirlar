// GET /api/qaror?id=&q=ok|no&t=<imzo> — Telegramdagi tugma shu yerga olib keladi.
// Imzo har bir tadbir va har bir qaror uchun alohida: boshqa havolani o'ylab topib bo'lmaydi.
const U = require('./_umumiy.js');

module.exports = async (req, res) => {
  if (!U.sozlanganmi())
    return U.sahifa(res, 503, 'Server sozlanmagan', 'Sozlamalar hali qo’shilmagan.');

  const { id, q, t } = req.query || {};
  if (!id || (q !== 'ok' && q !== 'no') || !U.imzoTogri(id, q, t))
    return U.sahifa(res, 403, 'Havola yaroqsiz',
      'Imzo to’g’ri kelmadi. Havolani to’liq nusxalanganiga ishonch hosil qiling.');

  let ro;
  try { ro = await U.kvOqi(); } catch (e) {
    return U.sahifa(res, 503, 'Baza javob bermadi', 'Birozdan keyin qayta urinib ko’ring.');
  }
  const x = ro.find((y) => y.id === id);
  if (!x) return U.sahifa(res, 404, 'Tadbir topilmadi', 'U o’chirilgan bo’lishi mumkin.');
  if (x.holat !== 'kutilmoqda')
    return U.sahifa(res, 409, 'Allaqachon hal qilingan',
      `Bu tadbir avval <b>${x.holat === 'tasdiq' ? 'tasdiqlangan' : 'rad etilgan'}</b>.`);

  x.holat = q === 'ok' ? 'tasdiq' : 'rad';
  x.qarorVaqt = new Date().toISOString();
  try { await U.kvYoz(ro); } catch (e) {
    return U.sahifa(res, 503, 'Saqlanmadi', 'Qaror yozilmadi, qayta urinib ko’ring.');
  }

  const sayt = U.manzil(req);
  if (q === 'ok')
    return U.sahifa(res, 200, 'Tasdiqlandi',
      `<b>${U.esc(x.nom)}</b> (${U.esc(x.kun)}-${U.esc(x.oy)}) endi jadvalda ko’rinadi. `
      + `<a href="${sayt}">Taqvimni ochish</a>`);
  return U.sahifa(res, 200, 'Rad etildi',
    `<b>${U.esc(x.nom)}</b> jadvalga qo’shilmadi.`);
};
