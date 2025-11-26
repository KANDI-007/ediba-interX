# 🔗 Liaison Supabase et Netlify - Guide Complet

## ✅ Prérequis Vérifiés

- [x] Tables créées dans Supabase
- [x] Code déployé sur GitHub : https://github.com/KANDI-007/ediba-interX
- [x] Projet Supabase actif : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj

---

## 🚀 Étape 1 : Connecter GitHub à Netlify

### 1.1 Créer/Connecter le Compte Netlify

1. **Allez sur Netlify**
   - Ouvrez https://app.netlify.com/
   - Connectez-vous avec votre compte GitHub (ou créez un compte)

2. **Autoriser Netlify**
   - Si demandé, autorisez Netlify à accéder à vos dépôts GitHub
   - Sélectionnez les permissions nécessaires

### 1.2 Importer le Dépôt

1. **Ajouter un Nouveau Site**
   - Dans le dashboard Netlify, cliquez sur **"Add new site"**
   - Sélectionnez **"Import an existing project"**

2. **Choisir GitHub**
   - Cliquez sur **"Deploy with GitHub"**
   - Si nécessaire, autorisez Netlify à accéder à GitHub

3. **Sélectionner le Dépôt**
   - Cherchez **`ediba-interX`** dans la liste
   - Cliquez sur le dépôt pour le sélectionner

4. **Configurer le Déploiement**
   - Netlify devrait détecter automatiquement les paramètres depuis `netlify.toml`
   - Vérifiez que les paramètres sont corrects :
     - **Branch to deploy** : `main`
     - **Build command** : `npm run build`
     - **Publish directory** : `dist`
     - **Functions directory** : `netlify/functions`

5. **Ne pas déployer tout de suite**
   - **N'CLIQUEZ PAS** sur "Deploy site" pour l'instant
   - On va d'abord configurer les variables d'environnement

---

## 🔧 Étape 2 : Configurer les Variables d'Environnement

### 2.1 Accéder aux Paramètres

1. **Avant le premier déploiement**, allez dans :
   - **"Site settings"** (ou cliquez sur le nom du site si déjà créé)
   - **"Environment variables"** dans le menu de gauche

### 2.2 Ajouter les Variables Supabase

Cliquez sur **"Add a variable"** et ajoutez **UNE PAR UNE** :

#### Variables Frontend (commencent par VITE_)

```
VITE_SUPABASE_URL = https://ywiicnfobaotiwhesdvj.supabase.co
```

```
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWljbmZvYmFvdGl3aGVzZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTMwODMsImV4cCI6MjA3OTY2OTA4M30.ci2NSBzwnm1-Feerl0yqm_xx7MCLN9iSIQugAupVTXU
```

#### Variables Application

```
VITE_APP_NAME = EDIBA-INTER
```

```
VITE_COMPANY_NAME = EDIBA INTER SARL U
```

```
VITE_COMPANY_ADDRESS = 123 Avenue de la Paix, Lomé, Togo
```

```
VITE_COMPANY_PHONE = +228 12 34 56 78
```

```
VITE_COMPANY_EMAIL = contact@edibainter.com
```

#### Variables Sécurité

```
VITE_ENCRYPTION_KEY = ediba-inter-encryption-key-2024
```

```
VITE_SESSION_TIMEOUT = 3600000
```

#### Variables PWA

```
VITE_PWA_NAME = EDIBA-INTER
```

```
VITE_PWA_SHORT_NAME = EDIBA
```

```
VITE_PWA_THEME_COLOR = #25C1FF
```

```
VITE_PWA_BACKGROUND_COLOR = #1e40af
```

### 2.3 Variables pour Netlify Functions

**⚠️ IMPORTANT** : Les Netlify Functions ont besoin de leurs propres variables (sans le préfixe VITE_)

Ajoutez aussi :

```
SUPABASE_URL = https://ywiicnfobaotiwhesdvj.supabase.co
```

```
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWljbmZvYmFvdGl3aGVzZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTMwODMsImV4cCI6MjA3OTY2OTA4M30.ci2NSBzwnm1-Feerl0yqm_xx7MCLN9iSIQugAupVTXU
```

### 2.4 Vérifier les Variables

Une fois toutes les variables ajoutées, vous devriez avoir environ **15-20 variables** dans la liste.

---

## 🚀 Étape 3 : Déployer le Site

### 3.1 Lancer le Déploiement

1. **Retournez à la page principale du site**
   - Cliquez sur **"Deploys"** dans le menu
   - Ou retournez à la page de configuration initiale

2. **Déployer**
   - Si vous n'avez pas encore déployé, cliquez sur **"Deploy site"**
   - Si le site existe déjà, cliquez sur **"Trigger deploy"** > **"Deploy site"**

3. **Attendre le Build**
   - Le build prendra 2-5 minutes
   - Vous pouvez suivre la progression en temps réel
   - Les logs de build s'affichent dans la console

### 3.2 Vérifier le Build

Une fois le build terminé, vérifiez :

- ✅ **Status** : "Published" (vert)
- ✅ **Deploy log** : Pas d'erreurs critiques
- ✅ **Functions** : Les 3 fonctions sont listées (chat, auth, user-data)

---

## ✅ Étape 4 : Vérifier la Connexion Supabase

### 4.1 Tester le Site

1. **Ouvrir le Site**
   - Cliquez sur l'URL du site (ex: `https://your-site-name.netlify.app`)
   - Le site devrait se charger

2. **Ouvrir la Console du Navigateur**
   - Appuyez sur **F12** pour ouvrir les outils développeur
   - Allez dans l'onglet **"Console"**

3. **Vérifier les Messages**
   - Vous devriez voir : `✅ Connexion Supabase réussie`
   - S'il y a des erreurs, notez-les

### 4.2 Tester les Netlify Functions

1. **Tester l'Endpoint Chat**
   - Ouvrez : `https://your-site-name.netlify.app/.netlify/functions/chat`
   - Devrait retourner une réponse JSON (même si c'est une erreur, c'est normal sans paramètres)

2. **Tester l'Endpoint Auth**
   - Ouvrez : `https://your-site-name.netlify.app/.netlify/functions/auth`
   - Devrait retourner une réponse JSON

### 4.3 Tester la Création de Données

1. **Dans l'Application**
   - Connectez-vous avec un utilisateur
   - Créez un client ou une facture
   - Vérifiez dans Supabase Dashboard > Table Editor que les données apparaissent

---

## 🔍 Étape 5 : Vérifications Finales

### Checklist de Vérification

#### Netlify
- [ ] Site déployé avec succès
- [ ] Variables d'environnement configurées
- [ ] Build réussi sans erreurs
- [ ] Functions déployées (chat, auth, user-data)
- [ ] Site accessible sur l'URL Netlify

#### Supabase
- [ ] Tables créées (14 tables)
- [ ] Connexion testée depuis l'application
- [ ] Insertion de données fonctionne
- [ ] Récupération de données fonctionne

#### Application
- [ ] Application se charge correctement
- [ ] Pas d'erreurs dans la console
- [ ] Connexion Supabase réussie
- [ ] Création de données fonctionne
- [ ] Récupération de données fonctionne

---

## 🐛 Dépannage

### Problème : Build Netlify échoue

**Symptômes** : Erreur dans les logs de build

**Solutions** :
1. Vérifiez les logs de build dans Netlify
2. Vérifiez que toutes les dépendances sont dans `package.json`
3. Vérifiez que `NODE_VERSION` est correct (18)
4. Vérifiez les erreurs TypeScript/ESLint

### Problème : Variables d'environnement non chargées

**Symptômes** : Erreur "VITE_SUPABASE_URL is not defined"

**Solutions** :
1. Vérifiez que les variables sont bien définies dans Netlify
2. Vérifiez que les noms commencent par `VITE_` pour Vite
3. Redéployez après avoir ajouté les variables
4. Vérifiez que vous avez sauvegardé les variables

### Problème : Erreurs Supabase dans la console

**Symptômes** : "Failed to fetch" ou erreurs de connexion

**Solutions** :
1. Vérifiez que `VITE_SUPABASE_URL` est correct
2. Vérifiez que `VITE_SUPABASE_ANON_KEY` est correct
3. Vérifiez que les tables existent dans Supabase
4. Vérifiez les politiques RLS (désactivez temporairement pour tests)
5. Vérifiez CORS dans Supabase (devrait être activé par défaut)

### Problème : Functions Netlify ne fonctionnent pas

**Symptômes** : 404 ou erreurs lors de l'appel aux functions

**Solutions** :
1. Vérifiez que les functions sont déployées dans Netlify > Functions
2. Vérifiez que les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont définies (sans VITE_)
3. Vérifiez les logs des functions dans Netlify
4. Testez les functions directement via l'URL

### Problème : Données non sauvegardées

**Symptômes** : Les données ne apparaissent pas dans Supabase

**Solutions** :
1. Vérifiez la connexion Supabase dans la console
2. Vérifiez les politiques RLS (désactivez temporairement)
3. Vérifiez les logs Supabase dans le dashboard
4. Testez avec une insertion directe dans Supabase SQL Editor

---

## 📊 Configuration CORS Supabase

### Vérifier CORS

1. **Dans Supabase Dashboard**
   - Allez dans **"Settings"** > **"API"**
   - Vérifiez la section **"CORS"**
   - Ajoutez votre URL Netlify si nécessaire : `https://your-site-name.netlify.app`

### Configuration CORS Automatique

Supabase devrait accepter les requêtes depuis n'importe quelle origine par défaut avec la clé anon. Si vous avez des problèmes :

1. Allez dans **"Settings"** > **"API"**
2. Dans **"CORS"**, ajoutez :
   - `https://your-site-name.netlify.app`
   - `https://*.netlify.app` (pour tous les sites Netlify)

---

## 🔄 Mises à Jour Futures

### Déploiement Automatique

Une fois configuré, chaque push sur GitHub déclenchera automatiquement un nouveau déploiement sur Netlify.

### Mise à Jour des Variables

Pour mettre à jour les variables d'environnement :
1. Allez dans **"Site settings"** > **"Environment variables"**
2. Modifiez ou ajoutez les variables
3. Redéployez le site (ou attendez le prochain déploiement automatique)

---

## 📞 Support

En cas de problème :
- **Documentation Netlify** : https://docs.netlify.com/
- **Documentation Supabase** : https://supabase.com/docs
- **Support EDIBA INTER** : kandilare20@gmail.com

---

## ✅ Résumé des Étapes

1. ✅ Connecter GitHub à Netlify
2. ✅ Configurer les variables d'environnement (15-20 variables)
3. ✅ Déployer le site
4. ✅ Vérifier la connexion Supabase
5. ✅ Tester les fonctions
6. ✅ Tester la création/récupération de données

---

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Statut** : ✅ Prêt pour la liaison

