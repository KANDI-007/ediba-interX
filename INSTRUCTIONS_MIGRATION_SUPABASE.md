# 📋 Instructions pour Exécuter les Migrations Supabase

## 🎯 Vue d'Ensemble

Ce guide vous explique comment exécuter les migrations SQL dans Supabase pour créer toutes les tables nécessaires à l'application EDIBA INTER.

---

## 📍 Accès à Supabase SQL Editor

1. **Connectez-vous à Supabase**
   - Allez sur https://app.supabase.com/
   - Ouvrez votre projet : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj

2. **Ouvrir SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"** pour créer une nouvelle requête

---

## 🔧 Étape 1 : Créer les Tables

### 1.1 Copier le Script SQL

1. Ouvrez le fichier **`MIGRATION_SUPABASE_SQL_COMPLETE.sql`**
2. **Copiez TOUT le contenu** du fichier (Ctrl+A puis Ctrl+C)

### 1.2 Exécuter dans Supabase

1. Dans Supabase SQL Editor, **collez le script** (Ctrl+V)
2. Cliquez sur **"Run"** ou appuyez sur **`Ctrl+Enter`** (ou `Cmd+Enter` sur Mac)
3. Attendez que l'exécution se termine (quelques secondes)

### 1.3 Vérifier les Tables

1. Allez dans **"Table Editor"** dans le menu de gauche
2. Vérifiez que toutes ces tables sont créées :
   - ✅ `users`
   - ✅ `clients`
   - ✅ `suppliers`
   - ✅ `articles`
   - ✅ `article_categories`
   - ✅ `documents`
   - ✅ `line_items`
   - ✅ `payments`
   - ✅ `discharges`
   - ✅ `conversations`
   - ✅ `conversation_participants`
   - ✅ `messages`
   - ✅ `activities`
   - ✅ `notifications`

---

## 🔒 Étape 2 : Configurer les Politiques RLS (Optionnel)

### Option A : Désactiver RLS (Pour Tests Rapides) ⚡

Si vous voulez tester rapidement sans configurer les politiques :

1. Allez dans **"Table Editor"**
2. Pour chaque table :
   - Cliquez sur la table
   - Cliquez sur **"..."** (menu)
   - Sélectionnez **"Disable RLS"**

**⚠️ Note** : Réactivez RLS en production avec les bonnes politiques !

### Option B : Activer RLS avec Politiques Permissives (Recommandé)

1. Ouvrez le fichier **`MIGRATION_SUPABASE_RLS_POLICIES.sql`**
2. Copiez tout le contenu
3. Collez dans Supabase SQL Editor
4. Exécutez (Run ou Ctrl+Enter)

Ces politiques permettent à tous les utilisateurs authentifiés d'accéder aux données.

---

## ✅ Vérification Post-Migration

### Vérifier les Tables

```sql
-- Exécuter cette requête pour voir toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Vérifier les Index

```sql
-- Vérifier que les index sont créés
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### Tester une Insertion

```sql
-- Tester l'insertion d'un client
INSERT INTO clients (raison_sociale, nif, adresse, ville, telephone)
VALUES ('Client Test', 'NIF-TEST-001', '123 Rue Test', 'Lomé', '+228 12 34 56 78')
RETURNING *;
```

Si l'insertion fonctionne, les tables sont correctement créées !

---

## 🐛 Dépannage

### Erreur : "relation already exists"

**Solution** : Les tables existent déjà. C'est normal si vous avez déjà exécuté le script. Vous pouvez :
- Ignorer l'erreur
- Ou supprimer les tables existantes et réexécuter

### Erreur : "extension uuid-ossp does not exist"

**Solution** : L'extension est déjà installée par défaut dans Supabase. Vous pouvez ignorer cette ligne ou la supprimer du script.

### Erreur : "permission denied"

**Solution** : Vérifiez que vous êtes connecté avec les bonnes permissions. En général, cela ne devrait pas arriver dans Supabase.

### Tables non visibles dans Table Editor

**Solution** :
1. Rafraîchissez la page (F5)
2. Vérifiez que vous êtes dans le bon schéma (`public`)
3. Vérifiez avec la requête SQL ci-dessus

---

## 📊 Structure des Tables Créées

### Tables Principales

| Table | Description | Relations |
|-------|-------------|-----------|
| `users` | Utilisateurs de l'application | - |
| `clients` | Clients | - |
| `suppliers` | Fournisseurs | - |
| `articles` | Articles | → `article_categories` |
| `article_categories` | Catégories d'articles | → `article_categories` (parent) |
| `documents` | Factures, devis, BL | → `clients`, `users` |
| `line_items` | Lignes de documents | → `documents` |
| `payments` | Paiements | → `documents`, `users` |
| `discharges` | Décharges | → `users` |
| `conversations` | Conversations de chat | → `users` |
| `conversation_participants` | Participants | → `conversations`, `users` |
| `messages` | Messages de chat | → `conversations`, `users`, `messages` |
| `activities` | Journal d'activité | → `users` |
| `notifications` | Notifications | → `users` |

---

## 🚀 Prochaines Étapes

Après avoir créé les tables :

1. ✅ **Vérifier les tables** dans Table Editor
2. ✅ **Configurer RLS** (ou désactiver pour tests)
3. ✅ **Tester la connexion** depuis l'application
4. ✅ **Tester l'insertion** d'une donnée
5. ✅ **Tester la récupération** des données

---

## 📞 Support

En cas de problème :
- **Documentation Supabase** : https://supabase.com/docs
- **Support EDIBA INTER** : kandilare20@gmail.com

---

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Statut** : ✅ Prêt à exécuter

