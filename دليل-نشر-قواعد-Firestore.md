# دليل نشر قواعد Firestore — بسمة

## لماذا هذا مهم؟
ملف `firestore.rules` يحمي جدار الأدعية من التخريب ويمنع:
- إضافة روابط أو أرقام هواتف عبر الـ SDK مباشرةً
- حذف أو تعديل أدعية الآخرين
- إضافة حقول غير متوقعة في المستندات

بدون نشر هذه القواعد، قاعدة البيانات تعمل بالقواعد الافتراضية (أو قواعد اختبار مفتوحة).

---

## الطريقة الأولى: Firebase Console (الأسهل)

1. افتح: https://console.firebase.google.com/project/basmah-ad91f/firestore/rules

2. احذف كل النص الموجود في المحرر واستبدله بمحتوى ملف `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function textOk(text) {
      return
        text is string &&
        text.size() >= 3 &&
        text.size() <= 300 &&
        !text.matches('(?i).*https?://.*') &&
        !text.matches('(?i).*www\\..*') &&
        !text.matches('(?i).*(\\.(com|net|org|io|co|app|site|link|info|biz))[^\\w].*') &&
        !text.matches('(?i).*(\\.(com|net|org|io|co|app|site|link|info|biz))$') &&
        !text.matches('.*[0-9]{7,}.*') &&
        !text.matches('.*[\u0660-\u0669]{7,}.*');
    }

    match /duas/{duaId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['text', 'ts']) &&
        request.resource.data.keys().hasAll(['text', 'ts']) &&
        textOk(request.resource.data.text) &&
        request.resource.data.ts == request.time;
      allow update, delete: if false;
    }

    match /reports/{reportId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['duaId', 'ts']) &&
        request.resource.data.keys().hasAll(['duaId', 'ts']) &&
        request.resource.data.duaId is string &&
        request.resource.data.duaId.size() > 0 &&
        request.resource.data.duaId.size() <= 128 &&
        request.resource.data.ts == request.time;
      allow update, delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. اضغط **Publish** (نشر)

---

## الطريقة الثانية: Firebase CLI (للمطورين)

```bash
# تسجيل الدخول
firebase login

# نشر القواعد فقط
firebase deploy --only firestore:rules --project basmah-ad91f

# أو استخدام السكريبت الجاهز
bash scripts/deploy-firestore-rules.sh
```

---

## التحقق من عمل القواعد

بعد النشر، اختبر في Firebase Console → Firestore → Rules → **Rules Playground**:

| العملية | التوقع |
|---------|--------|
| قراءة مستند من `/duas` | ✅ مسموح |
| إضافة دعاء بنص صحيح + `serverTimestamp()` | ✅ مسموح |
| إضافة دعاء يحتوي رابط `http://...` | ❌ مرفوض |
| حذف دعاء | ❌ مرفوض |
| كتابة في مجموعة غير موجودة | ❌ مرفوض |

---

## ملاحظة
القواعد تعمل على مستوى Firebase Server، بمعنى أن أي محاولة لتجاوز التطبيق عبر:
- Firebase SDK مباشرة
- curl / Postman
- أي سكريبت خارجي

ستُرفض تلقائياً دون الحاجة لأي كود إضافي في التطبيق.
