import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CleanResponse, StatsMap } from '../../services/clean.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  result: CleanResponse | null = null;
  statsAvant: StatsMap | null = null;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const resultData = sessionStorage.getItem('cleanResult');
    const statsData = sessionStorage.getItem('statsAvant');
    if (resultData) this.result = JSON.parse(resultData) as CleanResponse;
    if (statsData) this.statsAvant = JSON.parse(statsData) as StatsMap;
  }

  getKeys(): string[] {
    return this.result?.statistiques_apres ? Object.keys(this.result.statistiques_apres) : [];
  }

  getBeforeValue(key: string): number {
    const value = this.statsAvant?.[key];
    return (value != null && !isNaN(Number(value))) ? Number(value) : 0;
  }

  getAfterValue(key: string): number {
    const value = this.result?.statistiques_apres?.[key];
    return (value != null && !isNaN(Number(value))) ? Number(value) : 0;
  }

  getImprovement(key: string): string {
    const before = Number(this.statsAvant?.[key]);
    const after = Number(this.result?.statistiques_apres?.[key]);
    if (!isFinite(before) || !isFinite(after) || before === 0) return '0.0%';
    if (before === after) return '0.0%';
    const decreaseIsBetter = ['missing_values', 'outliers', 'duplicates', 'Valeurs Manquantes', 'Valeurs Abberantes', 'Doublons'];
    const improvement = decreaseIsBetter.includes(key)
      ? ((before - after) / before) * 100
      : ((after - before) / before) * 100;
    const rounded = Math.round(improvement * 10) / 10;
    if (rounded === 0) return '0.0%';
    return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`;
  }

  isImprovement(key: string): boolean {
    const before = Number(this.statsAvant?.[key]);
    const after = Number(this.result?.statistiques_apres?.[key]);
    if (!isFinite(before) || !isFinite(after) || before === after) return false;
    const lowerBetter = ['missing_values', 'outliers', 'duplicates', 'Valeurs Manquantes', 'Valeurs Abberantes', 'Doublons'];
    return lowerBetter.includes(key) ? after < before : after > before;
  }

  getImprovementCount(): number {
    return this.getKeys().filter(key => this.isImprovement(key)).length;
  }

  // Nouvelle méthode de téléchargement avec credentials
download() {
  if (!this.result?.download_url) return;

  const result = this.result;
  const url = environment.apiUrl + result.download_url;
  const filename = result.fichier_sortie || 'fichier_nettoye';

  this.http.get(url, {
    responseType: 'blob',
    withCredentials: true
  }).subscribe({
    next: (blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    },
    error: (err) => {
      console.error('Erreur téléchargement:', err);
    }
  });
}


  goBack() {
    this.router.navigate(['/clean']);
  }
}
