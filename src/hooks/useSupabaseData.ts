/**
 * Hook personnalisé pour intégrer Supabase dans DataContext
 * Gère le chargement et la sauvegarde des données avec Supabase
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadAllDataFromSupabase,
  dataSync,
} from '../services/supabaseDataLoader';
import {
  saveDocumentToSupabase,
  updateDocumentInSupabase,
  deleteDocumentFromSupabase,
  saveClientToSupabase,
  updateClientInSupabase,
  deleteClientFromSupabase,
  saveSupplierToSupabase,
  saveArticleToSupabase,
  saveDischargeToSupabase,
  getArticleCategoriesFromSupabase,
} from '../services/dataService';
import {
  checkMigrationNeeded,
  migrateAllDataToSupabase,
  isMigrationDone,
  markMigrationAsDone,
} from '../services/migrationService';
import type {
  CustomerDocument,
  Client,
  SupplierEntity,
  Article,
  Discharge,
  ArticleCategory,
} from '../contexts/DataContext';

export interface UseSupabaseDataReturn {
  // Données
  documents: CustomerDocument[];
  clients: Client[];
  suppliers: SupplierEntity[];
  articles: Article[];
  articleCategories: ArticleCategory[];
  discharges: Discharge[];
  
  // État de chargement
  isLoading: boolean;
  isMigrating: boolean;
  migrationResult: any;
  
  // Fonctions de sauvegarde
  saveDocument: (doc: Omit<CustomerDocument, 'id' | 'reference'>) => Promise<CustomerDocument | null>;
  updateDocument: (id: string, updates: Partial<CustomerDocument>) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  
  saveClient: (client: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  saveSupplier: (supplier: Omit<SupplierEntity, 'id'>) => Promise<SupplierEntity | null>;
  saveArticle: (article: Omit<Article, 'id' | 'dateCreation' | 'lastUpdated'>) => Promise<Article | null>;
  saveDischarge: (discharge: Omit<Discharge, 'id'>) => Promise<Discharge | null>;
  
  // Fonctions utilitaires
  refreshData: () => Promise<void>;
  forceMigration: () => Promise<void>;
}

export function useSupabaseData(): UseSupabaseDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState({
    documents: [] as CustomerDocument[],
    clients: [] as Client[],
    suppliers: [] as SupplierEntity[],
    articles: [] as Article[],
    articleCategories: [] as ArticleCategory[],
    discharges: [] as Discharge[],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // Charger les données depuis Supabase
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Essayer de charger depuis le cache d'abord
      if (!forceRefresh) {
        const cached = dataSync.loadFromCache();
        if (cached) {
          setData(cached);
          setIsLoading(false);
          // Charger en arrière-plan pour mettre à jour
          dataSync.loadData(true).then(setData);
          return;
        }
      }
      
      // Charger depuis Supabase
      const loaded = await dataSync.loadData(forceRefresh);
      setData(loaded);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier et effectuer la migration si nécessaire
  const checkAndMigrate = useCallback(async () => {
    if (isMigrationDone()) {
      return;
    }

    try {
      const needsMigration = await checkMigrationNeeded();
      if (needsMigration && user) {
        setIsMigrating(true);
        console.log('🔄 Migration des données depuis localStorage...');
        
        const result = await migrateAllDataToSupabase(user.id);
        setMigrationResult(result);
        
        if (result.success) {
          markMigrationAsDone();
          console.log('✅ Migration terminée:', result.migrated);
          // Recharger les données après migration
          await loadData(true);
        } else {
          console.error('❌ Erreurs lors de la migration:', result.errors);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
    } finally {
      setIsMigrating(false);
    }
  }, [user, loadData]);

  // Charger les données au montage
  useEffect(() => {
    loadData();
    checkAndMigrate();
  }, [loadData, checkAndMigrate]);

  // Fonctions de sauvegarde
  const saveDocument = useCallback(async (
    doc: Omit<CustomerDocument, 'id' | 'reference'>
  ): Promise<CustomerDocument | null> => {
    try {
      const saved = await saveDocumentToSupabase(doc, user?.id);
      if (saved) {
        setData(prev => ({
          ...prev,
          documents: [saved, ...prev.documents],
        }));
        // Invalider le cache
        dataSync.invalidateCache();
      }
      return saved;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du document:', error);
      return null;
    }
  }, [user]);

  const updateDocument = useCallback(async (
    id: string,
    updates: Partial<CustomerDocument>
  ): Promise<boolean> => {
    try {
      const success = await updateDocumentInSupabase(id, updates);
      if (success) {
        setData(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === id ? { ...d, ...updates } : d),
        }));
        dataSync.invalidateCache();
      }
      return success;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du document:', error);
      return false;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deleteDocumentFromSupabase(id);
      if (success) {
        setData(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== id),
        }));
        dataSync.invalidateCache();
      }
      return success;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du document:', error);
      return false;
    }
  }, []);

  const saveClient = useCallback(async (
    client: Omit<Client, 'id'>
  ): Promise<Client | null> => {
    try {
      const saved = await saveClientToSupabase(client);
      if (saved) {
        setData(prev => ({
          ...prev,
          clients: [saved, ...prev.clients],
        }));
        dataSync.invalidateCache();
      }
      return saved;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du client:', error);
      return null;
    }
  }, []);

  const updateClient = useCallback(async (
    id: string,
    updates: Partial<Client>
  ): Promise<boolean> => {
    try {
      const success = await updateClientInSupabase(id, updates);
      if (success) {
        setData(prev => ({
          ...prev,
          clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
        dataSync.invalidateCache();
      }
      return success;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du client:', error);
      return false;
    }
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deleteClientFromSupabase(id);
      if (success) {
        setData(prev => ({
          ...prev,
          clients: prev.clients.filter(c => c.id !== id),
        }));
        dataSync.invalidateCache();
      }
      return success;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du client:', error);
      return false;
    }
  }, []);

  const saveSupplier = useCallback(async (
    supplier: Omit<SupplierEntity, 'id'>
  ): Promise<SupplierEntity | null> => {
    try {
      const saved = await saveSupplierToSupabase(supplier);
      if (saved) {
        setData(prev => ({
          ...prev,
          suppliers: [saved, ...prev.suppliers],
        }));
        dataSync.invalidateCache();
      }
      return saved;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du fournisseur:', error);
      return null;
    }
  }, []);

  const saveArticle = useCallback(async (
    article: Omit<Article, 'id' | 'dateCreation' | 'lastUpdated'>
  ): Promise<Article | null> => {
    try {
      const saved = await saveArticleToSupabase(article);
      if (saved) {
        setData(prev => ({
          ...prev,
          articles: [saved, ...prev.articles],
        }));
        dataSync.invalidateCache();
      }
      return saved;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'article:', error);
      return null;
    }
  }, []);

  const saveDischarge = useCallback(async (
    discharge: Omit<Discharge, 'id'>
  ): Promise<Discharge | null> => {
    try {
      const saved = await saveDischargeToSupabase(discharge, user?.id);
      if (saved) {
        setData(prev => ({
          ...prev,
          discharges: [saved, ...prev.discharges],
        }));
        dataSync.invalidateCache();
      }
      return saved;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la décharge:', error);
      return null;
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const forceMigration = useCallback(async () => {
    if (user) {
      setIsMigrating(true);
      const result = await migrateAllDataToSupabase(user.id);
      setMigrationResult(result);
      setIsMigrating(false);
      if (result.success) {
        await loadData(true);
      }
    }
  }, [user, loadData]);

  return {
    // Données
    documents: data.documents,
    clients: data.clients,
    suppliers: data.suppliers,
    articles: data.articles,
    articleCategories: data.articleCategories,
    discharges: data.discharges,
    
    // État
    isLoading,
    isMigrating,
    migrationResult,
    
    // Fonctions
    saveDocument,
    updateDocument,
    deleteDocument,
    saveClient,
    updateClient,
    deleteClient,
    saveSupplier,
    saveArticle,
    saveDischarge,
    refreshData,
    forceMigration,
  };
}

