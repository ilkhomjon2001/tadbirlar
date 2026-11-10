-- Tadbirlar jadvali. Supabase > SQL Editor da bir marta ishga tushiriladi.
-- Yozish va o'qish faqat server funksiyalari orqali (service role kaliti bilan) bo'ladi,
-- shuning uchun RLS yoqilgan va hech qanday ochiq siyosat berilmagan: anon kalit bilan
-- brauzerdan jadvalga kirib bo'lmaydi.

create table if not exists public.tadbirlar (
  id          text primary key,
  holat       text not null default 'kutilmoqda'
                check (holat in ('kutilmoqda', 'tasdiq', 'rad')),
  nom         text not null,
  izoh        text default '',
  kerak       text default '',
  kim         text default '',
  tur         text not null default 'taqdimot',
  fan         text not null default 'boshqa',
  oy          text,
  oy_idx      smallint default 0,
  kun         text,
  sana        date,
  hafta       text default '',
  sinflar     jsonb not null default '[]'::jsonb,
  vaqt        timestamptz not null default now(),
  qaror_vaqt  timestamptz
);

create index if not exists tadbirlar_holat_sana on public.tadbirlar (holat, sana);

alter table public.tadbirlar enable row level security;
