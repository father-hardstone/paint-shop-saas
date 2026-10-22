# Paintly (Paint & Utility Shop SaaS)

A modern full-stack SaaS platform specifically tailored for paint and utility hardware retailers. Paintly simplifies shop onboarding, secure credential management, custom shop branding, inventory tracking, counter billing, and Cloudflare R2 bucket asset storage.

---

## 🎨 Key Features

1. **Dashboard Tabs: Inventory & Billing**
   - **Tab Buttons**: Positioned directly underneath the top bar with smooth animated transitions.
   - **Inventory Tab**: 
     - Real-time stock counts across paints, utility accessories, and tools.
     - Live valuations, search filters, and low stock threshold alerts.
     - Quick "Add Product" modal.
   - **Billing Tab**:
     - Counter sales register and invoices log.
     - Instant "New Invoice" modal to log sales and calculate totals with tax/discount support.

2. **User Identity: UUID & Serial Number**
   - Every registered user/shop is assigned:
     - A standard cryptographic **UUID** (`uuid` / `id`).
     - An incrementing **Serial Number** (e.g. `1001`, `1002`).

3. **Cloudflare Bucket Storage (`paint-shop/{userUuid}/`)**
   - Uploaded personal profile pictures and company logos are stored in a **Cloudflare R2 Bucket**.
   - Path convention:
     ```text
     paint-shop/{userUuid}/profilePicture.<ext>
     paint-shop/{userUuid}/companyLogo.<ext>
     ```
   - Configurable via backend environment variables with automatic fallback to local disk storage.

4. **Brand Identity & Dynamic Replacement (Paintly)**
   - **Public Pages**: Always display the **Paintly** icon and application name.
   - **Dashboard & Authenticated Pages**: Displays the Paintly icon and name **by default**, unless the retailer uploads their store's custom logo or inputs their store's name in settings, in which case it is dynamically replaced with the store's branding.

5. **Single-View Shop Settings Page (`/settings`)**
   - **No Scrolling on Standard Displays**: Compact, responsive grid layout.
   - **Phone Number & Email**:
     - Whichever one was used to register/log in is **locked** and read-only.
     - The other communication field remains **open** and editable.
   - **Shop / Business Address**: Editable address field (max 120 characters).
   - **Full Name** & **Shop Name**: Compact side-by-side inputs without placeholder text.

6. **Clean Circular Profile Button**
   - A single round profile circle in the corner.
   - Clicking directly opens the dropdown menu with user details, Shop Settings link, and **Log Out**.

7. **Day & Night Mode Toggle**
   - Floating round button positioned at the bottom corner allowing users to toggle between Day (light) and Night (dark) modes at any time.

---

## ⚙️ Backend Environment Variables (`backend/.env`)

Add the following variables to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/paint-shop-db
JWT_SECRET=paint-shop-saas-secure-jwt-key-2026

# Cloudflare R2 Bucket Configuration
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=paint-shop-assets
# Optional custom public domain or r2.dev domain
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-id.r2.dev
```

*(If Cloudflare R2 keys are left empty, the application automatically falls back to local storage inside `backend/data/paint-shop/{userUuid}/` and `backend/data/{serialNumber}/`)*.

---

## 📂 Project Structure

```text
paint-shop-saas/
├── backend/
│   ├── .env.example                  # Template with MongoDB & Cloudflare R2 variables
│   ├── src/
│   │   ├── db/
│   │   │   └── db.ts                 # Database manager (UUID, serialNumber, inventory, invoices)
│   │   ├── handlers/
│   │   │   ├── auth.ts               # Sign-in, sign-up, settings, inventory & billing handlers
│   │   │   ├── calculateMix.ts       # Pigment cost calculation
│   │   │   ├── createOrder.ts        # Order fulfillment
│   │   │   ├── getOrders.ts          # Order history
│   │   │   └── getPaints.ts          # Pigment inventory retrieval
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT middleware with UUID and serialNumber
│   │   ├── services/
│   │   │   └── storage.ts            # Cloudflare R2 storage service (paint-shop/{userUuid}/)
│   │   └── server.ts                 # Express server with inventory, billing & storage endpoints
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   └── manifest.json             # Paintly Web App Manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopBar.tsx            # Dynamic store branding/Paintly & pure circular profile button
│   │   │   └── ThemeToggle.tsx       # Round floating day/night mode toggle
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # JWT state with user UUID, serialNumber, and theme toggle
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Paintly landing page
│   │   │   ├── SignInPage.tsx        # Phone / Email sign in with character limits
│   │   │   ├── SignUpPage.tsx        # 2-field verified sign up (phone/email + password)
│   │   │   ├── DashboardPage.tsx     # Animated Inventory & Billing tabs under top bar
│   │   │   └── SettingsPage.tsx      # Single-view settings with locked/open phone & email + address
│   │   ├── App.tsx                   # Route controller and global ThemeToggle
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ License

MIT License. Designed and built for Paintly.
