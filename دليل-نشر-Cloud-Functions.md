# دليل نشر Cloud Function — حذف الأدعية المُبلَّغ عنها

## ما تفعله هذه الـ Function؟

عند إضافة بلاغ جديد في `/reports`، تتحقق الـ Function تلقائياً من إجمالي البلاغات على الدعاء المُشار إليه.  
إذا بلغت **3 بلاغات أو أكثر من 3 مستخدمين مختلفين**، تقوم بـ:

1. **حذف** مستند الدعاء من `/duas/{duaId}` نهائياً
2. **حذف** جميع مستندات البلاغات المرتبطة من `/reports`

> تستخدم Admin SDK وتتجاوز قواعد Firestore (`allow delete: if false`) — هذا مقصود وآمن لأن Cloud Functions تعمل في بيئة موثوقة (server-side).

---

## حالة النشر الحالية

> ⚠️ **الـ Function لم تُنشر بعد.**  
> Cloud Functions API غير مفعّل للمشروع، مما يعني أن المشروع على خطة **Spark** (المجانية) وليس **Blaze**.  
> يجب الترقية يدوياً من Firebase Console قبل النشر.

---

## المتطلبات

- ✅ حساب Firebase على خطة **Blaze** (pay-as-you-go) — Cloud Functions تتطلب الترقية من Spark
- ✅ [Firebase CLI](https://firebase.google.com/docs/cli) مثبت: `npm install -g firebase-tools`

---

## خطوات النشر (مطلوبة يدوياً)

### 1. الترقية إلى خطة Blaze

افتح: https://console.firebase.google.com/project/basmah-ad91f/usage/details  
واضغط **Upgrade** → اختر **Blaze**

> ⚠️ Cloud Functions مجانية بالكامل تقريباً للاستخدام المحدود (2 مليون استدعاء/شهر مجاناً)

### 2. النشر من Terminal (Replit Shell أو محلي)

```bash
# تثبيت التبعيات (مرة واحدة)
cd functions && npm install && cd ..

# تسجيل الدخول
firebase login

# نشر الـ Function
firebase deploy --only functions --project basmah-ad91f
```

أو بسكريبت جاهز:

```bash
bash deploy-functions.sh
```

> **ملاحظة:** لنشر كل شيء (rules + functions + hosting) في آنٍ واحد:
> ```bash
> firebase deploy --project basmah-ad91f
> ```

---

## التحقق من عمل الـ Function

### أ. في Firebase Console

افتح: https://console.firebase.google.com/project/basmah-ad91f/functions  
يجب أن تظهر `autoDeleteReportedDua` بحالة ✅

### ب. اختبار تلقائي (سكريبت جاهز)

بعد النشر، شغّل السكريبت الذي يضيف دعاء + 3 بلاغات ويتحقق من الحذف:

```bash
cd functions
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  node ../scripts/test-auto-delete.js
```

أو إذا كنت مسجلاً الدخول عبر `firebase login`:

```bash
cd functions
node ../scripts/test-auto-delete.js
```

ناتج ناجح:

```
🎉  نجح الاختبار!
    الدعاء vWEpk7J... حُذف تلقائياً.
    جميع البلاغات حُذفت أيضاً.
```

### ج. اختبار يدوي

1. افتح التطبيق وأضف دعاء تجريبياً
2. اضغط 🚩 **إبلاغ** من 3 متصفحات/أجهزة مختلفة
3. افتح [Firestore Console](https://console.firebase.google.com/project/basmah-ad91f/firestore) وتحقق أن الدعاء اختفى من `/duas`

### د. مراقبة السجلات

```bash
firebase functions:log --project basmah-ad91f
```

يجب أن تظهر رسالة مثل:

```
[autoDeleteReportedDua] Deleted dua ABC123 and 3 report(s).
```

---

## ملاحظات

| الميزة | التفاصيل |
|--------|----------|
| المشغّل | `onDocumentCreated` في `/reports/{reportId}` |
| الإصدار | Cloud Functions v2 (Gen 2) |
| بيئة التشغيل | Node.js 20 |
| الحذف | batch atomically — إما كل شيء أو لا شيء |
| القواعد | `allow delete: if false` في Firestore Rules لا تؤثر على Admin SDK |
| الحماية | يتطلب 3 UIDs مختلفة — مستخدم واحد لا يستطيع تشغيل الحذف بمفرده |
