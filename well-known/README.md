# ملفات ربط النطاق (assetlinks)

هذا المجلد يحتوي على ملف `assetlinks.json` الذي يربط تطبيق الأندرويد بنطاق GitHub Pages لإزالة شريط المتصفح من التطبيق.

---

## ✅ خطوات إكمال هذه المرحلة

### الخطوة ١ — احصل على البصمة الأولى (من PWABuilder)

1. افتح **pwabuilder.com** وأدخل: `https://hyr55cc.github.io/BASMAH/`
2. اضغط **Package for Stores → Android → Google Play**
3. في إعدادات Signing: اختر *Create new* واحفظ ملف `signing.keystore` في مكان آمن
4. بعد البناء، ستحصل على ملف `assetlinks.json` من PWABuilder — **انسخ قيمة SHA-256 منه**

### الخطوة ٢ — احصل على البصمة الثانية (من Google Play Console)

بعد رفع ملف `.aab` لأول مرة في Play Console:
1. اذهب إلى: **Setup → App integrity → App signing**
2. انسخ قيمة **App signing key certificate → SHA-256 certificate fingerprint**

### الخطوة ٣ — حدّث الملف

افتح `well-known/.well-known/assetlinks.json` واستبدل:
- `REPLACE_WITH_PWABUILDER_SHA256_FINGERPRINT` ← بصمة PWABuilder
- `REPLACE_WITH_GOOGLE_PLAY_SHA256_FINGERPRINT` ← بصمة Google Play Console

**مثال على شكل البصمة الصحيح:**
```
AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
```
(32 زوج سداسي بأحرف كبيرة، مفصولة بـ `:`)

### الخطوة ٤ — تحقق من صحة الملف

شغّل سكريبت التحقق من مجلد `well-known/`:
```bash
cd well-known
bash validate-assetlinks.sh
```

### الخطوة ٥ — ارفع الملف على GitHub

1. أنشئ ريبو باسم **`hyr55cc.github.io`** وفعّل GitHub Pages فيه
2. ارفع مجلد `.well-known/` (بكامله) إلى جذر الريبو
3. تأكد أن هذا الرابط يفتح ويعرض البصمتين:
   ```
   https://hyr55cc.github.io/.well-known/assetlinks.json
   ```

---

## ⚠️ ملاحظة مهمة

بدون البصمتين معاً **وبشكل صحيح**، سيظهر شريط المتصفح داخل التطبيق (TWA لن يعمل بشكل صحيح) وقد يُرفض التطبيق.
