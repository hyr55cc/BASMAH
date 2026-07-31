# Threat Model

## Project Overview

بسمة is a static Islamic PWA (Progressive Web App) delivering morning/evening dhikr, prayer times, a digital tasbih, and Surah Al-Kahf. It is served by Python's built-in HTTP server (`python3 -m http.server 5000`). There is no application backend, no database, no user accounts, and no server-side authentication. All logic runs in the browser. The app supports offline usage via a Service Worker and optionally integrates with Firebase Cloud Messaging (FCM) for push notifications.

## Assets

- **Firebase project configuration** — API key, app ID, messaging sender ID, and VAPID public key embedded in client-side code. These are intentionally public per Firebase's design but define the project's identity and quota.
- **User notification preferences** — stored in `localStorage`; entirely local to the device, no server-side persistence.
- **FCM device tokens** — generated per-device when the user enables push notifications; logged to the browser console. Exposure is confined to the user's own device.
- **Prayer-time geolocation** — browser geolocation used to fetch prayer times; no data is persisted server-side.

## Trust Boundaries

- **Browser to static file server** — the Python HTTP server serves static assets only; there is no server-side logic or privileged operation. This boundary has minimal risk.
- **Browser to Firebase/Google** — the client calls Firebase APIs directly. Security depends on Firebase Security Rules in the Firebase project console (out of scope for this scan).
- **Browser to external prayer-time APIs** — the app may fetch prayer times from third-party APIs; those responses are consumed client-side only.

## Scan Anchors

- **Production entry points:** `index.html`, `notify.html`, `sw.js` (Service Worker with Firebase init)
- **Highest-risk area:** Firebase configuration embedded in `sw.js` and `notify.html`; FCM token handling in `notify.html`
- **Public surface only:** entire app is unauthenticated static HTML/JS; no admin or privileged routes exist
- **Dev-only areas:** none identified; the entire codebase is production-facing

## Threat Categories

### Information Disclosure

The Firebase Web API key and full project configuration (authDomain, projectId, storageBucket, messagingSenderId, appId) are embedded in `sw.js` and `notify.html`. Firebase Web API keys are designed to be client-side public identifiers; they do not grant privileged server-side access. However, if the Firebase project's Security Rules are overly permissive, an attacker with these identifiers could read or write to Firestore or Firebase Storage. The security posture depends entirely on Firebase-console-level configuration.

The FCM device token is logged via `console.log('FCM Token:', token)` in `notify.html`. While this is confined to the user's own browser console, it is unnecessary exposure.

**Required guarantee:** Firebase Security Rules must be configured to deny unauthorized access. The console.log of FCM tokens should be removed in production builds.

### Tampering / Denial of Service

An attacker who obtains the Firebase project identifiers could attempt to exhaust Firebase quotas (e.g., Firestore reads, Storage bandwidth) if Security Rules allow unauthenticated access. No application data would be exfiltrated since the app stores nothing server-side, but service disruption is possible.

### Spoofing / Elevation of Privilege

Not applicable. There are no user accounts, roles, or server-side sessions.

### Injection

Not applicable. No server-side code processes user input; the Python server is a read-only static file server.
