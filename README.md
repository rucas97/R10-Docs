# Docwize — دستیار هوشمند تحلیل اسناد

> Chat with your documents. AI-powered analysis for PDF, Word, Excel, PowerPoint, and scanned images — with full Persian support.

**Docwize** is a production Persian (Farsi) web application that lets users upload documents in multiple formats and ask questions about them through an AI assistant. It ships with a full subscription system, an admin panel, and a multi-channel authentication flow (SMS, Bale messenger, Google OAuth) built for the Iranian market.

Live at: [https://www.docwize.site](https://www.docwize.site)

---

## ✨ Features

### For users

- 📄 **Multi-format document chat** — upload and query **PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), and images (JPG/PNG) via OCR**. Ask questions, get answers grounded in the document content.
- 🌐 **Full Persian UI** — RTL layout, Persian typography, dark/light theme.
- 🔐 **Multi-channel login** — SMS OTP via Faraz SMS, OTP via [Bale](https://ble.ir) messenger, or Google OAuth.
- 💳 **Subscription plans** — free, pro, and enterprise tiers with per-plan storage limits.
- 🧾 **Payment receipts** — success / failure landing page with tracking code after every transaction.
- 📊 **Storage dashboard** — see current plan, storage used, and remaining quota in Settings.
- 🌍 **Accessible from outside Iran** — Bale and Google login don't require an Iranian SIM.

### For admins

- 👥 **User management** — view, edit, and delete users; change plan tier from the user page.
- 🛒 **Order management** — approve or reject transactions, which cascades to the user's plan.
- 💰 **Accounting dashboard** — revenue grouped by plan.
- 📝 **Audit logs** — track admin actions.
- ⚙️ **Settings** — manage admin credentials.
- 🎛️ **Plan editor** — tune storage limits and feature flags per plan.

---

## 📂 Supported file types

| Format | Extensions | Extraction |
|---|---|---|
| PDF | `.pdf` | Native text extraction |
| Word | `.doc`, `.docx` | Native text + structure extraction |
| Excel | `.xls`, `.xlsx` | Sheet-by-sheet cell extraction |
| PowerPoint | `.ppt`, `.pptx` | Slide text + speaker notes |
| Image | `.jpg`, `.jpeg`, `.png` | **OCR** (optical character recognition) for scanned and photographed documents |

---

## 🏗️ Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | React + Tailwind CSS |
| Auth | [Supabase Auth](https://supabase.com/auth) (SMS, Google OAuth) + custom OTP routing |
| Database | Supabase Postgres with Row-Level Security |
| Storage | Supabase Storage |
| AI | Google Gemini |
| SMS provider | [Faraz SMS](https://farazsms.com) — pattern-based OTP delivery |
| Messenger OTP | [Bale Bot API](https://docs.bale.ai) — free, no business license required |
| Payment gateway | [Aqayepardakht](https://aqayepardakht.ir) |
| Deploy | Vercel |

---

## 🔑 Authentication flow

Docwize supports three login methods that all converge on the **same Supabase user record**:

1. **SMS** — user enters phone, Supabase generates the OTP, a webhook routes it to Faraz SMS for delivery.
2. **Bale** — user enters phone, we insert a `PENDING` row in `bale_otp_sessions`, trigger Supabase's OTP, then redirect to a Bale deep link (`ble.ir/Docwize_bot?start=<uuid>`). The bot receives `/start <uuid>` via webhook and replies with the OTP — the same OTP that SMS would have used. Free, and works even without an Iranian SIM.
3. **Google** — standard OAuth redirect.

Because Bale and SMS both call `supabase.auth.verifyOtp` with the same code for the same phone, a user who logs in once via SMS and once via Bale ends up as the **same `auth.users` row** — same plan, same documents, same subscription.

Routing between SMS and Bale is deterministic: if a non-expired `PENDING` session exists in `bale_otp_sessions` for the phone, the OTP goes to Bale; otherwise it goes to SMS.

---

## 💳 Payment flow

1. User clicks a plan → `POST /api/payment/create` calls Aqayepardakht's `/create` endpoint.
2. We store the gateway's transaction ID as `transactions.authority` with `status = pending`.
3. User is redirected to the gateway's `startpay` page.
4. After payment, Aqayepardakht **POSTs** back to `/api/payment/callback` (form-encoded).
5. The callback handler verifies the transaction with the gateway, updates `transactions.status`, and upserts `profiles.plan_id`.
6. The user is redirected to `/payment-result` with `status` and `tracking` params — the receipt is rendered **from the URL alone**, so it survives the cross-site cookie hop back from the gateway.

A "simulate" button on the checkout page lets you test the flow end-to-end without hitting the gateway.

---

## 🚀 Local development

### 1. Clone and install

    git clone https://github.com/rucas97/R10-Docs.git
    cd R10-Docs
    npm install

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/schema.sql` (or apply migrations manually — see "Database tables" below).
3. Enable the **Phone** auth provider in Authentication → Providers.
4. Set up an **Send SMS Hook** pointing to `https://<your-domain>/api/auth/sms-hook` with a webhook secret — copy that secret into `SMS_HOOK_SECRET`.

### 3. Configure environment variables

Create `.env.local`:

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

    # Public site URL (must match the domain registered with the payment gateway)
    NEXT_PUBLIC_SITE_URL=https://www.docwize.site

    # Supabase Send SMS Hook secret (used to verify the webhook signature)
    SMS_HOOK_SECRET=

    # Faraz SMS — pattern-based OTP
    FARAZSMS_API_KEY=
    FARAZSMS_PATTERN_CODE=

    # Aqayepardakht
    AQAYEPARDAKHT_PIN=

    # Bale bot (from https://ble.ir → @BotFather)
    BALE_BOT_TOKEN=
    BALE_BOT_USERNAME=Docwize_bot
    BALE_WEBHOOK_SECRET=

    # Google Gemini
    GEMINI_API_KEY=

### 4. Run

    npm run dev

Open [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database tables

| Table | Purpose |
|---|---|
| `auth.users` | Supabase-managed users (phone, email) |
| `profiles` | One row per user — holds `plan_id`, subscription metadata |
| `plans` | Plan catalogue (`id`, `name`, `storage_limit` in GB, `feature_flags`) |
| `transactions` | Payment records — `authority` (gateway transid), `amount`, `status`, `plan_id`, `user_id` |
| `documents` | Uploaded files — `user_id`, `size` (bytes), `storage_path`, `mime_type` |
| `bale_otp_sessions` | Temporary OTP routing state — `session_id`, `phone`, `otp_code`, `used`, `expires_at` |
| `tickets` | Support tickets (used in admin user activity log) |
| `admin_settings` | Admin credentials (single row, `id = 1`) |

All user-scoped tables are protected by Supabase RLS. `bale_otp_sessions` is service-role only.

---

## 🔗 Bale webhook (one-time setup)

After deploying, register the bot webhook once by calling Bale's `setWebhook` endpoint with:

- URL: `https://www.docwize.site/api/bale/webhook?secret=<BALE_WEBHOOK_SECRET>`
- Method: `POST https://tapi.bale.ai/bot<BALE_BOT_TOKEN>/setWebhook`
- Body: `{"url": "https://www.docwize.site/api/bale/webhook?secret=<BALE_WEBHOOK_SECRET>"}`

Verify registration by calling `getWebhookInfo` with the same bot token. To remove it, call `deleteWebhook`.

---

## 🚢 Deployment

Docwize deploys to **Vercel**. Because `NEXT_PUBLIC_*` variables are baked in at build time:

1. Set all environment variables in **Vercel → Settings → Environment Variables → Production**.
2. Push to `main`.
3. Redeploy with **"Use existing Build Cache" unchecked** whenever you change an env var or a route handler's behavior.

The payment gateway requires `NEXT_PUBLIC_SITE_URL` to match the domain registered in the Aqayepardakht panel — mismatched domains return error `-14`.

---

## 📁 Project structure

    src/
    ├── app/
    │   ├── api/
    │   │   ├── admin/                  # Admin-only endpoints (orders, users, settings, plans)
    │   │   ├── auth/
    │   │   │   ├── sms-hook/           # Supabase Send SMS Hook — routes OTP to Faraz or Bale
    │   │   │   └── prepare-bale-otp/   # Creates PENDING session, returns Bale deep link
    │   │   ├── bale/
    │   │   │   └── webhook/            # Handles /start <uuid> from Bale bot
    │   │   └── payment/
    │   │       ├── create/             # Creates transaction + calls gateway /create
    │   │       ├── callback/           # Handles POST from gateway, verifies, upgrades plan
    │   │       └── simulate/           # Dev-only simulation of a successful payment
    │   ├── (protected)/                # Authenticated user pages
    │   ├── admin/                      # Admin panel
    │   ├── login/                      # Multi-channel login form
    │   ├── payment-result/             # Receipt page — survives cross-site redirect
    │   ├── settings/                   # User settings (profile, subscription, storage)
    │   └── chat/                       # Main document-chat interface
    ├── components/                     # Shared UI (layout, logo, etc.)
    ├── lib/
    │   ├── bale.ts                     # Bale Bot API helpers
    │   ├── sms.ts                      # Faraz SMS helpers
    │   ├── preferences.ts              # User UI preferences
    │   └── supabase/                   # Supabase clients (browser, server, middleware)
    └── middleware.ts                   # Auth session refresh

---

## 🛡️ Security notes

- `SUPABASE_SERVICE_ROLE_KEY`, `SMS_HOOK_SECRET`, `BALE_BOT_TOKEN`, `BALE_WEBHOOK_SECRET`, `AQAYEPARDAKHT_PIN`, and `FARAZSMS_API_KEY` are **server-side only** — never expose them with `NEXT_PUBLIC_`.
- The Bale webhook is authenticated via a shared secret in the URL query string (`?secret=…`), because Bale does not sign webhooks.
- The Supabase SMS hook verifies requests with [Standard Webhooks](https://www.standardwebhooks.com/) using `SMS_HOOK_SECRET`.
- `/payment-result` is intentionally public — it renders only what's in the URL (`status`, `tracking`), no user data.
- All payment verification happens server-side against Aqayepardakht's `/verify` endpoint before any plan mutation.

---

## 📜 License

Proprietary. © Docwize. All rights reserved.

---

## 🤝 Contact

- Website: [docwize.site](https://www.docwize.site)
- Email: [info@docwize.site](mailto:info@docwize.site)