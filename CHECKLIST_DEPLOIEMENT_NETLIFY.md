# ✅ Checklist de Déploiement Netlify + Supabase

## 📋 Checklist Complète

### 🔵 Étape 1 : Préparation GitHub

- [x] Code déployé sur GitHub
- [x] Dépôt accessible : https://github.com/KANDI-007/ediba-interX
- [x] Branche `main` à jour

### 🔵 Étape 2 : Configuration Supabase

- [x] Tables créées dans Supabase (14 tables)
- [ ] Politiques RLS configurées (ou désactivées pour tests)
- [ ] Connexion Supabase testée localement

### 🔵 Étape 3 : Configuration Netlify

#### 3.1 Connexion GitHub
- [ ] Compte Netlify créé/connecté
- [ ] GitHub autorisé dans Netlify
- [ ] Dépôt `ediba-interX` connecté
- [ ] Paramètres de build détectés automatiquement

#### 3.2 Variables d'Environnement
- [ ] `VITE_SUPABASE_URL` ajoutée
- [ ] `VITE_SUPABASE_ANON_KEY` ajoutée
- [ ] `VITE_APP_NAME` ajoutée
- [ ] `VITE_COMPANY_NAME` ajoutée
- [ ] `VITE_COMPANY_ADDRESS` ajoutée
- [ ] `VITE_COMPANY_PHONE` ajoutée
- [ ] `VITE_COMPANY_EMAIL` ajoutée
- [ ] `VITE_ENCRYPTION_KEY` ajoutée
- [ ] `VITE_SESSION_TIMEOUT` ajoutée
- [ ] `VITE_PWA_NAME` ajoutée
- [ ] `VITE_PWA_SHORT_NAME` ajoutée
- [ ] `VITE_PWA_THEME_COLOR` ajoutée
- [ ] `VITE_PWA_BACKGROUND_COLOR` ajoutée
- [ ] `SUPABASE_URL` ajoutée (pour Functions)
- [ ] `SUPABASE_ANON_KEY` ajoutée (pour Functions)

#### 3.3 Déploiement
- [ ] Build lancé
- [ ] Build réussi (status: Published)
- [ ] Aucune erreur dans les logs
- [ ] Site accessible sur l'URL Netlify

### 🔵 Étape 4 : Vérification Functions

- [ ] Function `chat` déployée
- [ ] Function `auth` déployée
- [ ] Function `user-data` déployée
- [ ] Endpoint `/.netlify/functions/chat` répond
- [ ] Endpoint `/.netlify/functions/auth` répond
- [ ] Endpoint `/.netlify/functions/user-data` répond

### 🔵 Étape 5 : Vérification Application

- [ ] Site se charge correctement
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Message "✅ Connexion Supabase réussie" visible
- [ ] Application fonctionnelle

### 🔵 Étape 6 : Tests Fonctionnels

#### Test Création
- [ ] Création d'un client fonctionne
- [ ] Client apparaît dans Supabase
- [ ] Création d'une facture fonctionne
- [ ] Facture apparaît dans Supabase
- [ ] Création d'un article fonctionne
- [ ] Article apparaît dans Supabase

#### Test Récupération
- [ ] Rechargement de la page
- [ ] Clients chargés depuis Supabase
- [ ] Factures chargées depuis Supabase
- [ ] Articles chargés depuis Supabase

#### Test Chat
- [ ] Envoi d'un message fonctionne
- [ ] Message sauvegardé dans Supabase
- [ ] Récupération de l'historique fonctionne

### 🔵 Étape 7 : Migration Données (Si Applicable)

- [ ] Données existantes dans localStorage détectées
- [ ] Migration automatique déclenchée
- [ ] Migration réussie
- [ ] Données présentes dans Supabase
- [ ] Données récupérées correctement

### 🔵 Étape 8 : Configuration Finale

- [ ] CORS configuré dans Supabase (si nécessaire)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] HTTPS activé (automatique avec Netlify)
- [ ] Monitoring configuré (optionnel)

---

## 🎯 URLs Importantes

### Netlify
- **Dashboard** : https://app.netlify.com/
- **Votre Site** : `https://your-site-name.netlify.app` (à remplacer par votre URL)

### Supabase
- **Dashboard** : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj
- **SQL Editor** : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj/sql
- **Table Editor** : https://supabase.com/dashboard/project/ywiicnfobaotiwhesdvj/editor

### GitHub
- **Dépôt** : https://github.com/KANDI-007/ediba-interX

---

## 📝 Notes

- Les variables d'environnement doivent être ajoutées **AVANT** le premier déploiement
- Le build prend généralement 2-5 minutes
- Les Functions sont déployées automatiquement avec le site
- La migration des données se fait automatiquement au premier chargement

---

**Version** : 1.0.0  
**Date** : Janvier 2025

