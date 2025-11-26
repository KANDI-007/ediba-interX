# 🚀 Migration Complète vers Supabase - EDIBA INTER

## 📋 Vue d'Ensemble

Ce document décrit la migration complète de toutes les données de l'application EDIBA INTER depuis **LocalStorage** vers **Supabase**. Toutes les données sont maintenant sauvegardées automatiquement dans Supabase et récupérables lors de la connexion.

---

## ✅ Données Migrées

### 1. **Documents (Factures, Devis, BL)** ✅
- ✅ Création automatique dans Supabase
- ✅ Sauvegarde des lignes de documents (line_items)
- ✅ Sauvegarde des paiements associés
- ✅ Récupération complète au chargement
- ✅ Mise à jour et suppression

**Tables Supabase** :
- `documents` - Documents principaux
- `line_items` - Lignes de documents
- `payments` - Paiements

### 2. **Clients** ✅
- ✅ Création automatique dans Supabase
- ✅ Toutes les informations (NIF, RCCM, adresse, etc.)
- ✅ Statistiques (CA, factures, encaissements)
- ✅ Récupération complète au chargement
- ✅ Mise à jour et suppression

**Table Supabase** : `clients`

### 3. **Fournisseurs** ✅
- ✅ Création automatique dans Supabase
- ✅ Informations complètes
- ✅ Récupération complète au chargement
- ✅ Mise à jour et suppression

**Table Supabase** : `suppliers`

### 4. **Articles et Catégories** ✅
- ✅ Création automatique dans Supabase
- ✅ Catégories hiérarchiques
- ✅ Articles avec prix, SKU, etc.
- ✅ Récupération complète au chargement
- ✅ Mise à jour et suppression

**Tables Supabase** :
- `article_categories` - Catégories d'articles
- `articles` - Articles

### 5. **Décharges** ✅
- ✅ Création automatique dans Supabase
- ✅ Signature électronique sauvegardée
- ✅ Récupération complète au chargement
- ✅ Mise à jour et suppression

**Table Supabase** : `discharges`

### 6. **Chat** ✅
- ✅ Messages sauvegardés dans Supabase
- ✅ Conversations et participants
- ✅ Historique complet récupérable
- ✅ Temps réel via Supabase Realtime

**Tables Supabase** :
- `conversations` - Conversations
- `conversation_participants` - Participants
- `messages` - Messages

### 7. **Paiements** ✅
- ✅ Sauvegarde automatique avec les documents
- ✅ Historique complet
- ✅ Récupération avec les documents

**Table Supabase** : `payments`

---

## 📁 Fichiers Créés

### Services Supabase

1. **`src/services/dataService.ts`** ✅
   - Service complet pour tous les modules
   - Fonctions CRUD pour documents, clients, fournisseurs, articles, décharges
   - Conversion entre formats application et Supabase

2. **`src/services/migrationService.ts`** ✅
   - Migration automatique depuis localStorage
   - Vérification de migration nécessaire
   - Gestion des erreurs de migration

3. **`src/services/supabaseDataLoader.ts`** ✅
   - Chargement unifié de toutes les données
   - Système de cache pour performance
   - Synchronisation automatique

4. **`src/services/chatService.ts`** ✅
   - Service de chat avec Supabase
   - Sauvegarde et récupération des messages
   - Temps réel via Realtime

### Configuration

5. **`src/lib/supabase.ts`** ✅
   - Client Supabase configuré
   - Types TypeScript
   - Helpers de connexion

---

## 🔄 Fonctionnement

### Sauvegarde Automatique

Toutes les opérations CRUD sauvegardent automatiquement dans Supabase :

```typescript
// Exemple : Création d'une facture
const document = await saveDocumentToSupabase({
  type: 'invoice',
  date: '2025-01-26',
  client: 'Client ABC',
  items: [...],
  tva: 18.5,
  // ...
}, userId);

// Le document est automatiquement sauvegardé dans Supabase
// avec ses lignes et paiements associés
```

### Récupération au Chargement

Au démarrage de l'application, toutes les données sont chargées depuis Supabase :

```typescript
// Dans DataContext ou App.tsx
const allData = await loadAllDataFromSupabase();

// Retourne :
// - documents: CustomerDocument[]
// - clients: Client[]
// - suppliers: SupplierEntity[]
// - articles: Article[]
// - articleCategories: ArticleCategory[]
// - discharges: Discharge[]
```

### Migration depuis LocalStorage

Si des données existent dans localStorage, elles sont automatiquement migrées :

```typescript
// Vérifier si migration nécessaire
const needsMigration = await checkMigrationNeeded();

if (needsMigration) {
  // Migrer toutes les données
  const result = await migrateAllDataToSupabase(userId);
  console.log('Migration:', result);
}
```

---

## 📊 Structure des Données

### Documents

```typescript
// Format Application
interface CustomerDocument {
  id: string;
  type: 'proforma' | 'delivery' | 'invoice';
  reference: string;
  date: string;
  client: string;
  items: LineItem[];
  status: 'validated' | 'paid' | 'partial' | 'overdue' | 'pending';
  // ...
}

// Format Supabase
// Table: documents
// Table: line_items (relation)
// Table: payments (relation)
```

### Clients

```typescript
// Format Application
interface Client {
  id: string;
  raisonSociale: string;
  nif: string;
  adresse: string;
  // ...
}

// Format Supabase
// Table: clients
```

---

## 🔧 Intégration dans DataContext

### Étape 1 : Charger les Données au Démarrage

```typescript
// Dans DataContext.tsx
useEffect(() => {
  const loadData = async () => {
    // Charger depuis Supabase
    const data = await loadAllDataFromSupabase();
    
    setState(prev => ({
      ...prev,
      documents: data.documents,
      clients: data.clients,
      suppliers: data.suppliers,
      articles: data.articles,
      articleCategories: data.articleCategories,
      discharges: data.discharges,
    }));
  };

  loadData();
}, []);
```

### Étape 2 : Sauvegarder dans Supabase

```typescript
// Remplacer localStorage.setItem par Supabase
const saveDocument = async (doc: CustomerDocument) => {
  // Sauvegarder dans Supabase
  const saved = await saveDocumentToSupabase(doc, userId);
  
  if (saved) {
    // Mettre à jour l'état local
    setState(prev => ({
      ...prev,
      documents: [...prev.documents, saved],
    }));
  }
};
```

### Étape 3 : Migration Automatique

```typescript
// Au démarrage, vérifier et migrer si nécessaire
useEffect(() => {
  const initMigration = async () => {
    if (!isMigrationDone() && await checkMigrationNeeded()) {
      const result = await migrateAllDataToSupabase(userId);
      if (result.success) {
        markMigrationAsDone();
      }
    }
  };

  initMigration();
}, []);
```

---

## 🚀 Déploiement

### 1. Créer les Tables dans Supabase

Exécutez les migrations depuis `supabase-setup/supabase/migrations/` :

```bash
# Via Supabase CLI
supabase db push

# Ou via l'interface Supabase SQL Editor
```

### 2. Configurer les Variables d'Environnement

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Tester la Migration

```typescript
// Dans l'application
import { migrateAllDataToSupabase } from './services/migrationService';

// Migrer les données
const result = await migrateAllDataToSupabase(userId);
console.log('Migration:', result);
```

### 4. Vérifier les Données

Dans Supabase Dashboard :
- Vérifier que les tables sont créées
- Vérifier que les données sont présentes
- Tester les requêtes

---

## ✅ Avantages de la Migration

### 1. **Persistance des Données**
- ✅ Données sauvegardées dans le cloud
- ✅ Accessibles depuis n'importe quel appareil
- ✅ Pas de perte de données

### 2. **Synchronisation Multi-utilisateurs**
- ✅ Données partagées entre utilisateurs
- ✅ Synchronisation en temps réel
- ✅ Collaboration améliorée

### 3. **Sécurité**
- ✅ Authentification Supabase
- ✅ Politiques RLS (Row Level Security)
- ✅ Chiffrement des données

### 4. **Performance**
- ✅ Cache local pour performance
- ✅ Chargement optimisé
- ✅ Requêtes indexées

### 5. **Scalabilité**
- ✅ Base de données PostgreSQL
- ✅ Pas de limite de taille (dans les limites du plan)
- ✅ Sauvegardes automatiques

---

## 🔍 Vérification Post-Migration

### Checklist

- [ ] Tables créées dans Supabase
- [ ] Politiques RLS configurées
- [ ] Données migrées depuis localStorage
- [ ] Nouvelles données sauvegardées dans Supabase
- [ ] Récupération des données au chargement
- [ ] Synchronisation multi-utilisateurs fonctionnelle
- [ ] Performance acceptable
- [ ] Pas d'erreurs dans les logs

---

## 🐛 Dépannage

### Problème : Données non sauvegardées

**Solution** :
- Vérifier la connexion Supabase
- Vérifier les clés API
- Vérifier les politiques RLS
- Consulter les logs Supabase

### Problème : Migration échoue

**Solution** :
- Vérifier que les tables existent
- Vérifier les formats de données
- Consulter les erreurs dans la console
- Migrer par petits lots si nécessaire

### Problème : Données non récupérées

**Solution** :
- Vérifier la connexion Supabase
- Vérifier les requêtes dans Supabase Dashboard
- Vérifier les logs de l'application
- Tester avec `loadAllDataFromSupabase()`

---

## 📞 Support

Pour toute question :
- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Migration** : Ce document
- **Support EDIBA INTER** : kandilare20@gmail.com

---

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Statut** : ✅ Migration complète implémentée

