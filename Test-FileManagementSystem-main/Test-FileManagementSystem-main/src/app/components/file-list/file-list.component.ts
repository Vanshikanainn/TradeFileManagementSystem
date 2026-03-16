import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FileItem, PagedResult } from '../../models/file-load.model';
import { SearchCriteria } from '../../models/search-criteria.model';
import { AuthService } from '../../services/auth.service';
import { FileLoadService } from '../../services/file-load.service';
import { StatusUpdateComponent } from '../status-update/status-update.component';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'filename', 'uploadDate', 'status', 'recordCount', 'actions'];
  dataSource = new MatTableDataSource<FileItem>([]);
  total = 0;
  loading = false;

  criteria: SearchCriteria = { page: 0, size: 10, sort: 'uploadDate,desc' };
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: FileLoadService,
    private snack: MatSnackBar,
    private router: Router,
    private auth: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    timer(0, 10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fetch());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(c: SearchCriteria) {
    this.criteria = {
      ...this.criteria,
      ...c,
      page: 0
    };
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.api.list(this.criteria).subscribe({
      next: (res: PagedResult<FileItem>) => {
        this.dataSource.data = res.items;
        this.total = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? 'Failed to load files', 'Dismiss', { duration: 3500 });
        this.loading = false;
      }
    });
  }

  pageChange(ev: PageEvent) {
    this.criteria.page = ev.pageIndex;
    this.criteria.size = ev.pageSize;
    this.fetch();
  }

  sortChange(ev: Sort) {
    const direction = ev.direction || 'desc';
    const fieldMap: Record<string, string> = {
      id: 'id',
      filename: 'filename',
      uploadDate: 'uploadDate',
      status: 'status',
      recordCount: 'recordCount'
    };
    this.criteria.sort = `${fieldMap[ev.active] || ev.active},${direction}`;
    this.criteria.page = 0;
    this.fetch();
  }

  view(row: FileItem) {
    this.router.navigate(['/files', row.id]);
  }

  openStatusDialog(row: FileItem) {
    this.dialog
      .open(StatusUpdateComponent, {
        width: '420px',
        panelClass: 'status-dialog',
        data: { fileId: row.id, currentStatus: row.status }
      })
      .afterClosed()
      .subscribe((updated) => {
        if (updated) this.fetch();
      });
  }


  download(row: FileItem) {
    this.api.download(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = row.filename || row.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.snack.open('Download started', 'OK', { duration: 1500 });
      },
      error: () => this.snack.open('Download failed', 'Dismiss', { duration: 3000 })
    });
  }

  delete(row: FileItem) {
    if (!confirm(`Delete "${row.filename || row.name}"? This cannot be undone.`)) return;
    this.api.delete(row.id).subscribe({
      next: () => {
        this.snack.open('File deleted', 'OK', { duration: 1500 });
        this.fetch();
      },
      error: () => this.snack.open('Delete failed', 'Dismiss', { duration: 3000 })
    });
  }

  fileName(row: FileItem): string {
    return row.filename || row.name;
  }

  uploadDate(row: FileItem): string {
    return row.uploadDate || row.uploadedAt;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-pending',
      PROCESSING: 'badge-processing',
      COMPLETED: 'badge-success',
      SUCCESS: 'badge-success',
      FAILED: 'badge-failed'
    };
    return map[status] || 'badge-default';
  }
}