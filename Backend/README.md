# DataStock Backend

Express API for DataStock. It handles authentication, files, folders, sharing,
notifications, storage analytics, subscriptions, and realtime socket events.

## Main Folders

```text
src/
  config/       Environment and database setup
  middleware/   Auth, upload, rate limit, and error middleware
  modules/      Feature modules grouped by domain
  services/     External service clients
  utils/        Shared backend helpers
prisma/
  migrations/   Database migrations
  schema.prisma Prisma schema
```

## Environment

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

`JWT_SECRET` should be at least 32 characters in production.

## Scripts

```bash
npm run dev    # Start with nodemon
npm start      # Start with node
```

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## Syntax Check

```bash
node --check server.js
```
