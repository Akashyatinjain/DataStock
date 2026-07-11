# DataStock Frontend

React/Vite client for the DataStock cloud storage app.

## Main Folders

```text
src/
  api/          API clients
  components/   Shared and dashboard UI
  config/       Runtime configuration
  context/      App providers
  hooks/        Reusable React hooks
  pages/        Route pages
  routes/       Route guards
  store/        Redux store and slices
  styles/       Global style modules
  utils/        Formatting, auth, upload, and file helpers
```

## Environment

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Scripts

```bash
npm run dev      # Start local Vite dev server
npm run lint     # Run ESLint
npm run build    # Build production assets
npm run preview  # Preview the production build
```

## Build Notes

- Vite copies everything from `public` into `dist`, so do not place generated
  build folders inside `public`.
- Theme state lives in Redux. UI components should use `src/hooks/useTheme.js`.
