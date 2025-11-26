import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
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
  getDocumentsFromSupabase,
  getClientsFromSupabase,
  getSuppliersFromSupabase,
  getArticlesFromSupabase,
  getArticleCategoriesFromSupabase,
  getDischargesFromSupabase,
} from '../services/dataService';
import {
  checkMigrationNeeded,
  migrateAllDataToSupabase,
  isMigrationDone,
  markMigrationAsDone,
} from '../services/migrationService';
import { checkSupabaseConnection } from '../lib/supabase';
import { useAuth } from './AuthContext';
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
  getDocumentsFromSupabase,
  getClientsFromSupabase,
  getSuppliersFromSupabase,
  getArticlesFromSupabase,
  getArticleCategoriesFromSupabase,
  getDischargesFromSupabase,
} from '../services/dataService';
import {
  checkMigrationNeeded,
  migrateAllDataToSupabase,
  isMigrationDone,
  markMigrationAsDone,
} from '../services/migrationService';
import { checkSupabaseConnection } from '../lib/supabase';

export type DocumentType = 'proforma' | 'delivery' | 'invoice' | 'contract' | 'order';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  // Pour les BL: quantité réellement reçue (indépendante de la quantité commandée)
  receivedQuantity?: number;
}

export interface CustomerDocument {
  id: string; // human number e.g. FACTURE PROFORMA N°2025-0001
  type: DocumentType;
  reference: string; // raw numeric ref
  date: string; // ISO yyyy-mm-dd
  dueDate?: string; // ISO due date
  client: string;
  address?: string;
  city?: string;
  tva: number; // percent
  items: LineItem[];
  status: 'validated' | 'paid' | 'partial' | 'overdue' | 'pending';
  sourceId?: string; // link to contract/proforma for BL or invoice
  payments?: { date: string; amount: number; note?: string }[];
  paymentTermsDays?: number; // e.g., 15, 30, 0 (comptant)
  // Workflow intégré
  workflowStatus?: 'draft' | 'validated' | 'ordered' | 'delivered' | 'invoiced' | 'completed';
  parentDocumentId?: string; // Document parent dans le workflow
  childDocuments?: string[]; // Documents enfants créés
  orderNumber?: string; // Numéro de commande attribué
  contractTerms?: {
    deliveryDate?: string;
    warrantyPeriod?: string;
    specialConditions?: string;
    paymentSchedule?: { date: string; amount: number; description: string }[];
  };
  // Nouveau: Référence à la lettre de commande ou contrat
  contractOrderReference?: string; // LETTRE DE COMMANDE N° ou CONTRAT N°
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber?: string;
  supplierName: string;
  nif?: string;
  date: string;
  ht: number;
  tva: number;
  ttc: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface SupplierArticle {
  id: string;
  name: string;
  unitPrice: number;
  taxRate: number; // percent
}

export interface SupplierEntity {
  id: string;
  type?: 'Societe' | 'Particulier'; // Type de fournisseur
  raisonSociale: string;
  nif: string;
  rccm?: string;
  adresse?: string; // Adresse complète incluant quartier, ville, etc.
  telephone?: string;
  email?: string;
  regimeFiscal?: 'Réel avec TVA' | 'Exonéré de la TVA' | 'Sans TVA' | 'Réel Normal' | 'Réel Simplifié' | 'Forfait'; // Nouveaux régimes + compatibilité
  classification?: 'National' | 'Particulier' | 'Etranger'; // Classification du fournisseur
  groupeFour?: string; // Groupe fournisseur / Catégorie d'activité
  produits?: string[]; // legacy
  articles?: SupplierArticle[];
  delaiPaiement?: string; // e.g., '30 jours'
  remise?: string; // e.g., '5%'
}

export interface Client {
  id: string;
  type: 'Societe' | 'ONG' | 'Particulier'; // Type de client
  raisonSociale: string;
  nomCommercial?: string;
  nif: string; // Peut être vide
  rccm?: string;
  adresse: string; // Adresse complète incluant quartier, BP, etc.
  ville: string;
  telephone: string;
  email: string;
  contactPrincipal: string;
  secteurActivite: string;
  regimeFiscal: 'Réel avec TVA' | 'Exonéré de la TVA' | 'Sans TVA' | 'Réel Normal' | 'Réel Simplifié' | 'Forfait'; // Nouveaux régimes + compatibilité
  classification: 'National' | 'Particulier'; // Classification du client
  delaiPaiement: number; // en jours
  remise: number; // en pourcentage
  limiteCredit: number;
  statut: 'actif' | 'inactif' | 'suspendu';
  dateCreation: string;
  derniereFacture?: string;
  totalFacture: number;
  totalEncaissement: number;
  soldeImpaye: number;
  nombreFactures: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: 'Courant' | 'Épargne' | 'Professionnel' | 'Autre';
  currency: string;
  swiftCode?: string;
  iban?: string;
  branchCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discharge {
  id: string;
  prestataire: string;
  service: string;
  montant: number;
  dateCreation: string;
  datePrestation: string;
  lieu: string;
  statut: 'pending' | 'signed' | 'completed' | 'overdue';
  telephone: string;
  cni: string;
  signature?: string; // Base64 signature data
  signedBy?: string; // Nom de la personne qui a signé
  signedAt?: string; // Date de signature
}

export interface ContractOrder {
  id: string;
  documentType: 'contract' | 'order';
  documentNumber: string;
  date: string;
  authorizingReference: string;
  awardee: string;
  taxId: string;
  amount: number;
  amountInWords: string;
  warrantyPeriod: number;
  warrantyRetention: number;
  performanceGuarantee: string;
  bankAccount: string;
  bankName: string;
  budgetAllocation: string;
  depositAccount: string;
  depositAccountTitle: string;
  subject: string;
  lotDescription: string;
  executionPeriod: number;
  issuingAuthority: string;
  country: string;
  motto: string;
  dateCreation: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentId?: string; // Pour les sous-catégories
  dateCreation: string;
}

export interface ArticleLot {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  categoryId: string; // Référence vers ArticleCategory
  dateCreation: string;
}

export interface Article {
  id: string;
  name: string;
  description?: string;
  unitPrice?: number;
  domain?: string; // Nouveau champ: Domaine (Ameublements, Informatiques, Fournitures de bureau)
  lowerLimitPrice?: number; // Nouveau champ: Limite inférieure de prix (LI)
  upperLimitPrice?: number; // Nouveau champ: Limite supérieure de prix (LS)
  lotId?: string;
  categoryId?: string; // Référence vers ArticleCategory
  sku?: string;
  supplier?: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  // Nouveaux attributs pour la classification
  brand?: string;
  model?: string;
  material?: string;
  color?: string;
  size?: string;
  dateCreation: string;
  lastUpdated: string;
}

export interface DataState {
  documents: CustomerDocument[];
  suppliers: SupplierInvoice[]; // kept for backward compatibility
  suppliersList: SupplierEntity[];
  supplierInvoices: SupplierInvoice[];
  clients: Client[];
  discharges: Discharge[];
  contractOrders: ContractOrder[];
  bankAccounts: BankAccount[];
  // Répertoire d'articles global
  articlesDirectory: { id: string; name: string; description?: string; unitPrice?: number }[];
  // Nouveau système d'articles avec catégories hiérarchiques
  articleCategories: ArticleCategory[];
  articleLots: ArticleLot[];
  articles: Article[];
  saveDocument: (doc: Omit<CustomerDocument, 'id' | 'reference'>) => CustomerDocument;
  addPayment: (docId: string, payment: { date: string; amount: number; note?: string }) => void;
  addSupplier: (s: Omit<SupplierEntity, 'id'>) => SupplierEntity;
  updateSupplier: (id: string, s: Partial<SupplierEntity>) => void;
  deleteSupplier: (id: string) => void;
  addSupplierInvoice: (inv: Omit<SupplierInvoice, 'id'>) => SupplierInvoice;
  updateDocument: (id: string, partial: Partial<CustomerDocument>) => void;
  deleteDocument: (id: string) => void;
  addSupplierArticle: (supplierId: string, article: Omit<SupplierArticle, 'id'>) => SupplierArticle;
  updateSupplierArticle: (supplierId: string, articleId: string, partial: Partial<SupplierArticle>) => void;
  deleteSupplierArticle: (supplierId: string, articleId: string) => void;
  // CRUD Répertoire d'articles
  addArticle: (article: { name: string; description?: string; unitPrice?: number }) => { id: string; name: string; description?: string; unitPrice?: number };
  updateArticle: (id: string, partial: { name?: string; description?: string; unitPrice?: number }) => void;
  deleteArticle: (id: string) => void;
  // CRUD Catégories d'articles
  addArticleCategory: (category: Omit<ArticleCategory, 'id' | 'dateCreation'>) => ArticleCategory;
  updateArticleCategory: (id: string, partial: Partial<Omit<ArticleCategory, 'id' | 'dateCreation'>>) => void;
  deleteArticleCategory: (id: string) => void;
  // CRUD Lots d'articles
  addArticleLot: (lot: Omit<ArticleLot, 'id' | 'dateCreation'>) => ArticleLot;
  updateArticleLot: (id: string, partial: Partial<Omit<ArticleLot, 'id' | 'dateCreation'>>) => void;
  deleteArticleLot: (id: string) => void;
  // CRUD Articles avancés
  addAdvancedArticle: (article: Omit<Article, 'id' | 'dateCreation' | 'lastUpdated'>) => Article;
  updateAdvancedArticle: (id: string, partial: Partial<Omit<Article, 'id' | 'dateCreation' | 'lastUpdated'>>) => void;
  deleteAdvancedArticle: (id: string) => void;
  // Gestion des clients
  addClient: (client: Omit<Client, 'id' | 'dateCreation' | 'totalFacture' | 'totalEncaissement' | 'soldeImpaye' | 'nombreFactures'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addDischarge: (discharge: Omit<Discharge, 'id' | 'dateCreation'>) => Discharge;
  updateDischarge: (id: string, discharge: Partial<Discharge>) => void;
  deleteDischarge: (id: string) => void;
  // Gestion des contrats et lettres de commande
  addContractOrder: (contractOrder: Omit<ContractOrder, 'id' | 'dateCreation'>) => ContractOrder;
  updateContractOrder: (id: string, contractOrder: Partial<ContractOrder>) => void;
  deleteContractOrder: (id: string) => void;
  // Fonctions de gestion des comptes bancaires
  addBankAccount: (bankAccount: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => BankAccount;
  updateBankAccount: (id: string, bankAccount: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  setDefaultBankAccount: (id: string) => void;
  // Workflow intégré
  validateQuote: (quoteId: string) => CustomerDocument;
  createOrderFromQuote: (quoteId: string, orderNumber: string, contractTerms?: CustomerDocument['contractTerms']) => CustomerDocument;
  createDeliveryFromOrder: (orderId: string) => CustomerDocument;
  createInvoiceFromDelivery: (deliveryId: string) => CustomerDocument;
  getDocumentWorkflow: (documentId: string) => CustomerDocument[];
  updateDocumentWorkflow: (documentId: string, workflowStatus: CustomerDocument['workflowStatus']) => void;
}

const STORAGE_KEY = 'ediba.data.v1';

function formatNumberNew(type: DocumentType, year: number, seq: number) {
  // Format attendu:
  // - Année sur 2 chiffres
  // - Séquence sur 5 chiffres
  // - Préfixes: proforma -> D, delivery -> BL, order -> CMD, invoice -> F
  const yearSuffix = String(year).slice(-2);
  const prefix = type === 'proforma' ? 'D' :
                 type === 'delivery' ? 'BL' :
                 type === 'order' ? 'CMD' :
                 type === 'invoice' ? 'F' : 'DOC';
  return `N°${prefix}${yearSuffix}${String(seq).padStart(5, '0')}`;
}

function nextSequence(existing: CustomerDocument[], type: DocumentType, year: number) {
  const docsSameYearType = existing.filter(d => d.type === type && d.date.startsWith(String(year)));
  const seqs = docsSameYearType.map(d => parseInt(d.reference.split('-').pop() || '0', 10)).filter(n => !isNaN(n));
  const max = seqs.length ? Math.max(...seqs) : 0;
  return max + 1;
}

interface DataContextValue extends DataState {}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  
  const [state, setState] = useState<DataState>({
    documents: [],
    suppliers: [],
    suppliersList: [],
    supplierInvoices: [],
    clients: [],
    discharges: [],
    contractOrders: [],
    bankAccounts: [
      {
        id: 'bank-1',
        bankName: 'BIA-TOGO POUR CECA',
        accountNumber: 'TG005 01251 00115511401-48',
        accountHolder: 'EDIBA INTER SARL U',
        accountType: 'Professionnel',
        currency: 'FCFA',
        swiftCode: 'BIAFTGLX',
        iban: 'TG005012510011551140148',
        branchCode: '001',
        address: 'Lomé, Togo',
        phone: '+228 22 21 21 21',
        email: 'contact@biatogo.tg',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    articlesDirectory: [],
    articleCategories: [],
    articleLots: [],
    articles: [],
    saveDocument: () => { console.warn('saveDocument not implemented'); return {} as any; },
    addPayment: () => { console.warn('addPayment not implemented'); },
    addSupplier: () => { console.warn('addSupplier not implemented'); return {} as any; },
    updateSupplier: () => { console.warn('updateSupplier not implemented'); },
    deleteSupplier: () => { console.warn('deleteSupplier not implemented'); },
    addSupplierInvoice: () => { console.warn('addSupplierInvoice not implemented'); return {} as any; },
    updateDocument: () => { console.warn('updateDocument not implemented'); },
    deleteDocument: () => { console.warn('deleteDocument not implemented'); },
    addSupplierArticle: () => { console.warn('addSupplierArticle not implemented'); return {} as any; },
    updateSupplierArticle: () => { console.warn('updateSupplierArticle not implemented'); },
    deleteSupplierArticle: () => { console.warn('deleteSupplierArticle not implemented'); },
    addArticle: () => { console.warn('addArticle not implemented'); return {} as any; },
    updateArticle: () => { console.warn('updateArticle not implemented'); },
    deleteArticle: () => { console.warn('deleteArticle not implemented'); },
    addArticleCategory: () => { console.warn('addArticleCategory not implemented'); return {} as any; },
    updateArticleCategory: () => { console.warn('updateArticleCategory not implemented'); },
    deleteArticleCategory: () => { console.warn('deleteArticleCategory not implemented'); },
    addArticleLot: () => { console.warn('addArticleLot not implemented'); return {} as any; },
    updateArticleLot: () => { console.warn('updateArticleLot not implemented'); },
    deleteArticleLot: () => { console.warn('deleteArticleLot not implemented'); },
    addAdvancedArticle: () => { console.warn('addAdvancedArticle not implemented'); return {} as any; },
    updateAdvancedArticle: () => { console.warn('updateAdvancedArticle not implemented'); },
    deleteAdvancedArticle: () => { console.warn('deleteAdvancedArticle not implemented'); },
    addClient: () => { console.warn('addClient not implemented'); return {} as any; },
    updateClient: () => { console.warn('updateClient not implemented'); },
    deleteClient: () => { console.warn('deleteClient not implemented'); },
    addDischarge: () => { console.warn('addDischarge not implemented'); return {} as any; },
    updateDischarge: () => { console.warn('updateDischarge not implemented'); },
    deleteDischarge: () => { console.warn('deleteDischarge not implemented'); },
    addContractOrder: () => { console.warn('addContractOrder not implemented'); return {} as any; },
    updateContractOrder: () => { console.warn('updateContractOrder not implemented'); },
    deleteContractOrder: () => { console.warn('deleteContractOrder not implemented'); },
    // Fonctions de gestion des comptes bancaires
    addBankAccount: () => { console.warn('addBankAccount not implemented'); return {} as any; },
    updateBankAccount: () => { console.warn('updateBankAccount not implemented'); },
    deleteBankAccount: () => { console.warn('deleteBankAccount not implemented'); },
    setDefaultBankAccount: () => { console.warn('setDefaultBankAccount not implemented'); },
    validateQuote: () => { console.warn('validateQuote not implemented'); return {} as any; },
    createOrderFromQuote: () => { console.warn('createOrderFromQuote not implemented'); return {} as any; },
    createDeliveryFromOrder: () => { console.warn('createDeliveryFromOrder not implemented'); return {} as any; },
    createInvoiceFromDelivery: () => { console.warn('createInvoiceFromDelivery not implemented'); return {} as any; },
    getDocumentWorkflow: () => { console.warn('getDocumentWorkflow not implemented'); return []; },
    updateDocumentWorkflow: () => { console.warn('updateDocumentWorkflow not implemented'); },
  });

  // Sauvegarder les données dans localStorage
  useEffect(() => {
    const toStore = {
      documents: state.documents,
      suppliersList: state.suppliersList,
      supplierInvoices: state.supplierInvoices,
      clients: state.clients,
      discharges: state.discharges,
      contractOrders: state.contractOrders,
      bankAccounts: state.bankAccounts,
      articlesDirectory: state.articlesDirectory,
      articleCategories: state.articleCategories,
      articleLots: state.articleLots,
      articles: state.articles
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state.documents, state.suppliersList, state.supplierInvoices, state.clients, state.discharges, state.contractOrders, state.bankAccounts, state.articlesDirectory, state.articleCategories, state.articleLots, state.articles]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      
            // Fournisseurs fréquents par défaut - Liste complète avec vraies informations exactes
      const frequentSuppliers = [
        { type: 'Societe', nif: '1000166149', raisonSociale: 'CCT-BATIMENT', telephone: '22 21 50 48/ 22 22 53 71', adresse: '606, Rue Koumoré, Assivito, Lomé, Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1000116343', raisonSociale: 'STE LE WATT', telephone: '22 22 27 74/ 22 21 15 81', adresse: '7, Rue Koumoré, Immeuble S3G, Assivito – BP 3112, Lomé, Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1000387083', raisonSociale: 'LUMCHRIST-AMOFIA SARL', telephone: '92 05 11 83/ 99 09 28 00', adresse: 'Lomé – Quartier Avédji Elavanyon, Rue Hôtel Léo 2000, Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1001875765', raisonSociale: 'CHINA MALL', telephone: '71 34 32 12', adresse: 'Hédzranawé et Agoè Zongo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1000173826', raisonSociale: 'Galerie Comfortium', telephone: '22 20 25 26/ 22 21 99 90', adresse: '1840, Boulevard circulaire - Quartier Nyékonakpoé; Lomé; BP 3112', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'GALERIE DE MEUBLES ET ELEMENTS DECORATIFS' },
        { type: 'Societe', nif: '1000172656', raisonSociale: 'ETS AMERICAIN', telephone: '93 75 75 45/ 99 48 13 58', adresse: 'Rue Jeanne d\'Arc, Non loin de la Phcie du Centre et la Banque Atlantique Assivito Lomé - Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1000126738', raisonSociale: 'DONSEN-ALU', telephone: '(+228) 70 18 12 64 / (+228) 92 18 64 68', adresse: 'Av. de 24 Janvier, non loin de Monté Christo Abobokomé Lomé - Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Matériaux de construction & Quincaillerie' },
        { type: 'Societe', nif: '1001895203', raisonSociale: 'KILIMANDJARO Services', telephone: '', adresse: 'Face CERFER, Boulevard De La Paix, Lome, Maritime', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Vente de matériels informatiques' },
        { type: 'Societe', nif: '1000929215', raisonSociale: 'ATLAS Services', telephone: '', adresse: 'Face CERFER, Boulevard De La Paix, Lome, Maritime', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'Vente de matériels informatiques' },
        { type: 'Societe', nif: '1000166347', raisonSociale: 'SOCIETE SOTIMEX SARL', telephone: '', adresse: 'Avenue De La Liberation, Lome', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'FOURNITURES DE BUREAUX ET PAPETERIE' },
        { type: 'Societe', nif: '1000168399', raisonSociale: 'CHAMPION', telephone: '', adresse: '', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'COMMERCE GENERAL' },
        { type: 'Societe', nif: '1000142389', raisonSociale: 'Ste Papéterie Centrale', telephone: '(+228) 22 20 41 30 / (+228) 22 20 26 28 / (+228) 92 00 38 99 / (+228) 90 04 26 22 / (+228) 91 32 32 93', adresse: 'Av. de la Libération, 630, Rue de la Nouvelle Marche, collée à la Direction de la Tde, en face de Hyundai, Assivito BP 4266 Lomé - Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'FOURNITURES DE BUREAUX ET PAPETERIE' },
        { type: 'Societe', nif: '1000373319', raisonSociale: 'ORCA SARL', telephone: '93 38 11 88', adresse: '', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'GALERIE DE MEUBLES ET ELEMENTS DECORATIFS' },
        { type: 'Societe', nif: '', raisonSociale: 'SAIMEX', telephone: '', adresse: '', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'GALERIE DE MEUBLES ET ELEMENTS DECORATIFS' },
        { type: 'Societe', nif: '1000166212', raisonSociale: 'CENPATO', telephone: '', adresse: '', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'FOURNITURES DE BUREAUX ET PAPETERIE' },
        { type: 'Societe', nif: '', raisonSociale: 'FLIGHT EAGLE', telephone: '96 74 75 76 / flightgalerie@hotmail.com', adresse: '97 74 75 76 / flightgalerie@hotmail.com', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'GALERIE DE MEUBLES ET ELEMENTS DECORATIFS' },
        { type: 'Societe', nif: '', raisonSociale: 'RAMCO', telephone: '07 Avenue du 24 Fevrier, + 228 22 21 40 78', adresse: '8 Avenue du 24 Fevrier, + 228 22 21 40 78', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'COMMERCE GENERAL' },
        { type: 'Societe', nif: '1000174492', raisonSociale: 'SPCG-PRO BURO', telephone: '22 22 05 60/ 22 22 05 20', adresse: 'SPCG Pro Buro Rue de Kourome, Lomé, Togo', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'FOURNITURES DE BUREAUX ET PAPETERIE' },
        { type: 'Societe', nif: '1000211277', raisonSociale: 'TECHNO', telephone: 'Tél: +228 22 22 49 46 / +228 22 22 49 45', adresse: '9 Av Sylvanus Olympio. Lomé BP 14263', regimeFiscal: 'Réel avec TVA', classification: 'National', groupeFour: 'FOURNITURES DE BUREAUX ET PAPETERIE' },
        { type: 'Particulier', nif: '', raisonSociale: 'Holly', telephone: '', adresse: '', regimeFiscal: '', classification: 'Etranger', groupeFour: '' },
        { type: 'Particulier', nif: '', raisonSociale: 'Jill', telephone: '', adresse: '', regimeFiscal: '', classification: 'Etranger', groupeFour: '' }
      ];
      
      // Clients par défaut
      const defaultClients: Client[] = [
        {
          id: 'CLI-001',
          raisonSociale: 'Assemblée Nationale',
          nomCommercial: 'AN',
          nif: 'NIF-AN-001',
          rccm: 'RCCM-AN-001',
          adresse: 'Boulevard du Mono, Lomé',
          ville: 'Lomé',
          telephone: '90 00 76 70 / 90 36 03 96',
          email: 'contact@assemblee-nationale.tg',
          contactPrincipal: 'Secrétaire Général',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-002',
          raisonSociale: 'Togo Cellulaire',
          nomCommercial: 'Togocel',
          nif: 'NIF-TC-002',
          rccm: 'RCCM-TC-002',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 01 96 01 / 70 45 00 33',
          email: 'contact@togocel.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Télécommunications',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-003',
          raisonSociale: 'Ministère de l\'Administration Territoriale',
          nomCommercial: 'MAT',
          nif: 'NIF-MAT-003',
          rccm: 'RCCM-MAT-003',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@mat.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-004',
          raisonSociale: 'CMA CGM',
          nomCommercial: 'CMA CGM',
          nif: 'NIF-CMA-004',
          rccm: 'RCCM-CMA-004',
          adresse: 'Port de Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@cmacgm.com',
          contactPrincipal: 'Direction',
          secteurActivite: 'Transport Maritime',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-005',
          raisonSociale: 'DRI-UL',
          nomCommercial: 'DRI-UL',
          nif: 'NIF-DRI-005',
          rccm: 'RCCM-DRI-005',
          adresse: 'Université de Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 24 24 75',
          email: 'contact@dri-ul.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Éducation',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-006',
          raisonSociale: 'SOS Village d\'Enfants',
          nomCommercial: 'SOS Village',
          nif: 'NIF-SOS-006',
          rccm: 'RCCM-SOS-006',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '91 71 21 24',
          email: 'contact@sos-village.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'ONG',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-007',
          raisonSociale: 'Ministère des Armées',
          nomCommercial: 'MINARM',
          nif: 'NIF-MINARM-007',
          rccm: 'RCCM-MINARM-007',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@minarm.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-008',
          raisonSociale: 'HAPLUCIA',
          nomCommercial: 'HAPLUCIA',
          nif: 'NIF-HAP-008',
          rccm: 'RCCM-HAP-008',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 70 75 04',
          email: 'contact@haplucia.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Entreprise Privée',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-009',
          raisonSociale: 'SNPT',
          nomCommercial: 'SNPT',
          nif: 'NIF-SNPT-009',
          rccm: 'RCCM-SNPT-009',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@snpt.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Transport',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-010',
          raisonSociale: 'Sénat du Togo',
          nomCommercial: 'Sénat',
          nif: 'NIF-SENAT-010',
          rccm: 'RCCM-SENAT-010',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@senat.tg',
          contactPrincipal: 'Président',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-011',
          raisonSociale: 'GIZ',
          nomCommercial: 'GIZ',
          nif: 'NIF-GIZ-011',
          rccm: 'RCCM-GIZ-011',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@giz.de',
          contactPrincipal: 'Direction',
          secteurActivite: 'Coopération Internationale',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-012',
          raisonSociale: 'Ministère du Désenclavement et des Pistes Rurales',
          nomCommercial: 'MDPR',
          nif: 'NIF-MDPR-012',
          rccm: 'RCCM-MDPR-012',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@mdpr.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-013',
          raisonSociale: 'HAUQUE',
          nomCommercial: 'HAUQUE',
          nif: 'NIF-HAUQUE-013',
          rccm: 'RCCM-HAUQUE-013',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 34 49 70',
          email: 'contact@hauque.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Entreprise Privée',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-014',
          raisonSociale: 'Ministère de l\'Agriculture, de l\'Élevage et du Développement Rural (MAEDR)',
          nomCommercial: 'MAEDR',
          nif: 'NIF-MAEDR-014',
          rccm: 'RCCM-MAEDR-014',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@maedr.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-015',
          raisonSociale: 'Ministère de l\'Hydraulique Villageoise et du Développement Rural (MAHVDR)',
          nomCommercial: 'MAHVDR',
          nif: 'NIF-MAHVDR-015',
          rccm: 'RCCM-MAHVDR-015',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@mahvdr.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-016',
          raisonSociale: 'Ministère de la Justice',
          nomCommercial: 'MINJUST',
          nif: 'NIF-MINJUST-016',
          rccm: 'RCCM-MINJUST-016',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@minjust.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-017',
          raisonSociale: 'Ministère de la Santé',
          nomCommercial: 'MINSANTE',
          nif: 'NIF-MINSANTE-017',
          rccm: 'RCCM-MINSANTE-017',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@minsante.tg',
          contactPrincipal: 'Ministre',
          secteurActivite: 'Institution Publique',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-018',
          raisonSociale: 'Ariana Maintenance',
          nomCommercial: 'Ariana Maintenance',
          nif: 'NIF-ARIANA-018',
          rccm: 'RCCM-ARIANA-018',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@ariana.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Maintenance',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-019',
          raisonSociale: 'Agence de Transformation Agricole (ATA)',
          nomCommercial: 'ATA',
          nif: 'NIF-ATA-019',
          rccm: 'RCCM-ATA-019',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '92 44 86 99 / 70 90 34 21',
          email: 'contact@ata.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Agriculture',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-020',
          raisonSociale: 'CEB (Communauté Électrique du Bénin)',
          nomCommercial: 'CEB',
          nif: 'NIF-CEB-020',
          rccm: 'RCCM-CEB-020',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'approvisionnement@cebnet.org / ywade@cebnet.org',
          contactPrincipal: 'Direction',
          secteurActivite: 'Énergie',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-021',
          type: 'Particulier',
          raisonSociale: 'ETS Kombaté',
          nomCommercial: 'ETS Kombaté',
          nif: 'NIF-KOMBATE-021',
          rccm: 'RCCM-KOMBATE-021',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 10 58 47',
          email: 'contact@kombate.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Entreprise Privée',
          regimeFiscal: 'Réel Normal' as const,
          classification: 'Particulier',
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-022',
          raisonSociale: 'Plan Togo',
          nomCommercial: 'Plan Togo',
          nif: 'NIF-PLAN-022',
          rccm: 'RCCM-PLAN-022',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '91 90 01 11',
          email: 'contact@plan-togo.org',
          contactPrincipal: 'Direction',
          secteurActivite: 'ONG',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-023',
          type: 'ONG',
          raisonSociale: 'ONG Espoir',
          nomCommercial: 'ONG Espoir',
          nif: 'NIF-ESPOIR-023',
          rccm: 'RCCM-ESPOIR-023',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '22 21 66 45',
          email: 'contact@espoir.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'ONG',
          regimeFiscal: 'Réel Normal' as const,
          classification: 'National',
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-024',
          raisonSociale: 'La Poste',
          nomCommercial: 'La Poste',
          nif: 'NIF-POSTE-024',
          rccm: 'RCCM-POSTE-024',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '90 29 74 28',
          email: 'contact@laposte.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Poste',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-025',
          raisonSociale: 'Port Autonome de Lomé',
          nomCommercial: 'PAL',
          nif: 'NIF-PAL-025',
          rccm: 'RCCM-PAL-025',
          adresse: 'Port de Lomé, Togo',
          ville: 'Lomé',
          telephone: '—',
          email: 'contact@pal.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Port',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        },
        {
          id: 'CLI-026',
          raisonSociale: 'UGP-AK',
          nomCommercial: 'UGP-AK',
          nif: 'NIF-UGP-026',
          rccm: 'RCCM-UGP-026',
          adresse: 'Lomé, Togo',
          ville: 'Lomé',
          telephone: '92 25 63 89',
          email: 'contact@ugp-ak.tg',
          contactPrincipal: 'Direction',
          secteurActivite: 'Entreprise Privée',
          regimeFiscal: 'Réel Normal' as const,
          delaiPaiement: 30,
          remise: 0,
          limiteCredit: 0,
          statut: 'actif' as const,
          dateCreation: new Date().toISOString().slice(0, 10),
          totalFacture: 0,
          totalEncaissement: 0,
          soldeImpaye: 0,
          nombreFactures: 0
        }
      ];

      // Catégories d'articles par défaut
      const defaultCategories: ArticleCategory[] = [
        // Catégories principales
        {
          id: 'CAT-AMEUBLEMENT',
          name: '🪑 Ameublement',
          description: 'Tous les articles liés à l\'ameublement et à la décoration',
          icon: '🪑',
          color: 'bg-amber-100 text-amber-800',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-INFORMATIQUE',
          name: '💻 Informatique',
          description: 'Matériel informatique et consommables',
          icon: '💻',
          color: 'bg-blue-100 text-blue-800',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-FOURNITURES',
          name: '🗂️ Fournitures de bureau',
          description: 'Fournitures et accessoires de bureau',
          icon: '🗂️',
          color: 'bg-green-100 text-green-800',
          dateCreation: new Date().toISOString()
        },
        // Sous-catégories Ameublement
        {
          id: 'CAT-TISSUS',
          name: 'Tissus et revêtements',
          description: 'Tissus d\'ameublement, revêtements muraux',
          icon: '🎨',
          color: 'bg-pink-100 text-pink-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-TISSUS-ET-REVÊTEMENTS',
          name: 'Tissus et revêtements',
          description: 'Tissus occultants, voilages, cuir, simili cuir, tissus salon',
          icon: '🎨',
          color: 'bg-pink-100 text-pink-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-BOIS',
          name: 'Bois et dérivés',
          description: 'Bois massif, panneaux, placages',
          icon: '🌳',
          color: 'bg-yellow-100 text-yellow-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-ACCESSOIRES',
          name: 'Accessoires et quincaillerie',
          description: 'Charnières, poignées, systèmes de fixation',
          icon: '🔧',
          color: 'bg-gray-100 text-gray-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-ACCESSOIRES-RIDEAUX',
          name: 'Accessoires rideaux',
          description: 'Ruflette, bande, oeillets, tringles, rails, stores',
          icon: '🪟',
          color: 'bg-blue-100 text-blue-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-DECORATION',
          name: 'Éléments de décoration',
          description: 'Textiles déco, décorations murales, objets de table',
          icon: '✨',
          color: 'bg-purple-100 text-purple-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-TAPISSIER',
          name: 'Matériels tapissiers',
          description: 'Mousses, garnissage, outils de tapissier',
          icon: '🛠️',
          color: 'bg-orange-100 text-orange-800',
          parentId: 'CAT-AMEUBLEMENT',
          dateCreation: new Date().toISOString()
        },
        // Sous-catégories Informatique
        {
          id: 'CAT-CONSOMMABLES',
          name: 'Consommables (cartouches & toners)',
          description: 'Cartouches HP, Canon, Lenovo, toners',
          icon: '🖨️',
          color: 'bg-red-100 text-red-800',
          parentId: 'CAT-INFORMATIQUE',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-MATERIEL',
          name: 'Matériel informatique & accessoires',
          description: 'Antivirus, multiprises, clés USB, disques durs',
          icon: '💾',
          color: 'bg-indigo-100 text-indigo-800',
          parentId: 'CAT-INFORMATIQUE',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-MATERIELS-INFORMATIQUES',
          name: 'Matériels informatiques',
          description: 'Antivirus, multiprises parafoudre, clés USB, disques durs, onduleurs',
          icon: '💾',
          color: 'bg-indigo-100 text-indigo-800',
          parentId: 'CAT-INFORMATIQUE',
          dateCreation: new Date().toISOString()
        },
        // Sous-catégories Fournitures de bureau
        {
          id: 'CAT-PAPETERIE',
          name: 'Papeterie',
          description: 'Rames de papier, cahiers, registres',
          icon: '📄',
          color: 'bg-white text-gray-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-CLASSEMENT',
          name: 'Classement et archivage',
          description: 'Chemises, sous-chemises, systèmes de classement',
          icon: '📁',
          color: 'bg-teal-100 text-teal-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-ENVELOPPES',
          name: 'Enveloppes',
          description: 'Enveloppes de toutes tailles et couleurs',
          icon: '✉️',
          color: 'bg-cyan-100 text-cyan-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-ECRITURE',
          name: 'Écriture et correction',
          description: 'Stylos, feutres, correcteurs',
          icon: '✏️',
          color: 'bg-rose-100 text-rose-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-QUINCAILLERIE',
          name: 'Petite quincaillerie de bureau',
          description: 'Agrafes, porte Bic, accessoires de bureau',
          icon: '📎',
          color: 'bg-slate-100 text-slate-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        },
        {
          id: 'CAT-FOURNITURES-BUREAU',
          name: 'Fournitures de bureau',
          description: 'Toutes les fournitures de bureau : papiers, chemises, enveloppes, stylos, registres',
          icon: '🗂️',
          color: 'bg-green-100 text-green-800',
          parentId: 'CAT-FOURNITURES',
          dateCreation: new Date().toISOString()
        }
      ];

      // Articles d'exemple par catégorie
      const defaultArticles: Article[] = [
        {
          id: 'ART-001',
          name: "Tissus occultant Sup",
          description: "Tissus occultant Sup - Tissus et revêtements",
          unitPrice: 4000,
          domain: "Ameublements",
          lowerLimitPrice: 3500,
          upperLimitPrice: 6000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-002',
          name: "Tissus occultant Moy",
          description: "Tissus occultant Moy - Tissus et revêtements",
          unitPrice: 2500,
          domain: "Ameublements",
          lowerLimitPrice: 3000,
          upperLimitPrice: 4000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-003',
          name: "Tissus non occultant",
          description: "Tissus non occultant - Tissus et revêtements",
          unitPrice: 1500,
          domain: "Ameublements",
          lowerLimitPrice: 2000,
          upperLimitPrice: 2500,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-004',
          name: "Voilage leger",
          description: "Voilage leger - Tissus et revêtements",
          unitPrice: 1500,
          domain: "Ameublements",
          lowerLimitPrice: 2000,
          upperLimitPrice: 3000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-005',
          name: "Voilage lourd",
          description: "Voilage lourd - Tissus et revêtements",
          unitPrice: 2500,
          domain: "Ameublements",
          lowerLimitPrice: 3000,
          upperLimitPrice: 3500,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-006',
          name: "Simili cuir",
          description: "Simili cuir - Tissus et revêtements",
          unitPrice: 3000,
          domain: "Ameublements",
          lowerLimitPrice: 4000,
          upperLimitPrice: 4500,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-007',
          name: "Cuir",
          description: "Cuir - Tissus et revêtements",
          unitPrice: 6000,
          domain: "Ameublements",
          lowerLimitPrice: 8000,
          upperLimitPrice: 9000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-008',
          name: "popeline",
          description: "popeline - Tissus et revêtements",
          unitPrice: 2000,
          domain: "Ameublements",
          lowerLimitPrice: 2500,
          upperLimitPrice: 3500,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-009',
          name: "Tissus salon lin lourd",
          description: "Tissus salon lin lourd - Tissus et revêtements",
          unitPrice: 3000,
          domain: "Ameublements",
          lowerLimitPrice: 4000,
          upperLimitPrice: 6000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-010',
          name: "Tissus salon lin leger",
          description: "Tissus salon lin leger - Tissus et revêtements",
          unitPrice: 4000,
          domain: "Ameublements",
          lowerLimitPrice: 4500,
          upperLimitPrice: 5000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-011',
          name: "Tissus salon velours lourd",
          description: "Tissus salon velours lourd - Tissus et revêtements",
          unitPrice: 4500,
          domain: "Ameublements",
          lowerLimitPrice: 5500,
          upperLimitPrice: 7000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-012',
          name: "Tissus salon velours leger",
          description: "Tissus salon velours leger - Tissus et revêtements",
          unitPrice: 3000,
          domain: "Ameublements",
          lowerLimitPrice: 4500,
          upperLimitPrice: 5000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-013',
          name: "Tissus salon coton lourd",
          description: "Tissus salon coton lourd - Tissus et revêtements",
          unitPrice: 3500,
          domain: "Ameublements",
          lowerLimitPrice: 6000,
          upperLimitPrice: 7000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-014',
          name: "Tissus salon coton leger",
          description: "Tissus salon coton leger - Tissus et revêtements",
          unitPrice: 2500,
          domain: "Ameublements",
          lowerLimitPrice: 3000,
          upperLimitPrice: 4500,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-015',
          name: "Tissus salon polyester lourd",
          description: "Tissus salon polyester lourd - Tissus et revêtements",
          unitPrice: 4500,
          domain: "Ameublements",
          lowerLimitPrice: 5000,
          upperLimitPrice: 6000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-016',
          name: "Tissus salon polyester leger",
          description: "Tissus salon polyester leger - Tissus et revêtements",
          unitPrice: 3000,
          domain: "Ameublements",
          lowerLimitPrice: 3500,
          upperLimitPrice: 4000,
          categoryId: 'CAT-TISSUS-ET-REVÊTEMENTS',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-017',
          name: "Ruflette",
          description: "Ruflette - Accessoires rideaux",
          unitPrice: 4500,
          domain: "Ameublements",
          lowerLimitPrice: 5000,
          upperLimitPrice: 6000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Rouleau",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-018',
          name: "Bande",
          description: "Bande - Accessoires rideaux",
          unitPrice: 4500,
          domain: "Ameublements",
          lowerLimitPrice: 5000,
          upperLimitPrice: 5500,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Rouleau",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-019',
          name: "oeillets en metal",
          description: "oeillets en metal - Accessoires rideaux",
          unitPrice: 600,
          domain: "Ameublements",
          lowerLimitPrice: 7000,
          upperLimitPrice: 8000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-020',
          name: "Tringle en metal inf",
          description: "Tringle en metal inf - Accessoires rideaux",
          unitPrice: 7000,
          domain: "Ameublements",
          lowerLimitPrice: 7500,
          upperLimitPrice: 8000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "barre",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-021',
          name: "Tringle en metal super",
          description: "Tringle en metal super - Accessoires rideaux",
          unitPrice: 17000,
          domain: "Ameublements",
          lowerLimitPrice: 18000,
          upperLimitPrice: 20000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "barre",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-022',
          name: "Embout",
          description: "Embout - Accessoires rideaux",
          unitPrice: 3000,
          domain: "Ameublements",
          lowerLimitPrice: 4000,
          upperLimitPrice: 5000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-023',
          name: "Suport simple",
          description: "Suport simple - Accessoires rideaux",
          unitPrice: 1200,
          domain: "Ameublements",
          lowerLimitPrice: 2000,
          upperLimitPrice: 3000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-024',
          name: "Suport double",
          description: "Suport double - Accessoires rideaux",
          unitPrice: 2000,
          domain: "Ameublements",
          lowerLimitPrice: 3000,
          upperLimitPrice: 4000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-025',
          name: "Rail simple",
          description: "Rail simple - Accessoires rideaux",
          unitPrice: 9000,
          domain: "Ameublements",
          lowerLimitPrice: 10000,
          upperLimitPrice: 12000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "u",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-026',
          name: "rail double",
          description: "rail double - Accessoires rideaux",
          unitPrice: 13000,
          domain: "Ameublements",
          lowerLimitPrice: 15500,
          upperLimitPrice: 18000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "u",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-027',
          name: "embrasse",
          description: "embrasse - Accessoires rideaux",
          unitPrice: 2000,
          domain: "Ameublements",
          lowerLimitPrice: 3000,
          upperLimitPrice: 4000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-028',
          name: "Anneau-pince aluminium",
          description: "Anneau-pince aluminium - Accessoires rideaux",
          unitPrice: 1000,
          domain: "Ameublements",
          lowerLimitPrice: 1500,
          upperLimitPrice: 2000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-029',
          name: "Crochet",
          description: "Crochet - Accessoires rideaux",
          unitPrice: 1000,
          domain: "Ameublements",
          lowerLimitPrice: 1500,
          upperLimitPrice: 2000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "Paquet",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-030',
          name: "Store",
          description: "Store - Accessoires rideaux",
          unitPrice: 30000,
          domain: "Ameublements",
          lowerLimitPrice: 35000,
          upperLimitPrice: 50000,
          categoryId: 'CAT-ACCESSOIRES-RIDEAUX',
          unit: "m",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-031',
          name: "Cartouche d'encre (HP 207A) pour imprimante HP Color LaserJet Pro M283fdw ((pack de 4 couleurs)",
          description: "Cartouche d'encre (HP 207A) pour imprimante HP Color LaserJet Pro M283fdw ((pack de 4 couleurs) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-032',
          name: "Cartouche d'encre (HP 415A) pour imprimante HP COLOR LASERJET PRO MFP M479DW (pack de 4 couleurs)",
          description: "Cartouche d'encre (HP 415A) pour imprimante HP COLOR LASERJET PRO MFP M479DW (pack de 4 couleurs) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-033',
          name: "Cartouche d'encre (59 A) pour l'imprimante HP laser Jet Pro MFP M428 fdw",
          description: "Cartouche d'encre (59 A) pour l'imprimante HP laser Jet Pro MFP M428 fdw - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-034',
          name: "Toner (C-EXV 53) pour le copieur CANON Image RUNNER ADVANCE 4545i",
          description: "Toner (C-EXV 53) pour le copieur CANON Image RUNNER ADVANCE 4545i - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-035',
          name: "Cartouche d'encre (HP 205A) pour l'imprimante HP Color Laser Jet Pro M181 fw (Couleur noir)",
          description: "Cartouche d'encre (HP 205A) pour l'imprimante HP Color Laser Jet Pro M181 fw (Couleur noir) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-036',
          name: "Cartouche d'encre (26A) pour l'imprimante HP laser Jet Pro M402dn et l'imprimante HP laser Jet Pro MFP 426 fdw",
          description: "Cartouche d'encre (26A) pour l'imprimante HP laser Jet Pro M402dn et l'imprimante HP laser Jet Pro MFP 426 fdw - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-037',
          name: "Toner HP 201A  (pack de 4 couleurs)",
          description: "Toner HP 201A  (pack de 4 couleurs) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-038',
          name: "Cartouche d'encre (HP 05 A)",
          description: "Cartouche d'encre (HP 05 A) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-039',
          name: "Cartouche d'encre (HP 203 A) (pack de 4 couleurs)",
          description: "Cartouche d'encre (HP 203 A) (pack de 4 couleurs) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-040',
          name: "CANON Toner CEXV 32",
          description: "CANON Toner CEXV 32 - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-041',
          name: "HP 131 A Toner FOR Jet Pro 200 color M251, 200 color MFP M276, 200 M251n, 200 M251nw, 200 MFP M276N, 200 MFP M276NW laser printers (SETS OF 4 COLORS)",
          description: "HP 131 A Toner FOR Jet Pro 200 color M251, 200 color MFP M276, 200 M251n, 200 M251nw, 200 MFP M276N, 200 MFP M276NW laser printers (SETS OF 4 COLORS) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-042',
          name: "Authentic Toner 80 A",
          description: "Authentic Toner 80 A - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-043',
          name: "Authentic Toner 85 A",
          description: "Authentic Toner 85 A - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-044',
          name: "CANON Toner CEXV 40",
          description: "CANON Toner CEXV 40 - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-045',
          name: "Toner 410A (pack de 4 couleurs)",
          description: "Toner 410A (pack de 4 couleurs) - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-046',
          name: "Cartouche d'encre(LT 245H) pour l'imprimante LENOVO LJ2655DN",
          description: "Cartouche d'encre(LT 245H) pour l'imprimante LENOVO LJ2655DN - Consommables informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-CONSOMMABLES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-047',
          name: "Antivirus Kspersky 4 postes",
          description: "Antivirus Kspersky 4 postes - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-048',
          name: "Multiprises parafoudre",
          description: "Multiprises parafoudre - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-049',
          name: "Clé USB 32Go, 64Go",
          description: "Clé USB 32Go, 64Go - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-050',
          name: "Disque dur externe 1To",
          description: "Disque dur externe 1To - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-051',
          name: "Clé WIFI TP LINK",
          description: "Clé WIFI TP LINK - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-052',
          name: "Multiprises parasurtenseur EATON",
          description: "Multiprises parasurtenseur EATON - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-053',
          name: "Onduleur APC Back-Ups 2200VA",
          description: "Onduleur APC Back-Ups 2200VA - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-054',
          name: "Onduleur APC EASY UPS SMV 1500VA",
          description: "Onduleur APC EASY UPS SMV 1500VA - Matériels informatiques",
          unitPrice: 0,
          domain: "Informatiques",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-MATERIELS-INFORMATIQUES',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-055',
          name: "Papiers rames paperline blanc (80g)",
          description: "Papiers rames paperline blanc (80g) - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-056',
          name: "Chemise",
          description: "Chemise - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-057',
          name: "Sous-chemises",
          description: "Sous-chemises - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-058',
          name: "Enveloppes A5 kaki",
          description: "Enveloppes A5 kaki - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-059',
          name: "Enveloppes A4 kaki",
          description: "Enveloppes A4 kaki - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-060',
          name: "Enveloppes A4 blanches",
          description: "Enveloppes A4 blanches - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-061',
          name: "Enveloppes A3 kaki",
          description: "Enveloppes A3 kaki - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-062',
          name: "Enveloppes 11/22 blanches",
          description: "Enveloppes 11/22 blanches - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-063',
          name: "Enveloppes ordinaires kaki",
          description: "Enveloppes ordinaires kaki - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-064',
          name: "Enveloppes ordinaires blanches",
          description: "Enveloppes ordinaires blanches - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-065',
          name: "Chemises à rabats cartons",
          description: "Chemises à rabats cartons - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-066',
          name: "Chemises à sangles (plastifiées)",
          description: "Chemises à sangles (plastifiées) - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-067',
          name: "Stylo Luxor Focus bleu ball pen",
          description: "Stylo Luxor Focus bleu ball pen - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-068',
          name: "Stylo Luxor Focus noir ball pen",
          description: "Stylo Luxor Focus noir ball pen - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-069',
          name: "Stylo à bille rouge Schneider 505 M",
          description: "Stylo à bille rouge Schneider 505 M - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-070',
          name: "Stylo à bille noir Schneider 505 M",
          description: "Stylo à bille noir Schneider 505 M - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-071',
          name: "Stylo à bille bleu Trio",
          description: "Stylo à bille bleu Trio - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-072',
          name: "Stylo à bille noir Trio",
          description: "Stylo à bille noir Trio - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-073',
          name: "Bic feutre bleu Schneider Topball 847",
          description: "Bic feutre bleu Schneider Topball 847 - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-074',
          name: "Registre 300 pages",
          description: "Registre 300 pages - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-075',
          name: "Cahier de transmission",
          description: "Cahier de transmission - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-076',
          name: "Agrafes 24/6",
          description: "Agrafes 24/6 - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-077',
          name: "Porte Bic grillagé noir ou blanc",
          description: "Porte Bic grillagé noir ou blanc - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-078',
          name: "Correcteur PENN (fluid)",
          description: "Correcteur PENN (fluid) - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'ART-079',
          name: "Registre Arrivé/ Départ",
          description: "Registre Arrivé/ Départ - Fournitures de bureau",
          unitPrice: 0,
          domain: "Fournitures de bureau",
          lowerLimitPrice: 0,
          upperLimitPrice: 0,
          categoryId: 'CAT-FOURNITURES-BUREAU',
          unit: "unité",
          stock: 0,
          minStock: 0,
          dateCreation: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      ];
      
      if (raw) {
        const parsed = JSON.parse(raw);
        
        // Ajouter les fournisseurs fréquents avec des IDs uniques
        const suppliersWithIds = frequentSuppliers.map((supplier, index) => ({
          ...supplier,
          id: `SUP-${String(index + 1).padStart(3, '0')}`,
          articles: []
        }));
        
        // Fusionner les fournisseurs existants avec les fournisseurs fréquents
        const existingSuppliers = (parsed.suppliersList || []).map((s: any) => {
          // Migration des anciennes données vers le nouveau format
          return {
            ...s,
            type: (s.type && s.type.trim()) || 'Societe', // Par défaut: Société si vide ou chaîne vide
            classification: (s.classification && s.classification.trim()) || 'National', // Par défaut: National si vide
            // Migration des anciens régimes fiscaux
            regimeFiscal: s.regimeFiscal && ['Réel avec TVA', 'Exonéré de la TVA', 'Sans TVA'].includes(s.regimeFiscal)
              ? s.regimeFiscal
              : s.regimeFiscal === 'Réel Normal' ? 'Réel avec TVA'
              : s.regimeFiscal === 'Réel Simplifié' ? 'Réel avec TVA'
              : s.regimeFiscal === 'Forfait' ? 'Sans TVA'
              : s.regimeFiscal || 'Réel avec TVA', // Valeur par défaut si inconnu
            groupeFour: s.groupeFour || s.produits?.[0] || '', // Utiliser groupeFour ou premier produit
            articles: s.articles || (s.produits ? s.produits.map((p: string, idx: number) => ({ id: `LEG-${idx}`, name: p, unitPrice: 0, taxRate: 18 })) : [])
          };
        });
        
        // Vérifier si les fournisseurs fréquents existent déjà
        const existingSupplierNames = existingSuppliers.map((s: any) => s.raisonSociale);
        const newSuppliers = suppliersWithIds.filter(s => !existingSupplierNames.includes(s.raisonSociale));
        
        // Vérifier si les clients par défaut existent déjà
        const existingClients = (parsed.clients || []).map((c: any) => {
          // Migration des anciennes données vers le nouveau format
          return {
            ...c,
            type: c.type || 'Societe', // Par défaut: Société
            classification: c.classification || (c.type === 'Particulier' ? 'Particulier' : 'National'), // Migration intelligente
            // Migration des anciens régimes fiscaux
            regimeFiscal: c.regimeFiscal && ['Réel avec TVA', 'Exonéré de la TVA', 'Sans TVA'].includes(c.regimeFiscal)
              ? c.regimeFiscal
              : c.regimeFiscal === 'Réel Normal' ? 'Réel avec TVA'
              : c.regimeFiscal === 'Réel Simplifié' ? 'Réel avec TVA'
              : c.regimeFiscal === 'Forfait' ? 'Sans TVA'
              : 'Réel avec TVA', // Valeur par défaut si inconnu
            nif: c.nif || '', // S'assurer que NIF est une chaîne vide si non défini
            adresse: c.adresse || '', // S'assurer que l'adresse est une chaîne vide si non définie
            telephone: c.telephone || '', // S'assurer que le téléphone est une chaîne vide si non défini
            email: c.email || '', // S'assurer que l'email est une chaîne vide si non défini
            contactPrincipal: c.contactPrincipal || '', // S'assurer que le contact principal est une chaîne vide si non défini
            secteurActivite: c.secteurActivite || '', // S'assurer que le secteur d'activité est une chaîne vide si non défini
            nomCommercial: c.nomCommercial || '', // S'assurer que le nom commercial est une chaîne vide si non défini
            rccm: c.rccm || '', // S'assurer que le rccm est une chaîne vide si non défini
            ville: c.ville || 'Lomé', // S'assurer que la ville est définie
            delaiPaiement: c.delaiPaiement || 30,
            remise: c.remise || 0,
            limiteCredit: c.limiteCredit || 0,
            statut: c.statut || 'actif',
            totalFacture: c.totalFacture || 0,
            totalEncaissement: c.totalEncaissement || 0,
            soldeImpaye: c.soldeImpaye || 0,
            nombreFactures: c.nombreFactures || 0,
          };
        });
        const hasDefaultClients = existingClients.some((c: any) => c.raisonSociale === 'ASSEMBLEE NATIONALE' || c.raisonSociale === 'Assemblée Nationale');
        
        // Vérifier si les catégories par défaut existent déjà
        const existingCategories = parsed.articleCategories || [];
        const hasDefaultCategories = existingCategories.some((cat: any) => cat.id === 'CAT-AMEUBLEMENT');
        
        // S'assurer que toutes les catégories nécessaires existent (même si des catégories existent)
        const requiredCategoryIds = new Set([
          'CAT-AMEUBLEMENT', 'CAT-INFORMATIQUE', 'CAT-FOURNITURES',
          'CAT-TISSUS-ET-REVÊTEMENTS', 'CAT-ACCESSOIRES-RIDEAUX',
          'CAT-MATERIELS-INFORMATIQUES', 'CAT-FOURNITURES-BUREAU',
          'CAT-CONSOMMABLES'
        ]);
        const existingCategoryIds = new Set(existingCategories.map((cat: any) => cat.id));
        const missingCategories = defaultCategories.filter((cat: any) => 
          requiredCategoryIds.has(cat.id) && !existingCategoryIds.has(cat.id)
        );
        
        // Fusionner les catégories : s'assurer que toutes les catégories nécessaires sont présentes
        // Créer un Set pour éviter les doublons
        const allCategoryIds = new Set();
        const mergedCategories: ArticleCategory[] = [];
        
        // D'abord ajouter toutes les catégories existantes
        existingCategories.forEach((cat: any) => {
          if (!allCategoryIds.has(cat.id)) {
            allCategoryIds.add(cat.id);
            mergedCategories.push(cat);
          }
        });
        
        // Ensuite ajouter les catégories par défaut qui n'existent pas encore
        if (!hasDefaultCategories) {
          defaultCategories.forEach((cat: any) => {
            if (!allCategoryIds.has(cat.id)) {
              allCategoryIds.add(cat.id);
              mergedCategories.push(cat);
            }
          });
        } else {
          // Si les catégories par défaut existent déjà, ajouter seulement celles qui manquent
          defaultCategories.forEach((cat: any) => {
            if (requiredCategoryIds.has(cat.id) && !allCategoryIds.has(cat.id)) {
              allCategoryIds.add(cat.id);
              mergedCategories.push(cat);
            }
          });
        }
        
        const finalCategories = mergedCategories;

        // Vérifier si les articles par défaut existent déjà
        const existingArticles = (parsed.articles || []).map((art: any) => {
          // Migration : s'assurer que les articles ont tous les champs requis
          return {
            ...art,
            domain: art.domain || 'Non spécifié',
            unit: art.unit || 'unité',
            lowerLimitPrice: art.lowerLimitPrice || 0,
            upperLimitPrice: art.upperLimitPrice || 0,
            dateCreation: art.dateCreation || new Date().toISOString(),
            lastUpdated: art.lastUpdated || new Date().toISOString(),
            // S'assurer que categoryId existe (migration automatique basée sur le domaine)
            categoryId: art.categoryId || (
              art.domain === 'Ameublements' 
                ? 'CAT-AMEUBLEMENT'
                : art.domain === 'Informatiques'
                ? 'CAT-INFORMATIQUE'
                : art.domain === 'Fournitures de bureau'
                ? 'CAT-FOURNITURES'
                : ''
            )
          };
        });
        const hasDefaultArticles = existingArticles.some((art: any) => art.id === 'ART-001' || art.id === 'ART-TISSUS-001');
        
        // Fusionner les articles existants avec les articles par défaut si nécessaire
        // Priorité aux articles par défaut en cas de doublons
        let articlesToMerge: Article[];
        if (hasDefaultArticles) {
          // Si les articles par défaut existent déjà, utiliser seulement les articles existants
          articlesToMerge = existingArticles;
        } else {
          // Sinon, mettre les articles par défaut en premier (priorité)
          articlesToMerge = [...defaultArticles, ...existingArticles];
        }
        
        // Supprimer les doublons basés sur l'ID et le nom (garde le premier trouvé, donc priorité aux articles par défaut)
        const uniqueArticlesMap = new Map<string, Article>();
        const seenNames = new Map<string, string>(); // Map: normalizedName -> articleId
        
        articlesToMerge.forEach((article: any) => {
          const normalizedName = (article.name?.toLowerCase().trim() || '').replace(/\s+/g, ' ');
          
          // Vérifier d'abord par ID
          if (uniqueArticlesMap.has(article.id)) {
            // Doublon d'ID, ignorer
            return;
          }
          
          // Vérifier par nom si le nom n'est pas vide
          if (normalizedName && normalizedName.length > 3) {
            if (seenNames.has(normalizedName)) {
              // Doublon de nom, garder le premier (déjà ajouté)
              return;
            }
            seenNames.set(normalizedName, article.id);
          }
          
          // Ajouter l'article (pas de doublon)
          uniqueArticlesMap.set(article.id, article);
        });
        
        const finalArticles = Array.from(uniqueArticlesMap.values());

        setState(prev => ({ 
          ...prev, 
          ...parsed, 
          suppliersList: [...existingSuppliers, ...newSuppliers] as SupplierEntity[],
          supplierInvoices: parsed.supplierInvoices || parsed.suppliers || [],
          clients: hasDefaultClients 
            ? existingClients 
            : [...defaultClients.map((c: any) => ({
                ...c,
                type: c.type || 'Societe', // Par défaut: Société
                classification: c.classification || 'National', // Par défaut: National
                regimeFiscal: c.regimeFiscal === 'Réel Normal' || c.regimeFiscal === 'Réel Simplifié' 
                  ? 'Réel avec TVA' 
                  : c.regimeFiscal === 'Forfait' 
                  ? 'Sans TVA' 
                  : c.regimeFiscal || 'Réel avec TVA', // Migration des anciens régimes
              })), ...existingClients],
          discharges: parsed.discharges || [],
          contractOrders: parsed.contractOrders || [],
          bankAccounts: parsed.bankAccounts || [
            {
              id: 'bank-1',
              bankName: 'BIA-TOGO POUR CECA',
              accountNumber: 'TG005 01251 00115511401-48',
              accountHolder: 'EDIBA INTER SARL U',
              accountType: 'Professionnel',
              currency: 'FCFA',
              swiftCode: 'BIAFTGLX',
              iban: 'TG005012510011551140148',
              branchCode: '001',
              address: 'Lomé, Togo',
              phone: '+228 22 21 21 21',
              email: 'contact@biatogo.tg',
              isDefault: true,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          articlesDirectory: (parsed.articlesDirectory && parsed.articlesDirectory.length > 0) ? parsed.articlesDirectory : [
            { id: 'ART-DIR-1', name: 'Toner' },
            { id: 'ART-DIR-2', name: 'PC' },
            { id: 'ART-DIR-3', name: 'Lenovo-Y260' },
            { id: 'ART-DIR-4', name: 'Mobilier de bureau' },
            { id: 'ART-DIR-5', name: 'Câble' }
          ],
          articleCategories: finalCategories,
          articleLots: parsed.articleLots || [],
          articles: finalArticles
        }));
      } else {
        // Ajouter les fournisseurs fréquents avec des IDs uniques
        const suppliersWithIds = frequentSuppliers.map((supplier, index) => ({
          type: (supplier.type && supplier.type.trim()) || 'Societe', // Par défaut: Société si vide ou chaîne vide
          classification: (supplier.classification && supplier.classification.trim()) || 'National', // Par défaut: National si vide
          regimeFiscal: (supplier.regimeFiscal && supplier.regimeFiscal.trim()) || 'Réel avec TVA', // Par défaut: Réel avec TVA
          groupeFour: supplier.groupeFour || '', // Groupe fournisseur
          ...supplier,
          id: `SUP-${String(index + 1).padStart(3, '0')}`,
          articles: []
        }));
        
        setState(prev => ({ 
          ...prev, 
          suppliersList: suppliersWithIds,
          clients: defaultClients,
          articlesDirectory: [
            { id: 'ART-DIR-1', name: 'Toner' },
            { id: 'ART-DIR-2', name: 'PC' },
            { id: 'ART-DIR-3', name: 'Lenovo-Y260' },
            { id: 'ART-DIR-4', name: 'Mobilier de bureau' },
            { id: 'ART-DIR-5', name: 'Câble' }
          ],
          articleCategories: defaultCategories,
          articleLots: [],
          articles: defaultArticles
        }));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const toStore = { 
      documents: state.documents, 
      suppliers: state.supplierInvoices, 
      suppliersList: state.suppliersList, 
      supplierInvoices: state.supplierInvoices, 
      clients: state.clients, 
      discharges: state.discharges, 
      contractOrders: state.contractOrders, 
      bankAccounts: state.bankAccounts,
      articlesDirectory: state.articlesDirectory, 
      articleCategories: state.articleCategories, 
      articleLots: state.articleLots, 
      articles: state.articles 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state.documents, state.suppliersList, state.supplierInvoices, state.clients, state.discharges, state.contractOrders, state.bankAccounts, state.articlesDirectory, state.articleCategories, state.articleLots, state.articles]);

  const api = useMemo<DataContextValue>(() => ({
    documents: state.documents,
    suppliers: state.supplierInvoices,
    suppliersList: state.suppliersList,
    supplierInvoices: state.supplierInvoices,
    clients: state.clients,
    discharges: state.discharges,
    contractOrders: state.contractOrders,
    bankAccounts: state.bankAccounts,
    articlesDirectory: state.articlesDirectory,
    articleCategories: state.articleCategories,
    articleLots: state.articleLots,
    articles: state.articles,
    saveDocument: async (docInput) => {
      const year = new Date(docInput.date).getFullYear();
      const seq = nextSequence(state.documents, docInput.type, year);
      const reference = `${year}-${String(seq).padStart(4, '0')}`;
      const id = formatNumberNew(docInput.type, year, seq);
      const doc: CustomerDocument = { ...docInput, id, reference, payments: [] };
      
      // Sauvegarder dans Supabase si connecté
      if (supabaseEnabled && user) {
        try {
          const saved = await saveDocumentToSupabase(docInput, user.id);
          if (saved) {
            console.log('✅ Document sauvegardé dans Supabase:', saved.id);
            // Utiliser le document sauvegardé depuis Supabase
            setState(s => ({ ...s, documents: [saved, ...s.documents.filter(d => d.id !== saved.id)] }));
            return saved;
          } else {
            console.warn('⚠️ Échec sauvegarde Supabase, utilisation locale');
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde Supabase:', error);
        }
      }
      
      // Sauvegarder localement (localStorage + état)
      setState(s => ({ ...s, documents: [doc, ...s.documents] }));
      return doc;
    },
    addPayment: (docId, payment) => {
      setState(s => {
        const docs = s.documents.map(d => {
          if (d.id !== docId) return d;
          const payments = [...(d.payments || []), payment];
          const totalHT = d.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
          const tva = Math.round((totalHT * d.tva) / 100);
          const ttc = totalHT + tva;
          const paid = payments.reduce((sum, p) => sum + p.amount, 0);
          
          // Gestion du reliquat : si le montant payé dépasse le montant dû
          let finalPayment = payment;
          if (paid > ttc) {
            // Le montant payé dépasse le montant dû, on ajuste le paiement
            const excess = paid - ttc;
            finalPayment = { ...payment, amount: payment.amount - excess };
            // Ajouter le reliquat comme un paiement séparé
            const reliquatPayment = { 
              date: payment.date, 
              amount: excess, 
              note: `Reliquat - ${payment.note || 'Paiement'}` 
            };
            payments[payments.length - 1] = finalPayment;
            payments.push(reliquatPayment);
          }
          
          const status: CustomerDocument['status'] = paid >= ttc ? 'paid' : (paid > 0 ? 'partial' : d.status);
          return { ...d, payments, status };
        });
        return { ...s, documents: docs };
      });
    },
    addSupplier: (s) => {
      const id = `SUP-${Date.now()}`;
      // Gérer la compatibilité avec les anciennes données (migration automatique)
      const entity: SupplierEntity = {
        type: s.type || 'Societe', // Par défaut: Société
        classification: s.classification || 'National', // Par défaut: National
        regimeFiscal: s.regimeFiscal || 'Réel avec TVA', // Migration vers les nouvelles valeurs
        groupeFour: s.groupeFour || s.produits?.[0] || '', // Utiliser groupeFour ou premier produit
        ...s,
        id,
        produits: s.produits || [],
        articles: s.articles || []
      };
      setState(st => ({ ...st, suppliersList: [entity, ...st.suppliersList] }));
      return entity;
    },
    updateSupplier: (id, partial) => {
      setState(st => ({ ...st, suppliersList: st.suppliersList.map(s => s.id === id ? { ...s, ...partial } : s) }));
    },
    deleteSupplier: (id) => {
      setState(st => ({ ...st, suppliersList: st.suppliersList.filter(s => s.id !== id) }));
    },
    addSupplierInvoice: (invInput) => {
      const id = `SINV-${Date.now()}`;
      const inv: SupplierInvoice = { id, ...invInput };
      setState(st => ({ ...st, supplierInvoices: [inv, ...st.supplierInvoices] }));
      
      return inv;
    },
    updateDocument: async (id, partial) => {
      // Mettre à jour dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const success = await updateDocumentInSupabase(id, partial);
          if (success) {
            console.log('✅ Document mis à jour dans Supabase:', id);
          }
        } catch (error) {
          console.error('❌ Erreur mise à jour Supabase:', error);
        }
      }
      
      // Mettre à jour localement
      setState(st => ({ ...st, documents: st.documents.map(d => d.id === id ? { ...d, ...partial } : d) }));
    },
    deleteDocument: async (id) => {
      // Supprimer dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const success = await deleteDocumentFromSupabase(id);
          if (success) {
            console.log('✅ Document supprimé dans Supabase:', id);
          }
        } catch (error) {
          console.error('❌ Erreur suppression Supabase:', error);
        }
      }
      
      // Supprimer localement
      setState(st => ({
        ...st,
        documents: st.documents.filter(d => d.id !== id)
      }));
    },
    addSupplierArticle: (supplierId, articleInput) => {
      const article: SupplierArticle = { id: `ART-${Date.now()}`, ...articleInput };
      setState(st => ({ ...st, suppliersList: st.suppliersList.map(s => s.id === supplierId ? { ...s, articles: [...(s.articles || []), article] } : s) }));
      return article;
    },
    updateSupplierArticle: (supplierId, articleId, partial) => {
      setState(st => ({ ...st, suppliersList: st.suppliersList.map(s => s.id === supplierId ? { ...s, articles: (s.articles || []).map(a => a.id === articleId ? { ...a, ...partial } : a) } : s) }));
    },
    deleteSupplierArticle: (supplierId, articleId) => {
      setState(st => ({ ...st, suppliersList: st.suppliersList.map(s => s.id === supplierId ? { ...s, articles: (s.articles || []).filter(a => a.id !== articleId) } : s) }));
    },
    // Répertoire d'articles global
    addArticle: (articleInput) => {
      const article = { id: `ADIR-${Date.now()}`, ...articleInput };
      setState(st => ({ ...st, articlesDirectory: [article, ...st.articlesDirectory] }));
      return article;
    },
    updateArticle: (id, partial) => {
      setState(st => ({ ...st, articlesDirectory: st.articlesDirectory.map(a => a.id === id ? { ...a, ...partial } : a) }));
    },
    deleteArticle: (id) => {
      setState(st => ({ ...st, articlesDirectory: st.articlesDirectory.filter(a => a.id !== id) }));
    },
    // CRUD Catégories d'articles
    addArticleCategory: (categoryInput) => {
      const category: ArticleCategory = { 
        id: `CAT-${Date.now()}`, 
        dateCreation: new Date().toISOString(),
        ...categoryInput 
      };
      setState(st => ({ ...st, articleCategories: [category, ...st.articleCategories] }));
      return category;
    },
    updateArticleCategory: (id, partial) => {
      setState(st => ({ ...st, articleCategories: st.articleCategories.map(c => c.id === id ? { ...c, ...partial } : c) }));
    },
    deleteArticleCategory: (id) => {
      setState(st => ({ 
        ...st, 
        articleCategories: st.articleCategories.filter(c => c.id !== id),
        // Mettre à jour les lots et articles qui référencent cette catégorie
        articleLots: st.articleLots.map(l => l.categoryId === id ? { ...l, categoryId: 'CAT-UNKNOWN' } : l),
        articles: st.articles.map(a => a.categoryId === id ? { ...a, categoryId: 'CAT-UNKNOWN' } : a)
      }));
    },
    // CRUD Lots d'articles
    addArticleLot: (lotInput) => {
      const lot: ArticleLot = { 
        id: `LOT-${Date.now()}`, 
        dateCreation: new Date().toISOString(),
        ...lotInput 
      };
      setState(st => ({ ...st, articleLots: [lot, ...st.articleLots] }));
      return lot;
    },
    updateArticleLot: (id, partial) => {
      setState(st => ({ ...st, articleLots: st.articleLots.map(l => l.id === id ? { ...l, ...partial } : l) }));
    },
    deleteArticleLot: (id) => {
      setState(st => ({ 
        ...st, 
        articleLots: st.articleLots.filter(l => l.id !== id),
        articles: st.articles.map(a => a.lotId === id ? { ...a, lotId: undefined } : a)
      }));
    },
    // CRUD Articles avancés
    addAdvancedArticle: async (articleInput) => {
      const article: Article = { 
        id: `ART-${Date.now()}`, 
        dateCreation: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ...articleInput 
      };
      
      // Sauvegarder dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const saved = await saveArticleToSupabase(articleInput);
          if (saved) {
            console.log('✅ Article sauvegardé dans Supabase:', saved.id);
            setState(st => ({ ...st, articles: [saved, ...st.articles.filter(a => a.id !== saved.id)] }));
            return saved;
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde Supabase:', error);
        }
      }
      
      // Sauvegarder localement
      setState(st => ({ ...st, articles: [article, ...st.articles] }));
      return article;
    },
    updateAdvancedArticle: (id, partial) => {
      setState(st => ({ 
        ...st, 
        articles: st.articles.map(a => a.id === id ? { ...a, ...partial, lastUpdated: new Date().toISOString() } : a) 
      }));
    },
    deleteAdvancedArticle: (id) => {
      setState(st => ({ ...st, articles: st.articles.filter(a => a.id !== id) }));
    },
    // Workflow intégré
    validateQuote: (quoteId) => {
      const quote = state.documents.find(d => d.id === quoteId);
      if (!quote || quote.type !== 'proforma') {
        throw new Error('Document non trouvé ou n\'est pas un devis');
      }
      const updatedQuote = { ...quote, workflowStatus: 'validated' as const, status: 'validated' as const };
      setState(st => ({ ...st, documents: st.documents.map(d => d.id === quoteId ? updatedQuote : d) }));
      return updatedQuote;
    },
    createOrderFromQuote: (quoteId, orderNumber, contractTerms) => {
      const quote = state.documents.find(d => d.id === quoteId);
      if (!quote || quote.type !== 'proforma') {
        throw new Error('Devis non trouvé');
      }
      
      const year = new Date().getFullYear();
      const seq = nextSequence(state.documents, 'order', year);
      const reference = `${year}-${String(seq).padStart(4, '0')}`;
      const id = formatNumberNew('order', year, seq);
      
      const order: CustomerDocument = {
        ...quote,
        id,
        reference,
        type: 'order',
        orderNumber,
        contractTerms,
        workflowStatus: 'ordered',
        status: 'pending',
        parentDocumentId: quoteId,
        childDocuments: [],
        payments: []
      };
      
      // Mettre à jour le devis parent
      const updatedQuote = { 
        ...quote, 
        childDocuments: [...(quote.childDocuments || []), id],
        workflowStatus: 'ordered' as const
      };
      
      setState(st => ({ 
        ...st, 
        documents: [order, ...st.documents.map(d => d.id === quoteId ? updatedQuote : d)]
      }));
      
      return order;
    },
    createDeliveryFromOrder: (orderId) => {
      const order = state.documents.find(d => d.id === orderId);
      if (!order || order.type !== 'order') {
        throw new Error('Commande non trouvée');
      }
      
      const year = new Date().getFullYear();
      const seq = nextSequence(state.documents, 'delivery', year);
      const reference = `${year}-${String(seq).padStart(4, '0')}`;
      const id = formatNumberNew('delivery', year, seq);
      
      const delivery: CustomerDocument = {
        ...order,
        id,
        reference,
        type: 'delivery',
        workflowStatus: 'delivered',
        status: 'pending',
        parentDocumentId: orderId,
        childDocuments: [],
        payments: []
      };
      
      // Mettre à jour la commande parent
      const updatedOrder = { 
        ...order, 
        childDocuments: [...(order.childDocuments || []), id],
        workflowStatus: 'delivered' as const
      };
      
      setState(st => ({ 
        ...st, 
        documents: [delivery, ...st.documents.map(d => d.id === orderId ? updatedOrder : d)]
      }));
      
      return delivery;
    },
    createInvoiceFromDelivery: (deliveryId) => {
      const delivery = state.documents.find(d => d.id === deliveryId);
      if (!delivery || delivery.type !== 'delivery') {
        throw new Error('Bon de livraison non trouvé');
      }
      
      const year = new Date().getFullYear();
      const seq = nextSequence(state.documents, 'invoice', year);
      const reference = `${year}-${String(seq).padStart(4, '0')}`;
      const id = formatNumberNew('invoice', year, seq);
      
      const invoice: CustomerDocument = {
        ...delivery,
        id,
        reference,
        type: 'invoice',
        workflowStatus: 'completed',
        status: 'pending',
        parentDocumentId: deliveryId,
        childDocuments: [],
        payments: []
      };
      
      // Mettre à jour le BL parent
      const updatedDelivery = { 
        ...delivery, 
        childDocuments: [...(delivery.childDocuments || []), id],
        workflowStatus: 'completed' as const
      };
      
      setState(st => ({ 
        ...st, 
        documents: [invoice, ...st.documents.map(d => d.id === deliveryId ? updatedDelivery : d)]
      }));
      
      return invoice;
    },
    getDocumentWorkflow: (documentId) => {
      const document = state.documents.find(d => d.id === documentId);
      if (!document) return [];
      
      const workflow: CustomerDocument[] = [];
      
      // Remonter jusqu'au document racine
      let current = document;
      while (current.parentDocumentId) {
        const parent = state.documents.find(d => d.id === current.parentDocumentId);
        if (parent) {
          workflow.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
      
      // Ajouter le document actuel
      workflow.push(document);
      
      // Descendre vers les documents enfants
      const addChildren = (doc: CustomerDocument) => {
        if (doc.childDocuments) {
          doc.childDocuments.forEach(childId => {
            const child = state.documents.find(d => d.id === childId);
            if (child) {
              workflow.push(child);
              addChildren(child);
            }
          });
        }
      };
      
      addChildren(document);
      
      return workflow;
    },
    updateDocumentWorkflow: (documentId, workflowStatus) => {
      setState(st => ({ 
        ...st, 
        documents: st.documents.map(d => d.id === documentId ? { ...d, workflowStatus } : d)
      }));
    },
    // Gestion des clients
    addClient: async (clientInput) => {
      const id = `CLI-${Date.now()}`;
      // Gérer la compatibilité avec les anciennes données (migration automatique)
      const client: Client = {
        type: clientInput.type || 'Societe', // Par défaut: Société
        classification: clientInput.classification || 'National', // Par défaut: National
        regimeFiscal: clientInput.regimeFiscal || 'Réel avec TVA', // Migration vers les nouvelles valeurs
        ...clientInput,
        id,
        dateCreation: new Date().toISOString().slice(0, 10),
        totalFacture: 0,
        totalEncaissement: 0,
        soldeImpaye: 0,
        nombreFactures: 0
      };
      
      // Sauvegarder dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const saved = await saveClientToSupabase(clientInput);
          if (saved) {
            console.log('✅ Client sauvegardé dans Supabase:', saved.id);
            // Utiliser le client sauvegardé depuis Supabase
            setState(st => ({ ...st, clients: [saved, ...st.clients.filter(c => c.id !== saved.id)] }));
            return saved;
          } else {
            console.warn('⚠️ Échec sauvegarde Supabase, utilisation locale');
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde Supabase:', error);
        }
      }
      
      // Sauvegarder localement (localStorage + état)
      setState(st => ({ ...st, clients: [client, ...st.clients] }));
      return client;
    },
    updateClient: async (id, partial) => {
      // Mettre à jour dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const success = await updateClientInSupabase(id, partial);
          if (success) {
            console.log('✅ Client mis à jour dans Supabase:', id);
          }
        } catch (error) {
          console.error('❌ Erreur mise à jour Supabase:', error);
        }
      }
      
      // Mettre à jour localement
      setState(st => ({ 
        ...st, 
        clients: st.clients.map(c => c.id === id ? { ...c, ...partial } : c) 
      }));
    },
    deleteClient: async (id) => {
      // Supprimer dans Supabase si connecté
      if (supabaseEnabled) {
        try {
          const success = await deleteClientFromSupabase(id);
          if (success) {
            console.log('✅ Client supprimé dans Supabase:', id);
          }
        } catch (error) {
          console.error('❌ Erreur suppression Supabase:', error);
        }
      }
      
      // Supprimer localement
      setState(st => ({
        ...st,
        clients: st.clients.filter(c => c.id !== id)
      }));
    },
    // Gestion des décharges
    addDischarge: async (dischargeInput) => {
      const id = `DECHARGE N°${String(state.discharges.length + 1).padStart(3, '0')}`;
      const discharge: Discharge = {
        ...dischargeInput,
        id,
        dateCreation: new Date().toISOString().slice(0, 10)
      };
      
      // Sauvegarder dans Supabase si connecté
      if (supabaseEnabled && user) {
        try {
          const saved = await saveDischargeToSupabase(dischargeInput, user.id);
          if (saved) {
            console.log('✅ Décharge sauvegardée dans Supabase:', saved.id);
            setState(st => ({ ...st, discharges: [saved, ...st.discharges.filter(d => d.id !== saved.id)] }));
            return saved;
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde Supabase:', error);
        }
      }
      
      // Sauvegarder localement
      setState(st => ({ ...st, discharges: [discharge, ...st.discharges] }));
      return discharge;
    },
    updateDischarge: (id, partial) => {
      setState(st => ({
        ...st,
        discharges: st.discharges.map(d => d.id === id ? { ...d, ...partial } : d)
      }));
    },
    deleteDischarge: (id) => {
      setState(st => ({
        ...st,
        discharges: st.discharges.filter(d => d.id !== id)
      }));
    },
    // Gestion des contrats et lettres de commande
    addContractOrder: (contractOrderInput) => {
      const id = `${contractOrderInput.documentType.toUpperCase()}-${String(state.contractOrders.length + 1).padStart(3, '0')}`;
      const contractOrder: ContractOrder = {
        ...contractOrderInput,
        id,
        dateCreation: new Date().toISOString().slice(0, 10)
      };
      setState(st => ({ ...st, contractOrders: [contractOrder, ...st.contractOrders] }));
      return contractOrder;
    },
    updateContractOrder: (id, partial) => {
      setState(st => ({
        ...st,
        contractOrders: st.contractOrders.map(co => co.id === id ? { ...co, ...partial } : co)
      }));
    },
    deleteContractOrder: (id) => {
      setState(st => ({
        ...st,
        contractOrders: st.contractOrders.filter(co => co.id !== id)
      }));
    },
    // Implémentations des fonctions bancaires
    addBankAccount: (bankAccountInput) => {
      const id = `bank-${Date.now()}`;
      const bankAccount: BankAccount = {
        ...bankAccountInput,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState(st => ({
        ...st,
        bankAccounts: [...st.bankAccounts, bankAccount]
      }));
      return bankAccount;
    },
    updateBankAccount: (id, bankAccountInput) => {
      setState(st => ({
        ...st,
        bankAccounts: st.bankAccounts.map(ba => 
          ba.id === id 
            ? { ...ba, ...bankAccountInput, updatedAt: new Date().toISOString() }
            : ba
        )
      }));
    },
    deleteBankAccount: (id) => {
      setState(st => ({
        ...st,
        bankAccounts: st.bankAccounts.filter(ba => ba.id !== id)
      }));
    },
    setDefaultBankAccount: (id) => {
      setState(st => ({
        ...st,
        bankAccounts: st.bankAccounts.map(ba => ({
          ...ba,
          isDefault: ba.id === id,
          updatedAt: new Date().toISOString()
        }))
      }));
    }
  }), [state.documents, state.suppliersList, state.supplierInvoices, state.clients, state.discharges, state.contractOrders, state.bankAccounts, state.articlesDirectory, state.articleCategories, state.articleLots, state.articles]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
};

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}


