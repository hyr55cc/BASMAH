/**
 * بسمة — Cloud Function: autoDeleteReportedDua
 *
 * يُشغَّل تلقائياً عند إضافة بلاغ جديد إلى /reports.
 * إذا بلغ عدد البلاغات على دعاء معين 3 أو أكثر، يحذف:
 *   • مستند الدعاء من /duas/{duaId}
 *   • جميع مستندات البلاغات المرتبطة به من /reports
 *
 * تستخدم Admin SDK وتتجاوز قواعد Firestore (allow update, delete: if false)
 * التي تمنع الحذف عبر SDK العميل.
 *
 * Deploy:
 *   firebase deploy --only functions --project basmah-ad91f
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore }      = require('firebase-admin/firestore');

initializeApp();

exports.autoDeleteReportedDua = onDocumentCreated(
  'reports/{reportId}',
  async (event) => {
    const db    = getFirestore();
    const data  = event.data.data();
    const duaId = data && data.duaId;

    if (!duaId || typeof duaId !== 'string') return;

    // عدّ جميع البلاغات على هذا الدعاء
    const reportsSnap = await db
      .collection('reports')
      .where('duaId', '==', duaId)
      .get();

    if (reportsSnap.size < 3) return; // لم يصل للحد بعد

    // تحقق من تنوع مصادر البلاغات:
    // يجب أن يصدر كل بلاغ من UID مختلف (مُصدَر من الخادم عبر Firebase Anonymous Auth)
    // هذا يمنع مستخدماً واحداً من تشغيل الحذف بثلاثة بلاغات متتالية
    const uniqueUids = new Set(
      reportsSnap.docs
        .map(d => d.data().uid)
        .filter(uid => typeof uid === 'string' && uid.length > 0)
    );
    if (uniqueUids.size < 3) {
      console.log(
        `[autoDeleteReportedDua] Skipped: dua ${duaId} has ` +
        `${reportsSnap.size} report(s) but only ${uniqueUids.size} unique UID(s).`
      );
      return;
    }

    // Firestore batch: حذف الدعاء + جميع بلاغاته دفعة واحدة
    const batch = db.batch();

    // حذف مستند الدعاء (يتجاوز القواعد لأننا نستخدم Admin SDK)
    batch.delete(db.collection('duas').doc(duaId));

    // حذف جميع البلاغات المرتبطة
    reportsSnap.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    console.log(
      `[autoDeleteReportedDua] Deleted dua ${duaId} ` +
      `and ${reportsSnap.size} report(s).`
    );
  }
);
