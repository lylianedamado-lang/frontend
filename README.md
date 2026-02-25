# DataClean - Frontend Angular

Frontend Angular 18 pour l'API de nettoyage de données Flask.

## Prérequis

- Node.js 18+
- Angular CLI 18 (`npm install -g @angular/cli@18`)

## Installation

```bash
git clone <repo-url>
cd data-cleaning-frontend
npm install
```

## Configuration

### Environnement local (développement)

Modifiez `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:5000'
};
```

### Environnement production (Render)

Modifiez `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-api.onrender.com'  // Remplacez par votre URL Render
};
```

## Lancement

```bash
# Développement
ng serve

# L'app sera disponible sur http://localhost:4200
```

## Build Production

```bash
ng build --configuration production
```

## Structure du projet

```
src/app/
├── components/navbar/        # Barre de navigation
├── guards/auth.guard.ts      # Protection des routes
├── models/models.ts          # Interfaces TypeScript
├── pages/
│   ├── login/                # Page de connexion
│   ├── register/             # Page d'inscription (validation mot de passe)
│   ├── dashboard/            # Upload + nettoyage + résultats
│   └── history/              # Historique des nettoyages
├── services/
│   ├── auth.service.ts       # Login, register, logout, me
│   └── cleaning.service.ts   # Clean, download, history
└── environments/             # Config dev / prod
```

## Fonctionnalités

- Authentification par session cookie
- Upload drag and drop (CSV, Excel, JSON, XML)
- Options de normalisation (Min-Max, Z-Score, Robust)
- Statistiques avant/après nettoyage
- Téléchargement du fichier nettoyé
- Historique complet des nettoyages
- Design Bootstrap 5 avec thème bleu/gradient
