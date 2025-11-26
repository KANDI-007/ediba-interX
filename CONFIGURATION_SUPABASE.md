# 🔧 Configuration Supabase - EDIBA INTER

## ✅ Configuration Effectuée

Vos identifiants Supabase ont été configurés :

- **URL** : `https://ywiicnfobaotiwhesdvj.supabase.co`
- **Anon Key** : Configurée dans le code

## 📝 Fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec :

```env
VITE_SUPABASE_URL=https://ywiicnfobaotiwhesdvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWljbmZvYmFvdGl3aGVzZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTMwODMsImV4cCI6MjA3OTY2OTA4M30.ci2NSBzwnm1-Feerl0yqm_xx7MCLN9iSIQugAupVTXU
```

## 🚀 Prochaines Étapes

1. **Créer les tables dans Supabase**
   - Allez dans votre dashboard Supabase
   - SQL Editor → Exécutez les migrations depuis `supabase-setup/supabase/migrations/`

2. **Tester la connexion**
   - Démarrez l'application : `npm run dev`
   - Vérifiez la console pour les messages de connexion

3. **Migration des données**
   - La migration se fera automatiquement au premier chargement
   - Ou utilisez `forceMigration()` dans le hook `useSupabaseData`

## 📊 Tables à Créer

- `users`
- `clients`
- `suppliers`
- `documents`
- `line_items`
- `payments`
- `articles`
- `article_categories`
- `discharges`
- `conversations`
- `messages`
- `activities`
- `notifications`

Voir `supabase-setup/supabase/migrations/20241208000001_initial_schema.sql` pour le schéma complet.

