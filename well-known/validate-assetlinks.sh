#!/bin/bash
# validate-assetlinks.sh — تحقق من صحة ملف assetlinks.json قبل رفعه

FILE=".well-known/assetlinks.json"
ERRORS=0

echo "🔍 فحص ملف $FILE ..."
echo ""

# تحقق من وجود الملف
if [ ! -f "$FILE" ]; then
  echo "❌ الملف غير موجود: $FILE"
  exit 1
fi

# تحقق من صحة JSON
if ! python3 -c "import json; json.load(open('$FILE'))" 2>/dev/null; then
  echo "❌ الملف ليس JSON صحيحاً — تحقق من الفواصل والأقواس"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ JSON صحيح"
fi

# تحقق من عدم وجود placeholders
if grep -q "REPLACE_WITH" "$FILE"; then
  echo "❌ لا تزال هناك قيم placeholder — يجب استبدال REPLACE_WITH_... بالبصمات الحقيقية"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ لا توجد قيم placeholder"
fi

# تحقق من تنسيق البصمات (XX:XX:XX... بحجم 32 زوج سداسي)
FINGERPRINTS=$(python3 -c "
import json, sys
data = json.load(open('$FILE'))
for entry in data:
    fps = entry.get('target', {}).get('sha256_cert_fingerprints', [])
    for fp in fps:
        print(fp)
" 2>/dev/null)

FP_COUNT=0
while IFS= read -r fp; do
  [ -z "$fp" ] && continue
  FP_COUNT=$((FP_COUNT + 1))
  # تنسيق SHA-256 الصحيح: 32 زوج من الأرقام السداسية مفصولة بـ :
  if echo "$fp" | grep -qP '^([0-9A-F]{2}:){31}[0-9A-F]{2}$'; then
    echo "✅ البصمة $FP_COUNT: تنسيق صحيح — ${fp:0:17}..."
  else
    echo "❌ البصمة $FP_COUNT: تنسيق غير صحيح → $fp"
    echo "   التنسيق المطلوب: XX:XX:XX:... (32 زوج بأحرف كبيرة)"
    ERRORS=$((ERRORS + 1))
  fi
done <<< "$FINGERPRINTS"

if [ "$FP_COUNT" -lt 2 ]; then
  echo "❌ عدد البصمات $FP_COUNT — يجب أن يكون 2 على الأقل"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "🎉 كل شيء صحيح! الملف جاهز للرفع على ريبو hyr55cc.github.io"
  echo ""
  echo "الخطوة التالية:"
  echo "  1. ارفع مجلد .well-known/ إلى ريبو hyr55cc.github.io"
  echo "  2. تحقق من الرابط: https://hyr55cc.github.io/.well-known/assetlinks.json"
else
  echo "⚠️  وُجد $ERRORS خطأ — صحّح الأخطاء أعلاه ثم أعد تشغيل السكريبت"
  exit 1
fi
