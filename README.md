# Tadbirlar taqvimi

Najot Ta'lim maktabining 2026–2027-o'quv yili tadbirlar rejasi: sinflar va haftalar kesimida
41 tadbir, har birining maqsadi, jihozi, tayyorgarlik muddatlari va kun tartibi bilan.

Bitta statik sahifa — server ham, baza ham kerak emas. Vercel'da shundayligicha turadi.

## Ichida nima bor

- **Jadval** — ustunlar: davrga qarab shanbalar yoki oylar; qatorlar: «Butun maktab» va 1–10-sinf.
- **Filtrlar** — davr (oy / chorak / yil) va sinf.
- **Tadbir kartochkasi** — katakka bosilsa pastda ochiladi: maqsad, kerakli jihoz,
  tayyorgarlik bosqichlari (3 haftadan o'sha kunigacha), kun tartibi daqiqalar bilan,
  nima bilan tugashi va diqqat qilinadigan joyi.
- **Tadbir qo'shish** — yangi tadbir kiritiladi va darhol jadvalga tushadi: nomi, turi, oy va hafta,
  qaysi sinflar (1–10 yoki butun maktab), fan, izoh va kerakli narsalar. Qo'shilgan tadbirni
  tahrirlash va o'chirish mumkin.
- **Saqlash** — qo'shilgan tadbirlar brauzerning o'zida (localStorage) saqlanadi: sahifa yopilsa ham
  qoladi, lekin faqat shu qurilmada. Boshqalarga berish uchun «JSON yuklab olish», qabul qilish
  uchun «JSON yuklash» — shu bilan bir ustozning tadbirlari ikkinchisiga o'tadi.

## Fayllar

| Fayl | Nima |
|---|---|
| `index.html` | butun sahifa: ma'lumot, uslub va kod bitta faylda |
| `belgi.svg` | brauzer yorlig'i |

Tashqaridan faqat Google Fonts yuklanadi; boshqa so'rov yo'q, kuzatuv yo'q, cookie yo'q.

## Yangilash

Sahifa maktabning o'quv rejasidan yig'iladi (reja alohida loyihada turadi):

```
python taqvim_yasa.py      # tadbirlar rejasi/ papkasida
```

— u shu repodagi `index.html` ni qayta yozadi. So'ng odatdagidek commit va push; Vercel o'zi
qayta joylaydi.
