/**
 * test-auto-delete.js
 *
 * اختبار تلقائي للتحقق من أن autoDeleteReportedDua تعمل بعد النشر.
 *
 * الخطوات:
 *  1. يُضيف دعاء تجريبياً إلى /duas
 *  2. يُضيف 3 بلاغات من UIDs مختلفة إلى /reports
 *  3. ينتظر 35 ثانية ثم يتحقق أن الدعاء اختفى من /duas
 *
 * الاستخدام:
 *   cd functions
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node ../scripts/test-auto-delete.js
 *
 * أو باستخدام Application Default Credentials:
 *   gcloud auth application-default login
 *   node ../scripts/test-auto-delete.js
 */

'use strict';

const path = require('path');

// يجب تشغيل هذا السكريبت من مجلد functions/ حيث يوجد firebase-admin
const { initializeApp, cert, getApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const PROJECT_ID = 'basmah-ad91f';
const WAIT_SECONDS = 35;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // تهيئة Firebase Admin
  let appConfig = { projectId: PROJECT_ID };
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    appConfig.credential = cert(keyFile);
  }
  // إذا كان هناك تطبيق سبق تهيؤه، استخدمه
  let app;
  try { app = getApp(); } catch (_) { app = initializeApp(appConfig); }

  const db = getFirestore(app);

  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log('🧪  اختبار autoDeleteReportedDua');
  console.log('════════════════════════════════════════════════');
  console.log('');

  // ─── 1. أضف دعاء تجريبياً ──────────────────────────────
  const duaRef = db.collection('duas').doc();
  const duaId  = duaRef.id;
  await duaRef.set({
    text:      '[TEST] دعاء تجريبي — سيُحذف تلقائياً عند 3 بلاغات',
    uid:       'test-admin-sdk',
    createdAt: Timestamp.now(),
    _isTest:   true,
  });
  console.log('✅  أُضيف الدعاء التجريبي');
  console.log('    المعرّف:', duaId);
  console.log('');

  // ─── 2. أضف 3 بلاغات من UIDs مختلفة ───────────────────
  const uids      = ['test-uid-X', 'test-uid-Y', 'test-uid-Z'];
  const reportRefs = [];
  for (const uid of uids) {
    const ref = db.collection('reports').doc();
    await ref.set({ duaId, uid, reason: 'test', createdAt: Timestamp.now() });
    reportRefs.push(ref);
    console.log(`📋  بلاغ (${uid}): ${ref.id}`);
  }
  console.log('');

  // ─── 3. انتظر تشغيل الـ Function ───────────────────────
  console.log(`⏳  انتظار ${WAIT_SECONDS} ثانية لتشغيل الـ Function...`);
  await sleep(WAIT_SECONDS * 1000);
  console.log('');

  // ─── 4. تحقق من الحذف ──────────────────────────────────
  const duaSnap = await duaRef.get();

  if (!duaSnap.exists) {
    // تحقق أن البلاغات أيضاً حُذفت
    let remaining = 0;
    for (const r of reportRefs) {
      const s = await r.get();
      if (s.exists) remaining++;
    }

    console.log('🎉  نجح الاختبار!');
    console.log(`    الدعاء ${duaId} حُذف تلقائياً.`);
    console.log(remaining === 0
      ? '    جميع البلاغات حُذفت أيضاً.'
      : `    ⚠️  تبقّى ${remaining} بلاغ/بلاغات في /reports (ربما تأخر قليلاً).`
    );
    console.log('');
    console.log('    للتحقق من السجلات:');
    console.log('    firebase functions:log --project basmah-ad91f');
    console.log('    يجب أن تظهر:');
    console.log(`    [autoDeleteReportedDua] Deleted dua ${duaId} and 3 report(s).`);
    console.log('');
    console.log('✅  الاختبار مكتمل.');
    process.exit(0);
  } else {
    console.log('❌  فشل الاختبار!');
    console.log('    الدعاء لا يزال موجوداً في /duas.');
    console.log('');
    console.log('    الأسباب المحتملة:');
    console.log('    1. الـ Function لم تُنشر بعد — شغّل: bash deploy-functions.sh');
    console.log('    2. المشروع ليس على خطة Blaze — افتح Firebase Console وقم بالترقية');
    console.log('    3. Cloud Functions API غير مفعّل — سيُفعَّل تلقائياً عند أول نشر');
    console.log('    4. الـ Function تعمل بعد أكثر من 35 ثانية (نادر)');
    console.log('');
    console.log('    راجع السجلات:');
    console.log('    firebase functions:log --project basmah-ad91f');
    console.log('');

    // تنظيف البيانات التجريبية
    console.log('🧹  تنظيف البيانات التجريبية...');
    await duaRef.delete().catch(() => {});
    for (const r of reportRefs) await r.delete().catch(() => {});
    console.log('    تم.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('خطأ غير متوقع:', err.message);
  process.exit(1);
});
