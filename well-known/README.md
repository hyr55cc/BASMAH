# ملفات ربط النطاق (assetlinks)

هذا المجلد يحتوي على ملف `assetlinks.json` الذي يربط تطبيق الأندرويد بنطاق GitHub Pages.

## كيفية الاستخدام

1. ارفع محتوى مجلد `.well-known/` إلى ريبو `hyr55cc.github.io` على GitHub
2. تأكد أن مسار الملف النهائي هو:
   ```
   https://hyr55cc.github.io/.well-known/assetlinks.json
   ```

## البصمتان المطلوبتان

### البصمة الأولى — من PWABuilder
بعد بناء حزمة الأندرويد على pwabuilder.com، ستحصل على ملف `assetlinks.json` جاهز يحتوي على بصمة SHA-256 الخاصة بمفتاح توقيعك.
- استبدل `REPLACE_WITH_PWABUILDER_SHA256_FINGERPRINT` بهذه القيمة.

### البصمة الثانية — من Google Play Console
بعد رفع ملف `.aab` لأول مرة في Play Console:
- اذهب إلى: **Setup → App integrity → App signing**
- انسخ قيمة **App signing key certificate → SHA-256 certificate fingerprint**
- استبدل `REPLACE_WITH_GOOGLE_PLAY_SHA256_FINGERPRINT` بهذه القيمة.

## ملاحظة مهمة
بدون البصمتين معاً، سيظهر شريط المتصفح داخل التطبيق (TWA لن يعمل بشكل صحيح).
