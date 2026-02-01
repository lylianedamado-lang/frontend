import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CleanService } from '../../services/clean.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  statsAvant: any = null;
  statsApres: any = null;
  downloadUrl: string = '';
  fileName: string = '';

  constructor(
    private cleanService: CleanService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadResults();
  }

  loadResults() {
    const statsAvant = sessionStorage.getItem('statsAvant');
    const statsApres = sessionStorage.getItem('statsApres');
    const downloadUrl = sessionStorage.getItem('downloadUrl');
    const fileName = sessionStorage.getItem('fileName');
    
    if (statsAvant) this.statsAvant = JSON.parse(statsAvant);
    if (statsApres) this.statsApres = JSON.parse(statsApres);
    if (downloadUrl) this.downloadUrl = downloadUrl;
    if (fileName) this.fileName = fileName;
  }

  downloadFile() {
    if (this.downloadUrl) {
      const fullUrl = this.cleanService.getDownloadUrl(this.downloadUrl);
      window.open(fullUrl, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/clean']);
  }
}