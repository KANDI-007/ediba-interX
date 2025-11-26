# 🚀 Guide de Déploiement Netlify avec Supabase - EDIBA INTER

## 📋 Vue d'ensemble

Ce guide détaille le processus complet de déploiement de l'application EDIBA INTER sur Netlify avec intégration Supabase pour la base de données et l'authentification.

---

## 🎯 Prérequis

### 1. Comptes Nécessaires
- ✅ Compte [Netlify](https://www.netlify.com/) (gratuit)
- ✅ Compte [Supabase](https://supabase.com/) (gratuit jusqu'à 500MB)
- ✅ Compte [GitHub](https://github.com/) (pour le dépôt)

### 2. Outils Locaux
- ✅ Node.js 18+ installé
- ✅ Git installé et configuré
- ✅ npm ou yarn installé

---

## 📦 Étape 1 : Configuration Supabase

### 1.1 Créer un Projet Supabase

1. Connectez-vous à [Supabase](https://app.supabase.com/)
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Name** : `ediba-inter`
   - **Database Password** : (choisissez un mot de passe fort)
   - **Region** : Choisissez la région la plus proche
4. Cliquez sur **"Create new project"**
5. Attendez 2-3 minutes que le projet soit créé

### 1.2 Récupérer les Clés API

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Copiez les valeurs suivantes :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key** : (gardez-la secrète, ne l'exposez jamais côté client)

### 1.3 Créer les Tables dans Supabase

#### Option A : Via l'Interface Supabase

1. Allez dans **SQL Editor** dans Supabase
2. Exécutez le script de migration depuis `supabase-setup/supabase/migrations/20241208000001_initial_schema.sql`
3. Ou utilisez les migrations fournies dans le dossier `supabase-setup/`

#### Option B : Via Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
supabase db push
```

### 1.4 Configurer les Politiques RLS (Row Level Security)

1. Allez dans **Authentication** > **Policies**
2. Pour chaque table, créez les politiques appropriées :

**Table `users`** :
```sql
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Permettre la mise à jour de son propre profil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
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
    AND user_id = auth.uid()
  )
);

-- Permettre l'insertion pour les participants
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);
```

---

## 🔧 Étape 2 : Configuration Locale

### 2.1 Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Configuration Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuration Application
VITE_APP_NAME=EDIBA-INTER
VITE_COMPANY_NAME=EDIBA INTER SARL U
VITE_COMPANY_ADDRESS=123 Avenue de la Paix, Lomé, Togo
VITE_COMPANY_PHONE=+228 12 34 56 78
VITE_COMPANY_EMAIL=contact@edibainter.com

# Configuration Sécurité
VITE_ENCRYPTION_KEY=your-encryption-key-here
VITE_SESSION_TIMEOUT=3600000

# Configuration PWA
VITE_PWA_NAME=EDIBA-INTER
VITE_PWA_THEME_COLOR=#25C1FF
```

### 2.2 Installer les Dépendances

```bash
npm install
```

### 2.3 Tester en Local

```bash
# Démarrer le serveur de développement
npm run dev

# Tester le build
npm run build
npm run preview
```

---

## 📤 Étape 3 : Préparer le Déploiement GitHub

### 3.1 Initialiser Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit - EDIBA INTER avec Supabase"
```

### 3.2 Créer un Dépôt GitHub

1. Allez sur [GitHub](https://github.com/new)
2. Créez un nouveau dépôt : `ediba-interX`
3. Ne cochez **PAS** "Initialize with README"

### 3.3 Pousser le Code

```bash
# Ajouter le remote
git remote add origin https://github.com/KANDI-007/ediba-interX.git

# Pousser le code
git branch -M main
git push -u origin main
```

---

## 🚀 Étape 4 : Déploiement sur Netlify

### 4.1 Connecter le Dépôt GitHub

1. Connectez-vous à [Netlify](https://app.netlify.com/)
2. Cliquez sur **"Add new site"** > **"Import an existing project"**
3. Choisissez **"GitHub"** et autorisez Netlify
4. Sélectionnez le dépôt `ediba-interX`

### 4.2 Configurer les Paramètres de Build

Netlify devrait détecter automatiquement les paramètres depuis `netlify.toml`, mais vérifiez :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Functions directory** : `netlify/functions`

### 4.3 Configurer les Variables d'Environnement

1. Dans Netlify, allez dans **Site settings** > **Environment variables**
2. Ajoutez toutes les variables de `.env.local` :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=EDIBA-INTER
VITE_COMPANY_NAME=EDIBA INTER SARL U
... (toutes les autres variables)
```

**⚠️ IMPORTANT** : Pour les Netlify Functions, ajoutez aussi :
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4.4 Déployer

1. Cliquez sur **"Deploy site"**
2. Attendez que le build se termine (2-5 minutes)
3. Votre site sera disponible sur `https://your-site-name.netlify.app`

---

## ✅ Étape 5 : Vérifications Post-Déploiement

### 5.1 Tester l'Application

1. Ouvrez votre site Netlify
2. Testez la connexion
3. Vérifiez que les données se sauvegardent dans Supabase
4. Testez le système de chat

### 5.2 Vérifier les Logs

1. Dans Netlify, allez dans **Functions** > **Logs**
2. Vérifiez qu'il n'y a pas d'erreurs
3. Testez les endpoints :
   - `/.netlify/functions/chat`
   - `/.netlify/functions/auth`
   - `/.netlify/functions/user-data`

### 5.3 Vérifier Supabase

1. Dans Supabase, allez dans **Table Editor**
2. Vérifiez que les tables sont créées
3. Testez l'insertion de données depuis l'application

---

## 🔒 Étape 6 : Sécurité et Optimisations

### 6.1 Configurer un Domaine Personnalisé (Optionnel)

1. Dans Netlify, allez dans **Domain settings**
2. Cliquez sur **"Add custom domain"**
3. Suivez les instructions pour configurer votre domaine

### 6.2 Activer HTTPS

Netlify active automatiquement HTTPS pour tous les sites. Vérifiez que le certificat SSL est actif.

### 6.3 Configurer les Headers de Sécurité

Les headers de sécurité sont déjà configurés dans `netlify.toml` :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### 6.4 Optimiser les Performances

1. **Activer le CDN** : Netlify utilise automatiquement un CDN global
2. **Compression** : Activée automatiquement (gzip/brotli)
3. **Cache** : Configuré dans `netlify.toml` pour les assets statiques

---

## 🐛 Dépannage

### Problème : Build échoue sur Netlify

**Solution** :
- Vérifiez les logs de build dans Netlify
- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que `NODE_VERSION` est correct dans `netlify.toml`

### Problème : Variables d'environnement non chargées

**Solution** :
- Vérifiez que les variables sont bien définies dans Netlify
- Assurez-vous que les noms commencent par `VITE_` pour Vite
- Redéployez après avoir ajouté les variables

### Problème : Erreurs Supabase

**Solution** :
- Vérifiez que les clés API sont correctes
- Vérifiez que les tables existent dans Supabase
- Vérifiez les politiques RLS
- Consultez les logs Supabase dans le dashboard

### Problème : Images ne s'affichent pas

**Solution** :
- Vérifiez que les images sont dans le dossier `public/`
- Utilisez des chemins relatifs `./` au lieu de `/`
- Vérifiez la configuration dans `vite.config.ts`

---

## 📊 Monitoring et Maintenance

### Monitoring Netlify

1. **Analytics** : Activez Netlify Analytics pour suivre le trafic
2. **Logs** : Consultez les logs en temps réel dans Netlify
3. **Functions** : Surveillez l'utilisation des fonctions serverless

### Monitoring Supabase

1. **Database** : Surveillez l'utilisation de la base de données
2. **API** : Consultez les métriques API dans le dashboard
3. **Auth** : Surveillez les connexions utilisateurs

### Sauvegardes

1. **Supabase** : Les sauvegardes automatiques sont incluses (quotidiennes)
2. **Code** : Le code est sauvegardé sur GitHub
3. **Données** : Exportez régulièrement les données depuis Supabase

---

## 🔄 Mises à Jour

### Mettre à Jour l'Application

1. Faites vos modifications en local
2. Testez avec `npm run build`
3. Committez et poussez sur GitHub
4. Netlify déploiera automatiquement

### Mettre à Jour Supabase

1. Modifiez les migrations dans `supabase-setup/supabase/migrations/`
2. Appliquez avec `supabase db push`
3. Ou utilisez l'interface Supabase SQL Editor

---

## 📞 Support

Pour toute question ou problème :
- **Documentation Netlify** : https://docs.netlify.com/
- **Documentation Supabase** : https://supabase.com/docs
- **Support EDIBA INTER** : kandilare20@gmail.com

---

## ✅ Checklist de Déploiement

- [ ] Projet Supabase créé
- [ ] Tables créées dans Supabase
- [ ] Politiques RLS configurées
- [ ] Variables d'environnement configurées localement
- [ ] Build local réussi
- [ ] Code poussé sur GitHub
- [ ] Site connecté sur Netlify
- [ ] Variables d'environnement configurées sur Netlify
- [ ] Déploiement réussi
- [ ] Application testée en production
- [ ] Logs vérifiés
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] HTTPS activé
- [ ] Monitoring configuré

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025  
**Statut** : ✅ Prêt pour le déploiement

