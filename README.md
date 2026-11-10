# Tadbirlar taqvimi

Najot Ta'lim maktabining 2026–2027-o'quv yili tadbirlar rejasi: sinflar va haftalar kesimida
41 tadbir, har birining maqsadi, jihozi, tayyorgarlik muddatlari va kun tartibi bilan.

Sahifa statik; tadbir qo'shish va tasdiqlash uchun uchta kichik serverless funksiya ishlatiladi.

## Ichida nima bor

- **Jadval** — ustunlar: davrga qarab shanbalar yoki oylar; qatorlar: «Butun maktab» va 1–10-sinf.
- **Filtrlar** — davr (oy / chorak / yil) va sinf.
- **Tadbir kartochkasi** — katakka bosilsa pastda ochiladi: maqsad, kerakli jihoz,
  tayyorgarlik bosqichlari, kun tartibi daqiqalar bilan, natija va diqqat qilinadigan joyi.
- **Tadbir qo'shish va tasdiqlash** — ustoz tadbir kiritadi, u ma'murga Telegram orqali boradi;
  ma'mur tasdiqlagandan keyin tadbir hammaning jadvalida ko'rinadi.

## Tasdiqlash qanday ishlaydi

```
Ustoz qo'shadi
   POST /api/taklif        → tadbir «kutilmoqda» holatida bazaga yoziladi
                           → Telegramga xabar: TASDIQLASH / RAD ETISH havolalari
Ma'mur havolani bosadi
   GET /api/qaror          → imzo tekshiriladi, holat «tasdiq» yoki «rad» bo'ladi
Hamma ko'radi
   GET /api/tadbirlar      → faqat tasdiqlanganlar qaytadi, sahifa shuni jadvalga qo'yadi
```

Tasdiqlanmagan tadbir faqat uni kiritgan brauzerda, «kutilmoqda» belgisi bilan ko'rinadi.
Havolalar HMAC bilan imzolangan: har tadbir va har qaror uchun alohida, boshqasini o'ylab
topib bo'lmaydi.

## Fayllar

| Fayl | Nima |
|---|---|
| `index.html` | butun sahifa: ma'lumot, uslub va kod bitta faylda |
| `api/taklif.js` | yangi tadbirni qabul qiladi va Telegramga yuboradi |
| `api/qaror.js` | Telegramdagi tasdiqlash/rad etish havolasi |
| `api/tadbirlar.js` | tasdiqlangan tadbirlar ro'yxati |
| `api/_umumiy.js` | baza, imzo va Telegram yordamchilari |
| `api/holat.js` | sozlash to'g'ri ketganini tekshiradi (`/api/holat`) |
| `supabase.sql` | jadvalni yaratadigan SQL (bir marta ishga tushiriladi) |
| `belgi.svg` | brauzer yorlig'i |

Kutubxona ishlatilmaydi — `npm install` ham, build ham kerak emas.

## Vercel'da sozlash

1. **Loyihani ulash**: [vercel.com/new](https://vercel.com/new) → bu repo → Framework: *Other*,
   Build Command va Output Directory bo'sh → Deploy.
2. **Baza**: loyihaning *Storage* bo'limidan **Supabase** ni ulang (Custom Prefix bo'sh qolsin —
   shunda `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` nomlari bilan keladi).
3. **Jadval**: Supabase panelida *SQL Editor* ni oching, shu repodagi `supabase.sql` ni
   nusxalab ishga tushiring. Jadval RLS bilan yopiq — unga faqat server funksiyalari kiradi.
4. **Sozlamalar**: Vercel *Settings → Environment Variables* ga qo'shing:

   | Nomi | Qiymati |
   |---|---|
   | `TG_TOKEN` | Telegram botning tokeni |
   | `TG_ADMIN` | tasdiqlovchi odamning chat id raqami |
   | `IMZO_KALIT` | tasodifiy uzun satr (kamida 32 belgi) — havolalarni imzolaydi |
   | `SAYT_MANZIL` | ixtiyoriy: `https://<loyiha>.vercel.app` (yozilmasa o'zi aniqlaydi) |

   `IMZO_KALIT` ni yasash: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

5. Sozlamalarni qo'shgach **Redeploy** qiling — funksiyalar yangi qiymatlarni shunda oladi.
6. **Tekshirish**: `https://<loyiha>.vercel.app/api/holat` ni oching. U qaysi sozlama bor,
   baza javob beryaptimi va nima yetishmayotganini aytadi (maxfiy qiymatlarni ko'rsatmaydi).

Sozlanmaguncha sahifa ishlayveradi: tadbir faqat o'sha brauzerda saqlanadi va «Server ulanmagan»
deb yozib turadi. Hech narsa buzilmaydi.

Agar Supabase integratsiyasi kalitlarni boshqa nom bilan qo'shsa (masalan prefiks bilan),
`SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` nomlarini qo'lda qo'shib qo'ying — kod shularni
va `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_ANON_KEY` nomlarini ham tushunadi.

## Yangilash

Taqvimning o'zi maktabning o'quv rejasidan yig'iladi (reja alohida loyihada):

```
python taqvim_yasa.py      # "tadbirlar rejasi" papkasida — shu repodagi index.html ni qayta yozadi
git add -A && git commit -m "Taqvim yangilandi" && git push
```

Vercel push'dan keyin o'zi qayta joylaydi.
