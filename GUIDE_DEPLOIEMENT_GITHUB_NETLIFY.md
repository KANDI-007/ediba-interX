# 🚀 Guide de Déploiement GitHub → Netlify → Supabase

## ✅ Étape 1 : Déploiement GitHub - TERMINÉ

Votre code a été déployé avec succès sur GitHub :
- **Dépôt** : https://github.com/KANDI-007/ediba-interX
- **Branche** : `main`
- **Statut** : ✅ Code déployé (831 fichiers, 1.11 MiB)

---

## 🔧 Étape 2 : Configuration Netlify

### 2.1 Connecter le Dépôt GitHub à Netlify

1. **Connectez-vous à Netlify**
   - Allez sur https://app.netlify.com/
   - Connectez-vous avec votre compte GitHub

2. **Importer le Projet**
   - Cliquez sur **"Add new site"** > **"Import an existing project"**
   - Choisissez **"Deploy with GitHub"**
   - Autorisez Netlify à accéder à votre compte GitHub si demandé

3. **Sélectionner le Dépôt**
   - Cherchez et sélectionnez **`ediba-interX`**
   - Cliquez sur **"Connect"**

### 2.2 Configurer les Paramètres de Build

Netlify devrait détecter automatiquement les paramètres depuis `netlify.toml`, mais vérifiez :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Functions directory** : `netlify/functions`
- **Node version** : `18` (déjà configuré dans netlify.toml)

### 2.3 Configurer les Variables d'Environnement

1. **Avant de déployer**, allez dans **"Site settings"** > **"Environment variables"**
2. **Ajoutez toutes les variables** :

```
VITE_SUPABASE_URL=https://ywiicnfobaotiwhesdvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWljbmZvYmFvdGl3aGVzZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTMwODMsImV4cCI6MjA3OTY2OTA4M30.ci2NSBzwnm1-Feerl0yqm_xx7MCLN9iSIQugAupVTXU

VITE_APP_NAME=EDIBA-INTER
VITE_COMPANY_NAME=EDIBA INTER SARL U
VITE_COMPANY_ADDRESS=123 Avenue de la Paix, Lomé, Togo
VITE_COMPANY_PHONE=+228 12 34 56 78
VITE_COMPANY_EMAIL=contact@edibainter.com

VITE_ENCRYPTION_KEY=ediba-inter-encryption-key-2024
VITE_SESSION_TIMEOUT=3600000

VITE_PWA_NAME=EDIBA-INTER
VITE_PWA_SHORT_NAME=EDIBA
VITE_PWA_THEME_COLOR=#25C1FF
VITE_PWA_BACKGROUND_COLOR=#1e40af
```

**⚠️ IMPORTANT** : Pour les Netlify Functions, ajoutez aussi :

```
SUPABASE_URL=https://ywiicnfobaotiwhesdvj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWljbmZvYmFvdGl3aGVzZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTMwODMsImV4cCI6MjA3OTY2OTA4M30.ci2NSBzwnm1-Feerl0yqm_xx7MCLN9iSIQugAupVTXU
```

### 2.4 Déployer

1. Cliquez sur **"Deploy site"**
2. Attendez que le build se termine (2-5 minutes)
3. Votre site sera disponible sur `https://your-site-name.netlify.app`

---

## 🗄️ Étape 3 : Configuration Supabase

### 3.1 Créer les Tables dans Supabase

1. **Connectez-vous à Supabase**
   - Allez sur https://app.supabase.com/
   - Ouvrez votre projet : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj

2. **Ouvrir SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Exécuter les Migrations**
   - Copiez le contenu du fichier `supabase-setup/supabase/migrations/20241208000001_initial_schema.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`

4. **Vérifier les Tables**
   - Allez dans **"Table Editor"**
   - Vérifiez que toutes les tables sont créées :
     - ✅ `users`
     - ✅ `clients`
     - ✅ `suppliers`
     - ✅ `documents`
     - ✅ `line_items`
     - ✅ `payments`
     - ✅ `articles`
     - ✅ `article_categories`
     - ✅ `discharges`
     - ✅ `conversations`
     - ✅ `conversation_participants`
     - ✅ `messages`
     - ✅ `activities`
     - ✅ `notifications`

### 3.2 Configurer les Politiques RLS (Row Level Security)

1. **Activer RLS sur les Tables**
   - Pour chaque table, allez dans **"Authentication"** > **"Policies"**
   - Activez **"Enable Row Level Security"**

2. **Créer les Politiques de Base**

**Table `users`** :
```sql
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid()::text = id::text);

-- Permettre la mise à jour de son propre profil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);
```

**Table `clients`** :
```sql
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read clients"
ON clients FOR SELECT
USING (auth.role() = 'authenticated');

-- Permettre l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert clients"
ON clients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update clients"
ON clients FOR UPDATE
USING (auth.role() = 'authenticated');
```

**Table `documents`** :
```sql
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read documents"
ON documents FOR SELECT
USING (auth.role() = 'authenticated');

-- Permettre l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert documents"
ON documents FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update documents"
ON documents FOR UPDATE
USING (auth.role() = 'authenticated');
```

**Table `messages`** :
```sql
-- Permettre la lecture pour les participants de la conversation
CREATE POLICY "Participants can read messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id::text = auth.uid()::text
  )
);

-- Permettre l'insertion pour les participants
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id::text = auth.uid()::text
  )
);
```

**Note** : Pour simplifier au début, vous pouvez désactiver RLS temporairement pour tester, puis l'activer progressivement.

### 3.3 Désactiver RLS Temporairement (Pour Tests)

Si vous voulez tester rapidement sans configurer toutes les politiques :

1. Allez dans **"Table Editor"**
2. Pour chaque table, cliquez sur **"..."** > **"Disable RLS"**
3. ⚠️ **Réactivez RLS en production** avec les bonnes politiques !

---

## ✅ Étape 4 : Vérification

### 4.1 Vérifier Netlify

1. **Vérifier le Déploiement**
   - Allez sur votre site Netlify
   - Vérifiez qu'il se charge correctement
   - Ouvrez la console du navigateur (F12)
   - Vérifiez qu'il n'y a pas d'erreurs

2. **Vérifier les Functions**
   - Dans Netlify, allez dans **"Functions"**
   - Vérifiez que les fonctions sont déployées :
     - `/.netlify/functions/chat`
     - `/.netlify/functions/auth`
     - `/.netlify/functions/user-data`

3. **Tester les Endpoints**
   - Testez : `https://your-site.netlify.app/.netlify/functions/chat`
   - Devrait retourner une réponse JSON

### 4.2 Vérifier Supabase

1. **Tester la Connexion**
   - Dans votre application Netlify, ouvrez la console
   - Vérifiez les messages de connexion Supabase
   - Devrait voir : `✅ Connexion Supabase réussie`

2. **Tester l'Insertion**
   - Créez un client dans l'application
   - Vérifiez dans Supabase Dashboard > Table Editor > `clients`
   - Le client devrait apparaître

3. **Tester la Récupération**
   - Rechargez l'application
   - Les données devraient être chargées depuis Supabase

---

## 🔄 Étape 5 : Migration des Données

### 5.1 Migration Automatique

Si vous avez des données dans localStorage, elles seront migrées automatiquement au premier chargement.

### 5.2 Migration Manuelle

Si nécessaire, vous pouvez forcer la migration :

1. Ouvrez la console du navigateur
2. Exécutez :
```javascript
// Dans la console du navigateur
localStorage.getItem('ediba.data.v1') // Vérifier les données
```

3. La migration se fera automatiquement au prochain chargement si :
   - Des données existent dans localStorage
   - Aucune donnée n'existe dans Supabase
   - L'utilisateur est connecté

---

## 📊 Checklist de Déploiement

### GitHub
- [x] Code poussé sur GitHub
- [x] Dépôt accessible : https://github.com/KANDI-007/ediba-interX

### Netlify
- [ ] Dépôt connecté à Netlify
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Site accessible
- [ ] Functions déployées

### Supabase
- [ ] Tables créées
- [ ] Politiques RLS configurées (ou désactivées pour tests)
- [ ] Connexion testée
- [ ] Insertion testée
- [ ] Récupération testée

### Application
- [ ] Application se charge correctement
- [ ] Connexion Supabase fonctionnelle
- [ ] Création de données fonctionne
- [ ] Récupération de données fonctionne
- [ ] Migration automatique fonctionne (si applicable)

---

## 🐛 Dépannage

### Problème : Build Netlify échoue

**Solution** :
- Vérifiez les logs de build dans Netlify
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `NODE_VERSION` est correct

### Problème : Variables d'environnement non chargées

**Solution** :
- Vérifiez que les variables sont bien définies dans Netlify
- Vérifiez que les noms commencent par `VITE_` pour Vite
- Redéployez après avoir ajouté les variables

### Problème : Erreurs Supabase

**Solution** :
- Vérifiez que les clés API sont correctes
- Vérifiez que les tables existent
- Vérifiez les politiques RLS
- Consultez les logs Supabase

### Problème : Données non sauvegardées

**Solution** :
- Vérifiez la connexion Supabase dans la console
- Vérifiez les politiques RLS
- Vérifiez les logs Supabase
- Testez avec RLS désactivé temporairement

---

## 📞 Support

Pour toute question :
- **Documentation Netlify** : https://docs.netlify.com/
- **Documentation Supabase** : https://supabase.com/docs
- **Support EDIBA INTER** : kandilare20@gmail.com

---

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Statut** : ✅ Code déployé sur GitHub - Prêt pour Netlify et Supabase

