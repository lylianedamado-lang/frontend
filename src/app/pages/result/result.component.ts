import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  result: any;
  statsAvant: any = null;

  constructor(private router: Router) {}

  ngOnInit() {     
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const resultData = sessionStorage.getItem('cleanResult');
    const statsData = sessionStorage.getItem('statsAvant');
    
    if (resultData) {
      this.result = JSON.parse(resultData);
    }
    
    if (statsData) {
      this.statsAvant = JSON.parse(statsData);
    }
  }

  getKeys(): string[] {
    if (!this.result || !this.result.statistiques_apres) return [];
    return Object.keys(this.result.statistiques_apres);
  }

  getBeforeValue(key: string): number {
  if (!this.statsAvant) return 0;

  const value = this.statsAvant[key];

  if (value === null || value === undefined || value === 'N/A') {
    return 0;
  }

  const num = Number(value);
  return isNaN(num) ? 0 : num;
}


 getAfterValue(key: string): number {
  if (!this.result || !this.result.statistiques_apres) return 0;

  const value = this.result.statistiques_apres[key];

  if (value === null || value === undefined || value === 'N/A') {
    return 0;
  }

  const num = Number(value);
  return isNaN(num) ? 0 : num;
}


getImprovement(key: string): string {
  const before = Number(this.statsAvant?.[key]);
  const after = Number(this.result?.statistiques_apres?.[key]);

  if (!isFinite(before) || !isFinite(after) || before === 0) {
    return '0.0%';
  }

  if (before === after) {
    return '0.0%';
  }

  const decreaseIsBetter = [
    'missing_values', 'missing_percentage', 'outliers',
    'duplicates', 'invalid_format', 'inconsistencies',
    'Valeurs Manquantes', 'Valeurs Abberantes', 'Doublons'
  ];

  const improvement = decreaseIsBetter.includes(key)
    ? ((before - after) / before) * 100
    : ((after - before) / before) * 100;

  const rounded = Math.round(Math.abs(improvement) * 10) / 10;

  return rounded === 0 ? '0.0%' : `+${rounded.toFixed(1)}%`;
}


  isImprovement(key: string): boolean {
  const before = Number(this.statsAvant?.[key]);
  const after = Number(this.result?.statistiques_apres?.[key]);

  // Cas non exploitables
  if (!isFinite(before) || !isFinite(after)) return false;
  if (before === after) return false;

  const metricsWhereLowerIsBetter = [
    'missing_values', 'missing_percentage', 'outliers',
    'duplicates', 'invalid_format', 'inconsistencies',
    'Valeurs Manquantes', 'Valeurs Abberantes', 'Doublons',
    'Lignes', 'Colonnes'
  ];

  if (metricsWhereLowerIsBetter.includes(key)) {
    return after < before;
  }

  return after > before;
}

  getImprovementCount(): number {
    const keys = this.getKeys();
    let count = 0;
    for (const key of keys) {
      if (this.isImprovement(key)) {
        count++;
      }
    }
    return count;
  }

  download() {
    if (this.result && this.result.download_url) {
      window.open(environment.apiUrl + this.result.download_url, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}