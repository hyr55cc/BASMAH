#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  نشر قواعد Firestore — بسمة
#  Deploy Firestore security rules for the Dua Wall
# ════════════════════════════════════════════════════════════════
#
#  الاستخدام:
#    bash scripts/deploy-firestore-rules.sh
#
#  المتطلبات:
#    - تسجيل الدخول إلى Firebase أولاً:
#        firebase login
#      أو باستخدام CI token:
#        firebase login:ci
#        ثم: export FIREBASE_TOKEN="<token>"
#               firebase deploy --only firestore:rules --token "$FIREBASE_TOKEN"
# ════════════════════════════════════════════════════════════════

set -e

PROJECT="basmah-ad91f"
RULES_FILE="firestore.rules"

echo "📋  مشروع Firebase: $PROJECT"
echo "📄  ملف القواعد: $RULES_FILE"
echo ""

# Check firebase CLI
if ! command -v firebase &>/dev/null; then
  echo "❌  Firebase CLI غير مثبت. تثبيت..."
  npm install -g firebase-tools
fi

echo "🚀  جاري نشر قواعد Firestore..."
firebase deploy --only firestore:rules --project "$PROJECT"

echo ""
echo "✅  تم نشر القواعد بنجاح!"
echo ""
echo "للتحقق: افتح Firebase Console → Firestore → Rules"
echo "https://console.firebase.google.com/project/$PROJECT/firestore/rules"
