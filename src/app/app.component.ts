// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="card">
      <h1>🔥 Predicción de Calorías Quemadas</h1>
      <p class="subtitle">Selecciona el modelo entrenado, calcula las calorías o re-entrena el modelo.</p>

      <div class="form-group full-width">
        <label><strong>Dataset / Modelo a consultar o re-entrenar:</strong></label>
        <select [(ngModel)]="selectedDataset" name="dataset">
          <option value="100">Modelo Entrenado al 100% Dataset (gym-100)</option>
          <option value="50">Modelo Entrenado al 50% Dataset (gym-50)</option>
          <option value="25">Modelo Entrenado al 25% Dataset (gym-25)</option>
        </select>
      </div>

      <form (ngSubmit)="calcularPrediccion()">
        <div class="grid">
          <div class="form-group">
            <label>Peso (kg):</label>
            <input type="number" step="0.1" [(ngModel)]="formData.weight" name="weight" required>
          </div>
          <div class="form-group">
            <label>Duración Sesión (horas):</label>
            <input type="number" step="0.01" [(ngModel)]="formData.session_duration" name="session_duration" required>
          </div>
          <div class="form-group">
            <label>BPM Promedio:</label>
            <input type="number" [(ngModel)]="formData.avg_bpm" name="avg_bpm" required>
          </div>
          <div class="form-group">
            <label>Edad (años):</label>
            <input type="number" [(ngModel)]="formData.age" name="age" required>
          </div>
          <div class="form-group">
            <label>BPM Máximo:</label>
            <input type="number" [(ngModel)]="formData.max_bpm" name="max_bpm" required>
          </div>
          <div class="form-group">
            <label>% Grasa Corporal:</label>
            <input type="number" step="0.1" [(ngModel)]="formData.fat_percentage" name="fat_percentage" required>
          </div>
          <div class="form-group">
            <label>IMC (BMI):</label>
            <input type="number" step="0.01" [(ngModel)]="formData.bmi" name="bmi" required>
          </div>
          <div class="form-group">
            <label>Nivel Experiencia (1-3):</label>
            <input type="number" [(ngModel)]="formData.experience_level" name="experience_level" required>
          </div>
          <div class="form-group full-width">
            <label>Frecuencia (días/semana):</label>
            <input type="number" [(ngModel)]="formData.workout_frequency" name="workout_frequency" required>
          </div>
        </div>

        <button type="submit" class="btn-primary" [disabled]="loadingPredict">
          {{ loadingPredict ? 'Consultando modelo...' : 'Calcular Predicción' }}
        </button>
      </form>

      <div *ngIf="resultado !== null" class="result-box">
        <p>Calorías Estimadas (Modelo {{ selectedDataset }}%):</p>
        <h2>{{ resultado }} kcal</h2>
      </div>

      <hr class="divider">

      <div class="retrain-section">
        <h3>⚙️ Re-entrenar Modelo (GitHub Actions CI/CD)</h3>
        <p class="subtitle-small">Dispara el workflow ml_ci_cd con el dataset seleccionado arriba.</p>

        <div class="form-group full-width">
          <label>Token de GitHub (con permiso workflow):</label>
          <input type="password" [(ngModel)]="githubToken" name="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
        </div>

        <button type="button" class="btn-secondary" (click)="dispararReentrenamiento()" [disabled]="loadingRetrain">
          🚀 Re-entrenar Modelo ({{ selectedDataset }}%)
        </button>

        <div *ngIf="retrainMessage" class="status-box" [ngClass]="retrainSuccess ? 'status-success' : 'status-error'">
          {{ retrainMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  selectedDataset: '25' | '50' | '100' = '100';
  githubToken = '';
  resultado: string | null = null;
  loadingPredict = false;
  loadingRetrain = false;
  retrainMessage = '';
  retrainSuccess = false;

  // REEMPLAZA CON TUS URLS DE RENDER Y CLOUDINARY
  modelsConfig = {
    '25': {
      renderUrl: 'https://gym-xgboost-api-gym-25.onrender.com/score',
      datasetUrl: 'https://res.cloudinary.com/dzjnywhya/raw/upload/v1792544445/gym_25_vqoezy.csv',
      sha: 'gym-25'
    },
    '50': {
      renderUrl: 'https://gym-xgboost-api-gym-50.onrender.com/score',
      datasetUrl: 'https://res.cloudinary.com/dzjnywhya/raw/upload/v1792544456/gym_50_cdeiyh.csv',
      sha: 'gym-50'
    },
    '100': {
      renderUrl: 'https://gym-xgboost-api-gym-100.onrender.com/score',
      datasetUrl: 'https://res.cloudinary.com/dzjnywhya/raw/upload/v1792544463/gym_100_x4wzvb.csv',
      sha: 'gym-100'
    }
  };

  formData = {
    weight: 70.5,
    session_duration: 1.2,
    avg_bpm: 135.0,
    age: 25,
    max_bpm: 165.0,
    fat_percentage: 15.5,
    bmi: 24.0,
    experience_level: 2,
    workout_frequency: 4
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.githubToken = localStorage.getItem('gh_pat_token') || '';
  }

  calcularPrediccion() {
    this.loadingPredict = true;
    const url = this.modelsConfig[this.selectedDataset].renderUrl;
    this.http.post<{ score: number }>(url, this.formData).subscribe({
      next: (res) => {
        this.resultado = res.score.toFixed(2);
        this.loadingPredict = false;
      },
      error: (err) => {
        alert('Error al consultar Render: ' + err.message);
        this.loadingPredict = false;
      }
    });
  }

  dispararReentrenamiento() {
    if (!this.githubToken.trim()) {
      this.retrainSuccess = false;
      this.retrainMessage = '⚠️ Ingresa tu Token de GitHub.';
      return;
    }
    localStorage.setItem('gh_pat_token', this.githubToken.trim());
    this.loadingRetrain = true;

    const cfg = this.modelsConfig[this.selectedDataset];
    const url = 'https://api.github.com/repos/NullAceBeta/deploy-calories/dispatches';
    const headers = new HttpHeaders({
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${this.githubToken.trim()}`,
      'Content-Type': 'application/json'
    });
    const body = {
      event_type: 'ml_ci_cd',
      client_payload: { dataseturl: cfg.datasetUrl, sha: cfg.sha }
    };

    this.http.post(url, body, { headers, observe: 'response' }).subscribe({
      next: () => {
        this.retrainSuccess = true;
        this.retrainMessage = `✅ Workflow disparado con éxito para ${cfg.sha} (204 No Content). Revisa GitHub Actions.`;
        this.loadingRetrain = false;
      },
      error: (err) => {
        this.retrainSuccess = false;
        this.retrainMessage = `❌ Error al disparar workflow: ${err.message}`;
        this.loadingRetrain = false;
      }
    });
  }
}
