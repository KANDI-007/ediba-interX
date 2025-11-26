/**
 * Service de gestion des données avec Supabase
 * Gère toutes les opérations CRUD pour tous les modules de l'application
 */

import { supabase } from '../lib/supabase';
import type {
  CustomerDocument,
  Client,
  SupplierEntity,
  SupplierInvoice,
  Discharge,
  Article,
  ArticleCategory,
  ArticleLot,
  BankAccount,
  LineItem,
} from '../contexts/DataContext';

// ============================================================================
// DOCUMENTS (Factures, Devis, BL, etc.)
// ============================================================================

export interface SupabaseDocument {
  id: string;
  type: 'proforma' | 'bl' | 'invoice' | 'acompte' | 'solde';
  reference: string;
  client_id: string | null;
  date_creation: string;
  date_echeance: string | null;
  tva: number;
  statut: 'validated' | 'paid' | 'partial' | 'overdue' | 'pending';
  workflow_status: 'draft' | 'validated' | 'ordered' | 'delivered' | 'invoiced' | 'completed';
  parent_document_id: string | null;
  order_number: string | null;
  contract_order_reference: string | null;
  objet: string;
  total_ht: number;
  total_ttc: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseLineItem {
  id: string;
  document_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_ht: number;
  received_quantity: number;
  created_at: string;
}

/**
 * Sauvegarde un document dans Supabase
 */
export async function saveDocumentToSupabase(
  document: Omit<CustomerDocument, 'id' | 'reference'>,
  userId?: string
): Promise<CustomerDocument | null> {
  try {
    // Trouver ou créer le client
    let clientId: string | null = null;
    if (document.client) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('raison_sociale', document.client)
        .single();
      
      if (clientData) {
        clientId = clientData.id;
      }
    }

    // Générer la référence si nécessaire
    const reference = document.reference || generateDocumentReference(document.type);

    // Insérer le document
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          type: mapDocumentType(document.type),
          reference,
          client_id: clientId,
          date_creation: document.date,
          date_echeance: document.dueDate || null,
          tva: document.tva,
          statut: document.status,
          workflow_status: document.workflowStatus || 'draft',
          parent_document_id: document.parentDocumentId || null,
          order_number: document.orderNumber || null,
          contract_order_reference: document.contractOrderReference || null,
          objet: 'CONSOMMABLE',
          total_ht: calculateTotalHT(document.items),
          total_ttc: calculateTotalTTC(document.items, document.tva),
          created_by: userId || null,
        },
      ])
      .select()
      .single();

    if (docError || !docData) {
      console.error('❌ Erreur lors de la sauvegarde du document:', docError);
      return null;
    }

    // Insérer les lignes du document
    if (document.items && document.items.length > 0) {
      const lineItems = document.items.map((item) => ({
        document_id: docData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_ht: item.quantity * item.unitPrice,
        received_quantity: item.receivedQuantity || 0,
      }));

      const { error: itemsError } = await supabase
        .from('line_items')
        .insert(lineItems);

      if (itemsError) {
        console.error('❌ Erreur lors de la sauvegarde des lignes:', itemsError);
      }
    }

    // Insérer les paiements si présents
    if (document.payments && document.payments.length > 0) {
      const payments = document.payments.map((payment) => ({
        document_id: docData.id,
        amount: payment.amount,
        payment_date: payment.date,
        payment_method: 'Espèces', // Par défaut
        note: payment.note || null,
        created_by: userId || null,
      }));

      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(payments);

      if (paymentsError) {
        console.error('❌ Erreur lors de la sauvegarde des paiements:', paymentsError);
      }
    }

    // Convertir en format CustomerDocument
    return convertSupabaseDocumentToCustomerDocument(docData);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du document:', error);
    return null;
  }
}

/**
 * Récupère tous les documents depuis Supabase
 */
export async function getDocumentsFromSupabase(): Promise<CustomerDocument[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        clients (
          id,
          raison_sociale,
          adresse,
          ville
        ),
        line_items (*),
        payments (*)
      `)
      .order('date_creation', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des documents:', error);
      return [];
    }

    return (data || []).map(convertSupabaseDocumentToCustomerDocument);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des documents:', error);
    return [];
  }
}

/**
 * Met à jour un document dans Supabase
 */
export async function updateDocumentInSupabase(
  id: string,
  updates: Partial<CustomerDocument>
): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (updates.status) updateData.statut = updates.status;
    if (updates.workflowStatus) updateData.workflow_status = updates.workflowStatus;
    if (updates.date) updateData.date_creation = updates.date;
    if (updates.dueDate) updateData.date_echeance = updates.dueDate;
    if (updates.tva !== undefined) updateData.tva = updates.tva;
    if (updates.orderNumber) updateData.order_number = updates.orderNumber;
    if (updates.contractOrderReference) updateData.contract_order_reference = updates.contractOrderReference;
    
    updateData.updated_at = new Date().toISOString();

    // Mettre à jour les totaux si les items ont changé
    if (updates.items) {
      updateData.total_ht = calculateTotalHT(updates.items);
      updateData.total_ttc = calculateTotalTTC(updates.items, updates.tva || 18.5);
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du document:', error);
      return false;
    }

    // Mettre à jour les lignes si nécessaire
    if (updates.items) {
      // Supprimer les anciennes lignes
      await supabase.from('line_items').delete().eq('document_id', id);
      
      // Insérer les nouvelles lignes
      const lineItems = updates.items.map((item) => ({
        document_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_ht: item.quantity * item.unitPrice,
        received_quantity: item.receivedQuantity || 0,
      }));

      await supabase.from('line_items').insert(lineItems);
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du document:', error);
    return false;
  }
}

/**
 * Supprime un document dans Supabase
 */
export async function deleteDocumentFromSupabase(id: string): Promise<boolean> {
  try {
    // Les line_items et payments seront supprimés automatiquement via CASCADE
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur lors de la suppression du document:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du document:', error);
    return false;
  }
}

// ============================================================================
// CLIENTS
// ============================================================================

/**
 * Sauvegarde un client dans Supabase
 */
export async function saveClientToSupabase(
  client: Omit<Client, 'id'>
): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          raison_sociale: client.raisonSociale,
          nom_commercial: client.nomCommercial || null,
          nif: client.nif,
          rccm: client.rccm || null,
          adresse: client.adresse,
          ville: client.ville,
          telephone: client.telephone,
          email: client.email,
          contact_principal: client.contactPrincipal,
          secteur_activite: client.secteurActivite,
          regime_fiscal: client.regimeFiscal,
          delai_paiement: client.delaiPaiement,
          remise: client.remise,
          limite_credit: client.limiteCredit,
          statut: client.statut,
          date_creation: client.dateCreation,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Erreur lors de la sauvegarde du client:', error);
      return null;
    }

    return convertSupabaseClientToClient(data);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du client:', error);
    return null;
  }
}

/**
 * Récupère tous les clients depuis Supabase
 */
export async function getClientsFromSupabase(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('raison_sociale', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des clients:', error);
      return [];
    }

    return (data || []).map(convertSupabaseClientToClient);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des clients:', error);
    return [];
  }
}

/**
 * Met à jour un client dans Supabase
 */
export async function updateClientInSupabase(
  id: string,
  updates: Partial<Client>
): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (updates.raisonSociale) updateData.raison_sociale = updates.raisonSociale;
    if (updates.nomCommercial) updateData.nom_commercial = updates.nomCommercial;
    if (updates.nif) updateData.nif = updates.nif;
    if (updates.rccm) updateData.rccm = updates.rccm;
    if (updates.adresse) updateData.adresse = updates.adresse;
    if (updates.ville) updateData.ville = updates.ville;
    if (updates.telephone) updateData.telephone = updates.telephone;
    if (updates.email) updateData.email = updates.email;
    if (updates.contactPrincipal) updateData.contact_principal = updates.contactPrincipal;
    if (updates.secteurActivite) updateData.secteur_activite = updates.secteurActivite;
    if (updates.regimeFiscal) updateData.regime_fiscal = updates.regimeFiscal;
    if (updates.delaiPaiement !== undefined) updateData.delai_paiement = updates.delaiPaiement;
    if (updates.remise !== undefined) updateData.remise = updates.remise;
    if (updates.limiteCredit !== undefined) updateData.limite_credit = updates.limiteCredit;
    if (updates.statut) updateData.statut = updates.statut;
    
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du client:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du client:', error);
    return false;
  }
}

/**
 * Supprime un client dans Supabase
 */
export async function deleteClientFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur lors de la suppression du client:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du client:', error);
    return false;
  }
}

// ============================================================================
// FOURNISSEURS
// ============================================================================

/**
 * Sauvegarde un fournisseur dans Supabase
 */
export async function saveSupplierToSupabase(
  supplier: Omit<SupplierEntity, 'id'>
): Promise<SupplierEntity | null> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          raison_sociale: supplier.raisonSociale,
          nom_commercial: supplier.nomCommercial || null,
          nif: supplier.nif,
          rccm: supplier.rccm || null,
          adresse: supplier.adresse || '',
          ville: supplier.adresse?.split(',')[supplier.adresse.split(',').length - 1]?.trim() || 'Lomé',
          telephone: supplier.telephone || '',
          email: supplier.email || null,
          contact_principal: supplier.articles?.[0]?.name || null,
          secteur_activite: supplier.groupeFour || null,
          delai_paiement: supplier.delaiPaiement || '30 jours',
          remise: supplier.remise || '0%',
          statut: 'actif',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Erreur lors de la sauvegarde du fournisseur:', error);
      return null;
    }

    return convertSupabaseSupplierToSupplier(data);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du fournisseur:', error);
    return null;
  }
}

/**
 * Récupère tous les fournisseurs depuis Supabase
 */
export async function getSuppliersFromSupabase(): Promise<SupplierEntity[]> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('raison_sociale', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des fournisseurs:', error);
      return [];
    }

    return (data || []).map(convertSupabaseSupplierToSupplier);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des fournisseurs:', error);
    return [];
  }
}

// ============================================================================
// ARTICLES ET CATÉGORIES
// ============================================================================

/**
 * Sauvegarde un article dans Supabase
 */
export async function saveArticleToSupabase(
  article: Omit<Article, 'id' | 'dateCreation' | 'lastUpdated'>
): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          name: article.name,
          description: article.description || null,
          sku: article.sku || null,
          unit_price: article.unitPrice || null,
          category_id: article.categoryId || null,
          stock: 0,
          min_stock: 0,
          max_stock: 0,
          unit: 'pièce',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Erreur lors de la sauvegarde de l\'article:', error);
      return null;
    }

    return convertSupabaseArticleToArticle(data);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'article:', error);
    return null;
  }
}

/**
 * Récupère tous les articles depuis Supabase
 */
export async function getArticlesFromSupabase(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        article_categories (
          id,
          name,
          description
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des articles:', error);
      return [];
    }

    return (data || []).map(convertSupabaseArticleToArticle);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des articles:', error);
    return [];
  }
}

/**
 * Récupère toutes les catégories d'articles depuis Supabase
 */
export async function getArticleCategoriesFromSupabase(): Promise<ArticleCategory[]> {
  try {
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des catégories:', error);
      return [];
    }

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: '📦',
      color: '#3b82f6',
      parentId: cat.parent_id || undefined,
      dateCreation: cat.created_at,
    }));
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error);
    return [];
  }
}

// ============================================================================
// DÉCHARGES
// ============================================================================

/**
 * Sauvegarde une décharge dans Supabase
 */
export async function saveDischargeToSupabase(
  discharge: Omit<Discharge, 'id'>,
  userId?: string
): Promise<Discharge | null> {
  try {
    const { data, error } = await supabase
      .from('discharges')
      .insert([
        {
          prestataire: discharge.prestataire,
          prestation: discharge.service,
          date_prestation: discharge.datePrestation,
          lieu: discharge.lieu,
          objet: 'CONSOMMABLE',
          signature_data: discharge.signature || null,
          created_by: userId || null,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Erreur lors de la sauvegarde de la décharge:', error);
      return null;
    }

    return convertSupabaseDischargeToDischarge(data);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la décharge:', error);
    return null;
  }
}

/**
 * Récupère toutes les décharges depuis Supabase
 */
export async function getDischargesFromSupabase(): Promise<Discharge[]> {
  try {
    const { data, error } = await supabase
      .from('discharges')
      .select('*')
      .order('date_prestation', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des décharges:', error);
      return [];
    }

    return (data || []).map(convertSupabaseDischargeToDischarge);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des décharges:', error);
    return [];
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES DE CONVERSION
// ============================================================================

function mapDocumentType(type: string): 'proforma' | 'bl' | 'invoice' | 'acompte' | 'solde' {
  const mapping: Record<string, 'proforma' | 'bl' | 'invoice' | 'acompte' | 'solde'> = {
    'proforma': 'proforma',
    'delivery': 'bl',
    'invoice': 'invoice',
    'contract': 'proforma',
    'order': 'proforma',
  };
  return mapping[type] || 'proforma';
}

function generateDocumentReference(type: string): string {
  const year = new Date().getFullYear();
  const prefix = type === 'proforma' ? 'PROFORMA' : type === 'delivery' ? 'BL' : 'FACTURE';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix} ${year}-${random}`;
}

function calculateTotalHT(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function calculateTotalTTC(items: LineItem[], tva: number): number {
  const ht = calculateTotalHT(items);
  return ht * (1 + tva / 100);
}

function convertSupabaseDocumentToCustomerDocument(doc: any): CustomerDocument {
  return {
    id: doc.id,
    type: doc.type === 'bl' ? 'delivery' : doc.type === 'proforma' ? 'proforma' : 'invoice',
    reference: doc.reference,
    date: doc.date_creation,
    dueDate: doc.date_echeance || undefined,
    client: doc.clients?.raison_sociale || '',
    address: doc.clients?.adresse || undefined,
    city: doc.clients?.ville || undefined,
    tva: doc.tva,
    items: (doc.line_items || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      receivedQuantity: item.received_quantity,
    })),
    status: doc.statut,
    workflowStatus: doc.workflow_status,
    parentDocumentId: doc.parent_document_id || undefined,
    orderNumber: doc.order_number || undefined,
    contractOrderReference: doc.contract_order_reference || undefined,
    payments: (doc.payments || []).map((p: any) => ({
      date: p.payment_date,
      amount: p.amount,
      note: p.note || undefined,
    })),
  };
}

function convertSupabaseClientToClient(client: any): Client {
  return {
    id: client.id,
    type: 'Societe',
    raisonSociale: client.raison_sociale,
    nomCommercial: client.nom_commercial || undefined,
    nif: client.nif,
    rccm: client.rccm || undefined,
    adresse: client.adresse,
    ville: client.ville,
    telephone: client.telephone,
    email: client.email || '',
    contactPrincipal: client.contact_principal || '',
    secteurActivite: client.secteur_activite || '',
    regimeFiscal: client.regime_fiscal || 'Réel Normal',
    classification: 'National',
    delaiPaiement: client.delai_paiement || 30,
    remise: client.remise || 0,
    limiteCredit: client.limite_credit || 0,
    statut: client.statut || 'actif',
    dateCreation: client.date_creation || client.created_at,
    derniereFacture: client.derniere_facture || undefined,
    totalFacture: client.total_facture || 0,
    totalEncaissement: client.total_encaissement || 0,
    soldeImpaye: client.solde_impaye || 0,
    nombreFactures: client.nombre_factures || 0,
  };
}

function convertSupabaseSupplierToSupplier(supplier: any): SupplierEntity {
  return {
    id: supplier.id,
    type: 'Societe',
    raisonSociale: supplier.raison_sociale,
    nomCommercial: supplier.nom_commercial || undefined,
    nif: supplier.nif,
    rccm: supplier.rccm || undefined,
    adresse: supplier.adresse || '',
    telephone: supplier.telephone || '',
    email: supplier.email || undefined,
    regimeFiscal: 'Réel Normal',
    classification: 'National',
    groupeFour: supplier.secteur_activite || undefined,
    delaiPaiement: supplier.delai_paiement || '30 jours',
    remise: supplier.remise || '0%',
  };
}

function convertSupabaseArticleToArticle(article: any): Article {
  return {
    id: article.id,
    name: article.name,
    description: article.description || undefined,
    unitPrice: article.unit_price || undefined,
    categoryId: article.category_id || undefined,
    sku: article.sku || undefined,
    dateCreation: article.created_at,
    lastUpdated: article.updated_at || article.created_at,
  };
}

function convertSupabaseDischargeToDischarge(discharge: any): Discharge {
  return {
    id: discharge.id,
    prestataire: discharge.prestataire,
    service: discharge.prestation,
    montant: 0, // Non stocké dans Supabase actuellement
    dateCreation: discharge.created_at,
    datePrestation: discharge.date_prestation,
    lieu: discharge.lieu,
    statut: 'pending',
    telephone: '',
    cni: '',
    signature: discharge.signature_data || undefined,
  };
}

