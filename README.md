<div align="center">

  <img src="Frontend/public/datastock-logo.svg" alt="DataStock Logo" width="80" height="80" />

  # ☁️ DataStock
  ### Next-Generation Zero-Knowledge Cloud Storage & Collaboration Platform

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

  <p align="center">
    <b>Store files securely • E2EE Zero-Knowledge Privacy • Real-Time Collaboration • Modern Mobile UX</b>
    <br />
    <a href="https://data-stock.vercel.app"><strong>🌐 Explore Live App »</strong></a>
    ·
    <a href="https://datastock-skpb.onrender.com">Backend API</a>
  </p>

</div>

---

## 🌟 Overview

**DataStock** is an enterprise-grade, high-performance cloud storage web platform designed to rival Google Drive, Dropbox, and Linear in aesthetics, speed, and privacy. Built with client-side Zero-Knowledge End-to-End Encryption (E2EE), real-time WebSockets, and native mobile gestures, DataStock keeps your digital files protected, organized, and accessible from anywhere.

> [!IMPORTANT]
> **Zero-Knowledge Privacy Guaranteed**: DataStock utilizes the browser Web Crypto API (RSA-OAEP 2048 + AES-GCM 256) to encrypt your files client-side before upload. Server administrators and cloud providers never have access to your raw unencrypted keys or passphrases.

---

## 🔥 Key Features

### 🛡️ Security & Zero-Knowledge Encryption (E2EE)
- **Client-Side Encryption**: Web Crypto API (RSA + AES-GCM 256-bit encryption).
- **Passphrase Vault**: Single-click vault lock/unlock with encrypted passphrase storage.
- **Zero-Knowledge Architecture**: Encryption and decryption happen entirely within your local browser context.

### 📁 Cloud Storage & Directory Management
- **Instant Drag-and-Drop**: Multi-file drag-and-drop overlay zone.
- **Folder Vaults & Nested Paths**: Subfolder navigation, breadcrumbs, and folder ZIP downloads.
- **Rich File Previews**: Native modal preview for Images, Videos, PDFs, Text documents, and Audio files.
- **Smart Extension Badges**: Automatic recognition of `DOCX`, `XLSX`, `PPTX`, `PNG`, `JPG`, `ZIP`, `PDF`, `MP4`, `MP3`, and more.

### 📱 Native Mobile Experience
- **Bottom Navigation Bar**: Mobile quick bar with 🏠 Drive, 🔍 Search, ➕ Upload FAB, 🔔 Alerts, and 👤 Profile tabs.
- **Floating Action Button (FAB)**: One-tap bottom-right mobile upload button.
- **Touch Swipe Gestures**:
  - ➡️ **Swipe Right**: Star / Favorite file
  - ⬅️ **Swipe Left**: Move file to Trash
- **Compact Card Scaling**: Optimized 15–20% shorter file cards for high-density mobile viewports.

### 🤝 Real-Time Collaboration & Telemetry
- **Socket.io Live Sync**: Real-time notifications and live active collaborator avatars.
- **Secure Link Sharing**: Share files and folders with password protection and expiration limits.
- **Audit Log Telemetry**: System activity stream tracking uploads, deletions, shares, and logins.

### 📊 Storage Analytics & Stripe Subscriptions
- **Category Usage Breakdowns**: Visual breakdown of storage consumed by Images, Videos, Documents, and Archives.
- **Modern Pricing Matrix**: Basic (₹0), Pro (₹149/mo), and Family (₹299/mo) plans.
- **Billing Toggle**: Monthly / Yearly toggle with instant 20% discount calculation.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Redux Toolkit, Lucide Icons, Socket.io Client, JSZip |
| **Security & Crypto** | Web Crypto API (SubtleCrypto: RSA-OAEP 2048, AES-GCM 256) |
| **Backend API** | Node.js, Express.js, Prisma ORM, PostgreSQL |
| **Real-Time & Sync** | Socket.IO WebSockets |
| **Storage & Services** | Cloudinary API, Google OAuth 2.0, Dodo Payments / Stripe |
| **Deployment** | Vercel (Frontend), Render (Backend API) |

---

## 📁 Repository Structure

```text
DataStock/
├── Backend/
│   ├── prisma/                # Prisma ORM Schema & Migrations
│   ├── src/
│   │   ├── config/            # Environment & Cloudinary configs
│   │   ├── middleware/        # JWT & Auth validation middleware
│   │   ├── modules/           # API routes (files, folders, auth, shares)
│   │   ├── services/          # Real-time WebSocket handlers & Stripe
│   │   └── utils/             # Crypto & email helpers
│   └── server.js              # Express server entry point
│
└── Frontend/
    ├── public/                # Static assets & favicon
    └── src/
        ├── api/               # Axios REST API client
        ├── components/        # Modals, layout headers, sidebars, file cards
        ├── context/           # E2EE Web Crypto Context
        ├── hooks/             # Custom React hooks (useSubscription, useDecryptedFiles)
        ├── pages/             # HomePage, Dashboard, Pricing, Notifications, Profile
        ├── store/             # Redux thunks & slices (auth, files, folders, payment)
        └── utils/             # File formatters & upload validators
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- Node.js `v18.x` or `v20.x`
- PostgreSQL Database
- Cloudinary & Google OAuth credentials (optional for full features)

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/Akashyatinjain/DataStock.git
cd DataStock
```

Install dependencies for both projects:
```bash
# Backend dependencies
cd Backend
npm install

# Frontend dependencies
cd ../Frontend
npm install
```

### 3. Environment Variables

Create `Backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/datastock?schema=public"
JWT_SECRET="your_jwt_secret_key"
SESSION_SECRET="your_session_secret"
FRONTEND_URL="http://localhost:5173"

# Services (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Create `Frontend/.env`:
```env
VITE_API_URL="http://localhost:5000/api"
```

### 4. Database Setup & Migration
```bash
cd Backend
npx prisma generate
npx prisma migrate dev
```

### 5. Running Locally
```bash
# Start Backend API (Terminal 1)
cd Backend
npm run dev

# Start Frontend Vite Dev Server (Terminal 2)
cd Frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🎨 Design System & Aesthetics

DataStock implements a custom modern dark-mode aesthetic with glassmorphism overlays, HSL color harmony, ambient glow cards, and micro-interactions.

- **Pro Tier**: Electric Blue ambient glow (`shadow-blue-500/20`)
- **Family Tier**: Royal Purple ambient glow (`shadow-purple-500/25`)
- **Vault State**: Amber security badge & instant unlock drawer

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the file for details.

<div align="center">
  <sub>Built with ♥ for privacy-first cloud storage and seamless digital life.</sub>
</div>
