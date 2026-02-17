import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HistoryService } from '../../services/history.service';


@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  history: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

 ngOnInit() {
  this.historyService.getHistory().subscribe({
    next: (res) => {
      this.history = res.history;
    },
    error: (err) => {
      this.errorMessage = "Impossible de charger l'historique.";
      console.error(err);
    }
  });
}


  loadHistory() {
    this.http.get<any>(
      `${environment.apiUrl}/history`,
      { withCredentials: true }
    ).subscribe({
      next: (res) => {
        this.history = res.history || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger l’historique.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
