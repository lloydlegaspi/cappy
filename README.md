# Cappy (Expo + Supabase)

## What this app does

Cappy is a medication-reminder mobile app built with Expo React Native.

Core flows used in the assignment demo:

- Guest-first app bootstrap using Supabase anonymous auth.
- Medication create/read/update/delete backed by Supabase tables.
- Reminder event logging (taken/snoozed metadata) to Supabase.
- Medication photo capture/pick + upload to Supabase Storage.
- Reminder history generated from cloud reminder events (with local fallback only when Supabase is not configured).

## Prerequisites

- Node.js (LTS recommended)
- npm (this repo uses npm; `package-lock.json` is present)
- Expo / EAS access (`npx expo ...`, `npx eas ...`)
- Supabase cloud project (already created)
- Optional but recommended for migrations: Supabase CLI (`npx supabase ...`)
- For APK install/testing: Android phone or emulator

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env file from the template:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill `.env` with your Supabase values:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. Validate required env variables:

   ```bash
   bash scripts/check-env.sh
   ```

## Environment variables

The app expects only public Expo client variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

These are read in `lib/env.ts` via `process.env.EXPO_PUBLIC_*` and used to initialize the Supabase client in `lib/supabase.ts`.

Do not use service-role keys in the client app.

## How Supabase is connected

- `lib/supabase.ts`: creates the Supabase client when env vars are present.
- `app/_layout.tsx`: runs `ensureAnonymousSession()` on startup.
- `lib/auth/guestSession.ts`: obtains/creates the anonymous authenticated session.
- `lib/api/medications.ts`: medication CRUD + status mapping.
- `lib/api/reminderEvents.ts`: event inserts/reads + history sections.
- `lib/storage/medicationImageUpload.ts`: uploads photos to `pill-images` bucket.
- `lib/api/settings.ts`: per-user settings reads/writes in `user_settings`.

## Supabase migrations in this repo

Migration SQL files are under `supabase/migrations/`.

Current folder state in this repo:

- `supabase/migrations/` exists and contains SQL migrations.
- `supabase/config.toml` is not tracked in this repository.

Recommended CLI path for your existing cloud project:

1. Authenticate and link:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```

2. Apply migrations:

   ```bash
   npx supabase db push
   ```

If CLI linking is unavailable, run migration SQL files in timestamp order in Supabase SQL Editor.

## Start app locally

Use real env values to avoid fallback demo mode.

```bash
npm start
```

Useful alternatives:

```bash
npm run android
npm run web
```

## Fast local bug-fixing (one-time dev build)

Create and install a development build once:

```bash
npx eas build -p android --profile development
```

After installing that APK, use it for day-to-day coding:

```bash
npx expo start --dev-client
```

Rebuild only when native configuration or native dependencies change.

## Build Android APK with EAS (internal distribution)

This repo is configured for internal APK builds in `eas.json`, including a `development` profile and a `preview` profile.

Existing Expo/EAS config that affects build behavior:

- `app.json` already includes `expo.extra.eas.projectId`.
- The project is in managed workflow (`android/` and `ios/` are not committed).
- Expo plugins for camera/image-picker/notifications are already declared in `app.json`.

Run helper script:

```bash
bash scripts/build-preview-android.sh
```

Direct command equivalent:

```bash
npx eas build -p android --profile preview
```

After build completes, install the APK from the EAS build artifact link.

## EAS Update (JS/asset changes only)

Build profiles are mapped to update channels in `eas.json`:

- `development` profile -> `development` channel
- `preview` profile -> `preview` channel
- `production` profile -> `production` channel

Publish an update to a specific channel:

```bash
npx eas update --platform android --channel development --message "Dev iteration: <short note>"
npx eas update --platform android --channel preview --message "Demo patch: <short note>"
npx eas update --platform android --channel production --message "Release patch: <short note>"
```

Use EAS Update when only JavaScript/TypeScript code or assets changed.

Rebuild with `eas build` when Expo SDK/native dependencies/plugins/app config (permissions, package identifiers, splash/icons, etc.) changes, or when users need a newer binary/runtime.

## Validate backend demo flows

Run these checks with env vars configured and migrations applied.

1. Session bootstrap (valid auth path)
- Launch app and wait for the startup loader to finish.
- In Settings, confirm guest ID is shown (means session/user exists).

2. Medication CRUD uses live Supabase
- Add medication in Add tab.
- Edit it in Medications tab.
- Delete it in Medications tab.
- Verify rows in Supabase table `medications` for your current `user_id`.

3. Reminder event logging reaches Supabase
- Open a reminder and tap Take Now or Snooze.
- Verify new/updated row in `reminder_events`.

4. Photo/media upload works
- Add or edit medication with camera/gallery image.
- Verify file appears in Storage bucket `pill-images`.
- Verify `medications.pill_photo_url` is populated.

5. History loads cloud data (not demo fallback)
- Perform reminder actions for one or more meds.
- Open History tab and confirm entries reflect your recent `reminder_events`.
- Note: if Supabase env is missing, history falls back to `data/mock-medications.ts` by design.

## Anonymous auth and RLS note

This app depends on anonymous sign-in (`supabase.auth.signInAnonymously`) and per-user RLS policies.

Make sure:

- Anonymous sign-ins are enabled in Supabase Auth.
- Latest migration `20260419120000_guest_first_anonymous_auth.sql` is applied.
- RLS policies allow authenticated users to access only their own rows.

If these are not aligned, create/update/delete or upload operations may be blocked with RLS errors.

## Reproducible submission files/config

Key files for this assignment submission:

- `app.json`
- `eas.json`
- `.env.example`
- `scripts/check-env.sh`
- `scripts/build-preview-android.sh`
- `lib/env.ts`
- `lib/supabase.ts`
- `lib/auth/guestSession.ts`
- `lib/api/medications.ts`
- `lib/api/reminderEvents.ts`
- `lib/storage/medicationImageUpload.ts`
- `supabase/migrations/*`

## Manual steps

The following cannot be fully completed from source code alone:

- Add real Supabase env values in local `.env` and in EAS project environment variables.
- Ensure Supabase project settings allow anonymous auth.
- Link/apply migrations to the target Supabase cloud project.
