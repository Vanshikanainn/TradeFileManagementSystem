DEV NOTES — Deep study guide and 10-page reference

Date: 2026-03-15
Purpose: Extended developer notes intended for you to study and present. This file expands the brief DEV_NOTES into a multi-section reference: code walkthrough, architecture, API contract, backend-integration guide, debugging tips, demo script and next steps. Use this when explaining the project or onboarding another developer.

TABLE OF CONTENTS
1. Quick start and run commands
2. Project overview and goals
3. File-by-file walkthrough (frontend)
4. Data models and normalization
5. UI flows: upload, list, details, status changes, download
6. Services and HTTP contract (detailed endpoints and example payloads)
7. Mocking and switching to real backend
8. Backend integration guide (step-by-step, Node + Express + TypeScript example)
9. Testing, debug, and troubleshooting
10. Demo script, talking points, and Q&A

---
1) Quick start and run commands
- Install dependencies: npm install
- Dev server (Angular): npm start (runs ng serve --no-open)
- Dev server (Angular with open): npm run start:open
- Build production bundle: npm run build
- Where to change API base URL: src/environments/environment.ts -> apiBaseUrl

2) Project overview and goals
Goal: File-management UI that supports upload, metadata, status updates, search and download. Architecture intentionally separates UI and backend contract using a single service (FileLoadService) that normalizes responses so frontend is resilient to backend shape changes.
What exists today:
- Angular single-page app in src/
- Components that implement each UI piece
- Services that call the backend contract (currently can be mocked)
- Models that define the shape used by UI

3) File-by-file walkthrough (frontend)
Open these files when presenting:
- src/index.html & src/main.ts — app bootstrap
- src/environments/environment.ts — API base URL, feature flags, toggles
- src/app/app.module.ts — module imports, providers (shows mock interceptor registration)
- src/app/app-routing.module.ts — route definitions and auth guard usage

Components (what to show and lines to reference):
- src/app/components/dashboard/
  - dashboard.component.ts/html — entry view, summary cards, shortcuts
- src/app/components/file-upload/
  - file-upload.component.ts/html — file selection, validation, submit logic
  - Key lines: building FormData and calling FileLoadService.upload
- src/app/components/file-list/
  - file-list.component.ts/html — table/list rendering, pagination, selection
  - Shows how search criteria map to HTTP params
- src/app/components/file-details/
  - file-details.component.ts/html — display metadata, versioning, checksum, errors
- src/app/components/status-update/
  - status-update.component.ts/html — status transition UI and comments flow
- src/app/components/login/ & register/
  - authentication UI (uses AuthService to store token)

Services and models (what to open and why):
- src/app/services/file-load.service.ts
  - Central API adapter. Open to explain normalizeFile(item) and why the service returns unified FileItem objects.
  - Methods: list(criteria), details(id), upload(file), download(id), updateMetadata(id, body), updateStatus(id, status, comment), delete(id)
- src/app/services/auth.service.ts
  - Token storage (localStorage/sessionStorage), getToken(), setToken(), logout
- src/app/services/mock-api.interceptor.ts
  - Intercepts HTTP requests and returns fake responses for development without backend

Models:
- src/app/models/file-load.model.ts — FileItem interface and PagedResult<T>
- src/app/models/search-criteria.model.ts — filters supported by list endpoints
- src/app/models/user.model.ts — user metadata used by UI

4) Data models and normalization
Why normalize: Backends differ in field names (filename vs name, fileSize vs size). normalizeFile(item) maps any of these to a single FileItem used by UI. This keeps UI components simple.
Key fields in FileItem:
- id: unique identifier
- name / filename
- size / fileSize
- mimeType / fileType
- uploadedBy
- uploadedAt / uploadDate
- status (PENDING, PROCESSING, COMPLETED, FAILED)
- recordCount, errors, description, tags, checksum, version

Storage of metadata vs file bytes:
- Metadata must be stored in DB (relational recommended).
- File bytes should be stored in object storage (S3/MinIO) or on local disk in dev.
- The API should return metadata and a presigned URL or stream endpoint for downloading bytes.

5) UI flows (detailed)
Upload:
- User chooses file(s) and optional metadata (description, tags)
- file-upload component validates type/size then builds FormData:
  form.append('file', file)
  form.append('description', ...)
  form.append('tags', ...)
- Calls FileLoadService.upload(file, extra) which creates HttpRequest with reportProgress: true
- UI subscribes to HttpEvent to render progress percentage and final response (metadata)

List & search:
- FileList reads SearchCriteria from user inputs and calls FileLoadService.list(criteria)
- Service converts criteria object into HttpParams and calls GET /file-loads
- Response normalized to PagedResult<FileItem> used by table/pagination

Details:
- Clicking an item calls FileLoadService.details(id) -> opens file-details view
- file-details displays all metadata, errors, checksum, version history (if backend supports)

Status update:
- Status changes use PUT /file-loads/:id/status with {status, comment}
- UI updates optimistically or on success re-fetches details

Download:
- FileLoadService.download(id) makes GET /file-loads/:id/download with responseType blob
- UI receives Blob and creates an object URL to trigger file save

6) Services and HTTP contract — exact expectations
This section should be used when implementing backend to match frontend.

Endpoint: GET /file-loads
- Query params: page, size, sort, q, owner, status
- Response example:
{
  "items": [{ "id":"1","filename":"foo.csv","fileSize":1024, ... }],
  "total": 123,
  "page": 0,
  "pageSize": 10
}

Endpoint: GET /file-loads/:id
- Response: single file metadata (fields above)

Endpoint: POST /file-loads
- Accept: multipart/form-data
- Fields: file (binary), description (string), tags (multiple)
- Response: saved metadata (id, filename, fileSize, uploadDate, uploadedBy, status)

Endpoint: PUT /file-loads/:id/status
- Body: { status: 'APPROVED'|'REJECTED'|'PROCESSING'|'PENDING', comment?: string }
- Response: updated metadata

Endpoint: PATCH /file-loads/:id
- Body: partial metadata (description, tags, etc.)
- Response: updated metadata

Endpoint: DELETE /file-loads/:id
- Response: 204 No Content

Endpoint: GET /file-loads/:id/download
- Response: file bytes (application/octet-stream). If using S3, backend can redirect or return a presigned URL.

Auth endpoints (used by AuthService):
- POST /api/auth/login  { email, password } -> { token, user }
- POST /api/auth/register -> create user

Headers:
- Authorization: Bearer <token> (FileLoadService.authHeaders sets this)

Error shape (recommended):
{
  "status": 400,
  "message": "Validation failed",
  "errors": { "field": "reason" }
}

7) Mocking and switching to real backend
Where mocking happens:
- src/app/services/mock-api.interceptor.ts intercepts HTTP requests and returns mocked data for endpoints used by UI. When demoing without backend, this allows full UI flow.

Switching to backend:
- Remove or disable the mock interceptor provider in app.module.ts (comment out provider registration).
- Set environment.apiBaseUrl to real backend base (e.g., http://localhost:3000/api or http://localhost:3000)
- If using ng serve, add proxy.conf.json with:
{
  "/api": { "target": "http://localhost:3000", "secure": false, "changeOrigin": true }
}
- Start backend and frontend. The proxy will map /api routes to backend eliminating CORS headaches.

8) Backend integration guide — step-by-step (Node + Express + TypeScript)
This is a practical, minimal server plan to implement the contract.

Folder skeleton (create backend/ at repo root):
backend/
  package.json
  tsconfig.json
  .env
  src/
    index.ts
    app.ts
    routes/
      fileRoutes.ts
      authRoutes.ts
    controllers/
      fileController.ts
    services/
      storageService.ts
      fileService.ts
    models/
      file.model.ts (Prisma schema or TypeORM entity or Sequelize model)
    middleware/
      auth.ts
      errorHandler.ts

package.json scripts (example):
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}

Essential implementation details
- index.ts: load env, connect DB, start HTTP server on PORT
- app.ts: instantiate Express, use bodyParser, cors (allow origin for dev), helmet, setup routes, global error handler

Implementing file upload
- Use multer for multipart handling (streamed to disk or buffer)
- storageService abstracts local disk vs S3. On upload:
  1. Store file bytes to storage and get path/URL
  2. Persist metadata to DB (id, filename, size, mimeType, storagePath, ownerId, uploadDate, status)
  3. Return metadata JSON

Sample fileService.create(file, meta):
- validate file size and mime type
- compute checksum if required (sha256)
- call storageService.save(file) -> returns storagePath
- insert record in DB and return saved object

Download implementation
- Option A: stream bytes from storage to client with proper headers
- Option B: generate presigned URL (S3) and return URL to client

Example Express route (upload)
router.post('/file-loads', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { description, tags } = req.body;
    const file = req.file; // multer
    const saved = await fileService.create(file, { description, tags, ownerId: req.user.id });
    res.status(201).json(saved);
  } catch (err) { next(err); }
});

Database schema (example SQL for Postgres)
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT,
  tags TEXT[],
  description TEXT,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

Auth and security
- Protect POST/PUT/DELETE endpoints with auth middleware verifying JWT
- Limit allowed content types and max file size
- Sanitize filenames before writing to disk
- Run virus-scan pipeline for production (optional)

9) Testing, debug and troubleshooting
Frontend tests:
- Unit tests for services: mock HttpClient to simulate responses. Test that FileLoadService.normalizeFile handles different shapes.
- Component tests: shallow tests with TestBed and provide mock service or HttpTestingController.

Backend tests:
- Unit tests for services and controllers using Jest and Supertest
- Integration tests using Testcontainers or local test database. Seed DB and run full upload/download flow.

Common issues and fixes
- CORS: Use proxy.conf.json during development or configure CORS middleware on backend
- Large uploads crash: use streaming, increase body parser limits, use S3 direct upload for very large files
- File not found after container restart: ensure volume mounts for storage in docker-compose

10) Demo script, talking points, and Q&A
10-minute demo script
- 0:00 — 0:30: Project purpose & quick architecture overview (UI + expected backend)
- 0:30 — 2:00: Open dashboard, show file list and search
- 2:00 — 4:00: Upload a file (show progress) and show the created item in list
- 4:00 — 5:30: Click item -> details -> show metadata and download
- 5:30 — 7:00: Update status and show optimistic UI / refresh
- 7:00 — 8:30: Explain where backend will be integrated (point to FileLoadService contract) and how mock API is used now
- 8:30 — 10:00: Q&A, next steps

Talking points to memorize (one-liners)
- "FileLoadService is the client-side contract: change backend, keep UI stable."
- "normalizeFile centralizes mapping of server shapes to UI model."
- "Mock interceptor lets UI be developed/tested without backend."
- "Backend should store metadata in a DB and bytes in object storage; return metadata and a download endpoint/presigned URL."

Appendix A — Example curl requests
Upload:
curl -X POST "http://localhost:3000/file-loads" -H "Authorization: Bearer <token>" -F "file=@./path/to/file.csv" -F "description=Test"

List:
curl "http://localhost:3000/file-loads?page=0&size=10"

Download:
curl -L -X GET "http://localhost:3000/file-loads/<id>/download" -H "Authorization: Bearer <token>" --output myfile.csv

Appendix B — Quick checklist before demo
- Ensure mock interceptor is enabled if backend not started
- Ensure environment.apiBaseUrl points to correct URL (or proxy configured)
- If backend present: run backend (npm run dev) and frontend (npm start)
- Confirm token in AuthService (or login) for protected endpoints

Final notes
- Keep this file updated with any backend changes (field names, new endpoints)
- If replacing mock interceptor, update unit tests to use HttpTestingController or backend test server

---
If this looks good, save and use DEV_NOTES.md when rehearsing. The file now contains an expanded learning guide and an in-depth backend integration section tailored for Node + Express + TypeScript. 