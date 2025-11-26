/**
 * Service de chargement unifié de toutes les données depuis Supabase
 * Charge toutes les données nécessaires au démarrage de l'application
 */

import {
  getDocumentsFromSupabase,
  getClientsFromSupabase,
  getSuppliersFromSupabase,
  getArticlesFromSupabase,
  getArticleCategoriesFromSupabase,
  getDischargesFromSupabase,
} from './dataService';
import type {
  CustomerDocument,
  Client,
  SupplierEntity,
  Article,
  ArticleCategory,
  Discharge,
} from '../contexts/DataContext';

export interface AllData {
  documents: CustomerDocument[];
  clients: Client[];
  suppliers: SupplierEntity[];
  articles: Article[];
  articleCategories: ArticleCategory[];
  discharges: Discharge[];
}

/**
 * Charge toutes les données depuis Supabase
 */
export async function loadAllDataFromSupabase(): Promise<AllData> {
  console.log('📥 Chargement de toutes les données depuis Supabase...');

  try {
    // Charger toutes les données en parallèle
    const [
      documents,
      clients,
      suppliers,
      articles,
      articleCategories,
      discharges,
    ] = await Promise.all([
      getDocumentsFromSupabase(),
      getClientsFromSupabase(),
      getSuppliersFromSupabase(),
      getArticlesFromSupabase(),
      getArticleCategoriesFromSupabase(),
      getDischargesFromSupabase(),
    ]);

    console.log('✅ Données chargées:', {
      documents: documents.length,
      clients: clients.length,
      suppliers: suppliers.length,
      articles: articles.length,
      categories: articleCategories.length,
      discharges: discharges.length,
    });

    return {
      documents,
      clients,
      suppliers,
      articles,
      articleCategories,
      discharges,
    };
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    // Retourner des tableaux vides en cas d'erreur
    return {
      documents: [],
      clients: [],
      suppliers: [],
      articles: [],
      articleCategories: [],
      discharges: [],
    };
  }
}

/**
 * Synchronise les données locales avec Supabase
 * Utilise un cache local pour améliorer les performances
 */
export class SupabaseDataSync {
  private cache: AllData | null = null;
  private lastSync: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Charge les données avec cache
   */
  async loadData(forceRefresh: boolean = false): Promise<AllData> {
    const now = Date.now();

    // Utiliser le cache si disponible et récent
    if (
      !forceRefresh &&
      this.cache &&
      now - this.lastSync < this.syncInterval
    ) {
      console.log('📦 Utilisation du cache');
      return this.cache;
    }

    // Charger depuis Supabase
    this.cache = await loadAllDataFromSupabase();
    this.lastSync = now;

    // Sauvegarder dans localStorage comme backup
    try {
      localStorage.setItem('ediba.supabase.cache', JSON.stringify({
        data: this.cache,
        timestamp: now,
      }));
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le cache:', error);
    }

    return this.cache;
  }

  /**
   * Invalide le cache
   */
  invalidateCache(): void {
    this.cache = null;
    this.lastSync = 0;
    localStorage.removeItem('ediba.supabase.cache');
  }

  /**
   * Charge depuis le cache localStorage si disponible
   */
  loadFromCache(): AllData | null {
    try {
      const cached = localStorage.getItem('ediba.supabase.cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Utiliser le cache s'il a moins de 5 minutes
        if (now - timestamp < this.syncInterval) {
          console.log('📦 Chargement depuis le cache localStorage');
          this.cache = data;
          this.lastSync = timestamp;
          return data;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement du cache:', error);
    }

    return null;
  }
}

// Instance singleton
export const dataSync = new SupabaseDataSync();

