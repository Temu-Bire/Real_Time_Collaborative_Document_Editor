# SyncWrite — Real-Time Collaborative Document Editor

A full-stack collaborative document editor with rich-text editing, live
multi-user collaboration, presence awareness, auto-save, version history,
comments, and granular sharing permissions.

Two users editing the same document see each other's changes **instantly**
— no page refresh required — thanks to a CRDT-based real-time sync layer
([Yjs](https://yjs.dev) over Socket.IO).

---

## Features

### Authentication
- Register, login, logout (local email/password)
- Google Sign-In (Google Identity Services)
- JWT access tokens + httpOnly refresh-token rotation (hashed at rest)
- Email verification & password reset (token flows; email sending is a TODO)
- Brute-force protection: account lockout, rate limiting, input validation

### Dashboard
- Documents **owned by you**, **shared with you**, and **recently opened**
  (filter tabs: All / Owned by me / Shared with me / Recent)
- Create, rename, delete, duplicate, and open documents
- Search by title, pagination, dark mode

### Document management
Every document stores: title, owner, date created, last modified.

### Rich text editing (TipTap)
- Headings (H1–H3), bold, italic, underline
- Bullet & ordered lists, text alignment, hyperlinks, page breaks

### Real-time collaboration (main requirement)
- Instant, conflict-free edits via **Yjs CRDT** + **Socket.IO**
- All connected users stay synchronized with no refresh
- **Secured**: every WebSocket connection is authenticated (JWT) and must have
  permission on the document before joining its sync room

### Presence awareness
- See who is currently viewing the document (names, avatars, online status)
- Live cursor positions and active editing locations (bonus)
- **Typing indicators**: see who is actively typing, with animated dots

### Keyboard shortcuts
- `Ctrl/Cmd + S` save now · `Ctrl/Cmd + P` export PDF · `Ctrl/Cmd + Shift + E`
  export Markdown · `Ctrl/Cmd + Shift + I` import Markdown · `Ctrl/Cmd + F`
  find in document · `Ctrl/Cmd + /` shortcuts help · `Mod + Enter` page break
- In-editor **find bar** with match counting and next/previous navigation

### Export & import
- Export document to **PDF** (print-optimized A4 layout)
- Export to **Markdown** (`.md` download)
- Import a **Markdown** file directly into the editor

### Auto-save
- No save button — changes persist automatically (2s debounce) and on close
- Document data survives a browser refresh

### Version history
- View previous revisions, restore any earlier version
- Revisions record who created them and when
- Versions are created on manual save, significant changes, and document close

### Comments
- Add comments, reply to comments (threaded), resolve / unresolve, delete

### Sharing & permissions
- Share by email with roles: **Viewer**, **Commenter**, **Editor**
- Owner-only share management; permission enforced on every REST route and on
  the real-time WebSocket layer

### Notifications
- In-app **notification bell** with unread badge
- Real-time push over Socket.IO (with periodic polling fallback)
- Alerts for: document shared with you, role changes, new comments, and replies
  to your comments

---

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, Tailwind CSS, TipTap (rich text), Yjs, y-socket.io, Socket.IO client |
| Backend  | Node.js, Express 5, Socket.IO, y-socket.io, Yjs |
| Database | MongoDB (Mongoose) |
| Auth     | JWT, bcryptjs, Google Identity Services, helmet, express-rate-limit |

---

## Project structure

```
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (common, documents, editor)
│   │   ├── context/            # Auth, Document, Theme contexts
│   │   ├── hooks/
│   │   ├── pages/              # auth/, dashboard/
│   │   ├── routes/             # Route definitions + guards
│   │   ├── services/           # axios API layer, document/auth services
│   │   ├── utils/
│   │   └── socket.js           # (unused) Socket.IO client
│   └── vite.config.js
├── server/                     # Express + Socket.IO backend
│   ├── index.js                # Entry: HTTP + Socket.IO + Yjs auth middleware
│   └── src/
│       ├── app.js              # Express app (middleware, routes, security)
│       ├── config/             # Env, database, auth config
│       ├── features/           # Feature modules (auth, documents, comments, users)
│       │   └── <feature>/
│       │       ├── controllers/
│       │       ├── models/
│       │       ├── routes/
│       │       ├── services/
│       │       ├── repositories/
│       │       └── validators/
│       └── shared/             # constants, errors, middleware, utils
└── render.yaml                 # Render Blueprint (deploys API + UI)
```

The backend follows a **feature-first, layered architecture**:
`routes → controllers → services → repositories/models`, with shared
middleware (auth, permissions, error handling) and validators kept separate
and reusable.

---

## Getting started (local development)

### Prerequisites
- Node.js ≥ 18
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Configure the server

```bash
cd server
cp .env.example .env          # or edit server/.env directly
npm install
```

`server/.env` ships production-ready. For local development, the server
automatically loads `server/.env.development` when `NODE_ENV` is
`development` (it already contains `CLIENT_URL=http://localhost:5173`).
Create it if missing:

```bash
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 2. Configure the client

```bash
cd client
npm install
```

`client/.env` is used for production builds (`vite build`).
`client/.env.development` is used for `npm run dev` and already points at
`http://localhost:5000`.

### 3. Run

```bash
# Terminal 1 — server (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — client (http://localhost:5173)
cd client && npm run dev
```

---

## Environment variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens |
| `CLIENT_URL` | Frontend origin (used for CORS, cookies, reset links) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional for current flow) |
| `NODE_ENV` | `development` / `production` |
| `ACCESS_TOKEN_EXPIRY` | Default `15m` |
| `REFRESH_TOKEN_EXPIRY` | Default `7d` |
| `PORT` | Default `5000` |

### Client (`client/.env` / `.env.development`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | REST API base URL, e.g. `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO base URL, e.g. `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## API overview

All routes are prefixed with `/api` and (except auth) require
`Authorization: Bearer <accessToken>`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | public | Register |
| POST | `/auth/login` | public | Login (sets refresh cookie) |
| POST | `/auth/google` | public | Google Sign-In |
| POST | `/auth/refresh` | public | Refresh access token |
| POST | `/auth/logout` | auth | Logout |
| POST | `/auth/forgot-password` | public | Request reset link |
| POST | `/auth/reset-password` | public | Reset password |
| GET  | `/auth/profile` | auth | Current user |
| GET  | `/documents?type=all\|owned\|shared\|recent` | auth | List docs |
| POST | `/documents` | auth | Create document |
| GET  | `/documents/:id` | Viewer+ | Open document (also records "recent") |
| PUT  | `/documents/:id` | Editor+ | Auto-save / rename |
| DELETE | `/documents/:id` | Owner | Delete document |
| POST | `/documents/:id/share` | Owner | Share with a user |
| PATCH | `/documents/:id/share/:userId` | Owner | Change role |
| DELETE | `/documents/:id/share/:userId` | Owner | Remove collaborator |
| GET/POST | `/documents/:id/comments` | Viewer+/Commenter+ | List / add comments |
| PATCH/DELETE | `/documents/:id/comments/:commentId` | Commenter+ | Edit / delete |
| PATCH | `/documents/:id/comments/:commentId/resolve` | Commenter+ | Resolve |
| GET  | `/documents/:id/versions` | Viewer+ | Version history |
| POST | `/documents/:id/versions` | Editor+ | Create manual version |
| POST | `/documents/:id/versions/restore` | Editor+ | Restore version |
| POST | `/documents/:id/close` | Editor+ | Save on close |
| GET  | `/health` | public | Health check |

---

## Security

- Passwords hashed with bcrypt; refresh tokens stored hashed
- JWT access tokens in memory/localStorage, refresh tokens in **httpOnly** cookies
- Rate limiting on auth + API routes, account lockout, input validation
- Helmet security headers, strict CORS (configured from `CLIENT_URL`)
- **Permission checks on the real-time layer**: every Yjs/Socket.IO connection
  must present a valid JWT and belong to a user with access to the document
  (enforced in `server/index.js` before any sync data is exchanged)

---

## Deployment (Render)

The repo includes a **Render Blueprint** (`render.yaml`) that creates both
services automatically:

1. **syncwrite-api** — Node Web Service (Express + Socket.IO)
2. **syncwrite-ui** — Static Site (Vite build) with SPA rewrite

### One-click (Blueprint)

1. Push this repository to GitHub.
2. In [render.com](https://render.com) → **New → Blueprint** → connect the repo.
3. After the first deploy, open each service's **Environment** tab and set the
   values flagged with `sync: false`:

   **API (`syncwrite-api`)**
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET`, `REFRESH_TOKEN_SECRET` — long random values
   - `CLIENT_URL` — the UI URL, e.g. `https://syncwrite-ui.onrender.com`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

   **UI (`syncwrite-ui`)**
   - `VITE_API_URL` — `https://syncwrite-api.onrender.com/api`
   - `VITE_SOCKET_URL` — `https://syncwrite-api.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID`

4. **MongoDB Atlas**: add `0.0.0.0/0` to Network Access (or Render egress IPs).
5. **Google Cloud Console**: add your production frontend URL to the OAuth
   client's **Authorized JavaScript origins**.
6. Trigger a manual deploy on both services and verify `/api/health` returns
   `200`.

### Manual (Dashboard)

- **Web Service**: root dir `server`, runtime Node, build `npm install`,
  start `npm start`, health check path `/api/health`, then add the env vars above.
- **Static Site**: root dir `client`, build `npm install && npm run build`,
  publish directory `dist`, and add a **Redirect/Rewrite** rule
  (`/*` → `/index.html`, Rewrite) for SPA routing.

### Deployment notes

- Render Web Services support WebSocket/Socket.IO without extra config.
- Free-tier instances sleep after ~15 min of inactivity (drops live
  connections and cold-starts slowly) — use a paid plan for a reliable demo.
- Keep a **single API instance**: Yjs documents and version sessions are held
  in memory. Scale horizontally only after adding a shared persistence layer.

---

## Known limitations

- Email verification / password-reset emails are not sent (no SMTP provider);
  tokens are only returned in development mode.
- Realtime sync state is in-memory; a Yjs persistence adapter
  (e.g. y-leveldb / y-mongodb) would make live documents survive restarts.
- `client/src/socket.js` is currently unused (the editor connects via
  y-socket.io's provider).

## License

ISC
