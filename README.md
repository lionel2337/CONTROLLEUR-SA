# Application de Gestion de Salon de Coiffure - Anti-Vol

Cette application web moderne permet aux clients d'enregistrer leurs prestations de coiffure en libre-service, ce qui envoie immédiatement une notification et enregistre la transaction en temps réel sur l'interface de la patronne (propriétaire).

## Étape 1 : Configuration de Firebase (Console Web)

Puisque vous êtes novice, voici les étapes pas-à-pas pour configurer votre projet Firebase gratuitement :

### 1. Créer le projet Firebase
1. Rendez-vous sur la [Console Firebase](https://console.firebase.google.com/).
2. Connectez-vous avec votre compte Google (Gmail).
3. Cliquez sur **Créer un projet** (ou *Ajouter un projet*).
4. Nommez votre projet, par exemple : `Salon-Coiffure-Controle`.
5. Désactivez l'option *Google Analytics* pour ce projet (ce n'est pas nécessaire pour commencer et cela simplifie la création).
6. Cliquez sur **Créer le projet** et attendez que la préparation soit terminée, puis cliquez sur **Continuer**.

---

### 2. Ajouter une Application Web
1. Sur la page d'accueil de votre projet, cliquez sur l'icône **Web** (`</>`) pour ajouter une application.
2. Saisissez un nom pour l'application, par exemple : `Interface-Salon`.
3. Cochez la case **Configurer également Firebase Hosting** (cela permettra de mettre l'application en ligne gratuitement plus tard).
4. Cliquez sur **Enregistrer l'application**.
5. Firebase va afficher un bloc de code JavaScript contenant vos clés de configuration (`firebaseConfig`). **Copiez et conservez ce bloc de code**, nous allons l'intégrer dans le fichier `public/js/app.js` de notre projet. Il ressemble à ceci :
   ```javascript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "VOTRE_AUTH_DOMAIN",
     projectId: "VOTRE_PROJECT_ID",
     storageBucket: "VOTRE_STORAGE_BUCKET",
     messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
     appId: "VOTRE_APP_ID"
   };
   ```
6. Cliquez sur **Suivant** pour les autres étapes, puis sur **Accéder à la console**.

---

### 3. Activer la Base de Données Firestore
1. Dans le menu de gauche de la console Firebase, cliquez sur **Créer** (si masqué) puis sur **Firestore Database**.
2. Cliquez sur le bouton **Créer une base de données**.
3. Choisissez l'emplacement de votre base de données (sélectionnez la région la plus proche de chez vous, par exemple `europe-west9` pour Paris ou équivalent). Cliquez sur **Suivant**.
4. Sélectionnez **Démarrer en mode test** (cela permettra à l'application de lire et écrire sans restriction pendant les 30 premiers jours, le temps de tout configurer).
5. Cliquez sur **Créer**.

---

## Prochaine Étape
Une fois que vous avez créé le projet et récupéré votre bloc `firebaseConfig` :
1. Envoyez-moi ces clés de configuration (ou dites-moi juste que c'est fait, et nous créerons les fichiers de notre application).
2. Nous allons écrire le code des interfaces Client et Patronne.
