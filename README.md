# TRUSTFORGE — Privacy-First Vehicle Communication & Emergency Assistance Platform

> **"One Scan. The Right Help. At The Right Time."**

TRUSTFORGE is a full-stack mobility platform designed to enable responsible, privacy-preserving vehicle communication. When vehicles obstruct driveways, block parking bays, or when someone nearby encounters a roadside emergency, anyone can scan the vehicle's unique QR code from their smartphone camera without installing an application or exposing personal telephone numbers.

---

## 🛡️ Core Value Proposition & Privacy Architecture

* **Zero PII Exposure on Public QR Codes:** The physical decal encodes only an unguessable 128-bit cryptographic token (`/v/<secure-random-token>`). Scanners never receive the vehicle owner's mobile number, residential address, or date of birth.
* **Instant Token Invalidation & Regeneration:** If a vehicle is sold or a printed sticker is lost, the owner can invalidate the previous QR with a single click, instantly rendering the old decal inactive.
* **Row-Level Security (RLS) PostgreSQL Schema:** Complete Supabase database schema with RLS policies, indexing, and PostgreSQL stored procedures (`get_public_vehicle_by_token`, `submit_public_parking_report`, `submit_public_emergency_alert`).
* **India 112 National Emergency Helpline Protocol:** Direct, non-intermediated access to India's unified police, ambulance, and fire dispatch (112), unrestricted by application rate limits.
* **Dual-Engine Architecture:** Seamlessly operates in full live Supabase cloud mode when credentials are provided in `.env`, or via an integrated local persistent simulation engine for zero-friction hackathon demos and offline testing with honest simulated OTP verification.

---

## 🚀 Live Demo & Core User Journeys

1. **Landing Page (`/`):**
   * Overview of platform identity, mission statement, and interactive windshield pass preview.
   * Action buttons: **GET STARTED** and **CREATE YOUR QR** leading to onboarding.
   * Direct link to simulate public scanner experience on sample registered vehicle.

2. **Owner Onboarding & Vehicle Registration (`/register`):**
   * **Step 1 (Personal Information):** Full name, email, Indian mobile number with OTP verification (runs transparent dev/demo mode if SMS gateway not configured).
   * **Step 2 (Vehicle Details):** Category (Car, Bike, Scooter, Other), Brand, Model, Year, Registration Number (format validated), Color, and optional authentic photograph upload.
   * **Step 3 (Trusted Emergency Contacts):** 2 mandatory emergency contacts (up to 5 total) with relationship, mobile number, and emergency notification toggle.
   * **Step 4 (Review & Privacy Options):** Registration summary, license plate masking option on public page, DPDP Act consent agreement.

3. **QR Generation & Decal Management (`/qr-success/:vehicleId` & `/dashboard`):**
   * Instant cryptographic token generation.
   * Download high-resolution QR as PNG.
   * Printable vehicle windshield decal (`window.print()` layout formatted for vehicle glass/dashboard stickers).
   * QR activation toggle (Active / Deactivated).
   * Token regeneration with confirmation modal.

4. **Public Assistance Scanner Interface (`/v/:token`):**
   * Mobile-first responsive interface accessible without app download or registration.
   * Displays owner-approved public fields only (brand, model, category, color, masked registration number, verified owner display alias).
   * **Action 1 — Contact Vehicle Owner:** Direct mediated notification dispatch.
   * **Action 2 — Report Parking Issue:** Selection of reason (blocking entrance, wrong parking, blocking vehicle), optional description, and consent-based GPS location.
   * **Action 3 — Notify Trusted Contacts:** Mediated notification dispatch to emergency contacts.
   * **Action 4 — Emergency Assistance:** Urgent incident broadcast to owner and contacts.
   * **Action 5 — Call National Emergency 112:** One-touch direct dialing to India 112 emergency services.

5. **Owner Command Dashboard (`/dashboard`):**
   * **Overview:** Real-time statistics (total scans, contact requests, parking reports, emergency pings), Recharts activity velocity chart, recent audit trail.
   * **My Vehicles:** Vehicle details, edit photo, registration masking toggle.
   * **My QR Codes:** High-res QR canvas, link copy, PNG download, windshield printout.
   * **Trusted Contacts:** Add, edit, remove, and manage emergency notification recipients.
   * **Parking Alerts:** Real reports, reason, description, timestamp, GPS coords, and resolution workflow (Acknowledge, Resolve, Dismiss).
   * **Emergency Alerts:** Severity level, message, contacts notified count, and resolution controls.
   * **Activity History:** Full chronological audit trail.
   * **Privacy & Security:** Fine-grained feature switches and RLS status overview.
   * **Settings:** Connection architecture, data backup JSON export, and sample data reset.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, TypeScript |
| **Routing** | React Router v6 |
| **Styling & UI** | Tailwind CSS (Navy/Slate/Brand Fintech Design System), Lucide Icons |
| **State & Forms** | React Hook Form, Zod, Custom Persistent Repository Adapter |
| **Data Visualization** | Recharts |
| **QR Code Engine** | `qrcode` (High error-correction level canvas renderer) |
| **Database & Auth** | Supabase PostgreSQL, Row-Level Security (RLS) |
| **Deployment Target** | Vercel / Netlify compatible |

---

## 📦 Project Structure

```
TRUSTFORGE/
├── public/
│   └── shield.svg                    # SVG Favicon & Brand Symbol
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx            # Sticky header with auth/status controls
│   │   │   ├── Footer.tsx            # Footer with 112 emergency advisory
│   │   │   └── StatusBanner.tsx      # Honest system connection banner
│   │   ├── qr/
│   │   │   ├── QRCodeDisplay.tsx     # Canvas QR, download PNG, link copy, token regeneration
│   │   │   └── QRCardPrintable.tsx   # Print-ready windshield decal pass layout
│   │   └── dashboard/
│   │       ├── Sidebar.tsx           # Dashboard navigation & notification badges
│   │       ├── OverviewTab.tsx       # Real-time metrics & Recharts activity velocity
│   │       ├── VehiclesTab.tsx       # Vehicle management & photo updates
│   │       ├── QRCodesTab.tsx        # Dedicated QR management screen
│   │       ├── TrustedContactsTab.tsx# Emergency contact management
│   │       ├── ParkingAlertsTab.tsx  # Parking report resolution workflow
│   │       ├── EmergencyAlertsTab.tsx# Urgent emergency pings
│   │       ├── ActivityHistoryTab.tsx# Chronological audit trail
│   │       ├── ProfileTab.tsx        # Profile editing
│   │       ├── PrivacySettingsTab.tsx# Plate masking & feature toggles
│   │       └── SettingsTab.tsx       # System health & JSON data backup
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client initializer
│   │   ├── storage.ts                # Unified persistent repository layer (Cloud & Local)
│   │   └── utils.ts                  # Indian mobile & vehicle validation, crypto tokens
│   ├── pages/
│   │   ├── LandingPage.tsx           # Homepage & hero with live decal simulation
│   │   ├── OnboardingPage.tsx        # 4-step owner onboarding & registration
│   │   ├── QRSuccessPage.tsx         # Post-registration celebration & QR pass
│   │   ├── PublicQRScanPage.tsx      # Public scanner page (/v/:token)
│   │   ├── DashboardPage.tsx         # Comprehensive owner portal
│   │   ├── LoginPage.tsx             # Returning owner sign-in
│   │   ├── AboutPage.tsx             # Platform mission & DPDP privacy charter
│   │   └── ContactPage.tsx           # Support contact & helpline links
│   ├── types/
│   │   └── index.ts                  # Full TypeScript database schema & interfaces
│   ├── App.tsx                       # React Router configuration
│   ├── main.tsx                      # App entry point
│   └── index.css                     # Tailwind directives & print media styles
├── supabase/
│   └── migrations/
│       └── 20261109000000_init_trustforge.sql # Complete Supabase PostgreSQL schema & RLS
├── .env.example                      # Environment variables template
├── tailwind.config.js                # Custom palette (deep navy, brand blue accents)
├── vite.config.ts                    # Optimized code splitting chunks
└── package.json
```

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
* **Node.js** v18+ (tested on v24.21.0)
* **npm** or **pnpm**

### 2. Installation
```bash
git clone <repository-url>
cd TRUSTFORGE
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To connect to Supabase Cloud:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
VITE_TELEPHONY_PROVIDER=none
```
*(If left empty, TRUSTFORGE runs in local persistent sandbox mode automatically with real persistence, so you can test all features without requiring cloud credentials).*

### 4. Supabase Database Migration
If using Supabase Cloud, run the SQL script in your Supabase SQL Editor:
```bash
# File location:
supabase/migrations/20261109000000_init_trustforge.sql
```
This script sets up:
* `profiles`, `vehicles`, `trusted_contacts`, `activity_events`, `parking_reports`, `emergency_alerts`, `notification_logs`
* Row Level Security (RLS) policies
* Public RPC functions: `get_public_vehicle_by_token`, `submit_public_parking_report`, `submit_public_emergency_alert`, `submit_public_contact_request`

### 5. Running the Application
```bash
# Start Vite development server
npm run dev

# Or build for production
npm run build
npm run preview
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing the Complete End-to-End Flow

1. **Visit Landing Page (`/`):**
   * Click **GET STARTED** or **CREATE YOUR QR**.
2. **Complete 4-Step Registration:**
   * Step 1: Enter your name, email, mobile number (e.g. `9876543210`). Click **Send OTP**, enter the displayed test code `492815`, and verify.
   * Step 2: Choose vehicle category (e.g. Car), Brand (e.g. `Tata`), Model (e.g. `Nexon EV`), Registration number (e.g. `DL01AB1234`), Color.
   * Step 3: Enter 2 emergency contacts (e.g. Spouse and Brother).
   * Step 4: Toggle "Mask registration number on public QR page" and confirm.
3. **Inspect Generated QR Code:**
   * View your newly created QR code on `/qr-success/:vehicleId`.
   * Test **Download PNG** or click **Print Windshield Pass**.
4. **Simulate Public Scanner Experience:**
   * Click **Test Scanner Experience** to open the public route `/v/<token>`.
   * Notice that your personal phone number, address, and email are completely concealed.
   * Click **Report Parking Issue**, select "Vehicle blocking entrance", and submit.
   * Click **Emergency Assistance** and submit an urgent ping.
5. **Review Dashboard Activity:**
   * Navigate to `/dashboard`.
   * Notice your metrics immediately update (Total Scans: 1+, Parking Reports: 1+, Emergency Alerts: 1+).
   * Open the **Parking Alerts** tab to inspect the report and click **Mark Resolved**.
   * Open the **Activity History** tab to view the immutable audit trail.
   * Open the **Privacy & Security** tab to reconfigure public plate masking or disable alerts.

---

## 🌐 Deployment to Vercel

TRUSTFORGE is fully configured for Vercel deployment:
1. Push your repository to GitHub / GitLab.
2. Import project into Vercel.
3. In **Environment Variables**, add:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
   * `VITE_APP_URL` (set to your Vercel production domain, e.g. `https://trustforge.vercel.app`)
4. Deploy! Single-page app client routing is supported out-of-the-box.

---

## 📜 License
Developed for the TRUSTFORGE Vehicle Communication & Emergency Assistance Hackathon. Distributed under the MIT License.

