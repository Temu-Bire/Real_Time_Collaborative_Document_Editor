const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "SyncWrite";
pptx.title = "SyncWrite - Technical Architecture";

const INDIGO = "4F46E5";
const INDIGO_DARK = "312E81";
const SLATE = "334155";
const SLATE_LIGHT = "94A3B8";
const BG = "F8FAFC";
const WHITE = "FFFFFF";
const EMERALD = "10B981";
const AMBER = "F59E0B";
const ROSE = "EF4444";

const F = (fontSize, bold = false, color = SLATE) => ({ fontSize, bold, color });

function footer(slide, idx) {
  slide.addText("SyncWrite — Real-Time Collaborative Document Editor", {
    x: 0.5, y: 7.05, w: 8, h: 0.3, fontSize: 9, color: SLATE_LIGHT,
  });
  slide.addText(String(idx), { x: 12.3, y: 7.05, w: 0.5, h: 0.3, fontSize: 9, color: SLATE_LIGHT, align: "right" });
}

function slideHeader(slide, title, subtitle) {
  slide.background = { color: BG };
  slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.14, fill: { color: INDIGO } });
  slide.addText(title, { x: 0.6, y: 0.35, w: 12, h: 0.6, ...F(26, true, INDIGO_DARK) });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.6, y: 0.95, w: 12, h: 0.4, ...F(13, false, SLATE_LIGHT) });
  }
}

// ---------------------------------------------------------------- Title
{
  const s = pptx.addSlide();
  s.background = { color: INDIGO_DARK };
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: INDIGO_DARK } });
  s.addShape("rect", { x: 0, y: 6.9, w: 13.33, h: 0.6, fill: { color: INDIGO } });
  s.addText("SyncWrite", { x: 0.9, y: 2.0, w: 11.5, h: 1.0, fontSize: 60, bold: true, color: WHITE });
  s.addText("Real-Time Collaborative Document Editor", { x: 0.9, y: 3.0, w: 11.5, h: 0.6, fontSize: 24, color: "C7D2FE" });
  s.addText("Technical Architecture & Implementation", { x: 0.9, y: 3.75, w: 11.5, h: 0.5, fontSize: 16, color: SLATE_LIGHT });
  s.addText("React 19 · TipTap · Yjs · Socket.IO · Express 5 · MongoDB", { x: 0.9, y: 5.6, w: 11.5, h: 0.4, fontSize: 13, color: "A5B4FC" });
}

// ---------------------------------------------------------------- Agenda
{
  const s = pptx.addSlide();
  slideHeader(s, "Agenda", "What we will cover");
  const items = [
    ["01", "Problem & Product Goals"],
    ["02", "System Architecture & Tech Stack"],
    ["03", "CRDTs & Why Yjs"],
    ["04", "Real-Time Sync Flow"],
    ["05", "Security Model"],
    ["06", "Data Model"],
    ["07", "Versioning Strategy"],
    ["08", "Collaboration Features"],
    ["09", "Deployment & Scale"],
    ["10", "Challenges, Roadmap & Demo"],
  ];
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * 6.2;
    const y = 1.6 + row * 1.1;
    s.addShape("roundRect", { x, y, w: 5.9, h: 0.85, rectRadius: 0.1, fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 }, shadow: { type: "outer", blur: 4, angle: 90, distance: 2, opacity: 0.12 } });
    s.addText(it[0], { x: x + 0.2, y: y + 0.18, w: 0.8, h: 0.5, ...F(18, true, INDIGO) });
    s.addText(it[1], { x: x + 1.0, y: y + 0.18, w: 4.7, h: 0.5, ...F(13, true, SLATE) });
  });
  footer(s, 2);
}

// ---------------------------------------------------------------- Problem & Goals
{
  const s = pptx.addSlide();
  slideHeader(s, "Problem & Product Goals", "Why build SyncWrite");
  s.addText("Problem", { x: 0.7, y: 1.6, w: 5, h: 0.4, ...F(16, true, ROSE) });
  s.addText(
    "Editing documents alone forces manual merges and email round-trips.\n" +
    "Teams need a single source of truth where every keystroke is shared live,\n" +
    "with no lost edits when people type at the same time.",
    { x: 0.7, y: 2.05, w: 5.9, h: 1.4, ...F(12.5) }
  );
  s.addText("Goals", { x: 6.9, y: 1.6, w: 5, h: 0.4, ...F(16, true, EMERALD) });
  const goals = [
    "Conflict-free simultaneous editing",
    "Instant propagation with no refresh",
    "Granular permission control",
    "Auto-save + version history",
    "Presence: cursors, typing, online users",
    "Secure real-time channel (JWT on WS)",
  ];
  goals.forEach((g, i) => {
    s.addShape("ellipse", { x: 7.0, y: 2.15 + i * 0.62, w: 0.16, h: 0.16, fill: { color: EMERALD } });
    s.addText(g, { x: 7.3, y: 2.0 + i * 0.62, w: 5.4, h: 0.45, ...F(12.5) });
  });
  footer(s, 3);
}

// ---------------------------------------------------------------- Architecture
{
  const s = pptx.addSlide();
  slideHeader(s, "High-Level Architecture", "Two apps, one event backbone");
  const box = (x, y, w, h, label, sub, color) => {
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: WHITE }, line: { color, width: 1.5 } });
    s.addText(label, { x, y: y + 0.12, w, h: 0.4, align: "center", ...F(13, true, color) });
    if (sub) s.addText(sub, { x: x + 0.15, y: y + 0.5, w: w - 0.3, h: 1.1, align: "center", ...F(10, false, SLATE_LIGHT) });
  };

  box(0.7, 1.6, 5.7, 2.0, "React SPA (client)", "Vite · TipTap editor · Yjs client\nSocket.IO provider · Tailwind UI", INDIGO);
  box(0.7, 4.0, 5.7, 2.0, "Express API (server)", "REST /api · JWT auth · Mongoose\nversioning · notifications", INDIGO);

  box(7.0, 1.6, 5.5, 2.0, "Socket.IO + YSocketIO", "Namespaced rooms per document\nYjs sync protocol over WebSocket", EMERALD);
  box(7.0, 4.0, 5.5, 2.0, "MongoDB Atlas", "Documents · Users · Versions\nComments · Notifications", EMERALD);

  // arrows
  s.addShape("line", { x: 3.55, y: 3.62, w: 0, h: 0.4, line: { color: SLATE_LIGHT, width: 1.5 } });
  s.addText("collaboration", { x: 6.35, y: 2.9, w: 0.8, h: 0.4, fontSize: 9, color: SLATE_LIGHT, rotate: 270 });
  s.addText("persistence + push", { x: 12.4, y: 2.9, w: 0.8, h: 0.4, fontSize: 9, color: SLATE_LIGHT, rotate: 90 });
  s.addShape("line", { x: 6.42, y: 3.7, w: 0.6, h: 0, line: { color: SLATE_LIGHT, width: 1.5 } });
  s.addShape("line", { x: 12.5, y: 3.7, w: 0.6, h: 0, line: { color: SLATE_LIGHT, width: 1.5 } });
  footer(s, 4);
}

// ---------------------------------------------------------------- Tech stack
{
  const s = pptx.addSlide();
  slideHeader(s, "Technology Stack", "Mature, battle-tested libraries");
  const cols = [
    ["Frontend", ["React 19 + Vite", "TipTap (ProseMirror)", "Tailwind CSS v4", "Yjs + y-socket.io", "socket.io-client"]],
    ["Realtime", ["Yjs CRDT", "y-socket.io", "y-prosemirror", "CollaborationCarets", "Awareness protocol"]],
    ["Backend", ["Node.js + Express 5", "Socket.IO server", "Mongoose (MongoDB)", "JWT + bcryptjs", "helmet + rate-limit"]],
    ["DevOps", ["Render Blueprint", "Vite static build", "GitHub Actions (CI)", "Atlas Managed DB", "dotenv env modes"]],
  ];
  cols.forEach((col, i) => {
    const x = 0.7 + i * 3.1;
    s.addShape("roundRect", { x, y: 1.6, w: 2.85, h: 4.9, rectRadius: 0.08, fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 } });
    s.addText(col[0], { x: x + 0.2, y: 1.75, w: 2.45, h: 0.4, ...F(14, true, INDIGO) });
    col[1].forEach((it, j) => {
      s.addText("•  " + it, { x: x + 0.25, y: 2.35 + j * 0.62, w: 2.4, h: 0.55, ...F(10.5) });
    });
  });
  footer(s, 5);
}

// ---------------------------------------------------------------- CRDT
{
  const s = pptx.addSlide();
  slideHeader(s, "Core Innovation: CRDTs & Yjs", "Conflict-free replicated data types");
  s.addText("Operational Transform (OT) vs Conflict-Free Replicated Data Type (CRDT)", { x: 0.7, y: 1.55, w: 11.9, h: 0.4, ...F(13, true, SLATE) });

  const box2 = (x, title, color, bullets) => {
    s.addShape("roundRect", { x, y: 2.1, w: 5.9, h: 3.1, rectRadius: 0.08, fill: { color: WHITE }, line: { color, width: 1.2 } });
    s.addText(title, { x: x + 0.3, y: 2.25, w: 5.3, h: 0.4, ...F(14, true, color) });
    bullets.forEach((b, i) => {
      s.addText("•  " + b, { x: x + 0.3, y: 2.8 + i * 0.5, w: 5.4, h: 0.45, ...F(11.5) });
    });
  };
  box2(0.7, "OT — classic approach", SLATE_LIGHT, [
    "Central/transform logic, order-dependent",
    "Requires server reconciliation",
    "Complex conflict resolution",
    "Heavy concurrency failure modes",
  ]);
  box2(6.8, "CRDT — what SyncWrite uses", EMERALD, [
    "Every edit tagged with a unique ID + position",
    "Merges deterministically on every peer",
    "No central authority needed",
    "Yjs: compact binary format, proven at scale",
  ]);
  s.addText("Result: two users editing the same sentence converge to the same final document — automatically.", { x: 0.7, y: 5.5, w: 11.9, h: 0.5, ...F(13, true, INDIGO) });
  footer(s, 6);
}

// ---------------------------------------------------------------- Real-time flow
{
  const s = pptx.addSlide();
  slideHeader(s, "Real-Time Sync Flow", "From keystroke to every collaborator");
  const steps = [
    ["1", "User types in TipTap", "ProseMirror transaction + Yjs update"],
    ["2", "y-prosemirror encodes", "Update folded into the shared Y.Doc"],
    ["3", "y-socket.io sends", "Binary update over the doc room"],
    ["4", "Server authorizes + relays", "JWT verified per namespace connection"],
    ["5", "Peers apply & render", "Collaboration caret + presence update"],
  ];
  steps.forEach((step, i) => {
    const y = 1.7 + i * 0.98;
    s.addShape("roundRect", { x: 0.7, y, w: 11.9, h: 0.8, rectRadius: 0.1, fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 } });
    s.addShape("ellipse", { x: 0.95, y: y + 0.14, w: 0.52, h: 0.52, fill: { color: i === 4 ? EMERALD : INDIGO } });
    s.addText(step[0], { x: 0.95, y: y + 0.18, w: 0.52, h: 0.45, align: "center", ...F(16, true, WHITE) });
    s.addText(step[1], { x: 1.75, y: y + 0.1, w: 5.0, h: 0.4, ...F(13, true, SLATE) });
    s.addText(step[2], { x: 1.75, y: y + 0.44, w: 5.0, h: 0.3, ...F(10, false, SLATE_LIGHT) });
    s.addText(step[3], { x: 6.9, y: y + 0.15, w: 5.5, h: 0.55, align: "right", ...F(11.5, false, INDIGO) });
  });
  footer(s, 7);
}

// ---------------------------------------------------------------- Security
{
  const s = pptx.addSlide();
  slideHeader(s, "Security Model", "AuthN + AuthZ on every surface");
  s.addShape("roundRect", { x: 0.7, y: 1.6, w: 5.9, h: 4.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: INDIGO, width: 1.2 } });
  s.addText("Authentication", { x: 1.0, y: 1.75, w: 5.3, h: 0.4, ...F(15, true, INDIGO) });
  const auth = [
    "Email/password (bcrypt) + Google OAuth",
    "JWT access tokens (15 min)",
    "Refresh tokens in httpOnly cookies (7 d)",
    "Refresh tokens hashed at rest",
    "Rate limiting + account lockout",
  ];
  auth.forEach((a, i) => s.addText("•  " + a, { x: 1.0, y: 2.35 + i * 0.7, w: 5.3, h: 0.55, ...F(11.5) }));

  s.addShape("roundRect", { x: 6.9, y: 1.6, w: 5.7, h: 4.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: EMERALD, width: 1.2 } });
  s.addText("Authorization", { x: 7.2, y: 1.75, w: 5.1, h: 0.4, ...F(15, true, EMERALD) });
  const authz = [
    "Roles: Owner > Editor > Commenter > Viewer",
    "REST: requireDocumentPermission middleware",
    "WebSocket: JWT verified per namespace",
    "Room join denied if no role on document",
    "All routes behind helmet + CORS allow-list",
  ];
  authz.forEach((a, i) => s.addText("•  " + a, { x: 7.2, y: 2.35 + i * 0.7, w: 5.1, h: 0.55, ...F(11.5) }));
  footer(s, 8);
}

// ---------------------------------------------------------------- Data model
{
  const s = pptx.addSlide();
  slideHeader(s, "Data Model", "MongoDB collections");
  const coll = (x, name, color, fields) => {
    s.addShape("roundRect", { x, y: 1.7, w: 3.75, h: 4.6, rectRadius: 0.08, fill: { color: WHITE }, line: { color, width: 1.2 } });
    s.addText(name, { x: x + 0.25, y: 1.85, w: 3.25, h: 0.4, ...F(14, true, color) });
    fields.forEach((f, i) => s.addText("•  " + f, { x: x + 0.3, y: 2.45 + i * 0.6, w: 3.2, h: 0.5, ...F(11) }));
  };
  coll(0.7, "users", INDIGO, ["name, email, avatar", "profile, auth provider", "recentDocuments (cap 20)", "password hash"]);
  coll(4.65, "documents", INDIGO, ["owner (ref)", "collaborators[] + role", "content (HTML)", "isPublic + publicRole"]);
  coll(8.6, "versions", INDIGO, ["versionNumber", "content snapshot", "author, reason", "createdAt"]);
  coll(0.7, "comments", EMERALD, ["author, document", "parentComment (threads)", "resolved flag", "replies[]"]);
  coll(4.65, "notifications", EMERALD, ["recipient, actor", "type: share/comment", "document ref, read flag", "createdAt"]);
  coll(8.6, "session caches", AMBER, ["Y.Doc in memory", "version sessions", "presence state"]);
  footer(s, 9);
}

// ---------------------------------------------------------------- Versioning
{
  const s = pptx.addSlide();
  slideHeader(s, "Versioning Strategy", "Separating auto-save from history");
  s.addShape("roundRect", { x: 0.7, y: 1.6, w: 5.9, h: 4.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: AMBER, width: 1.2 } });
  s.addText("Auto-save (every ~2s)", { x: 1.0, y: 1.75, w: 5.3, h: 0.4, ...F(15, true, AMBER) });
  [
    "Updates the live Document only",
    "Never creates a history entry",
    "Content survives refresh",
    "In-memory session tracks deltas",
  ].forEach((a, i) => s.addText("•  " + a, { x: 1.0, y: 2.35 + i * 0.7, w: 5.3, h: 0.55, ...F(11.5) }));

  s.addShape("roundRect", { x: 6.9, y: 1.6, w: 5.7, h: 4.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: INDIGO, width: 1.2 } });
  s.addText("Versions (meaningful milestones)", { x: 7.2, y: 1.75, w: 5.1, h: 0.4, ...F(15, true, INDIGO) });
  [
    "Created on manual save / document close",
    "Thresholds: ≥10% change or ≥150 chars",
    "Author + reason recorded",
    "One-click restore creates a new version",
  ].forEach((a, i) => s.addText("•  " + a, { x: 7.2, y: 2.35 + i * 0.7, w: 5.1, h: 0.55, ...F(11.5) }));
  footer(s, 10);
}

// ---------------------------------------------------------------- Features
{
  const s = pptx.addSlide();
  slideHeader(s, "Collaboration Features", "What makes it feel alive");
  const feats = [
    ["Live cursors", "Colored carets with name labels at each collaborator's selection"],
    ["Typing indicators", "Animated dots + “X is typing” via the Yjs awareness channel"],
    ["Presence panel", "Online avatars, overflow count, live status dots"],
    ["Comments", "Threaded replies, resolve/unresolve, role-gated"],
    ["Notifications", "Bell + badge; real-time push for shares, comments, replies"],
    ["Find & shortcuts", "In-doc find (Ctrl+F), full shortcut palette, export/import"],
  ];
  feats.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * 6.1;
    const y = 1.6 + row * 1.55;
    s.addShape("roundRect", { x, y, w: 5.9, h: 1.35, rectRadius: 0.08, fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 } });
    s.addShape("rect", { x, y, w: 0.12, h: 1.35, fill: { color: INDIGO } });
    s.addText(f[0], { x: x + 0.35, y: y + 0.1, w: 5.3, h: 0.4, ...F(14, true, INDIGO_DARK) });
    s.addText(f[1], { x: x + 0.35, y: y + 0.55, w: 5.3, h: 0.7, ...F(11) });
  });
  footer(s, 11);
}

// ---------------------------------------------------------------- Deployment
{
  const s = pptx.addSlide();
  slideHeader(s, "Deployment & Scaling", "Render Blueprint, zero-touch");
  const steps = [
    ["Blueprint", "render.yaml provisions API + static UI automatically"],
    ["API service", "Express + Socket.IO Web Service, health check /api/health"],
    ["UI service", "Vite static build → dist, SPA rewrite to index.html"],
    ["Environment", "Mongo URI, JWT secrets, CLIENT_URL, Google OAuth IDs"],
    ["Atlas", "Network access allow-list; single shared cluster"],
    ["WebSockets", "Supported natively on Render Web Services"],
  ];
  steps.forEach((st, i) => {
    const y = 1.65 + i * 0.82;
    s.addShape("ellipse", { x: 0.9, y: y + 0.08, w: 0.5, h: 0.5, fill: { color: INDIGO } });
    s.addText(String(i + 1), { x: 0.9, y: y + 0.12, w: 0.5, h: 0.42, align: "center", ...F(14, true, WHITE) });
    s.addText(st[0], { x: 1.6, y: y, w: 3.2, h: 0.6, ...F(13, true, SLATE) });
    s.addText(st[1], { x: 4.9, y: y, w: 7.7, h: 0.6, ...F(11.5, false, SLATE) });
  });
  s.addText("Caveat: free-tier instances sleep → keep single instance for the in-memory Y.Doc/version sessions; add a persistence adapter before horizontal scaling.", { x: 0.7, y: 6.6, w: 11.9, h: 0.4, ...F(10.5, true, AMBER) });
  footer(s, 12);
}

// ---------------------------------------------------------------- Challenges
{
  const s = pptx.addSlide();
  slideHeader(s, "Challenges & Trade-offs", "Engineering decisions we made");
  const rows = [
    ["In-memory realtime state", "Y.Doc lives in memory per instance", "Keep single instance; add y-leveldb/y-mongodb for restarts"],
    ["WebSocket auth complexity", "Auth must run before any sync data", "Namespace middleware + document role lookup"],
    ["OT vs CRDT", "Ordering vs convergence trade-off", "Chose Yjs CRDT — simpler and robust under latency"],
    ["Version spam", "Auto-save creating history noise", "Milestone-only versions + thresholds"],
    ["Notification delivery", "Socket drops on sleep/offline", "Real-time push + 30s polling fallback"],
    ["Email delivery", "No SMTP provider", "Dev-mode token return; plug SMTP later"],
  ];
  rows.forEach((r, i) => {
    const y = 1.55 + i * 0.85;
    s.addShape("roundRect", { x: 0.7, y, w: 11.9, h: 0.72, rectRadius: 0.08, fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 } });
    s.addText(r[0], { x: 0.95, y: y + 0.12, w: 3.1, h: 0.5, ...F(11.5, true, INDIGO) });
    s.addText(r[1], { x: 4.15, y: y + 0.12, w: 4.4, h: 0.5, ...F(10.5) });
    s.addText(r[2], { x: 8.65, y: y + 0.12, w: 3.8, h: 0.5, ...F(10.5, false, EMERALD) });
  });
  s.addText("Challenge", { x: 0.7, y: 1.35, w: 3.1, h: 0.3, ...F(10, true, SLATE_LIGHT) });
  s.addText("Detail", { x: 4.15, y: 1.35, w: 4.4, h: 0.3, ...F(10, true, SLATE_LIGHT) });
  s.addText("Resolution", { x: 8.65, y: 1.35, w: 3.8, h: 0.3, ...F(10, true, SLATE_LIGHT) });
  footer(s, 13);
}

// ---------------------------------------------------------------- Roadmap + Demo
{
  const s = pptx.addSlide();
  slideHeader(s, "Roadmap & Wrap-up", "What's next");
  s.addShape("roundRect", { x: 0.7, y: 1.6, w: 5.9, h: 4.5, rectRadius: 0.08, fill: { color: WHITE }, line: { color: INDIGO, width: 1.2 } });
  s.addText("Roadmap", { x: 1.0, y: 1.75, w: 5.3, h: 0.4, ...F(15, true, INDIGO) });
  [
    "Mentions & @notifications",
    "Persistent Yjs storage adapter",
    "Offline editing + sync on reconnect",
    "End-to-end encryption (Yjs E2EE)",
    "Webhook + Slack integrations",
    "Analytics / heatmaps",
  ].forEach((a, i) => s.addText("•  " + a, { x: 1.0, y: 2.35 + i * 0.6, w: 5.3, h: 0.5, ...F(11.5) }));

  s.addShape("roundRect", { x: 6.9, y: 1.6, w: 5.7, h: 4.5, rectRadius: 0.08, fill: { color: INDIGO_DARK } });
  s.addText("Live Demo", { x: 7.2, y: 2.0, w: 5.1, h: 0.6, align: "center", ...F(22, true, WHITE) });
  s.addText("Two editors, one document — watch cursors,\ntyping indicators, comments, and notifications\nalready synced in real time.", { x: 7.2, y: 3.0, w: 5.1, h: 1.8, align: "center", ...F(13, false, "C7D2FE") });
  s.addText("Thanks! Questions welcome.", { x: 7.2, y: 5.2, w: 5.1, h: 0.5, align: "center", ...F(14, true, WHITE) });
  footer(s, 14);
}

pptx.writeFile({ fileName: "SyncWrite_Technical_Presentation.pptx" })
  .then((f) => console.log("PPT written:", f))
  .catch((err) => { console.error(err); process.exit(1); });
