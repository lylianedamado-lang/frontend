export interface User {
  id?: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export type PrimitiveStat = string | number | boolean | null;

export interface CleaningStats {
  [key: string]: PrimitiveStat | CleaningStats;
}

export interface CleaningResult {
  statistiques_avant: CleaningStats;
  statistiques_apres: CleaningStats;
  download_url: string;
  fichier_sortie?: string;
}

export interface HistoryItem {
  original_filename: string;
  cleaned_at: string;
  file_id: string;
}
