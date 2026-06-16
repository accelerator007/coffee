# دليل نقل قاعدة البيانات إلى منطقة أقرب (Mumbai)

> **السبب:** قاعدة بيانات Supabase الحالية في **سيدني** بعيدة جداً عن المستخدمين في عُمان وعن سيرفرات Netlify، فكل طلب بطيء. الحل: مشروع Supabase جديد في **Mumbai (ap-south-1)** ونقل كل البيانات والحسابات إليه.

> ⚠️ **مهم:** سوِّ النقل في وقت هادئ (لا أحد يستخدم الموقع)، لأن أي بيانات تُضاف للمشروع القديم أثناء النقل لن تنتقل.

---

## المتطلبات
- أداة `psql` و `pg_dump` على جهازك (تجي مع تثبيت PostgreSQL):
  - **macOS:** `brew install postgresql@16`
  - **Windows:** نزّل PostgreSQL من الموقع الرسمي.
- لوحة تحكم Supabase (حسابك الحالي).

---

## الخطوة 1 — إنشاء المشروع الجديد
1. ادخل [supabase.com](https://supabase.com) → **New Project**.
2. الاسم: مثلاً `coffee-mumbai`.
3. **Region: `South Asia (Mumbai) ap-south-1`** ← الأهم.
4. اختر **Database Password** قوية و **احفظها** (بتحتاجها بالخطوة 3).
5. انتظر حتى يجهز المشروع (~دقيقتين).

## الخطوة 2 — بناء الجداول والدوال
1. في المشروع الجديد: **SQL Editor → New query**.
2. افتح الملف `supabase/migrations/full_schema.sql` من هذا المستودع، انسخ **كل** محتواه.
3. الصقه في المحرر واضغط **Run**.
4. تأكد ما فيه أخطاء (يبني الجداول + الـ RLS + الدوال + الـ triggers).

## الخطوة 3 — تجهيز روابط الاتصال (Connection strings)
لكل مشروع: **Settings → Database → Connection string → URI** (نوع **Session**، منفذ 5432).
ينسخ شكلها كذا:
```
postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```
بدّل `[YOUR-PASSWORD]` بكلمة سر قاعدة البيانات الحقيقية.

في الطرفية، عرّف المتغيرين (بدون مسافات حول `=`):
```bash
OLD_DB_URL="postgresql://postgres.OLDREF:OLD_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
NEW_DB_URL="postgresql://postgres.NEWREF:NEW_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

## الخطوة 4 — تصدير البيانات من المشروع القديم

### الطريقة الأسهل (موصى بها للبيانات) — سكربت جاهز
بدل ما تكتب أوامر pg_dump لبيانات التطبيق، فيه سكربت جاهز يسحب كل البيانات
(`packages` + `profiles` + `subscriptions` + `redemptions`) ويحوّلها إلى ملف
SQL واحد جاهز للّصق:
```bash
node scripts/export-data.mjs
```
يقرأ المفاتيح من `.env.local` تلقائياً، وينتج `supabase/seed_data.sql`.
تلصق محتواه في **SQL Editor** للمشروع الجديد (بعد بناء الجداول في الخطوة 2،
وبعد نقل الحسابات في الخطوة 5).

> ⚠️ هذا السكربت **لا** ينقل حسابات الدخول وكلمات السر (`auth.users`). تلك
> تُنقل عبر `pg_dump` أدناه — لأن كلمات السر مشفّرة ولا تخرج عبر الـ API.

### الطريقة اليدوية (pg_dump) — لكل شيء بما فيه الحسابات
نصدّر **البيانات فقط** (data-only) بالترتيب الصحيح. الحسابات في `auth`، وبيانات التطبيق في `public`.

```bash
# 1) حسابات المستخدمين (تسجيل الدخول) — الأهم
pg_dump "$OLD_DB_URL" --data-only --no-owner --no-privileges \
  -t 'auth.users' -t 'auth.identities' \
  > auth_data.sql

# 2) بيانات التطبيق
pg_dump "$OLD_DB_URL" --data-only --no-owner --no-privileges \
  -t 'public.profiles' -t 'public.packages' \
  -t 'public.subscriptions' -t 'public.redemptions' \
  > app_data.sql
```

## الخطوة 5 — الاستيراد إلى المشروع الجديد
الترتيب يهم بسبب المفاتيح الأجنبية (FK). نوقف الـ trigger مؤقتاً حتى لا يصطدم استيراد `profiles` مع إنشائها التلقائي.

```bash
# 1) استيراد حسابات المستخدمين أولاً
psql "$NEW_DB_URL" -f auth_data.sql

# 2) إيقاف الـ trigger مؤقتاً ثم استيراد بيانات التطبيق ثم إعادة تشغيله
psql "$NEW_DB_URL" <<'SQL'
alter table public.profiles disable trigger user_defined;
SQL

psql "$NEW_DB_URL" -f app_data.sql

# ملاحظة: الـ trigger on_auth_user_created موجود على auth.users، وقد يكون
# أنشأ صفوف profiles تلقائياً من الـ metadata عند استيراد auth.users.
# لو ظهرت أخطاء "duplicate key" أثناء استيراد profiles، فهذا طبيعي ويعني
# أن الصفوف أُنشئت مسبقاً — البيانات نفسها (الاسم/الهاتف/الدور) موجودة في
# الـ metadata فالنتيجة صحيحة. تجاهلها وأكمل.
```

إذا واجهت مشاكل مع profiles فقط، استورد البقية يدوياً بهذا الترتيب: `packages` ثم `subscriptions` ثم `redemptions` (الملف `app_data.sql` يحتويها كلها بالترتيب الصحيح).

## الخطوة 6 — التحقق من النقل
شغّل في **SQL Editor** لكل مشروع وقارن الأرقام:
```sql
select
  (select count(*) from auth.users)            as users,
  (select count(*) from public.profiles)       as profiles,
  (select count(*) from public.packages)       as packages,
  (select count(*) from public.subscriptions)  as subscriptions,
  (select count(*) from public.redemptions)    as redemptions;
```
لازم تتطابق الأرقام بين القديم والجديد.

## الخطوة 7 — تحديث المفاتيح في Netlify
من المشروع الجديد: **Settings → API**، انسخ:
- **Project URL** → متغير `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → متغير `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → متغير `SUPABASE_SERVICE_ROLE_KEY` (سري، لا تنشره)

في Netlify: **Site configuration → Environment variables**، حدّث القيم الثلاث.

> ⚠️ **تحذير أمني:** `service_role` key يعطي صلاحية كاملة. لا تضعه أبداً في متغير يبدأ بـ `NEXT_PUBLIC_`، ولا تكتبه في الكود.

## الخطوة 8 — إعادة النشر
في Netlify: **Deploys → Trigger deploy → Clear cache and deploy site**.

## الخطوة 9 — اختبار نهائي
1. سجّل دخول بحساب موجود (مثلاً عميل) بنفس كلمة سره → يثبت نجاح نقل الحسابات.
2. افتح `/admin` و `/dashboard` — المفروض أسرع بشكل واضح.
3. تأكد أن: أيام الاشتراك تظهر صح، رمز QR يطلع، مسح NFC يخصم.

## الخطوة 10 — بعد التأكد
بعد ما تتأكد أن كل شي شغّال على المشروع الجديد لعدة أيام، تقدر **توقف أو تحذف** مشروع سيدني القديم من Supabase لتجنّب أي خلط.

---

### ملاحظة عن منطقة Netlify
حتى بعد نقل القاعدة لـ Mumbai، دوال Netlify قد تعمل من منطقة بعيدة. للأفضلية القصوى تأكد أن منطقة نشر الموقع/الدوال قريبة من Mumbai/الخليج (حسب ما تتيحه خطتك). لكن نقل القاعدة وحده بيحسّن السرعة بشكل كبير.
