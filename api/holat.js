// GET /api/holat — sozlash to'g'ri ketganini tekshirish uchun. Maxfiy qiymat chiqarmaydi:
// faqat qaysi sozlama bor-yo'qligini va baza javob berayotganini aytadi.
const U = require('./_umumiy.js');

const bor = (n) => Boolean(process.env[n]);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const javob = {
    sozlangan: U.sozlanganmi(),
    manzil: bor('SUPABASE_URL') ? 'SUPABASE_URL'
      : bor('NEXT_PUBLIC_SUPABASE_URL') ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    kalit: bor('SUPABASE_SERVICE_ROLE_KEY') ? 'SUPABASE_SERVICE_ROLE_KEY'
      : bor('SUPABASE_SERVICE_KEY') ? 'SUPABASE_SERVICE_KEY'
      : bor('SUPABASE_ANON_KEY') ? 'SUPABASE_ANON_KEY (service role kerak!)'
      : bor('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY (service role kerak!)'
      : null,
    telegram: bor('TG_TOKEN') && bor('TG_ADMIN'),
    imzo: bor('IMZO_KALIT'),
    baza: 'tekshirilmadi',
  };

  if (javob.sozlangan) {
    try {
      const ro = await U.tasdiqlanganlar();
      javob.baza = 'ok';
      javob.tasdiqlangan = ro.length;
    } catch (e) {
      javob.baza = 'xato';
      javob.sabab = String(e.message || e).slice(0, 200);
    }
  }

  const tayyor = javob.sozlangan && javob.baza === 'ok' && javob.telegram;
  javob.xulosa = tayyor
    ? "Hammasi tayyor — tadbir qo'shsa Telegramga xabar boradi."
    : !javob.manzil || !javob.kalit ? 'Supabase sozlamalari topilmadi.'
    : !javob.imzo ? "IMZO_KALIT qo'shilmagan."
    : javob.baza !== 'ok' ? "Baza javob bermadi — supabase.sql ishga tushirilganini tekshiring."
    : 'TG_TOKEN yoki TG_ADMIN yozilmagan.';

  return res.status(200).json(javob);
};
