import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError, from } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FileItem } from '../models/file-load.model';

type User = { id: string; name: string; email: string; password: string; token?: string };

interface MockDb {
  users: User[];
  files: FileItem[];
  lastIds: { user: number; file: number };
}

const DB_KEY = 'fl_mock_db';
const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'SUCCESS', 'FAILED'];

function loadDb(): MockDb {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as MockDb;
    } catch {}
  }

  const seed: MockDb = {
    users: [{ id: 'u_1', name: 'Demo User', email: 'demo@example.com', password: 'password', token: 'mock-token-u_1' }],
    files: [
      {
        id: '1001',
        name: 'trade-load-q1.csv',
        filename: 'trade-load-q1.csv',
        size: 124567,
        fileSize: 124567,
        mimeType: 'text/csv',
        fileType: 'text/csv',
        uploadedBy: 'Demo User',
        uploadedAt: new Date().toISOString(),
        uploadDate: new Date().toISOString(),
        status: 'SUCCESS',
        recordCount: 2580,
        errors: '',
        description: 'Quarterly trade feed',
        tags: ['trade', 'Q1'],
        version: 1,
        checksum: 'abc123xyz'
      },
      {
        id: '1002',
        name: 'positions-march.xlsx',
        filename: 'positions-march.xlsx',
        size: 34567,
        fileSize: 34567,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: 'Demo User',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        uploadDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'PENDING',
        recordCount: 420,
        errors: '',
        description: 'Pending import batch',
        tags: ['positions', 'march'],
        version: 1,
        checksum: 'def456uvw'
      },
      {
        id: '1003',
        name: 'failed-trade-file.txt',
        filename: 'failed-trade-file.txt',
        size: 19876,
        fileSize: 19876,
        mimeType: 'text/plain',
        fileType: 'text/plain',
        uploadedBy: 'Demo User',
        uploadedAt: new Date(Date.now() - 172800000).toISOString(),
        uploadDate: new Date(Date.now() - 172800000).toISOString(),
        status: 'FAILED',
        recordCount: 0,
        errors: 'Invalid delimiter in line 24',
        description: 'Rejected batch file',
        tags: ['failed', 'trade'],
        version: 1,
        checksum: 'ghi789rst'
      }
    ],
    lastIds: { user: 1, file: 1003 }
  };

  saveDb(seed);
  return seed;
}

function saveDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ok<T>(body: T, ms = 250) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
}

function created<T>(body: T, ms = 250) {
  return of(new HttpResponse({ status: 201, body })).pipe(delay(ms));
}

function err(status: number, message: string, ms = 250) {
  return throwError(() => ({ status, error: { message } })).pipe(delay(ms));
}

function splitCsvCells(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    const next = i + 1 < row.length ? row[i + 1] : '';

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function looksLikeHeader(firstRow: string, secondRow: string): boolean {
  const first = splitCsvCells(firstRow);
  const second = splitCsvCells(secondRow);
  if (!first.length || first.length !== second.length) return false;

  const isNumber = (v: string) => /^[-+]?\d+(\.\d+)?$/.test(v);
  let textThenNumberPattern = 0;

  for (let i = 0; i < first.length; i++) {
    const a = first[i];
    const b = second[i];
    if (!a) continue;
    if (!isNumber(a) && isNumber(b)) textThenNumberPattern++;
  }

  return textThenNumberPattern >= Math.max(1, Math.floor(first.length / 2));
}

function parseCsvDataRowCount(content: string): number {
  let inQuotes = false;
  let currentRow = '';
  const rows: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = i + 1 < content.length ? content[i + 1] : '';

    if (ch === '"') {
      if (inQuotes && next === '"') {
        currentRow += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentRow += ch;
      }
      continue;
    }

    if (ch === '\r') continue;

    if (ch === '\n' && !inQuotes) {
      if (currentRow.trim().length > 0) rows.push(currentRow);
      currentRow = '';
      continue;
    }

    currentRow += ch;
  }

  if (currentRow.trim().length > 0) rows.push(currentRow);
  if (rows.length === 0) return 0;

  const hasHeader = rows.length > 1 && looksLikeHeader(rows[0], rows[1]);
  return hasHeader ? rows.length - 1 : rows.length;
}

function parseRecordCountFromText(file: File, content: string): number {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.csv')) {
    return parseCsvDataRowCount(content);
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return 0;

  if (lower.endsWith('.txt')) {
    return Math.max(lines.length - 1, 0);
  }

  return lines.length;
}

function resolveInitialRecordCount(file: File): Observable<number> {
  const lower = file.name.toLowerCase();
  const isTextLike = lower.endsWith('.csv') || lower.endsWith('.txt') || lower.endsWith('.xml');
  if (!isTextLike) return of(0);

  return from(file.text()).pipe(
    map((content) => parseRecordCountFromText(file, content)),
    catchError(() => of(0))
  );
}

function evolveStatuses(db: MockDb) {
  let changed = false;
  const now = Date.now();

  for (const file of db.files) {
    if (file.status === 'SUCCESS' || file.status === 'FAILED' || file.status === 'COMPLETED') {
      continue;
    }

    const stamp = new Date(file.uploadDate ?? file.uploadedAt).getTime();
    if (Number.isNaN(stamp)) continue;

    const ageMs = now - stamp;
    if (file.status === 'PENDING' && ageMs >= 10000) {
      file.status = 'PROCESSING';
      changed = true;
      continue;
    }

    if (file.status === 'PROCESSING' && ageMs >= 20000) {
      if (/(fail|error|reject)/i.test(file.filename ?? file.name)) {
        file.status = 'FAILED';
        file.errors = file.errors || 'File processing failed during validation';
      } else {
        file.status = 'SUCCESS';
        file.errors = '';
      }
      changed = true;
    }
  }

  if (changed) saveDb(db);
}

function toComparableValue(file: FileItem, field: string): any {
  const map: Record<string, any> = {
    id: Number(file.id),
    fileId: Number(file.id),
    filename: file.filename ?? file.name,
    name: file.name,
    uploadDate: file.uploadDate ?? file.uploadedAt,
    uploadedAt: file.uploadedAt,
    status: file.status,
    recordCount: file.recordCount
  };
  return map[field] ?? (file as any)[field];
}

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!environment.mockApi) return next.handle(req);
    if (!req.url.startsWith('/api')) return next.handle(req);

    const url = new URL(req.url, window.location.origin);
    const { pathname, searchParams } = url;
    const method = req.method.toUpperCase();
    const db = loadDb();
    evolveStatuses(db);

    if (pathname === '/api/auth/register' && method === 'POST') {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) return err(400, 'name, email, password are required');
      const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
      if (exists) return err(409, 'Email already exists');

      db.lastIds.user += 1;
      const user: User = { id: `u_${db.lastIds.user}`, name, email, password, token: `mock-token-u_${db.lastIds.user}` };
      db.users.push(user);
      saveDb(db);
      const { password: _, ...safeUser } = user;
      return created(safeUser);
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) return err(400, 'email and password are required');
      const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
      if (!user || user.password !== password) return err(401, 'Invalid email or password');

      const { password: _, ...safeUser } = user;
      return ok({ ...safeUser, token: user.token || `mock-token-${user.id}` });
    }

    if (pathname === '/api/file-loads' && method === 'GET') {
      const fileId = searchParams.get('fileId')?.trim();
      const filename = searchParams.get('filename')?.toLowerCase().trim() || '';
      const status = searchParams.get('status') || '';
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null;
      const recordCountMin = searchParams.get('recordCountMin');
      const recordCountMax = searchParams.get('recordCountMax');
      const page = +(searchParams.get('page') || 0);
      const size = +(searchParams.get('size') || 10);
      const sort = searchParams.get('sort') || 'uploadDate,desc';
      const [sortField, sortDir = 'desc'] = sort.split(',');

      let items = [...db.files];
      if (fileId) items = items.filter((f) => String(f.id).includes(fileId));
      if (filename) items = items.filter((f) => (f.filename ?? f.name).toLowerCase().includes(filename));
      if (status) items = items.filter((f) => f.status === status);
      if (startDate) items = items.filter((f) => new Date(f.uploadDate ?? f.uploadedAt) >= startDate);
      if (endDate) items = items.filter((f) => new Date(f.uploadDate ?? f.uploadedAt) <= endDate);
      if (recordCountMin !== null && recordCountMin !== '') items = items.filter((f) => f.recordCount >= Number(recordCountMin));
      if (recordCountMax !== null && recordCountMax !== '') items = items.filter((f) => f.recordCount <= Number(recordCountMax));

      items.sort((a, b) => {
        const av = toComparableValue(a, sortField);
        const bv = toComparableValue(b, sortField);
        if (av === bv) return 0;
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });

      const total = items.length;
      const paged = items.slice(page * size, page * size + size);
      return ok({ items: paged, total, page, pageSize: size });
    }

    const fileIdMatch = pathname.match(/^\/api\/file-loads\/([^/]+)$/);
    if (fileIdMatch && method === 'GET') {
      const file = db.files.find((f) => String(f.id) === fileIdMatch[1]);
      if (!file) return err(404, 'File not found');
      return ok(file);
    }

    if (fileIdMatch && method === 'PATCH') {
      const file = db.files.find((f) => String(f.id) === fileIdMatch[1]);
      if (!file) return err(404, 'File not found');
      const body = req.body || {};
      file.description = body.description ?? file.description;
      file.tags = Array.isArray(body.tags) ? body.tags : file.tags;
      saveDb(db);
      return ok(file);
    }

    const fileStatusMatch = pathname.match(/^\/api\/file-loads\/([^/]+)\/status$/);
    if (fileStatusMatch && method === 'PUT') {
      const file = db.files.find((f) => String(f.id) === fileStatusMatch[1]);
      if (!file) return err(404, 'File not found');
      const { status, comment } = req.body || {};
      if (!status || !ALLOWED_STATUSES.includes(status)) return err(400, 'Valid status is required');
      file.status = status;
      if (comment) file.errors = comment;
      saveDb(db);
      return ok(file);
    }

    if (fileIdMatch && method === 'DELETE') {
      const idx = db.files.findIndex((f) => String(f.id) === fileIdMatch[1]);
      if (idx < 0) return err(404, 'File not found');
      db.files.splice(idx, 1);
      saveDb(db);
      return ok({ success: true });
    }

    if (pathname === '/api/file-loads' && method === 'POST') {
      const formData = req.body as FormData;
      if (!(formData instanceof FormData)) return err(400, 'Expected multipart/form-data');
      const file = formData.get('file') as File | null;
      if (!file) return err(400, 'file is required');

      return resolveInitialRecordCount(file).pipe(
        switchMap((recordCount) => {
          const parsedRecordCount = Number(recordCount) || 0;
          db.lastIds.file += 1;
          const now = new Date().toISOString();
          const description = String(formData.get('description') || '');
          const tags = formData.getAll('tags').map(String).filter(Boolean);
          const createdFile: FileItem = {
            id: String(db.lastIds.file),
            name: file.name,
            filename: file.name,
            size: file.size,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            fileType: file.type || 'application/octet-stream',
            uploadedBy: 'You',
            uploadedAt: now,
            uploadDate: now,
            status: 'PENDING',
            recordCount: parsedRecordCount,
            errors: '',
            description,
            tags,
            version: 1,
            checksum: `chk-${db.lastIds.file}`
          };
          db.files.unshift(createdFile);
          saveDb(db);
          return created(createdFile, 650);
        })
      );
    }

    const fileDownloadMatch = pathname.match(/^\/api\/file-loads\/([^/]+)\/download$/);
    if (fileDownloadMatch && method === 'GET') {
      const file = db.files.find((f) => String(f.id) === fileDownloadMatch[1]);
      if (!file) return err(404, 'File not found');
      const content = `Mock content for ${file.filename ?? file.name}\nGenerated at ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: file.mimeType || 'text/plain' });
      return of(new HttpResponse({ status: 200, body: blob }));
    }

    return err(404, `No mock handler for ${method} ${pathname}`);
  }
}