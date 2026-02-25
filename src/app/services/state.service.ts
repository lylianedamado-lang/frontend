import { Injectable } from '@angular/core';
import { CleaningResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StateService {
  uploadedFile: File | null = null;
  filePreviewData: any[] = [];
  fileLastRows: any[] = [];
  fileTotalRows: number = 0;
  fileColumns: string[] = [];
  cleaningResult: CleaningResult | null = null;

  reset() {
    this.uploadedFile = null;
    this.filePreviewData = [];
    this.fileLastRows = [];
    this.fileTotalRows = 0;
    this.fileColumns = [];
    this.cleaningResult = null;
  }

  get hasFile(): boolean { return this.uploadedFile !== null; }
  get hasResult(): boolean { return this.cleaningResult !== null; }
}
