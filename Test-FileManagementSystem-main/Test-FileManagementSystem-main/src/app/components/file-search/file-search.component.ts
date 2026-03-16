import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SearchCriteria } from '../../models/search-criteria.model';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss']
})
export class FileSearchComponent {
  @Output() search = new EventEmitter<SearchCriteria>();

  form = this.fb.group({
    fileId: [''],
    filename: [''],
    status: [''],
    startDate: [''],
    endDate: [''],
    recordCountMin: [''],
    recordCountMax: ['']
  });

  constructor(private fb: FormBuilder) {}

  submit() {
    const { fileId, filename, status, startDate, endDate, recordCountMin, recordCountMax } = this.form.value;
    this.search.emit({
      fileId: fileId || '',
      filename: filename || '',
      status: status || '',
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      recordCountMin: recordCountMin !== '' && recordCountMin !== null ? Number(recordCountMin) : undefined,
      recordCountMax: recordCountMax !== '' && recordCountMax !== null ? Number(recordCountMax) : undefined,
      page: 0
    });
  }

  reset() {
    this.form.reset({
      fileId: '',
      filename: '',
      status: '',
      startDate: '',
      endDate: '',
      recordCountMin: '',
      recordCountMax: ''
    });
    this.search.emit({
      fileId: '',
      filename: '',
      status: '',
      startDate: undefined,
      endDate: undefined,
      recordCountMin: undefined,
      recordCountMax: undefined,
      page: 0
    });
  }
}