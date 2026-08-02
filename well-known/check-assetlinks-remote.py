#!/usr/bin/env python3
# check-assetlinks-remote.py — تحقق تلقائياً أن assetlinks.json يُعيد البصمتين الصحيحتين من الإنترنت

import urllib.request
import urllib.error
import json
import re
import sys
import os

# ─── القيم المرجعية الثابتة ─────────────────────────────────────────────────
# يمكن تجاوزها بملف assetlinks.json المحلي إذا تم تحديثه
CANONICAL_PACKAGE    = "io.github.hyr55cc.basmah"
CANONICAL_NAMESPACE  = "android_app"
CANONICAL_RELATION   = "delegate_permission/common.handle_all_urls"
CANONICAL_FPS = [
    "99:4D:1E:9C:C6:94:85:8F:8F:D7:C4:66:69:B1:5E:6F:14:35:C9:9D:AF:9A:C1:EE:E5:7E:5B:CF:CB:79:41:50",
    "FC:FA:5C:1A:92:32:9D:32:2E:D3:92:DA:03:37:79:60:B7:6D:EE:81:70:0F:E4:89:41:E0:D7:12:7E:3F:18:1E",
]

# اقرأ القيم من الملف المحلي إذا كان متاحاً (يُعاد تعريف القيم أعلاه)
_local = os.path.join(os.path.dirname(__file__), ".well-known", "assetlinks.json")
if os.path.isfile(_local):
    try:
        _data = json.load(open(_local))
        _entry = _data[0]
        _target = _entry.get("target", {})
        _fps = _target.get("sha256_cert_fingerprints", [])
        if len(_fps) == 2 and not any("REPLACE_WITH" in f for f in _fps):
            CANONICAL_FPS     = _fps
            CANONICAL_PACKAGE = _target.get("package_name", CANONICAL_PACKAGE)
    except Exception:
        pass  # استخدم القيم الافتراضية أعلاه

URL = "https://hyr55cc.github.io/.well-known/assetlinks.json"
SHA256_PATTERN = re.compile(r'^([0-9A-F]{2}:){31}[0-9A-F]{2}$')

errors   = []
warnings = []

print(f"🔍 جارٍ التحقق من: {URL}")
print(f"   package المتوقع  : {CANONICAL_PACKAGE}")
print(f"   البصمة 1 المتوقعة: {CANONICAL_FPS[0][:23]}...")
print(f"   البصمة 2 المتوقعة: {CANONICAL_FPS[1][:23]}...")
print()

# ─── 1. طلب الرابط ─────────────────────────────────────────────────────────
try:
    req = urllib.request.Request(URL, headers={"User-Agent": "assetlinks-validator/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        status       = resp.status
        content_type = resp.getheader("Content-Type", "")
        raw_body     = resp.read().decode("utf-8")
except urllib.error.HTTPError as e:
    print(f"❌ فشل الطلب — HTTP {e.code} {e.reason}")
    print(f"   تأكد أن ريبو hyr55cc.github.io يحتوي على الملف في المسار الصحيح")
    sys.exit(1)
except urllib.error.URLError as e:
    print(f"❌ لا يمكن الوصول إلى الرابط — {e.reason}")
    print(f"   تأكد من اتصالك بالإنترنت وأن GitHub Pages مُفعَّل")
    sys.exit(1)

# ─── 2. رمز الاستجابة ─────────────────────────────────────────────────────
if status == 200:
    print(f"✅ رمز الاستجابة: {status} OK")
else:
    errors.append(f"رمز الاستجابة {status} — المطلوب 200 OK")
    print(f"❌ رمز الاستجابة: {status} (المطلوب 200 OK)")

# ─── 3. Content-Type ───────────────────────────────────────────────────────
if "application/json" in content_type:
    print(f"✅ Content-Type: {content_type}")
else:
    warnings.append(f"Content-Type هو '{content_type}' — المُفضَّل application/json")
    print(f"⚠️  Content-Type: {content_type} (المُفضَّل: application/json)")

# ─── 4. صحة JSON ──────────────────────────────────────────────────────────
try:
    data = json.loads(raw_body)
    print("✅ JSON صحيح ويمكن تحليله")
except json.JSONDecodeError as e:
    errors.append(f"محتوى الملف ليس JSON صالحاً: {e}")
    print(f"❌ محتوى الملف ليس JSON صالحاً: {e}")
    print()
    print("=" * 60)
    print(f"❌ التحقق فشل — {len(errors)} مشكلة:")
    for i, err in enumerate(errors, 1):
        print(f"   {i}. {err}")
    sys.exit(1)

if not isinstance(data, list) or len(data) == 0:
    errors.append("الملف يجب أن يكون مصفوفة JSON تحتوي على عنصر واحد على الأقل")
    print("❌ الملف يجب أن يكون مصفوفة JSON تحتوي على عنصر واحد على الأقل")
    data = []

# ─── 5. فحص كل entry ─────────────────────────────────────────────────────
matched_entry = None
for entry in data:
    target = entry.get("target", {})
    if target.get("package_name") == CANONICAL_PACKAGE:
        matched_entry = entry
        break

if matched_entry is None:
    found_pkgs = [e.get("target", {}).get("package_name", "") for e in data]
    errors.append(
        f"package_name غير مطابق — وُجد: {found_pkgs} — المطلوب: {CANONICAL_PACKAGE}"
    )
    print(f"❌ package_name غير مطابق")
    print(f"   وُجد    : {found_pkgs}")
    print(f"   المطلوب : {CANONICAL_PACKAGE}")
else:
    print(f"✅ package_name: {CANONICAL_PACKAGE}")

    target    = matched_entry.get("target", {})
    relations = matched_entry.get("relation", [])
    namespace = target.get("namespace", "")
    live_fps  = target.get("sha256_cert_fingerprints", [])

    # ── 5a. namespace ──────────────────────────────────────────────────────
    if namespace == CANONICAL_NAMESPACE:
        print(f"✅ namespace: {namespace}")
    else:
        errors.append(f"namespace هو '{namespace}' — المطلوب '{CANONICAL_NAMESPACE}'")
        print(f"❌ namespace: '{namespace}' (المطلوب: '{CANONICAL_NAMESPACE}')")

    # ── 5b. relation ───────────────────────────────────────────────────────
    if CANONICAL_RELATION in relations:
        print(f"✅ relation: {CANONICAL_RELATION}")
    else:
        errors.append(f"العلاقة المطلوبة غير موجودة — وُجد: {relations}")
        print(f"❌ relation: المطلوب '{CANONICAL_RELATION}'")
        print(f"   وُجد: {relations}")

    # ── 5c. مطابقة البصمات تماماً ─────────────────────────────────────────
    print()
    print(f"📋 البصمات في الملف الحي: {len(live_fps)}")

    live_set     = set(live_fps)
    canon_set    = set(CANONICAL_FPS)
    missing_fps  = canon_set - live_set
    extra_fps    = live_set  - canon_set

    for i, fp in enumerate(CANONICAL_FPS, 1):
        if fp in live_set:
            print(f"✅ البصمة {i}: {fp[:23]}... ← مطابقة")
        else:
            print(f"❌ البصمة {i}: {fp[:23]}... ← غير موجودة")

    if missing_fps:
        errors.append(
            f"{len(missing_fps)} بصمة مطلوبة غير موجودة في الملف الحي"
        )

    if extra_fps:
        errors.append(
            f"الملف الحي يحتوي على {len(extra_fps)} بصمة إضافية غير متوقعة — "
            "يُسمح فقط بالبصمتين المرجعيتين لمنع تخويل شهادات غير معروفة"
        )
        print(f"❌ بصمات إضافية غير مصرح بها ({len(extra_fps)}):")
        for fp in extra_fps:
            print(f"   + {fp}")

    # تحقق من التكرار
    if len(live_fps) != len(set(live_fps)):
        errors.append("الملف الحي يحتوي على بصمات مكررة — كل بصمة يجب أن تظهر مرة واحدة فقط")
        print("❌ بصمات مكررة في الملف الحي")

    # تحقق من العدد الدقيق
    if len(live_fps) != len(CANONICAL_FPS):
        errors.append(
            f"عدد البصمات في الملف الحي {len(live_fps)} — المطلوب تماماً {len(CANONICAL_FPS)}"
        )
        print(f"❌ عدد البصمات: {len(live_fps)} (المطلوب: {len(CANONICAL_FPS)})")

    # تحقق من التنسيق لكل بصمة في الملف الحي
    bad_format = [fp for fp in live_fps if not SHA256_PATTERN.match(fp)]
    if bad_format:
        errors.append(f"{len(bad_format)} بصمة بتنسيق SHA-256 غير صحيح")
        print(f"❌ بصمات بتنسيق غير صحيح ({len(bad_format)}):")
        for fp in bad_format:
            print(f"   → {fp}")

# ─── الخلاصة ────────────────────────────────────────────────────────────────
print()
print("=" * 60)

if errors:
    print(f"❌ التحقق فشل — {len(errors)} مشكلة تحتاج إصلاحاً:")
    for i, err in enumerate(errors, 1):
        print(f"   {i}. {err}")
    if warnings:
        print()
        print(f"⚠️  تحذيرات ({len(warnings)}):")
        for w in warnings:
            print(f"   • {w}")
    sys.exit(1)
else:
    print("✅ جاهز للتطبيق — assetlinks.json يُعيد البصمتين الصحيحتين من الإنترنت")
    if warnings:
        print()
        print(f"⚠️  تحذيرات غير حرجة ({len(warnings)}):")
        for w in warnings:
            print(f"   • {w}")
    print()
    print("التطبيق يستطيع الآن فتح الروابط مباشرةً بدون شريط المتصفح ✓")
    sys.exit(0)
