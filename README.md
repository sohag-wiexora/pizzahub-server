# 🍕 PizzaHub — Server (REST API)

PizzaHub is a pizza ordering and delivery platform. Customers discover local pizza shops, browse their menus and place food orders. Vendors (restaurants) publish menu items and manage incoming orders, while admins manage users, review published menu items and monitor platform transactions.

This repository contains the **backend REST API** of PizzaHub, built with **Express.js, MongoDB and Stripe**, and secured with **JWT-based role authentication**.

- **Client repository:** [_add-your-client-repo-link-here_]
- **Live website:** [_add-your-live-link-here_]
- **Server live API:** [_add-your-render/railway-link-here_]

---

## ✨ Features

### Public
- Browse approved & active menu items with **advanced search, category/location filters, price range and sorting** (price asc/desc, newest)
- Featured menu items (premium vendors get featured placement first)
- Category list with item counts, item details page data

### Vendor
- Create menu items (status starts as `pending` until an admin approves)
- Free plan limited to **3 active items**; **Premium** unlocks unlimited items
- Update, delete, activate/deactivate own items (ownership verified)
- View customer orders, **accept or reject** pending orders (one-time decision)
- **Stripe subscription checkout** for Premium with webhook-verified activation
- Vendor dashboard: item stats, order stats, subscription info, sales overview chart

### Customer
- Place orders with delivery date, address and message
- Duplicate active orders for the same item + delivery date are blocked
- Vendors cannot order their own items; admins cannot place customer orders
- Cancel pending orders, view order history, customer dashboard with chart

### Admin
- Manage users: search by name/email, filter by role, **block / unblock**
- Review menu items: approve, reject, change status, delete inappropriate items
- View all transactions (**read-only — admins can never edit payment records**)
- Admin dashboard with platform analytics (users, orders, revenue per month)

### Security
- Better Auth issues the JWT on the client; this server **verifies every token** against Better Auth's JWKS endpoint
- Database is the source of truth: roles sent by the client are never trusted
- Role-based middleware (`admin`, `vendor`, `customer`) on every protected API
- Blocked users are rejected from all protected features (403)
- Resource ownership is verified before every update/delete
- Premium is activated **only after a verified Stripe webhook event** — the frontend success redirect is never trusted
- Vendor checkout sessions are always created for the signed-in vendor only
- 401 for unauthorized, 403 for forbidden requests; server-side validation with zod

---

## 🛠 Technology Stack

| Area | Packages |
|---|---|
| Runtime / Framework | Node.js (≥20), **Express 5**, TypeScript |
| Database | **MongoDB**, Mongoose 9 |
| Authentication | Better Auth (client) + **jose** (JWT verification via JWKS) |
| Validation | **zod** |
| Payments | **stripe** (Checkout Sessions + Webhooks) |
| Security / CORS | helmet, cors |
| Dev tooling | tsx (dev server), TypeScript compiler |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your own values. **Never push `.env` to GitHub.**

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port the API listens on |
| `MONGODB_URI` | MongoDB Atlas connection string (credentials secured) |
| `CLIENT_URL` | Comma separated list of allowed frontend origins (CORS + Stripe redirects) |
| `JWT_JWKS_URL` | Better Auth JWKS endpoint of the client, e.g. `http://localhost:3000/api/auth/jwks` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe Price ID of the monthly Premium plan (`price_...`) |
| `ADMIN_NAME` / `ADMIN_EMAIL` | Used by the admin promotion seed script |

> Google OAuth credentials, Better Auth secret and the ImgBB API key live in the **client** `.env.local`, because Better Auth and image uploads run from the Next.js app.

---

## 🔗 Client Integration Guide (Better Auth + Google)

The Express API never sees Google credentials — Google login is handled by Better Auth inside the Next.js client, and this server simply verifies the JWTs Better Auth issues. A Google-signed-in user works with every API exactly like an email/password user, because both end up in the same MongoDB `user` collection.

**Client `.env.local`**

```bash
BETTER_AUTH_SECRET=<random-strong-secret>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
NEXT_PUBLIC_IMGBB_API_KEY=<imgbb-key>
```

**Better Auth server config (client repo)**

```ts
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer, jwt } from 'better-auth/plugins';

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'customer', input: false },
      isBlocked: { type: 'boolean', defaultValue: false, input: false },
      businessName: { type: 'string', required: false },
      subscriptionPlan: { type: 'string', defaultValue: 'free', input: false },
      subscriptionExpiresAt: { type: 'date', required: false, input: false },
    },
  },
  // Both plugins are required for this API to work:
  // jwt()   -> exposes /api/auth/jwks so the Express server can verify tokens
  // bearer()-> lets the client fetch a bearer token for API calls
  plugins: [jwt(), bearer()],
});
```

**Calling this API from the client**

```ts
// 1. get a bearer token from Better Auth
const { token } = await fetch('/api/auth/token').then((r) => r.json());

// 2. send it with every API request
fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ /* ... */ }),
});
```

Google sign-ups land with the default `customer` role (the social flow skips the role picker) — vendors can be onboarded from the client afterwards. Admin accounts are only created through the seed script described above.

---

## ⚙️ Installation & Running Locally

```bash
# 1. clone & install
git clone <your-server-repo-url>
cd pizzahub-server
npm install

# 2. configure environment
cp .env.example .env      # then fill in your own values

# 3. run
npm run dev               # development (tsx watch)
npm run build && npm start # production
```

### Creating the Admin account (securely)
Admins are **never** created through public registration:

1. Sign up in the PizzaHub client using the email you set as `ADMIN_EMAIL`
2. Run the promotion script once:
   ```bash
   npm run seed:admin
   ```
   It flips that existing account's role to `admin` in the database.

### Stripe test flow
1. Create a monthly **Premium** price in the Stripe dashboard and put its `price_...` id in `STRIPE_PREMIUM_PRICE_ID`
2. Forward webhooks locally: `stripe listen --forward-to localhost:5000/api/v1/payments/webhook` and copy the `whsec_...` into `STRIPE_WEBHOOK_SECRET`
3. Pay on the Stripe Checkout page with the test card `4242 4242 4242 4242` (any future expiry, any CVC)
4. Premium activates only after the verified `checkout.session.completed` webhook arrives

---

## 📡 API Overview (base: `/api/v1`)

### Menu items
| Method | Endpoint | Access |
|---|---|---|
| GET | `/menu-items` | Public |
| GET | `/menu-items/featured` | Public |
| GET | `/menu-items/categories` | Public |
| GET | `/menu-items/:id` | Public |
| POST | `/menu-items` | Vendor |
| GET | `/menu-items/mine` · `/mine/:id` | Vendor |
| PATCH | `/menu-items/:id` | Vendor (owner) |
| DELETE | `/menu-items/:id` | Vendor (owner) |
| GET | `/menu-items/admin` | Admin |
| PATCH | `/menu-items/admin/:id/status` | Admin |
| DELETE | `/menu-items/admin/:id` | Admin |

### Orders
| Method | Endpoint | Access |
|---|---|---|
| POST | `/orders` | Customer |
| GET | `/orders/mine` | Customer |
| PATCH | `/orders/:id/cancel` | Customer (owner, pending only) |
| GET | `/orders/vendor` | Vendor |
| PATCH | `/orders/:id/accept` · `/:id/reject` | Vendor (owner, pending only) |
| GET | `/admin/orders` | Admin |

### Payments, transactions & users
| Method | Endpoint | Access |
|---|---|---|
| POST | `/payments/checkout-session` | Vendor |
| GET | `/payments/session-status/:sessionId` | Vendor (own session) |
| POST | `/payments/webhook` | Stripe (signature verified) |
| GET | `/transactions` | Admin (read-only) |
| GET / PATCH | `/users/me` | Authenticated |
| GET | `/users` · `/users/:id` | Admin |
| PATCH | `/users/:id/block` · `/:id/unblock` | Admin |
| GET | `/dashboard/vendor` · `/customer` · `/admin` | Role based |

---

## 🧩 Challenge Implementation Notes

### 1. Advanced search & sorting (query parameters)

`GET /api/v1/menu-items` supports the following query parameters:

| Param | Example | Behaviour |
|---|---|---|
| `search` | `?search=pepperoni` | Case-insensitive regex match on item name (user input is regex-escaped) |
| `category` | `?category=Meat Lovers` | Validated against the 6 pizza categories |
| `location` | `?location=Dhaka` | Case-insensitive regex match on the item location |
| `minPrice` / `maxPrice` | `?minPrice=5&maxPrice=20` | Price range filter |
| `sort` | `?sort=price-asc` | `newest` (default) · `oldest` · `price-asc` · `price-desc` |
| `page` / `limit` | `?page=2&limit=12` | Pagination with a hard limit of 50, plus a `meta` block (`total`, `totalPage`) |

Only items with `status: approved` are ever returned publicly; rejected/inactive/pending items are invisible to customers.

### 2. JWT verification middleware flow

```
Request → Authorization: Bearer <token>
   │
   ├─ 1. authenticate (middleware/auth.ts)
   │     • verifies the JWT signature with jose against Better Auth's JWKS endpoint
   │     • rejects missing / invalid / expired tokens with 401
   │     • loads the user from MongoDB (DB is the source of truth)
   │     • blocks banned accounts with 403 and attaches req.user
   │
   ├─ 2. requireRole('vendor' | 'customer' | 'admin')
   │     • compares the DB role against the route's allowed roles → 403 on mismatch
   │
   └─ 3. Controller / Service
         • validates the body with zod (400 on bad data)
         • verifies resource ownership before update/delete
         • premium helpers re-check subscription expiry on every action
```

Because the role is re-read from the database on every request, demotions (e.g. blocking or subscription changes) take effect immediately even if the JWT itself is still valid.

### 3. Premium activation flow (webhook only)

```
Vendor clicks "Upgrade" → POST /payments/checkout-session (vendor taken from token)
   → Stripe Checkout (subscription mode) → success/cancel page on the client
   → Stripe fires checkout.session.completed → signature verified with STRIPE_WEBHOOK_SECRET
   → transaction saved (idempotent by stripeSessionId) + Premium activated with expiry
Renewals: invoice.paid extends the expiry (the first invoice is skipped to avoid duplicates)
Cancellation: customer.subscription.deleted → vendor moved back to the Free plan
```

---

## 🚀 Deployment (Render / Railway)

1. Create a new **Web Service** from this repo
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all environment variables from the table above (use the production client URL in `CLIENT_URL` and the production JWKS URL in `JWT_JWKS_URL`)
5. In the Stripe dashboard, point the webhook endpoint to `https://<your-api-domain>/api/v1/payments/webhook` with events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted` — then copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`

---

## 📄 License

MIT
