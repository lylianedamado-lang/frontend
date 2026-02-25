import { Component, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StateService } from '../../services/state.service';
import { CleaningService } from '../../services/cleaning.service';
import { Chart, registerables } from 'chart.js';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CleaningStats } from '../../models/models';
import { Subscription } from 'rxjs';
import { formatCellValue, isMissingValue } from '../../utils/value-format';

Chart.register(...registerables);

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('paramChart') paramChartRefs!: QueryList<ElementRef<HTMLCanvasElement>>;

  downloadLoading = false;
  downloadError = '';

  // Preview du fichier nettoyé
  cleanedColumns: string[] = [];
  cleanedFirstRows: any[] = [];
  cleanedLastRows: any[] = [];
  cleanedTotalRows = 0;
  cleanedPreviewLoading = false;
  cleanedPreviewError = '';
  readonly previewEdgeRows = 20;
  readonly previewShowAllThreshold = 35;
  readonly maxCsvPreviewBytes = 15 * 1024 * 1024;
  readonly maxExcelPreviewBytes = 5 * 1024 * 1024;
  numericStatKeys: string[] = [];
  readonly cleaningChartPriorityKeys = [
    'Valeurs Manquantes',
    'Valeurs Abberantes',
    'Doublons',
    'Lignes',
    'Colonnes'
  ];

  private paramCharts: Chart[] = [];
  private chartRefsSub?: Subscription;

  constructor(public state: StateService, private cleaningService: CleaningService, private router: Router) {}

  ngOnInit() {
    if (!this.state.hasResult) { this.router.navigate(['/accueil']); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.numericStatKeys = this.getNumericChartKeys();
    this.loadCleanedPreview();
  }

  ngAfterViewInit() {
    if (!this.state.hasResult) return;
    this.chartRefsSub = this.paramChartRefs.changes.subscribe(() => this.buildCharts());
    setTimeout(() => this.buildCharts(), 200);
  }

  ngOnDestroy() {
    this.chartRefsSub?.unsubscribe();
    this.destroyCharts();
  }

  get avant(): CleaningStats { return this.state.cleaningResult?.statistiques_avant || {}; }
  get apres(): CleaningStats { return this.state.cleaningResult?.statistiques_apres || {}; }

  getKeys(obj: Record<string, unknown>): string[] { return Object.keys(obj); }
  isObj(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  get allKeys(): string[] {
    const set = new Set([
      ...this.getKeys(this.avant as Record<string, unknown>),
      ...this.getKeys(this.apres as Record<string, unknown>)
    ]);
    return Array.from(set);
  }

  getObjSubKeys(key: string): string[] {
    const avantObj = (this.avant as Record<string, unknown>)[key];
    const apresObj = (this.apres as Record<string, unknown>)[key];
    const a = this.isObj(avantObj) ? Object.keys(avantObj) : [];
    const b = this.isObj(apresObj) ? Object.keys(apresObj) : [];
    return Array.from(new Set([...a, ...b]));
  }

  getObjVal(source: Record<string, unknown>, key: string, subKey: string): string {
    const container = source[key];
    if (!this.isObj(container)) return '—';
    const v = container[subKey];
    return v !== undefined && v !== null ? String(v) : '—';
  }

  getDeltaValue(key: string): number | null {
    const before = this.getNumberValue(this.avant as Record<string, unknown>, key);
    const after = this.getNumberValue(this.apres as Record<string, unknown>, key);
    if (before === null || after === null) return null;
    return after - before;
  }

  getObjDeltaValue(key: string, subKey: string): number | null {
    const before = this.getObjectNumberValue(this.avant as Record<string, unknown>, key, subKey);
    const after = this.getObjectNumberValue(this.apres as Record<string, unknown>, key, subKey);
    if (before === null || after === null) return null;
    return after - before;
  }

  isNegativeOrZero(delta: number | null): boolean {
    return delta !== null && delta <= 0;
  }

  isPositive(delta: number | null): boolean {
    return delta !== null && delta > 0;
  }

  formatDelta(delta: number | null): string {
    if (delta === null) return '—';
    return `${delta >= 0 ? '+' : ''}${delta}`;
  }

  isMissing(value: unknown): boolean {
    return isMissingValue(value);
  }

  displayCleanedValue(value: unknown): string {
    return formatCellValue(value);
  }

  getChartExplanation(key: string): string {
    const before = this.getNum(this.avant, key);
    const after = this.getNum(this.apres, key);
    const delta = after - before;

    if (delta === 0) {
      return `Le paramètre "${key}" est resté stable après nettoyage (aucune variation).`;
    }

    const trend = delta < 0 ? 'a diminué' : 'a augmenté';
    if (before === 0) {
      return `Le paramètre "${key}" est passé de ${before} à ${after} et ${trend}.`;
    }

    const pct = (Math.abs(delta) / Math.abs(before)) * 100;
    return `Le paramètre "${key}" est passé de ${before} à ${after} (${trend} de ${pct.toFixed(1)}%).`;
  }

  // ==================== Cleaned file preview ====================
  loadCleanedPreview() {
    if (!this.state.cleaningResult?.download_url) return;
    const fid = this.state.cleaningResult.download_url.split('/').pop() || '';

    this.cleanedColumns = [];
    this.cleanedFirstRows = [];
    this.cleanedLastRows = [];
    this.cleanedTotalRows = 0;
    this.cleanedPreviewLoading = true;
    this.cleanedPreviewError = '';

    this.cleaningService.downloadFile(fid).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.cleanedPreviewLoading = false;
          this.cleanedPreviewError = 'Impossible de lire le fichier nettoyé.';
          return;
        }

        const fallbackName = `cleaned_${this.state.uploadedFile?.name || 'file'}`;
        const filename = this.cleaningService.getFilenameFromResponse(response, fallbackName);
        const ext = filename.split('.').pop()?.toLowerCase() || '';

        if (ext === 'csv' && blob.size > this.maxCsvPreviewBytes) {
          this.cleanedPreviewLoading = false;
          this.cleanedPreviewError = 'Aperçu CSV désactivé: fichier trop volumineux.';
          return;
        }
        if (ext !== 'csv' && blob.size > this.maxExcelPreviewBytes) {
          this.cleanedPreviewLoading = false;
          this.cleanedPreviewError = 'Aperçu Excel désactivé: fichier trop volumineux.';
          return;
        }

        if (ext === 'csv') {
          this.parseCsvBlob(blob);
        } else {
          this.parseExcelBlob(blob);
        }
      },
      error: () => {
        this.cleanedPreviewLoading = false;
        this.cleanedPreviewError = 'Impossible de charger l\'aperçu du fichier nettoyé.';
      }
    });
  }

  private parseCsvBlob(blob: Blob) {
    const firstRows: Record<string, unknown>[] = [];
    const lastRows: Record<string, unknown>[] = [];
    const allRows: Record<string, unknown>[] = [];
    let totalRows = 0;
    const csvFile = blob instanceof File ? blob : new File([blob], 'cleaned.csv', { type: 'text/csv' });

    Papa.parse<Record<string, unknown>>(csvFile, {
      header: true,
      worker: true,
      skipEmptyLines: 'greedy',
      step: (result) => {
        const row = result.data || {};
        if (this.cleanedColumns.length === 0 && result.meta.fields?.length) {
          this.cleanedColumns = [...result.meta.fields];
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
        if (totalRows === 0) {
          this.cleanedPreviewLoading = false;
          this.cleanedPreviewError = 'Le fichier nettoyé est vide.';
          return;
        }
        this.cleanedTotalRows = totalRows;
        if (totalRows <= this.previewShowAllThreshold) {
          this.cleanedFirstRows = allRows;
          this.cleanedLastRows = [];
        } else {
          this.cleanedFirstRows = firstRows;
          this.cleanedLastRows = lastRows;
        }
        this.cleanedPreviewLoading = false;
      },
      error: () => {
        this.cleanedPreviewLoading = false;
        this.cleanedPreviewError = 'Erreur de lecture du CSV nettoyé.';
      }
    });
  }

  private parseExcelBlob(blob: Blob) {
    blob.arrayBuffer().then(buffer => {
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(ws, {
        header: 1,
        defval: ''
      });
      if (!rows.length) {
        this.cleanedPreviewLoading = false;
        this.cleanedPreviewError = 'Le fichier nettoyé est vide.';
        return;
      }

      const headers = (rows[0] || []).map((col) => String(col));
      const values = rows.slice(1);
      if (!headers.length || !values.length) {
        this.cleanedPreviewLoading = false;
        this.cleanedPreviewError = 'Le fichier nettoyé est vide.';
        return;
      }

      const toObj = (line: (string | number | boolean | null)[]) => {
        const row: Record<string, string | number | boolean | null> = {};
        headers.forEach((header, index) => {
          row[header] = line[index] ?? '';
        });
        return row;
      };

      this.cleanedColumns = headers;
      this.cleanedTotalRows = values.length;
      if (values.length <= this.previewShowAllThreshold) {
        this.cleanedFirstRows = values.map(toObj);
        this.cleanedLastRows = [];
      } else {
        this.cleanedFirstRows = values.slice(0, this.previewEdgeRows).map(toObj);
        this.cleanedLastRows = values.slice(-this.previewEdgeRows).map(toObj);
      }
      this.cleanedPreviewLoading = false;
    }).catch(() => {
      this.cleanedPreviewLoading = false;
      this.cleanedPreviewError = 'Erreur de lecture du fichier Excel nettoyé.';
    });
  }

  // ==================== Charts ====================
  buildCharts() {
    this.destroyCharts();
    const refs = this.paramChartRefs?.toArray() ?? [];
    if (!refs.length) return;

    const palette = [
      ['#ef4444', '#7c3aed'],
      ['#f59e0b', '#3b82f6'],
      ['#10b981', '#8b5cf6'],
      ['#f97316', '#06b6d4'],
      ['#84cc16', '#e11d48'],
      ['#6366f1', '#0ea5e9']
    ] as const;

    refs.forEach((ref, index) => {
      const key = this.numericStatKeys[index];
      if (!key || !ref?.nativeElement) return;
      const before = this.getNum(this.avant, key);
      const after = this.getNum(this.apres, key);
      const colors = palette[index % palette.length];

      const chart = new Chart(ref.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Avant', 'Après'],
          datasets: [{
            label: key,
            data: [before, after],
            backgroundColor: [colors[0], colors[1]],
            borderRadius: 8,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: key }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Étape du nettoyage'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: `Valeur (${key})`
              }
            }
          }
        }
      });
      this.paramCharts.push(chart);
    });
  }

  private getNum(obj: Record<string, unknown>, key: string): number {
    if (!obj) return 0;
    const v = obj[key];
    return typeof v === 'number' ? v : 0;
  }

  private getNumberValue(obj: Record<string, unknown>, key: string): number | null {
    const value = obj[key];
    return typeof value === 'number' ? value : null;
  }

  private getObjectNumberValue(
    source: Record<string, unknown>,
    key: string,
    subKey: string
  ): number | null {
    const container = source[key];
    if (!this.isObj(container)) return null;
    const value = container[subKey];
    return typeof value === 'number' ? value : null;
  }

  // ==================== Download ====================
  downloadFile() {
    if (!this.state.cleaningResult?.download_url) return;
    const fid = this.state.cleaningResult.download_url.split('/').pop() || '';
    this.downloadLoading = true; this.downloadError = '';
    this.cleaningService.downloadFile(fid).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.downloadLoading = false;
          this.downloadError = 'Fichier de téléchargement invalide.';
          return;
        }
        this.downloadLoading = false;
        const url = window.URL.createObjectURL(blob);
        const fallbackName = 'cleaned_' + (this.state.uploadedFile?.name || 'file');
        const filename = this.cleaningService.getFilenameFromResponse(response, fallbackName);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click(); window.URL.revokeObjectURL(url);
      },
      error: () => { this.downloadLoading = false; this.downloadError = 'Erreur lors du téléchargement.'; }
    });
  }

  newCleaning() { this.state.reset(); this.router.navigate(['/accueil']); }

  private destroyCharts() {
    this.paramCharts.forEach((chart) => chart.destroy());
    this.paramCharts = [];
  }

  private isSimpleNumericStat(key: string): boolean {
    const before = (this.avant as Record<string, unknown>)[key];
    const after = (this.apres as Record<string, unknown>)[key];
    if (this.isObj(before) || this.isObj(after)) return false;
    return typeof before === 'number' || typeof after === 'number';
  }

  private getNumericChartKeys(): string[] {
    const prioritized = this.cleaningChartPriorityKeys.filter((key) => this.isSimpleNumericStat(key));
    if (prioritized.length) return prioritized;

    const numericKeys = this.allKeys.filter((key) => this.isSimpleNumericStat(key));
    const changedKeys = numericKeys.filter((key) => this.getNum(this.avant, key) !== this.getNum(this.apres, key));
    return changedKeys.length ? changedKeys : numericKeys;
  }
}
