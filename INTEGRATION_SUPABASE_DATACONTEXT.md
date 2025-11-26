# 🔄 Intégration Supabase dans DataContext

## 📋 Vue d'Ensemble

Ce guide explique comment intégrer Supabase dans `DataContext.tsx` pour remplacer localStorage par Supabase tout en gardant la compatibilité avec le code existant.

## ✅ Hook Créé

Le hook `useSupabaseData` a été créé dans `src/hooks/useSupabaseData.ts`. Il fournit :

- ✅ Chargement automatique des données depuis Supabase
- ✅ Migration automatique depuis localStorage
- ✅ Fonctions de sauvegarde vers Supabase
- ✅ Cache local pour performance
- ✅ Synchronisation automatique

## 🔧 Intégration dans DataContext

### Option 1 : Utilisation Directe du Hook (Recommandé)

Dans vos composants, utilisez directement le hook :

```typescript
import { useSupabaseData } from '../hooks/useSupabaseData';

function MyComponent() {
  const {
    documents,
    clients,
    suppliers,
    saveDocument,
    saveClient,
    isLoading,
  } = useSupabaseData();

  // Utiliser les données et fonctions
}
```

### Option 2 : Intégration dans DataContext (Pour Compatibilité)

Si vous voulez garder `useData()` existant, modifiez `DataContext.tsx` :

```typescript
// Dans DataContext.tsx
import { useSupabaseData } from '../hooks/useSupabaseData';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseData = useSupabaseData();
  const [localState, setLocalState] = useState({...});

  // Utiliser les données Supabase comme source principale
  const api = useMemo(() => ({
    documents: supabaseData.documents,
    clients: supabaseData.clients,
    suppliers: supabaseData.suppliers,
    // ...
    
    saveDocument: async (doc) => {
      const saved = await supabaseData.saveDocument(doc);
      if (saved) {
        // Mettre à jour l'état local aussi pour réactivité immédiate
        setLocalState(prev => ({
          ...prev,
          documents: [saved, ...prev.documents],
        }));
      }
      return saved;
    },
    // ... autres fonctions
  }), [supabaseData]);

  return (
    <DataContext.Provider value={api}>
      {children}
    </DataContext.Provider>
  );
};
```

## 🚀 Migration Progressive

### Étape 1 : Tester le Hook

Créez un composant de test :

```typescript
// TestSupabase.tsx
import { useSupabaseData } from '../hooks/useSupabaseData';

export function TestSupabase() {
  const {
    documents,
    clients,
    isLoading,
    isMigrating,
    saveDocument,
  } = useSupabaseData();

  if (isLoading) return <div>Chargement...</div>;
  if (isMigrating) return <div>Migration en cours...</div>;

  return (
    <div>
      <h2>Données Supabase</h2>
      <p>Documents: {documents.length}</p>
      <p>Clients: {clients.length}</p>
    </div>
  );
}
```

### Étape 2 : Remplacer Progressivement

1. Commencez par les nouveaux composants
2. Migrez les composants existants un par un
3. Gardez localStorage comme fallback temporaire

### Étape 3 : Supprimer localStorage

Une fois tout migré, supprimez les références à localStorage dans DataContext.

## 📊 Fonctionnalités Disponibles

### Chargement Automatique

```typescript
const { documents, clients, isLoading } = useSupabaseData();
// Les données sont chargées automatiquement au montage
```

### Sauvegarde

```typescript
const { saveDocument, saveClient } = useSupabaseData();

// Sauvegarder un document
const doc = await saveDocument({
  type: 'invoice',
  date: '2025-01-26',
  client: 'Client ABC',
  items: [...],
  tva: 18.5,
});
```

### Migration Manuelle

```typescript
const { forceMigration } = useSupabaseData();

// Forcer une migration
await forceMigration();
```

### Rafraîchissement

```typescript
const { refreshData } = useSupabaseData();

// Recharger les données depuis Supabase
await refreshData();
```

## ⚠️ Notes Importantes

1. **Cache Local** : Les données sont mises en cache localement pour performance
2. **Synchronisation** : Le cache est invalidé après chaque modification
3. **Migration** : La migration se fait automatiquement au premier chargement
4. **Erreurs** : Toutes les erreurs sont loggées dans la console

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. Ouvrez la console du navigateur
2. Vérifiez les messages de connexion Supabase
3. Vérifiez les messages de chargement des données
4. Testez la création d'un document
5. Vérifiez dans Supabase Dashboard que les données sont sauvegardées

## 📞 Support

En cas de problème :
- Vérifiez les logs dans la console
- Vérifiez la connexion Supabase dans le dashboard
- Vérifiez que les tables existent dans Supabase

