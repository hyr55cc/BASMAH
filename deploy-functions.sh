#!/bin/bash
# سكريبت نشر Cloud Functions — بسمة
# شغّله من Shell الخاص بك (Replit Shell أو Terminal محلي)

set -e

echo "=== نشر Cloud Function: autoDeleteReportedDua ==="
echo ""

# 1. تثبيت تبعيات الـ functions
echo "▶ تثبيت التبعيات..."
cd functions
npm install
cd ..

# 2. تسجيل الدخول (إذا لم تكن مسجلاً)
echo ""
echo "▶ التحقق من تسجيل الدخول..."
if ! firebase projects:list --project basmah-ad91f > /dev/null 2>&1; then
  echo "   يرجى تسجيل الدخول:"
  firebase login
fi

# 3. النشر
echo ""
echo "▶ جاري النشر على Firebase..."
firebase deploy --only functions --project basmah-ad91f

echo ""
echo "✅ تم النشر بنجاح!"
echo ""
echo "تحقق من الـ Function هنا:"
echo "https://console.firebase.google.com/project/basmah-ad91f/functions"
echo ""
echo "مراقبة السجلات:"
echo "firebase functions:log --project basmah-ad91f"
