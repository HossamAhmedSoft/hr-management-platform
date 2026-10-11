# 🚀 دليل رفع المنصة مجاناً (Free Deployment Guide)
## GDG on Campus NCTU — HR Operations & Performance Management System

تم تجهيز المشروع بالكامل كـ **Final Product** جاهز للنشر الفوري (Production Ready) بنسبة 100%، بدون أي أخطاء برمجية أو متطلبات مدفوعة.

---

## 🌟 المنصات المجانية الموصى بها (Zero Cost)
1. **الواجهة والتطبيق (Frontend & API):** [Vercel](https://vercel.com) (مجاني مدى الحياة، أداء فائق السرعة، شهادة SSL تلقائية، دومين `.vercel.app`).
2. **قاعدة البيانات ونظام المستخدمين (Database & Auth):** [Supabase](https://supabase.com) (خطة مجانية سخية تشمل PostgreSQL سحابية + 50,000 مستخدم نشط).

---

## 1️⃣ الطريقة الأولى: الرفع المباشر عبر Vercel CLI (أسرع طريقة في دقيقتين)

إذا كنت لا ترغب في استخدام GitHub الآن وتريد رابطاً حياً فورياً:

1. افتح موجه الأوامر (Terminal) في مجلد المشروع:
   ```powershell
   cd "c:\Users\Hossam Ahmed\Documents\HR Managment\hr-platform"
   ```
2. شغّل أمر النشر الخاص بـ Vercel:
   ```bash
   npx vercel
   ```
3. سيطلب منك تسجيل الدخول بحسابك (GitHub أو Google أو Email).
4. اتبع الأسئلة الافتراضية بالضغط على `Enter` في كل خطوة:
   - Set up and deploy? **Y**
   - Which scope? **(اختر حسابك)**
   - Link to existing project? **N**
   - Project name? **gdg-nctu-hr**
   - In which directory is code located? **./**
   - Want to modify settings? **N**
5. للمعاينة المباشرة على بيئة الإنتاج:
   ```bash
   npx vercel --prod
   ```
   🎉 ستحصل فوراً على رابط رسمي مثل: `https://gdg-nctu-hr.vercel.app`

---

## 2️⃣ الطريقة الثانية: الرفع عبر GitHub + Vercel (المعيار الاحترافي)

### الخطوة A: رفع الكود على GitHub
المشروع تم تهيئته بالفعل بـ Git وعمل Commit لكافة الملفات:
1. اذهب إلى [GitHub](https://github.com) وأنشئ مستودعاً جديداً (New Repository) باسم `gdg-nctu-hr`.
2. انسخ رابط المستودع وشغل الأوامر التالية في مجلد `hr-platform`:
   ```powershell
   git remote add origin https://github.com/<YOUR_USERNAME>/gdg-nctu-hr.git
   git branch -M main
   git push -u origin main
   ```

### الخطوة B: الربط مع Vercel
1. سجّل الدخول إلى [Vercel](https://vercel.com) باستخدام حساب GitHub.
2. اضغط على **"Add New..."** ثم **"Project"**.
3. اختر مستودع `gdg-nctu-hr` واضغط **"Import"**.
4. تأكد من الإعدادات:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
5. اضغط **"Deploy"** وخلال دقيقة واحدة سيكون موقعك متاحاً للعالم! 🌍

---

## 3️⃣ ربط قاعدة البيانات السحابية (Supabase) - اختياري

> **ملاحظة هامة:** التطبيق مصمم ليعمل **100% بكامل وظائفه** حتى لو لم تقم بربط Supabase حالياً؛ حيث يحتوي على نظام Local Session وحسابات تجريبية تفاعلية بضغطة زر واحدة.

إذا أردت تفعيل قاعدة البيانات السحابية الحقيقية:
1. أنشئ حساباً مجانياً على [Supabase](https://supabase.com) وأنشئ مشروعاً جديداً.
2. من لوحة تحكم Supabase، اذهب إلى **SQL Editor** ونفّذ ملفات الـ SQL الجاهزة الموجودة في المشروع:
   - `supabase/migrations/001_initial_schema.sql` (ينشئ جداول الفرق، المهام، النقاط، التقييمات، التظلمات، وسجل التدقيق).
   - `supabase/migrations/002_rls_and_seed.sql` (يفعّل سياسات الحماية RLS والبيانات الافتراضية).
3. من إعدادات المشروع في Supabase (`Project Settings -> API`)، انسخ:
   - `Project URL`
   - `anon public key`
4. في لوحة تحكم Vercel، اذهب إلى `Settings -> Environment Variables` وأضف:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. أعد عمل Redeploy لتفعيل الربط السحابي.

---

## 🔑 الحسابات والصلاحيات التجريبية الجاهزة (1-Click Personas)

يمكن لأي شخص يزور موقعك تجربة نظام الصلاحيات فوراً من صفحة تسجيل الدخول (`/login`):

| الدور (Role) | الاسم | البريد الإلكتروني | الصلاحيات المميزة |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Ahmed El-Sayed | `lead@gdgnctu.com` | وصول كامل، السياسات، سجل التدقيق الأمني، الإعدادات |
| **HR Admin** | Sara Mahmoud | `hr.lead@gdgnctu.com` | إدارة الأعضاء، جلسات الـ Feedback، خطط التحسين PIP، مؤشرات الأداء |
| **HR Reviewer** | Omar Khaled | `hr.reviewer@gdgnctu.com` | مراجعة أدلة وبنود النقاط، فحص التظلمات، الاعتماد |
| **Team Lead** | Kareem Tarek | `web.lead@gdgnctu.com` | إسناد المهام، تقييم درجات الـ 100، اقتراح نقاط الفريق |
| **Member** | Youssef Ali | `member.web@gdgnctu.com` | تسليم المهام، طلب التأجيل (Delay)، كشف حساب النقاط، تقديم تظلم |
