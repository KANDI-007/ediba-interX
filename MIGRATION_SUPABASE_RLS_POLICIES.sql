-- ============================================================================
-- POLITIQUES RLS (Row Level Security) - EDIBA INTER
-- ============================================================================
-- Ce script configure les politiques de sécurité pour les tables
-- À exécuter APRÈS la création des tables
-- ============================================================================
-- 
-- ⚠️ IMPORTANT : Pour tester rapidement, vous pouvez DÉSACTIVER RLS temporairement
-- en allant dans Table Editor > ... > Disable RLS pour chaque table
-- ============================================================================

-- ============================================================================
-- OPTION 1 : DÉSACTIVER RLS (Pour tests rapides)
-- ============================================================================
-- Si vous voulez tester rapidement sans configurer les politiques,
-- désactivez RLS pour toutes les tables dans l'interface Supabase :
-- Table Editor > Sélectionner table > ... > Disable RLS
-- ============================================================================

-- ============================================================================
-- OPTION 2 : ACTIVER RLS AVEC POLITIQUES PERMISSIVES (Recommandé pour début)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES PERMISSIVES (Permettre tout pour les utilisateurs authentifiés)
-- ============================================================================
-- Ces politiques permettent à tous les utilisateurs authentifiés d'accéder
-- aux données. À affiner selon vos besoins de sécurité.
-- ============================================================================

-- Table: users
CREATE POLICY "Users can read all profiles"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (true);

-- Table: clients
CREATE POLICY "Authenticated users can manage clients"
ON clients FOR ALL
USING (true)
WITH CHECK (true);

-- Table: suppliers
CREATE POLICY "Authenticated users can manage suppliers"
ON suppliers FOR ALL
USING (true)
WITH CHECK (true);

-- Table: articles
CREATE POLICY "Authenticated users can manage articles"
ON articles FOR ALL
USING (true)
WITH CHECK (true);

-- Table: article_categories
CREATE POLICY "Authenticated users can manage categories"
ON article_categories FOR ALL
USING (true)
WITH CHECK (true);

-- Table: documents
CREATE POLICY "Authenticated users can manage documents"
ON documents FOR ALL
USING (true)
WITH CHECK (true);

-- Table: line_items
CREATE POLICY "Authenticated users can manage line items"
ON line_items FOR ALL
USING (true)
WITH CHECK (true);

-- Table: payments
CREATE POLICY "Authenticated users can manage payments"
ON payments FOR ALL
USING (true)
WITH CHECK (true);

-- Table: discharges
CREATE POLICY "Authenticated users can manage discharges"
ON discharges FOR ALL
USING (true)
WITH CHECK (true);

-- Table: conversations
CREATE POLICY "Authenticated users can manage conversations"
ON conversations FOR ALL
USING (true)
WITH CHECK (true);

-- Table: conversation_participants
CREATE POLICY "Authenticated users can manage participants"
ON conversation_participants FOR ALL
USING (true)
WITH CHECK (true);

-- Table: messages
CREATE POLICY "Authenticated users can manage messages"
ON messages FOR ALL
USING (true)
WITH CHECK (true);

-- Table: activities
CREATE POLICY "Authenticated users can manage activities"
ON activities FOR ALL
USING (true)
WITH CHECK (true);

-- Table: notifications
CREATE POLICY "Users can manage own notifications"
ON notifications FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FIN DES POLITIQUES RLS
-- ============================================================================
-- Les politiques sont maintenant configurées pour permettre l'accès
-- à tous les utilisateurs authentifiés.
-- 
-- Pour une sécurité renforcée, vous pouvez affiner ces politiques plus tard
-- selon les rôles des utilisateurs (admin, comptable, commercial, lecture).
-- ============================================================================

