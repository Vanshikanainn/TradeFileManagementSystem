# File Load Management System (Angular Frontend)

## Document Purpose

This document explains the project in a **simple but complete** way so that a technical lead, reviewer, or new team member can quickly understand:
- what the system does,
- how it works today (without backend),
- what is simulated,
- and how it will work after backend integration.

---

## 1) Project Overview and Business Purpose

The **File Load Management System** is a web application used to upload and track trade files.

In real business teams, users upload files every day and need clear answers to questions like:
- Did the file upload successfully?
- Is processing still running?
- Did processing fail?
- How many records were in the file?
- Can I search old files quickly?

This system solves that operational problem by giving a single UI for file upload, tracking, and file-level actions.

### Current status of this project
- The frontend is built and functional in Angular.
- Backend (Spring Boot), database, and batch processing are not implemented yet.
- The app uses **mock API simulation** to mimic real backend behavior.

So this project is a **frontend-complete prototype** and **backend-ready foundation**.

---

## 2) Scope of This Frontend

## What is already implemented
- Register page
- Login page
- Dashboard/landing flow
- Protected routes using auth guard
- File upload UI with validation and upload progress
- File list table with sorting and pagination
- Search/filter section
- File details page
- Status update dialog
- Delete and download actions
- Mock API with simulated asynchronous behavior

## What is intentionally not implemented yet
- Real database persistence
- Real file storage service
- Real JWT issuance/verification
- Real Spring Batch job execution
- Real server-side authorization roles

---

## 3) Overall System Architecture (Target vs Current)

## Target architecture (final production design)

`Angular Frontend -> REST API -> Spring Boot Backend -> Database -> Batch Engine`

### Layer responsibilities
- **Angular Frontend**
  - Forms, screens, interactions, validations, state display.

- **REST API Layer**
  - Stable HTTP contracts for auth and file operations.

- **Spring Boot Backend**
  - Business rules, security, orchestration, workflow decisions.

- **Database**
  - Persistent storage for users, file metadata, statuses, errors, and history.

- **Batch Processing (Spring Batch)**
  - Reads uploaded file data, validates rows, computes record counts, updates statuses.

## Current architecture (today)

Only Angular exists physically.

Backend/database behavior is simulated using:
- `MockApiInterceptor`
- localStorage-based mock database
- RxJS delays and observable flows

This lets the team test full user journeys before backend is available.

---

## 4) Angular Frontend Architecture (Folder-by-Folder)

### `src/app/components/`
Contains UI screens and UI dialogs.

Main components in this project:
- `dashboard` - landing page
- `register` - account creation
- `login` - authentication entry
- `file-upload` - upload workflow
- `file-list` - table view of files
- `file-search` - filter form used by list
- `file-details` - detailed view of one file
- `status-update` - popup/dialog to update status
- `navbar` and `footer` - layout framing

### `src/app/services/`
Contains reusable logic for API-style communication.

- `AuthService`
  - register/login/logout
  - local token/user handling
  - authentication checks

- `FileLoadService`
  - list files
  - file details
  - upload
  - update metadata
  - update status
  - delete
  - download

- `MockApiInterceptor`
  - catches HTTP calls and returns simulated responses

### `src/app/models/`
Defines data shape contracts:
- `User`
- `FileItem`
- `SearchCriteria`
- `PagedResult<T>`

### `src/app/guards/`
- `AuthGuard` protects private routes (`/files`, `/upload`, `/files/:id`).

### Routing
`app-routing.module.ts` defines:
- public routes: `/`, `/login`, `/register`
- protected routes: `/files`, `/upload`, `/files/:id`

### Environment config
`environment.ts` currently has:
- `apiBaseUrl: '/api'`
- `mockApi: true`

This is the switch that enables simulation mode.

---

## 5) End-to-End User Flow (Simple Step-by-Step)

## Main user journey
1. User opens app.
2. User registers account.
3. User logs in.
4. User uploads one or more files.
5. Uploaded file appears in list with status `PENDING`.
6. Status evolves over time (`PROCESSING`, then `SUCCESS` or `FAILED`) in mock logic.
7. User filters/searches files as needed.
8. User opens details page for one file.
9. User may update status manually (via popup) if needed.
10. User can download or delete file.
11. User logs out.

## What the user experiences
- Immediate visual feedback via snackbar messages.
- Upload progress bars.
- Auto-refreshing list every 10 seconds.
- Structured table with paging and sorting.

---

## 6) Authentication Flow (Register/Login/Guard)

### Register flow
- User enters name, email, password.
- Frontend submits to `/api/auth/register`.
- In mock mode, interceptor creates user in localStorage mock DB.
- User is returned with mock token.

### Login flow
- User enters email and password.
- Frontend submits to `/api/auth/login`.
- Mock interceptor validates against mock user list.
- On success, user + token returned.

### Token storage
- Frontend stores authenticated user in localStorage (`fl_user` key via `AuthService`).
- `AuthService.getToken()` provides token for API headers.

### Route protection
- `AuthGuard` checks `isAuthenticated()`.
- If token missing, route redirects to `/login`.

## Current (Mock) behavior
- Token is simulated.
- Validation is local mock validation.
- Good for UI flow verification.

## Future (Backend) behavior
- Spring Boot validates credentials securely.
- JWT is signed and validated server-side.
- Expiry, refresh, revocation policies can be added.

---

## 7) File Upload Flow (UI + API Simulation)

### User actions
- User drags file(s) into dropzone or clicks browse.
- Optional description and tags can be provided.

### Frontend validation
Before upload, UI checks:
- extension (csv/txt/xml/xls/xlsx)
- mime type (where available)
- max file size (10 MB)

Invalid files are rejected with snackbar errors.

### Upload transport
- Frontend constructs `FormData`.
- Adds `file`, optional `description`, optional `tags`.
- Sends POST request to `/api/file-loads`.
- Tracks `UploadProgress` events for progress bar.

### UI result
- Queue item moves state: `queued -> uploading -> done/error`.
- Success/failure message is shown.

## Current (Mock) behavior
- Interceptor reads form data.
- Creates mock file metadata record.
- Adds it into mock DB.
- Returns created file as if server accepted upload.

## Future (Backend) behavior
- Backend stores file physically.
- Backend writes metadata in DB.
- Backend starts asynchronous processing job.

---

## 8) File Status Lifecycle

Target business lifecycle:

`PENDING -> PROCESSING -> SUCCESS / FAILED`

In current code, `COMPLETED` is also accepted in mock status list for compatibility.

### What status means
- `PENDING`: Upload accepted, waiting for processing.
- `PROCESSING`: Job is currently running.
- `SUCCESS`: Processing finished without critical errors.
- `FAILED`: Processing finished with error.

### UI representation
- Status badges are styled by status class mapping.
- Table refresh every 10 seconds shows progression.

## Current (Mock) behavior
- Interceptor has time-based status evolution.
- Based on file age, status transitions automatically.
- Some filename patterns can force `FAILED` simulation.

## Future (Backend) behavior
- Batch job updates status from real processing events.
- Status timeline is persisted and auditable.

---

## 9) Where Data Is Stored Today (No Backend)

### Important truth
There is no server-side storage yet.

### Current storage model
- Mock DB is saved in browser localStorage (`fl_mock_db`).
- It contains:
  - users array
  - files array
  - ID counters

### Implications
- Data survives page refresh on same browser.
- Data can be wiped if localStorage is cleared.
- Multi-user real-world persistence is not provided.

## Future storage model
- Binary files in backend storage.
- Metadata in relational database.
- Persistent, shared, secure, and queryable records.

---

## 10) Record Count Behavior

### Why record count matters
Reviewers want to know if the displayed count is real, estimated, or mocked.

### Current (Mock) logic
- For `.csv`/`.txt`/`.xml`, mock code attempts text reading and row counting.
- CSV parsing includes basic header detection before counting rows.
- For non-text files (binary Excel), fallback/simulated values can appear.

So in current mode, record count is **simulation-friendly**, not production-authoritative.

### Future (Backend) logic
- Spring Batch parses real files with robust format handling.
- Record count computed in backend and persisted.
- Frontend simply displays backend source-of-truth.

---

## 11) File List, Search, Filter, Sort, Pagination

### File list page capabilities
- Table columns include ID, filename, upload date, status, record count, actions.
- Actions include view details, download, delete, status update dialog.

### Search filters currently supported
- file ID
- filename
- status
- start date
- end date
- record count min
- record count max

### Sorting and pagination
- Sort field + direction sent as query (`field,direction`).
- Pagination uses `page` and `size`.
- Backend-style response shape (`items`, `total`, `page`, `pageSize`) is supported.

## Current (Mock) behavior
- Interceptor filters and sorts local array.
- Returns paged result as API response.

## Future (Backend) behavior
- Database query does filtering/sorting/pagination.
- Same frontend UI flow remains.

---

## 12) File Details Page

When user opens `/files/:id`:
- frontend fetches specific file details,
- shows metadata (name/type/size/status/upload date/record count/errors),
- allows metadata updates (description/tags),
- provides status update, download, delete actions.

## Current (Mock) behavior
- details request reads from mock DB by ID.
- patch/update modifies mock data.

## Future (Backend) behavior
- details loaded from database.
- metadata updates validated and persisted server-side.

---

## 13) Status Update Popup (Dialog)

### Functional flow
1. User clicks status action.
2. Dialog opens with current status preselected.
3. User selects new status and optional comment.
4. Submit triggers PUT `/api/file-loads/{id}/status`.
5. On success, snackbar appears and data refreshes.

## Current (Mock) behavior
- Interceptor validates status against allowed status list.
- Updates mock record immediately.

## Future (Backend) behavior
- Backend enforces transition rules.
- Role-based permissions (admin-only actions) can be applied.
- All transitions can be audited.

---

## 14) Polling and Real-Time Feel

To provide near real-time status visibility:
- `file-list` starts timer with 10-second interval.
- every cycle triggers fetch call.
- UI table updates automatically.

### Why this matters
Even without websocket infrastructure, users still get fresh status updates.

## Current (Mock) behavior
- Polling calls mocked list endpoint.
- Mock status evolution appears naturally over time.

## Future (Backend) behavior
- Polling reads real backend status updates.
- Can later be replaced/enhanced with websocket/events if needed.

---

## 15) Mock API Simulation Details

### Simulation mechanisms used
- HTTP interception (`MockApiInterceptor`)
- localStorage persistence for mock DB
- delayed responses for realism
- observable-based async handling

### Mock endpoints currently simulated
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/file-loads`
- `POST /api/file-loads`
- `GET /api/file-loads/{id}`
- `PATCH /api/file-loads/{id}`
- `PUT /api/file-loads/{id}/status`
- `DELETE /api/file-loads/{id}`
- `GET /api/file-loads/{id}/download`

### Why this approach is strong
- UI and integration contracts are developed early.
- Team can demo complete business flow without backend blockers.
- Migration risk is reduced later.

---

## 16) Security Position (Current vs Future)

## Current (Mock) state
- Basic auth flow and guarded routes exist.
- Token handling pattern exists.
- But this is demo-level, not production-level security.

## Future production security
- Secure password hashing and storage.
- Signed JWT with expiry and refresh strategy.
- Role-based authorization.
- Endpoint-level access control.
- Audit logs and security monitoring.

This project currently demonstrates security flow structure, not final hardening.

---

## 17) Error Handling and User Feedback

### Current UX handling
- API errors show snackbar messages.
- Upload errors are shown per file queue item.
- List/load/details operations handle failures gracefully.

### Typical messages
- Upload successful/failed
- Login failed
- Failed to load files
- Status updated / update failed
- Delete failed

This provides clear operational feedback to user.

---

## 18) Technology Stack and Why It Is Used

- **Angular**
  - component-driven frontend architecture
  - routing and module ecosystem

- **TypeScript**
  - type safety for models and service contracts

- **Angular Material**
  - enterprise-ready UI components (table, dialog, snackbar, form controls)

- **RxJS**
  - async streams for HTTP calls, polling, upload progress

- **Route Guards**
  - route-level access control

- **HTTP Interceptor**
  - central point for mock API behavior and future request policies

- **Service layer pattern**
  - separates UI and API logic, improves maintainability

---

## 19) Important Design Concepts Used

### Separation of concerns
UI components focus on display + user interaction.
Services focus on data calls and business operation orchestration.

### Component-based architecture
Each page/feature is isolated and reusable.

### Service-based API communication
All data operations go through services, keeping components clean.

### State and flow predictability
- typed models
- explicit criteria objects
- deterministic refresh/polling behavior

### Backend readiness
Because API-style calls already exist, switching to real backend is mostly configuration + contract alignment.

---

## 20) What Changes When Backend Is Ready

### Backend adds
- real user management
- real file persistence
- real DB records
- real batch jobs
- real status history
- real record counting

### Frontend changes expected
- set `mockApi` to false
- set real backend base URL
- keep existing pages and flows
- adjust minor response mappings if required

So the frontend is already structurally prepared for integration.

---

## 21) Known Limitations in Current Mock Version

- Data is browser-local, not shared globally.
- Mock token is not production-secure JWT lifecycle.
- Record count for binary formats may be simulated/fallback.
- No real archive endpoint in current active flow.
- No true backend audit trail yet.

These are expected at this phase and do not block frontend design validation.

---

## 22) Reviewer Quick Checklist

A technical lead can verify:
- [ ] Auth screens and guard behavior
- [ ] Upload validation and progress UX
- [ ] File list polling and status updates
- [ ] Search/filter/sort/pagination flows
- [ ] Details and metadata update flow
- [ ] Status dialog update behavior
- [ ] Delete and download actions
- [ ] Mock API consistency with service contracts
- [ ] Backend integration readiness

---

## 23) Final Conclusion

This project is a **well-structured Angular frontend for File Load Management** that already demonstrates real enterprise workflow behavior, even without backend/database.

It provides:
- complete user journey,
- clean architecture,
- mock-based API simulation,
- and clear migration path to Spring Boot + database + batch processing.

In practical terms: the frontend is not a static demo page; it is a **ready application layer** waiting for real backend services.

