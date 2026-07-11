# DataStock

DataStock is a full-stack cloud storage web app for uploading, organizing,
previewing, sharing, archiving, and deleting files. The project is split into a
Vite React frontend and an Express/Prisma backend.

## Live Links

- Frontend: https://data-stock.vercel.app
- Backend API: https://datastock-skpb.onrender.com

## Features

- Email/password, OTP, and Google OAuth authentication
- JWT and cookie-based session support
- File upload, preview, download, archive, star, trash, and restore flows
- Folder creation, navigation, and deletion
- File sharing with users and public links
- Notifications and realtime socket updates
- Storage analytics, subscription pricing, and payment return handling
- Light and dark theme support

## Tech Stack

- Frontend: React 19, Vite, Redux Toolkit, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, Prisma, PostgreSQL, Socket.IO
- Services: Cloudinary, Google OAuth, Dodo Payments
- Deployment: Vercel for frontend, Render for backend

## Project Structure

```text
DataStock/
  Backend/
    prisma/
    src/
      config/
      middleware/
      modules/
      services/
      utils/
    server.js
  Frontend/
    public/
    src/
      api/
      components/
      config/
      context/
      hooks/
      pages/
      routes/
      store/
      styles/
      utils/
```

## Local Setup

Install dependencies:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

Create `Backend/.env`:

```env
DATABASE_URL=
JWT_SECRET=
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Prepare the database:

```bash
cd Backend
npx prisma generate
npx prisma migrate dev
```

Run the app:

```bash
cd Backend
npm run dev

cd ../Frontend
npm run dev
```

## Quality Checks

```bash
cd Frontend
npm run lint
npm run build
```

For backend syntax checks:

```bash
cd Backend
node --check server.js
```

## Notes

- Generated frontend builds belong in `Frontend/dist` and should not be placed
  under `Frontend/public`.
- Keep secrets in local `.env` files only.
- Run Prisma migrations whenever the schema changes.
