# Portfolio hardening: review and release guide

## Status

The cancellation fixes, dependency updates, and security hardening are implemented locally. **No production backend/rules/frontend deployment or existing-photo migration has been performed.** This guide supersedes the earlier review.

Target: Firebase project `psalmhe-gallery`, Standard-edition `(default)` database in `nam5`, Vercel frontend. The admin identity is **verified `psalmhe@gmail.com`**. Confirm it matches the Firebase Authentication login; CLI/project ownership does not establish the app login identity.

## Implemented

- **Cancellation:** secret 256-bit links; booking, slot lock, and capability must be deleted together. Wrong, partial, and reused links cannot cancel another booking. No admin login required.
- **Bookings:** only the backend creates reservations, with real-calendar-date, future-time, one-year-horizon, timezone, length, and field validation. App Check is required in production. Persistent limits allow 8 attempts/IP/15 minutes; retry receipts prevent duplicate reservations after a lost response. Denied bookings are archived before replacement.
- **Galleries:** public Firestore reads are denied. The server checks the password before returning selected display fields and signed photo links. Client email, password verifiers, and internal metadata are excluded.
- **Passwords:** salted scrypt, 12–128 characters for new passwords, automatic rehashing after successful legacy authentication, and an admin Password action. Wrong/missing galleries use the same error message, with a shared limit of 10 attempts/IP/15 minutes across slugs.
- **Uploads:** verified-admin signatures bind unique gallery-scoped IDs to authenticated Cloudinary delivery with overwrite disabled. The server checks provider metadata before registering photos; browser-supplied URLs/metadata are not trusted.
- **Media access:** signed image, thumbnail, and download URLs expire after 15 minutes. Clients unlock again; admin access refreshes. Already-issued links remain valid until expiry after a password change.
- **Rules:** secrets, rate counters, and retry receipts are server-only. Even admin browser code cannot bypass server booking/password/photo validation. Design edits have field/type/range checks; status changes enforce related slot/cancellation updates.
- **Dependencies:** compatible advisory fixes applied, React Router upgraded to patched v7, and a targeted gaxios→uuid override resolves the backend UUID advisory.

Other retained fixes include live availability/gallery updates, stale-admin-action protection, confirmation-email resend, separate email failure reporting, safe ZIP filenames, lazy routes/ZIP support, list keys, and the missing background reference.

## Production setup — deploy together

**Do not deploy only the frontend or only the rules.** New bookings and client gallery access now require the Functions backend. Coordinate the release in a maintenance window; older open browser tabs need refreshing.

### 1. Backend configuration

Run `npm ci` from the `functions` directory. Functions use Node 22 in `us-central1`; the project must meet Firebase's billing/configuration requirements for Functions. No billing plan was changed.

Set non-secret parameters through Firebase deployment prompts or ignored `functions/.env.psalmhe-gallery`:

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
BOOKING_TIME_ZONE=America/Chicago
```

Store the API secret with:

```powershell
npx -y firebase-tools@latest functions:secrets:set CLOUDINARY_API_SECRET --project psalmhe-gallery
```

Never put the secret or Google service-account credentials in `VITE_*`, source control, frontend code, or chat. Backend environment/secret files are ignored.

### 2. App Check and Vercel

Register the Firebase web app with App Check using **reCAPTCHA Enterprise**. Authorize production and intentional preview domains. Set these Vercel frontend variables, retaining the existing Firebase/EmailJS configuration:

```dotenv
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_public_site_key
VITE_BOOKING_TIME_ZONE=America/Chicago
VITE_SITE_URL=https://psalmhe-portfolio.vercel.app
```

Match frontend/backend timezones to the photographer's actual business location. America/Chicago is the current default, not a confirmed business location. The production `createBooking` and `openGallery` callables require valid App Check tokens; a missing key will prevent those flows from working. Do not disable enforcement as a workaround.

The old unsigned upload preset is no longer used by this app. Disable it in Cloudinary if no other authorized application needs it.

### 3. Existing-photo migration

Previously public Cloudinary URLs remain public until migrated. The new client backend intentionally refuses legacy photos; admins retain legacy previews and see a migration notice.

The tool defaults to **dry-run**, handles one gallery at a time, and refuses photos referenced by another gallery or the local public-portfolio source files:

```powershell
node functions/scripts/migrate-gallery-media.js --project psalmhe-gallery --slug your-gallery
```

Provide Google Application Default Credentials authorized for this project. Before applying, also securely supply `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the process environment. Review the dry-run plan, then:

```powershell
node functions/scripts/migrate-gallery-media.js --project psalmhe-gallery --slug your-gallery --apply
```

Applying changes delivery to `authenticated`, requests CDN invalidation, removes public URL fields, and records immutable Cloudinary asset IDs. The tool resumes after an interrupted metadata write and stops on conflicting public/authenticated assets. Separate shared portfolio assets first; source-file checks cannot detect every external use, so review the plan. CDN invalidation takes time and downloaded copies cannot be revoked.

Rotate existing gallery passwords because their old hashes were previously public. Automatic rehashing alone does not revoke an exposed password.

### 4. Validate and deploy

Install both root and `functions` dependencies, then run:

```powershell
npm run test:security
npm run build
npx -y firebase-tools@latest deploy --only functions:portfolio,firestore:rules --project psalmhe-gallery
```

Deploy the matching frontend on Vercel in the coordinated release. On this Windows machine, Node required `$env:NODE_OPTIONS='--use-system-ca'` to use the Windows trust store; TLS verification stayed enabled.

Enable Firestore TTL cleanup for `expiresAt` on collection groups `rateLimits` and `bookingRequests`. Application code already checks expiry; TTL limits storage retention. Monitor Function errors, quotas, and billing.

Use **Resend Email** on existing confirmed bookings. Old date/time-only cancellation URLs deliberately cannot authorize anonymous deletion.

### 5. Live smoke tests

- Book a test session, confirm as admin, and verify email origin/timezone.
- Cancel while signed out; verify the slot reopens and the link cannot affect a replacement booking.
- Confirm missing App Check tokens are rejected and the production website succeeds.
- Upload an authenticated test image; unlock while signed out; test image display, single download, and ZIP download.
- Confirm public gallery Firestore reads fail and former public photo URLs stop resolving after migration/invalidation.
- Verify password rotation and media-link expiry, then remove test records using normal admin actions.

## Local validation

Final validation on September 16, 2026: **34/34 security tests passed** (19 backend tests and 15 Firestore rules tests). Both root and backend `npm audit` results report **0 vulnerabilities**. All eight Function exports load successfully. The production Vite build passed; its main JavaScript chunk is approximately 848 KB (269 KB gzip), so the large-chunk warning remains. Temporary build output is ignored and was removed from staging; existing staged source changes were preserved.

`npm run test:security` starts the Firestore emulator against **demo-portfolio**, running rules and backend tests serially. Backend tests refuse to run without `FIRESTORE_EMULATOR_HOST`. Upload/migration provider calls are stubbed; signatures use the real Cloudinary SDK with dummy credentials. Tests send no real emails and mutate no real Cloudinary assets.

For browser testing, set `VITE_USE_FIREBASE_EMULATORS=true` in an ignored local environment file, then start:

```powershell
npx -y firebase-tools@latest emulators:start --project demo-portfolio --config firebase.local.json
```

Run Vite separately. This switch is development-only and forces demo-project local Auth, Firestore, and Functions. Supply dummy local Function parameters/secrets for startup; real media delivery requires a separate test Cloudinary environment. App Check is bypassed only inside the Functions emulator.

## Remaining limitations

- EmailJS/Formspree remain browser-triggered and best effort; reliable delivery needs a server-side outbox with retries/status.
- IP limits and App Check reduce abuse but do not prevent every distributed attack. Configure monitoring and tune limits for actual traffic.
- Previously public URLs require migration/invalidation. Signed URLs can be shared until their 15-minute expiry; downloaded images cannot be revoked.
- Gallery deletion removes database references/secrets but retains authenticated Cloudinary assets. Define retention before adding destructive asset cleanup.
- Galleries still store up to 500 photos in one document and may reach Firestore size limits sooner; large ZIPs still use browser memory.
- Blocked dates, durations, buffers, minimum notice, reminders, and rescheduling remain product enhancements.
- Production App Check attestation, Cloudinary delivery/CORS, real emails, and full browser/device accessibility testing still require staging/live verification.

## References and review note

See [Firebase callable authentication/App Check](https://firebase.google.com/docs/functions/callable), [atomic operation rules](https://firebase.google.com/docs/firestore/manage-data/transactions), and [Cloudinary authenticated/expiring download APIs](https://cloudinary.com/documentation/image_upload_api_reference).

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for private gallery records, server-only password and booking validation, verified admin access, and token-scoped atomic cancellation. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
