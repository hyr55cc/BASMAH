# Threat Model

## Project Overview

بسمة is a static Islamic PWA (Progressive Web App) delivering morning/evening dhikr, prayer times, a digital tasbih, and Surah Al-Kahf. It is served by Python's built-in HTTP server (`python3 -m http.server 5000`). There is no application backend, no database, no user accounts, and no server-side authentication. All logic runs in the browser. The app supports offline usage via a Service Worker and optionally integrates with Firebase Cloud Messaging (FCM) for push notifications.

The app also includes a **community Dua Wall** (`index.html`) backed by Google Firestore, where any visitor can submit a prayer visible to all users. This is the highest-risk feature.

## Assets

- **Firebase project configuration** — API key, app ID, messaging sender ID, and VAPID public key embedded in client-side code. These are intentionally public per Firebase's design but define the project's identity and quota.
- **Community Dua Wall content** — user-submitted prayers written to Firestore and displayed to all visitors. Contains user-generated text; integrity depends on Firebase Security Rules.
- **User notification preferences** — stored in `localStorage`; entirely local to the device, no server-side persistence.
- **FCM device tokens** — generated per-device when the user enables push notifications; no longer logged to console.
- **Prayer-time geolocation** — browser geolocation used to fetch prayer times; no data is persisted server-side.

## Trust Boundaries

- **Browser to static file server** — the Python HTTP server serves static assets only; there is no server-side logic or privileged operation. This boundary has minimal risk.
- **Browser to Firestore (Dua Wall)** — the client calls Firestore directly without authentication. All content moderation is client-side only. Firebase Security Rules are the sole server-side enforcement point (configured in the Firebase console, outside this codebase).
- **Browser to Firebase/Google** — the client calls Firebase APIs directly. Security depends on Firebase Security Rules in the Firebase project console (out of scope for this scan).
- **Browser to external prayer-time APIs** — the app fetches prayer times from `api.aladhan.com`; those responses are consumed client-side only.

## Scan Anchors

- **Production entry points:** `index.html`, `notify.html`, `sw.js` (Service Worker with Firebase init)
- **Highest-risk area:** Community Dua Wall in `index.html` (lines 1518–1600, 1857–1893) — unauthenticated Firestore writes with client-side-only moderation
- **Second-highest-risk area:** Firebase configuration embedded in `sw.js` and `notify.html`; FCM token handling in `notify.html`
- **Public surface only:** entire app is unauthenticated static HTML/JS; no admin or privileged routes exist
- **Dev-only areas:** none identified; the entire codebase is production-facing

## Threat Categories

### Information Disclosure

The Firebase Web API key and full project configuration (authDomain, projectId, storageBucket, messagingSenderId, appId) are embedded in `sw.js` and `notify.html`. Firebase Web API keys are designed to be client-side public identifiers; they do not grant privileged server-side access. However, if the Firebase project's Security Rules are overly permissive, an attacker with these identifiers could read or write to Firestore or Firebase Storage. The security posture depends entirely on Firebase-console-level configuration.

**Required guarantee:** Firebase Security Rules must be configured to deny unauthorized access.

### Tampering / Content Integrity

The community Dua Wall allows unauthenticated writes to Firestore. All content moderation (URL blocking, word filtering, 2-minute rate limit) is implemented exclusively in client-side JavaScript (`duaTextOk`, `localStorage` cooldown). An attacker using the publicly available Firebase config can call Firestore directly — bypassing all client-side controls — to flood the wall with spam, explicit content, links, or phone numbers at arbitrary rate.

**Required guarantee:** Firebase Security Rules for the `duas` collection must enforce field length limits and ideally write-rate limits. Client-side filtering is UX only and must not be the sole moderation layer.

### Denial of Service

An attacker who obtains the Firebase project identifiers could attempt to exhaust Firebase quotas (e.g., Firestore writes, Storage bandwidth) if Security Rules allow unauthenticated access. No application data would be exfiltrated since the app stores no user PII server-side, but service disruption and quota exhaustion are possible.

### Spoofing / Elevation of Privilege

Not applicable. There are no user accounts, roles, or server-side sessions.

### Injection

Not applicable for the static server. The Dua Wall renders user text with `escHtml()` (escaping `&`, `<`, `>`) before inserting into `innerHTML`, which prevents HTML injection in the text body. Firestore auto-generated document IDs used in `onclick` attributes are alphanumeric only, making attribute injection in that context infeasible.
