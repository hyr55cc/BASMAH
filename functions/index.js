/**
 * بسمة — Cloud Function: autoDeleteReportedDua
 *
 * يُشغَّل تلقائياً عند إضافة بلاغ جديد إلى /reports.
 * إذا بلغ عدد البلاغات على دعاء معين 3 أو أكثر (من 3 مستخدمين مختلفين)، يحذف:
 *   • مستند الدعاء من /duas/{duaId}
 *   • جميع مستندات البلاغات المرتبطة به من /reports
 * ثم يرسل تنبيهاً للمشرف عبر Telegram Bot.
 *
 * Firebase Secrets المطلوبة (يُضبَطان عبر Firebase Secret Manager):
 *   firebase functions:secrets:set TELEGRAM_BOT_TOKEN
 *   firebase functions:secrets:set TELEGRAM_CHAT_ID
 *
 * تستخدم Admin SDK وتتجاوز قواعد Firestore (allow update, delete: if false)
 * التي تمنع الحذف عبر SDK العميل.
 *
 * Deploy:
 *   firebase deploy --only functions --project basmah-ad91f
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret }      = require('firebase-functions/params');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore }      = require('firebase-admin/firestore');

initializeApp();

// تعريف الـ Secrets — يتيح لـ Firebase v2 حقنها كمتغيرات بيئة موثوقة
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');
const telegramChatId   = defineSecret('TELEGRAM_CHAT_ID');

/**
 * يُهرِّب الحروف الخاصة في Telegram HTML mode لمنع كسر الرسالة
 * أو رفضها من API في حال احتوى النص على < أو > أو &.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * يرسل رسالة نصية إلى المشرف عبر Telegram.
 * يرمي خطأ إذا فشل الإرسال — يتيح لـ Firebase إعادة المحاولة.
 * يخرج صامتاً فقط إذا لم تُضبَط الـ Secrets (ليس خطأ في البنية).
 *
 * @param {string} message  - نص الرسالة (HTML مُهرَّب)
 * @param {string} token    - توكن Telegram Bot
 * @param {string} chatId   - معرّف المحادثة
 */
async function notifyAdminTelegram(message, token, chatId) {
  if (!token || !chatId) {
    console.warn(
      '[autoDeleteReportedDua] Telegram notification skipped: ' +
      'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret is not configured.'
    );
    return;
  }

  const url  = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    // نرمي خطأً حتى تُعيد Firebase المحاولة — آمن لأن الدعاء محذوف
    // وعند إعادة المحاولة سترى reportsSnap.size < 3 وتخرج مبكراً
    throw new Error(
      `[autoDeleteReportedDua] Telegram API error ${res.status}: ${errText}`
    );
  }

  console.log('[autoDeleteReportedDua] Telegram notification sent successfully.');
}

exports.autoDeleteReportedDua = onDocumentCreated(
  {
    document: 'reports/{reportId}',
    // تصريح صريح بالـ Secrets المطلوبة — يحقنها Firebase v2 كـ process.env
    secrets: [telegramBotToken, telegramChatId],
  },
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

    // ─────────────────────────────────────────────────────────────────
    // حماية: يجب أن يصدر كل بلاغ من UID مختلف (تسجيل دخول مجهول Firebase).
    // هذا يمنع مستخدماً واحداً من تشغيل الحذف بعدة بلاغات من نفس الجهاز.
    //
    // طبقات الحماية المتكاملة:
    //   ① localStorage (index.html → hasReportedDua):
    //      إذا أبلغ المتصفح عن دعاء من قبل، يظهر "سبق أن أبلغت" ويرجع مبكراً.
    //   ② Firestore document ID = uid + '_' + duaId (index.html → fbReportDua):
    //      setDoc بنفس المعرّف يستبدل المستند دون زيادة عدد البلاغات.
    //   ③ uniqueUids هنا (Cloud Function):
    //      حتى لو تجاوز المستخدم ①+② (مثلاً: مسح localStorage أو استخدام
    //      console)، تتحقق الدالة أن عدد UIDs الفريدة ≥ 3 قبل الحذف.
    //
    // كيفية اختبار هذا المنطق يدوياً:
    //   1. افتح التطبيق في المتصفح وأضف دعاءً → احفظ duaId من Firestore.
    //   2. ابلغ عنه من نفس المتصفح → يُحفظ المستند reports/{uid1}_{duaId}.
    //   3. امسح localStorage ثم أعِد الإبلاغ → يُعيد كتابة نفس المستند (uid لم يتغير).
    //   4. تحقق في Firestore Console: لا يزال هناك بلاغ واحد فقط لهذا uid.
    //   5. ستلاحظ في logs الدالة:
    //      "Skipped: dua <id> has 1 report(s) but only 1 unique UID(s)."
    //   6. لاختبار الحذف الفعلي: استخدم 3 متصفحات/أجهزة مختلفة للإبلاغ.
    // ─────────────────────────────────────────────────────────────────
    const uniqueUids = new Set(
      reportsSnap.docs
        .map(d => d.data().uid)
        .filter(uid => typeof uid === 'string' && uid.length > 0)
    );
    if (uniqueUids.size < 3) {
      console.log(
        `[autoDeleteReportedDua] Skipped: dua ${duaId} has ` +
        `${reportsSnap.size} report(s) but only ${uniqueUids.size} unique UID(s). ` +
        `Need 3 distinct UIDs to trigger deletion.`
      );
      return;
    }

    // اجلب نص الدعاء قبل حذفه لإدراجه في التنبيه
    const duaSnap = await db.collection('duas').doc(duaId).get();
    const duaText = duaSnap.exists
      ? (duaSnap.data().text || duaSnap.data().dua || '—')
      : '(الدعاء غير موجود أو سبق حذفه)';

    // Firestore batch: حذف الدعاء + جميع بلاغاته دفعة واحدة
    const batch = db.batch();
    batch.delete(db.collection('duas').doc(duaId));
    reportsSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    const deletedAt = new Date().toISOString();

    console.log(
      `[autoDeleteReportedDua] Deleted dua ${duaId} ` +
      `and ${reportsSnap.size} report(s).`
    );

    // بناء رسالة التنبيه — الحقول الديناميكية مُهرَّبة لـ Telegram HTML
    const message =
      `🚨 <b>تم حذف دعاء تلقائياً</b>\n\n` +
      `📋 <b>معرّف الدعاء:</b> <code>${escapeHtml(duaId)}</code>\n` +
      `📝 <b>نص الدعاء:</b>\n${escapeHtml(duaText)}\n\n` +
      `🚩 <b>عدد البلاغات:</b> ${reportsSnap.size}\n` +
      `🕐 <b>التوقيت:</b> ${escapeHtml(deletedAt)}`;

    // إرسال التنبيه — يرمي خطأً عند الفشل لتعيد Firebase المحاولة
    await notifyAdminTelegram(
      message,
      telegramBotToken.value(),
      telegramChatId.value()
    );
  }
);
