import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileLoadService } from '../../services/file-load.service';

interface UploadItem {
  file: File;
  progress: number;
  state: 'queued' | 'uploading' | 'done' | 'error';
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly maxFileSizeBytes = 10 * 1024 * 1024;
  readonly acceptedExtensions = ['.csv', '.txt', '.xml', '.xls', '.xlsx'];
  readonly acceptedMimeTypes = [
    'text/csv',
    'text/plain',
    'application/xml',
    'text/xml',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  uploads: UploadItem[] = [];
  description = '';
  tagsText = '';
  isOver = false;

  constructor(private api: FileLoadService, private snack: MatSnackBar) {}

  get acceptedFileHint(): string {
    return `${this.acceptedExtensions.join(', ')} · max 10 MB`;
  }

  onFileSelected(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const files = target.files;
    if (!files?.length) return;
    this.queueFiles(Array.from(files));
    target.value = '';
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isOver = false;
    const files = ev.dataTransfer?.files;
    if (files?.length) this.queueFiles(Array.from(files));
  }

  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isOver = true;
  }

  onDragLeave() {
    this.isOver = false;
  }

  private isValidFile(file: File): boolean {
    const lower = file.name.toLowerCase();
    const hasAllowedExtension = this.acceptedExtensions.some((ext) => lower.endsWith(ext));
    const hasAllowedMime = !file.type || this.acceptedMimeTypes.includes(file.type);
    if (!(hasAllowedExtension && hasAllowedMime)) {
      this.snack.open(`Unsupported file type: ${file.name}`, 'Dismiss', { duration: 3500 });
      return false;
    }
    if (file.size > this.maxFileSizeBytes) {
      this.snack.open(`File is too large: ${file.name} (max 10 MB)`, 'Dismiss', { duration: 3500 });
      return false;
    }
    return true;
  }

  queueFiles(files: File[]) {
    for (const file of files) {
      if (!this.isValidFile(file)) continue;
      this.uploads.push({ file, progress: 0, state: 'queued' });
    }
  }

  startUploads() {
    const tags = this.tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const extra = { description: this.description || undefined, tags: tags.length ? tags : undefined };

    this.uploads.filter((u) => u.state === 'queued').forEach((u) => {
      u.state = 'uploading';
      this.api.upload(u.file, extra).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            u.progress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            u.progress = 100;
            u.state = 'done';
            this.snack.open(`Upload successful: ${u.file.name}`, 'OK', { duration: 2000 });
          }
        },
        error: () => {
          u.state = 'error';
          this.snack.open(`Upload failed: ${u.file.name}`, 'Dismiss', { duration: 3500 });
        }
      });
    });
  }

  clearDone() {
    this.uploads = this.uploads.filter((u) => u.state !== 'done');
  }

  triggerFilePick() {
    this.fileInput.nativeElement.click();
  }
}