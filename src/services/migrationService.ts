/**
 * Service de migration des données depuis localStorage vers Supabase
 * Permet de migrer toutes les données existantes vers la base de données
 */

import { supabase } from '../lib/supabase';
import {
  saveDocumentToSupabase,
  saveClientToSupabase,
  saveSupplierToSupabase,
  saveArticleToSupabase,
  saveDischargeToSupabase,
  getArticleCategoriesFromSupabase,
} from './dataService';
import type {
  CustomerDocument,
  Client,
  SupplierEntity,
  Article,
  Discharge,
  ArticleCategory,
} from '../contexts/DataContext';

const STORAGE_KEY = 'ediba.data.v1';

interface LocalStorageData {
  documents?: CustomerDocument[];
  clients?: Client[];
  suppliersList?: SupplierEntity[];
  supplierInvoices?: any[];
  discharges?: Discharge[];
  articlesDirectory?: any[];
  articleCategories?: ArticleCategory[];
  articleLots?: any[];
  articles?: Article[];
  contractOrders?: any[];
  bankAccounts?: any[];
}

/**
 * Migre toutes les données depuis localStorage vers Supabase
 */
export async function migrateAllDataToSupabase(userId?: string): Promise<{
  success: boolean;
  migrated: {
    documents: number;
    clients: number;
    suppliers: number;
    articles: number;
    categories: number;
    discharges: number;
  };
  errors: string[];
}> {
  const result = {
    success: true,
    migrated: {
      documents: 0,
      clients: 0,
      suppliers: 0,
      articles: 0,
      categories: 0,
      discharges: 0,
    },
    errors: [] as string[],
  };

  try {
    // Récupérer les données depuis localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.warn('⚠️ Aucune donnée à migrer depuis localStorage');
      return result;
    }

    const data: LocalStorageData = JSON.parse(raw);
    console.log('📦 Données à migrer:', data);

    // Migrer les clients
    if (data.clients && data.clients.length > 0) {
      console.log(`📤 Migration de ${data.clients.length} clients...`);
      for (const client of data.clients) {
        try {
          const saved = await saveClientToSupabase(client);
          if (saved) {
            result.migrated.clients++;
          } else {
            result.errors.push(`Erreur migration client: ${client.raisonSociale}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration client ${client.raisonSociale}: ${error.message}`);
        }
      }
    }

    // Migrer les fournisseurs
    if (data.suppliersList && data.suppliersList.length > 0) {
      console.log(`📤 Migration de ${data.suppliersList.length} fournisseurs...`);
      for (const supplier of data.suppliersList) {
        try {
          const saved = await saveSupplierToSupabase(supplier);
          if (saved) {
            result.migrated.suppliers++;
          } else {
            result.errors.push(`Erreur migration fournisseur: ${supplier.raisonSociale}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration fournisseur ${supplier.raisonSociale}: ${error.message}`);
        }
      }
    }

    // Migrer les catégories d'articles
    if (data.articleCategories && data.articleCategories.length > 0) {
      console.log(`📤 Migration de ${data.articleCategories.length} catégories...`);
      for (const category of data.articleCategories) {
        try {
          const { error } = await supabase
            .from('article_categories')
            .insert([
              {
                name: category.name,
                description: category.description || null,
                parent_id: category.parentId || null,
              },
            ]);

          if (!error) {
            result.migrated.categories++;
          } else {
            result.errors.push(`Erreur migration catégorie ${category.name}: ${error.message}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration catégorie ${category.name}: ${error.message}`);
        }
      }
    }

    // Migrer les articles
    if (data.articles && data.articles.length > 0) {
      console.log(`📤 Migration de ${data.articles.length} articles...`);
      for (const article of data.articles) {
        try {
          const saved = await saveArticleToSupabase(article);
          if (saved) {
            result.migrated.articles++;
          } else {
            result.errors.push(`Erreur migration article: ${article.name}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration article ${article.name}: ${error.message}`);
        }
      }
    }

    // Migrer les documents (factures, devis, BL)
    if (data.documents && data.documents.length > 0) {
      console.log(`📤 Migration de ${data.documents.length} documents...`);
      for (const document of data.documents) {
        try {
          const saved = await saveDocumentToSupabase(document, userId);
          if (saved) {
            result.migrated.documents++;
          } else {
            result.errors.push(`Erreur migration document: ${document.reference}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration document ${document.reference}: ${error.message}`);
        }
      }
    }

    // Migrer les décharges
    if (data.discharges && data.discharges.length > 0) {
      console.log(`📤 Migration de ${data.discharges.length} décharges...`);
      for (const discharge of data.discharges) {
        try {
          const saved = await saveDischargeToSupabase(discharge, userId);
          if (saved) {
            result.migrated.discharges++;
          } else {
            result.errors.push(`Erreur migration décharge: ${discharge.prestataire}`);
          }
        } catch (error: any) {
          result.errors.push(`Erreur migration décharge ${discharge.prestataire}: ${error.message}`);
        }
      }
    }

    console.log('✅ Migration terminée:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error);
    result.success = false;
    result.errors.push(`Erreur générale: ${error.message}`);
    return result;
  }
}

/**
 * Vérifie si une migration est nécessaire
 */
export async function checkMigrationNeeded(): Promise<boolean> {
  try {
    // Vérifier si des données existent dans localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }

    // Vérifier si des données existent déjà dans Supabase
    const { data: clients } = await supabase.from('clients').select('id').limit(1);
    const { data: documents } = await supabase.from('documents').select('id').limit(1);

    // Si localStorage a des données mais Supabase est vide, migration nécessaire
    if (clients && clients.length === 0 && documents && documents.length === 0) {
      const data = JSON.parse(raw);
      return !!(data.clients?.length || data.documents?.length || data.suppliersList?.length);
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de migration:', error);
    return false;
  }
}

/**
 * Marque la migration comme effectuée
 */
export function markMigrationAsDone(): void {
  localStorage.setItem('ediba.migration.done', 'true');
  localStorage.setItem('ediba.migration.date', new Date().toISOString());
}

/**
 * Vérifie si la migration a déjà été effectuée
 */
export function isMigrationDone(): boolean {
  return localStorage.getItem('ediba.migration.done') === 'true';
}

