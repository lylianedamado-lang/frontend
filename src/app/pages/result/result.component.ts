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

  getBeforeValue(key: string): string {
    if (!this.statsAvant || !this.statsAvant[key]) return 'N/A';
    return this.statsAvant[key];
  }

  getAfterValue(key: string): string {
    if (!this.result || !this.result.statistiques_apres) return 'N/A';
    return this.result.statistiques_apres[key];
  }

  getImprovement(key: string): string {
    try {
      const before = parseFloat(this.statsAvant[key]);
      const after = parseFloat(this.result.statistiques_apres[key]);
      
      if (isNaN(before) || isNaN(after)) return 'N/A';
      
      const improvement = ((after - before) / before) * 100;
      return `${improvement.toFixed(1)}%`;
    } catch {
      return 'N/A';
    }
  }

  isImprovement(key: string): boolean {
    try {
      const before = parseFloat(this.statsAvant[key]);
      const after = parseFloat(this.result.statistiques_apres[key]);
      
      const metricsWhereLowerIsBetter = [
        'missing_values', 'missing_percentage', 'outliers', 
        'duplicates', 'invalid_format', 'inconsistencies'
      ];
      
      if (metricsWhereLowerIsBetter.includes(key)) {
        return after < before;
      }
      
      return after > before;
    } catch {
      return false;
    }
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