# 🍎 دليل نشر «بسمة» على App Store (iOS) عبر PWABuilder

جهزت لك كل ما تحتاجه. اتبع الخطوات بالترتيب.

---

## ⚠️ المتطلبات قبل البدء

| المتطلب | التفاصيل |
|---|---|
| **جهاز Mac** | macOS Ventura أو أحدث (لتشغيل Xcode) |
| **Xcode** | إصدار 15 أو أحدث — حمّله مجاناً من App Store |
| **حساب Apple Developer** | سجّل على [developer.apple.com](https://developer.apple.com) ($99/سنة) |
| **رابط HTTPS للتطبيق** | مثال: `https://hyr55cc.github.io/BASMAH/` (يجب أن يكون منشوراً أولاً) |

---

## المرحلة ١ — بناء حزمة iOS عبر PWABuilder

1. افتح **[pwabuilder.com](https://pwabuilder.com)** وأدخل رابط تطبيقك:
   ```
   https://hyr55cc.github.io/BASMAH/
   ```
2. اضغط **Package for Stores**
3. اختر **iOS** (وليس Android أو Windows)
4. الإعدادات المقترحة:

   | الحقل | القيمة |
   |---|---|
   | **Bundle ID** | `io.github.hyr55cc.basmah` |
   | **App name** | بسمة — أذكار الصباح والمساء |
   | **Version** | 1.0.0 |
   | **Build number** | 1 |

5. اضغط **Generate** — سيُنزّل ملف ZIP يحتوي على مشروع Xcode كامل

---

## المرحلة ٢ — فتح المشروع في Xcode

1. فك ضغط الملف المُنزَّل
2. افتح الملف `*.xcodeproj` أو `*.xcworkspace` بـ Xcode
3. في الشريط الجانبي اختر اسم المشروع ثم **Signing & Capabilities**:
   - **Team:** اختر حساب Apple Developer الخاص بك
   - **Bundle Identifier:** `io.github.hyr55cc.basmah`
   - **Automatically manage signing:** ✅ فعّله
4. تأكد أن Xcode يُوقّع المشروع تلقائياً (سيطلب منك تسجيل الدخول بحساب Apple Developer في أول مرة)

---

## المرحلة ٣ — لقطات شاشة App Store (إلزامية)

Apple تشترط لقطات شاشة بمقاسات محددة:

| الجهاز | المقاس (بكسل) |
|---|---|
| iPhone 6.5 بوصة (مطلوب) | 1284 × 2778 |
| iPhone 5.5 بوصة (مطلوب) | 1242 × 2208 |
| iPad Pro 12.9 بوصة (اختياري) | 2048 × 2732 |

**أسهل طريقة:**
- افتح الموقع في Safari بالجوال
- خذ لقطات للشاشات: الرئيسية، الأذكار، مواقيت الصلاة، المسبحة، الإعدادات
- أو استخدم Xcode Simulator: افتح المحاكي، شغّل التطبيق، خذ لقطة بـ `Cmd+S`

---

## المرحلة ٤ — رفع التطبيق على App Store Connect

### أ) إنشاء سجل التطبيق

1. افتح **[App Store Connect](https://appstoreconnect.apple.com)**
2. **My Apps → (+) → New App**
3. أدخل البيانات:

   | الحقل | القيمة |
   |---|---|
   | **Platforms** | iOS |
   | **Name** | بسمة — أذكار الصباح والمساء |
   | **Primary Language** | Arabic |
   | **Bundle ID** | `io.github.hyr55cc.basmah` |
   | **SKU** | `basmah-app-001` |
   | **User Access** | Full Access |

### ب) صفحة المتجر (App Information)

| الحقل | القيمة |
|---|---|
| **Privacy Policy URL** | `https://hyr55cc.github.io/BASMAH/privacy.html` |
| **Category** | Lifestyle (الأساسية) / Reference (الثانوية) |
| **Age Rating** | 4+ (بدون محتوى حساس) |

### ج) وصف التطبيق (App Store Listing)

**الوصف المقترح (بالعربية):**
```
أذكار الصباح والمساء ومواقيت الصلاة والمسبحة الإلكترونية وسورة الكهف — بدون إعلانات، ويعمل بدون إنترنت.

الميزات:
• أذكار الصباح والمساء والنوم والاستيقاظ وبعد الصلاة — مع العدّاد وتحديد الانتهاء
• مواقيت الصلاة لمدن السعودية والعالم بدون إنترنت
• المسبحة الإلكترونية بأصوات مختلفة
• أسماء الله الحسنى التسعة والتسعون
• سورة الكهف كاملة
• الوضع الليلي وثيمات ألوان متعددة
• يعمل أوفلاين بالكامل بعد أول تشغيل
```

**الكلمات المفتاحية (Keywords — 100 حرف كحد أقصى):**
```
أذكار,صباح,مساء,أدعية,صلاة,مسبحة,الكهف,إسلامي,تسبيح,دعاء
```

**⚠️ تجنب:** الادعاء بأنك «الأفضل» أو «رقم ١» — سبب رفض شائع.

---

## المرحلة ٥ — رفع البناء من Xcode

1. في Xcode: **Product → Archive**
2. انتظر حتى تنتهي عملية الـ Archive (قد تأخذ دقائق)
3. ستفتح نافذة **Organizer** تلقائياً
4. اختر الـ Archive الجديد ثم اضغط **Distribute App**
5. اختر **App Store Connect → Upload**
6. اتبع المعالج (Wizard) وأكمل الرفع
7. بعد الرفع بدقائق: ارجع لـ App Store Connect → **TestFlight** وستجد البناء الجديد

---

## المرحلة ٦ — اختبار TestFlight ثم النشر

### اختبار داخلي (Internal Testing):
1. **TestFlight → Internal Testing → (+)**
2. أضف بريدك الإلكتروني كـ Internal Tester
3. ستصلك دعوة على App Store Connect — اقبلها وثبّت التطبيق
4. تأكد أن كل الميزات تعمل

### تقديم للمراجعة (Submit for Review):
1. **App Store → Pricing and Availability:** مجاني، كل الدول
2. **App Review Information:**

   | الحقل | القيمة |
   |---|---|
   | **Demo Account** | No (التطبيق لا يحتاج تسجيل دخول) |
   | **Notes** | "This is an Islamic PWA app for Dhikr and prayer times. Works offline. No login required." |
   | **Contact Email** | بريدك الإلكتروني |
   | **Contact Phone** | رقمك |

3. اضغط **Submit for Review**
4. المراجعة عادة تأخذ **24–48 ساعة** (قد تصل لأسبوع أحياناً)

---

## ✅ أشهر أسباب الرفض من Apple — وكيف نتجنبها

| سبب الرفض | الحل |
|---|---|
| **4.2 Minimum Functionality** — "مجرد موقع مغلف" | التطبيق يعمل أوفلاين ويملك ميزات حقيقية — أذكر ذلك في Notes للمراجعة |
| **سياسة خصوصية مفقودة** | أضفنا `privacy.html` وربطناه في App Store Connect |
| **Guideline 5.1.1 — Data Collection** | وضّح في Notes أن التطبيق لا يجمع بيانات شخصية |
| **وصف مضلل أو مبالغ فيه** | التزم بالوصف المقترح أعلاه |
| **لقطات شاشة لا تطابق التطبيق** | تأكد أن اللقطات من التطبيق الفعلي وليس موقع الويب فقط |
| **أيقونة بخلفية شفافة** | استخدم `icon-512.png` — خلفيتها غير شفافة ✅ |

---

## 📋 قائمة التحقق النهائية

- [ ] رابط HTTPS للتطبيق يفتح بشكل صحيح
- [ ] حساب Apple Developer نشط ($99/سنة)
- [ ] Xcode مثبت على Mac
- [ ] مشروع Xcode مُولَّد من PWABuilder
- [ ] Bundle ID مضبوط: `io.github.hyr55cc.basmah`
- [ ] Signing & Capabilities مضبوط بحسابك
- [ ] لقطات شاشة بالمقاسات المطلوبة (6.5" و5.5")
- [ ] سياسة الخصوصية مرتبطة: `https://hyr55cc.github.io/BASMAH/privacy.html`
- [ ] الوصف والكلمات المفتاحية محدودة بالأحرف المسموحة
- [ ] Archive مرفوع من Xcode بنجاح
- [ ] تم الاختبار على TestFlight
- [ ] طُلبت المراجعة من Apple

---

> **ملاحظة:** Apple لا تدعم PWA مثل Google Play (لا يوجد TWA على iOS). PWABuilder يُولّد تطبيق iOS أصلي يُشغّل موقعك داخل WKWebView — هذا مقبول ومعتمد من Apple، لكن احرص على إبراز ميزات الأوفلاين في النشرة حتى لا يُرفض التطبيق بتهمة "مجرد موقع ويب".
