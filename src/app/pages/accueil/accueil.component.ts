import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as Papa from 'papaparse';
import { StateService } from '../../services/state.service';
import { CleaningService } from '../../services/cleaning.service';
import { formatCellValue, isMissingValue } from '../../utils/value-format';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css'
})
export class AccueilComponent {
  dragOver = false;
  errorMessage = '';
  previewNotice = '';
  previewLoading = false;

  // Normalisation
  normalizeChoice: 'yes' | 'no' | null = null;
  method = '';
  methodError = false;

  // Cleaning
  cleanLoading = false;
  cleanError = '';

  readonly allowedExtensions = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
  readonly maxJsonPreviewBytes = 4 * 1024 * 1024;
  readonly previewEdgeRows = 20;
  readonly previewShowAllThreshold = 35;
  readonly normalizationMethods = [
    {
      value: 'minmax',
      label: 'Min-Max',
      desc: 'Normalise les valeurs entre 0 et 1',
      impact: 'Conserve les écarts relatifs entre les valeurs et ramène toutes les colonnes sur la même échelle.'
    },
    {
      value: 'zscore',
      label: 'Z-Score',
      desc: 'Centré-réduit (moyenne = 0, écart-type = 1)',
      impact: 'Recentre les données autour de 0 pour comparer des colonnes de distributions différentes.'
    },
    {
      value: 'robust',
      label: 'Robust',
      desc: 'Résistant aux valeurs aberrantes (médiane / IQR)',
      impact: 'Réduit l’effet des valeurs extrêmes pour une normalisation plus stable sur des données bruitées.'
    }
  ] as const;

  constructor(
    public state: StateService,
    private cleaningService: CleaningService,
    private router: Router
  ) {}

  get fileName(): string { return this.state.uploadedFile?.name || ''; }
  get selectedMethodInfo() {
    return this.normalizationMethods.find((m) => m.value === this.method) || null;
  }

  get fileSize(): string {
    if (!this.state.uploadedFile) return '';
    const b = this.state.uploadedFile.size;
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragOver = false;
    if (e.dataTransfer?.files?.length) this.handleFile(e.dataTransfer.files[0]);
  }
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  handleFile(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      this.state.reset();
      this.normalizeChoice = null;
      this.method = '';
      this.methodError = false;
      this.errorMessage = 'Format non supporté. Utilisez : CSV, Excel, JSON ou XML.';
      return;
    }
    this.errorMessage = '';
    this.previewNotice = '';
    this.state.reset();
    this.state.uploadedFile = file;
    this.normalizeChoice = null;
    this.method = '';
    this.methodError = false;
    this.parsePreview(file);
  }

  parsePreview(file: File) {
    this.previewLoading = true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    this.previewNotice = '';
    this.resetPreviewState();

    if (ext === 'csv') {
      this.parseCsvPreview(file);
    } else if (ext === 'json') {
      if (file.size > this.maxJsonPreviewBytes) {
        this.previewLoading = false;
        this.previewNotice =
          'Aperçu JSON désactivé: le fichier est volumineux. Lancez le nettoyage pour voir le résultat.';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse((e.target?.result as string) || '[]');
          const data = Array.isArray(parsed) ? parsed : [parsed];
          const rows = data.map((item) => this.toPreviewRow(item));

          this.state.fileColumns = Object.keys(rows[0] || {});
          this.state.fileTotalRows = rows.length;
          if (rows.length <= this.previewShowAllThreshold) {
            this.state.filePreviewData = rows;
            this.state.fileLastRows = [];
          } else {
            this.state.filePreviewData = rows.slice(0, this.previewEdgeRows);
            this.state.fileLastRows = rows.slice(-this.previewEdgeRows);
          }
        } catch {
          this.errorMessage = 'Fichier JSON invalide.';
        }
        this.previewLoading = false;
      };
      reader.readAsText(file);
    } else {
      this.state.fileColumns = [];
      this.state.filePreviewData = [];
      this.state.fileLastRows = [];
      this.state.fileTotalRows = 0;
      this.previewLoading = false;
    }
  }

  removeFile() {
    this.state.reset();
    this.errorMessage = '';
    this.previewNotice = '';
    this.normalizeChoice = null;
    this.method = '';
    this.methodError = false;
  }

  selectNormalize(choice: 'yes' | 'no') {
    this.normalizeChoice = choice;
    if (choice === 'no') { this.method = ''; this.methodError = false; }
  }

  selectMethod(m: string) {
    if (!this.normalizationMethods.some((item) => item.value === m)) return;
    this.method = m;
    this.methodError = false;
  }

  isMissing(value: unknown): boolean {
    return isMissingValue(value);
  }

  displayPreviewValue(value: unknown): string {
    return formatCellValue(value);
  }

  goToResults() {
    if (!this.state.hasFile) return;
    if (this.normalizeChoice === null) return;

    // Validation: si oui normaliser mais pas de méthode
    if (this.normalizeChoice === 'yes' && !this.method) {
      this.methodError = true;
      return;
    }

    this.cleanLoading = true;
    this.cleanError = '';

    this.cleaningService.cleanFile(
      this.state.uploadedFile!,
      this.normalizeChoice === 'yes',
      this.method
    ).subscribe({
      next: (result) => {
        this.cleanLoading = false;
        this.state.cleaningResult = result;
        this.router.navigate(['/results']).then(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      },
      error: (err) => {
        this.cleanLoading = false;
        if (err?.status === 413) {
          this.cleanError = 'Fichier trop volumineux selon la limite du serveur.';
          return;
        }
        this.cleanError = err.error?.error || err.error?.message || 'Erreur lors du nettoyage.';
      }
    });
  }

  private parseCsvPreview(file: File) {
    const firstRows: Record<string, unknown>[] = [];
    const lastRows: Record<string, unknown>[] = [];
    const allRows: Record<string, unknown>[] = [];
    let totalRows = 0;

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      worker: true,
      skipEmptyLines: 'greedy',
      step: (result) => {
        const row = result.data || {};
        if (this.state.fileColumns.length === 0 && result.meta.fields?.length) {
          this.state.fileColumns = [...result.meta.fields];
        }

        if (allRows.length < this.previewShowAllThreshold) {
          allRows.push(row);
        }
        if (firstRows.length < this.previewEdgeRows) {
          firstRows.push(row);
        }
        if (lastRows.length === this.previewEdgeRows) {
          lastRows.shift();
        }
        lastRows.push(row);
        totalRows += 1;
      },
      complete: () => {
        this.state.fileTotalRows = totalRows;
        if (totalRows <= this.previewShowAllThreshold) {
          this.state.filePreviewData = allRows;
          this.state.fileLastRows = [];
        } else {
          this.state.filePreviewData = firstRows;
          this.state.fileLastRows = lastRows;
        }
        this.previewLoading = false;
      },
      error: () => {
        this.resetPreviewState();
        this.previewLoading = false;
        this.errorMessage = 'Impossible de lire ce fichier CSV.';
      }
    });
  }

  private resetPreviewState() {
    this.state.fileColumns = [];
    this.state.filePreviewData = [];
    this.state.fileLastRows = [];
    this.state.fileTotalRows = 0;
  }

  private toPreviewRow(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return { value };
  }
}
