-- ============================================================================
-- MIGRATION COMPLÈTE SUPABASE - EDIBA INTER
-- ============================================================================
-- Ce script crée toutes les tables nécessaires pour l'application EDIBA INTER
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Extension pour UUID (si pas déjà installée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users (Utilisateurs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'comptable', 'commercial', 'lecture')),
  avatar_url TEXT,
  phone VARCHAR(20),
  address TEXT,
  join_date TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- TABLE: clients (Clients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raison_sociale VARCHAR(200) NOT NULL,
  nom_commercial VARCHAR(200),
  nif VARCHAR(50) UNIQUE NOT NULL,
  rccm VARCHAR(50),
  adresse TEXT NOT NULL,
  ville VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  contact_principal VARCHAR(100),
  secteur_activite VARCHAR(100),
  regime_fiscal VARCHAR(50) DEFAULT 'Réel Normal',
  delai_paiement INTEGER DEFAULT 30,
  remise DECIMAL(5,2) DEFAULT 0,
  limite_credit DECIMAL(15,2) DEFAULT 0,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  date_creation TIMESTAMP DEFAULT NOW(),
  derniere_facture TIMESTAMP,
  total_facture DECIMAL(15,2) DEFAULT 0,
  total_encaissement DECIMAL(15,2) DEFAULT 0,
  solde_impaye DECIMAL(15,2) DEFAULT 0,
  nombre_factures INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_clients_nif ON clients(nif);
CREATE INDEX IF NOT EXISTS idx_clients_raison_sociale ON clients(raison_sociale);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);

-- ============================================================================
-- TABLE: suppliers (Fournisseurs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raison_sociale VARCHAR(200) NOT NULL,
  nom_commercial VARCHAR(200),
  nif VARCHAR(50) UNIQUE NOT NULL,
  rccm VARCHAR(50),
  adresse TEXT NOT NULL,
  ville VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  contact_principal VARCHAR(100),
  secteur_activite VARCHAR(100),
  delai_paiement VARCHAR(20) DEFAULT '30 jours',
  remise VARCHAR(10) DEFAULT '0%',
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_suppliers_nif ON suppliers(nif);
CREATE INDEX IF NOT EXISTS idx_suppliers_raison_sociale ON suppliers(raison_sociale);

-- ============================================================================
-- TABLE: article_categories (Catégories d'articles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES article_categories(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_article_categories_parent_id ON article_categories(parent_id);

-- ============================================================================
-- TABLE: articles (Articles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  unit_price DECIMAL(15,2),
  category_id UUID REFERENCES article_categories(id),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pièce',
  weight DECIMAL(10,2),
  dimensions VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  material VARCHAR(100),
  color VARCHAR(50),
  size VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_sku ON articles(sku);
CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);

-- ============================================================================
-- TABLE: documents (Factures, Devis, BL, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('proforma', 'bl', 'invoice', 'acompte', 'solde')),
  reference VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  date_creation DATE NOT NULL,
  date_echeance DATE,
  tva DECIMAL(5,2) DEFAULT 18.5,
  statut VARCHAR(20) DEFAULT 'pending' CHECK (statut IN ('validated', 'paid', 'partial', 'overdue', 'pending')),
  workflow_status VARCHAR(20) DEFAULT 'draft' CHECK (workflow_status IN ('draft', 'validated', 'ordered', 'delivered', 'invoiced', 'completed')),
  parent_document_id UUID REFERENCES documents(id),
  order_number VARCHAR(50),
  contract_order_reference VARCHAR(100),
  objet TEXT DEFAULT 'CONSOMMABLE',
  total_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_date_creation ON documents(date_creation);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);

-- ============================================================================
-- TABLE: line_items (Lignes de documents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_ht DECIMAL(15,2) NOT NULL,
  received_quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_line_items_document_id ON line_items(document_id);

-- ============================================================================
-- TABLE: payments (Paiements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_payments_document_id ON payments(document_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- ============================================================================
-- TABLE: discharges (Décharges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discharges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire VARCHAR(200) NOT NULL,
  prestation TEXT NOT NULL,
  date_prestation DATE NOT NULL,
  lieu VARCHAR(200) NOT NULL,
  objet TEXT DEFAULT 'CONSOMMABLE',
  signature_data TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_discharges_prestataire ON discharges(prestataire);
CREATE INDEX IF NOT EXISTS idx_discharges_date_prestation ON discharges(date_prestation);

-- ============================================================================
-- TABLE: conversations (Conversations de chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200),
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE: conversation_participants (Participants aux conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- ============================================================================
-- TABLE: messages (Messages de chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  reply_to_id UUID REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================================
-- TABLE: activities (Journal d'activité)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_module ON activities(module);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- ============================================================================
-- TABLE: notifications (Notifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
-- Toutes les tables ont été créées avec succès !
-- 
-- Prochaines étapes :
-- 1. Vérifier les tables dans "Table Editor"
-- 2. Configurer les politiques RLS (Row Level Security) si nécessaire
-- 3. Tester la connexion depuis l'application
-- ============================================================================

