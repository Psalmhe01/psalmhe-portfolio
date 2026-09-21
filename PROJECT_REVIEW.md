# Photography portfolio: Firebase free-plan release

## Current architecture

Keep the existing Vercel frontend, Firebase Spark Authentication/Firestore, Cloudinary, and EmailJS/Formspree. No Firebase Functions, Secret Manager, paid TTL cleanup, or billing upgrade is required. This replaces the previous Cloud Functions deployment guide.

## Implemented

- Anonymous booking requests use a Firestore transaction with a public slot lock, private booking, secret cancellation capability, and immutable retry receipt.
- Rules validate required fields, lengths, real dates, future appointments within a year, America/Chicago daylight-saving offsets, initial pending status, and atomic related writes.
- Duplicate slot requests cannot overwrite each other. A retry checks its original receipt; cancelled requests cannot be resurrected with the same token.
- Confirmation emails contain random 256-bit cancellation links. Clients can cancel while signed out. Wrong/reused tokens and partial cancellation writes are rejected.
- Only the verified admin account psalmhe@gmail.com can manage bookings and read private galleries. Denial archives the record and frees the slot.
- Public galleryShares documents contain an AES-256-GCM encrypted gallery and public salt/IV. PBKDF2-SHA-256 with 600,000 iterations derives its password key. The encrypted payload contains only selected display fields and photo links, excluding client emails and admin key material.
- The derived encryption key is stored only in the private admin gallery document, allowing edits/uploads to atomically refresh the encrypted client copy without repeatedly requesting the password.
- Admin gallery creation, design updates, photo registration/removal, password rotation, and deletion use Firestore directly.
- Uploads use the existing Cloudinary unsigned preset. Private API secrets never enter the frontend. Passwords are never stored as plaintext or copied into public records.
- Compatible dependency fixes, lazy routes/ZIP imports, safer downloads, and separate email-failure reporting remain.

## Release steps

1. Run npm run test:security and npm run build. Local tests use demo-portfolio only.
2. Deploy only the Firestore rules to psalmhe-gallery:
   npx -y firebase-tools@latest deploy --only firestore:rules --project psalmhe-gallery
3. The owner will commit and push to deploy the matching frontend through the existing Vercel integration.
4. Keep the existing VITE_FIREBASE_*, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET, and VITE_EMAILJS_* variables configured in Vercel. No Cloudinary secret belongs in VITE_*.
5. Sign in to the website as the verified admin. For each existing gallery, use Password to set a NEW strong password and publish its encrypted client copy. Existing password hashes cannot be converted back into passwords. Old hashes are removed when the gallery is saved.
6. Privately share new passwords with clients. Use Resend Email on confirmed bookings whose original emails have predictable date/time cancellation links.
7. Test a new request, confirmation, signed-out cancellation, reopened slot, wrong/reused link, gallery unlock, upload, individual download, ZIP, password change, and deletion.

America/Chicago is confirmed. The Firebase CLI login is psalmhe@gmail.com; the actual website admin account still needs a successful verified sign-in.

## Important free-plan limits

- Photos remain standard Cloudinary delivery URLs. Anyone who already has a photo URL can use it. Encrypting the gallery hides links from someone without its password; it does not encrypt the underlying photos or revoke saved links/downloads.
- Public encrypted galleries permit offline password guessing. Use randomly generated passwords or long unique passphrases. There is no trusted password-attempt rate limiter.
- Cloudinary unsigned upload presets can be used outside the website. Configure the preset's provider-side allowed image formats, maximum file size, and folder restrictions. Browser checks and the admin UI do not protect the preset itself.
- Public booking submissions have no server-side IP rate limiting. Rules validate records but cannot prove a submission is from a human. Abuse can consume free quotas or reserve slots.
- Email notifications remain best effort from the browser. Always check the admin booking list.
- Free quota exhaustion can interrupt service. No billing upgrade, paid service, or auto-upgrade has been enabled.
- Booking receipts are deliberately retained to prevent retries from recreating cancelled appointments; no paid TTL feature is used.
- Gallery deletion removes its private record and encrypted share, retaining Cloudinary files. Photo retention/deletion needs a separate policy.
- Password rotation protects the current encrypted gallery. Previously copied ciphertext, keys, URLs, and downloaded photos cannot be revoked.
- Galleries remain capped at 500 photos and 800,000 base64 ciphertext characters; large galleries may need splitting. ZIP generation uses browser memory.
- The frontend's existing large-bundle warning remains. Full browser/provider/email tests require the new frontend deployment.

## Validation and deployment status

Final checks on September 20, 2026: all 28 tests passed, including real frontend reservation retries, cancellation, conflicting bookings, password encryption/rotation, and seasonal timezone validation. The final Vite production build passed (main chunk about 834 KB / 264 KB gzip; existing large-chunk warning remains).

The free-plan Firestore rules were successfully deployed to psalmhe-gallery. Live signed-out HTTP checks return 403 for bookings, galleries, and galleryShares collection listing, and 200 for availability. No billing plan was changed and no Functions were deployed.

The live Vercel site still serves an older frontend. Local branch2 is one commit ahead of origin/branch2 at this check (259ea11). The owner will push and ensure the matching production deployment completes. This release guide also has a final status update to commit.

Cloudinary preset inspection returned HTTP 401 using the stored admin API credentials. The unsigned browser upload flow does not use those credentials, but preset restrictions and a real upload remain unverified. Gallery-password publishing, actual email cancellation, and browser download tests remain to be performed after the matching frontend is live.

## Rules review

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for private admin records, validated atomic bookings, token-scoped cancellation, and encrypted gallery shares. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
