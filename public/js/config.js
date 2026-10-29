// Configuration Firebase de l'application
const firebaseConfig = {
  apiKey: "AIzaSyA4uGqAhLuqwL-jioToi7BEc8Ekl9YTV20",
  authDomain: "salon-coiffure-controle.firebaseapp.com",
  projectId: "salon-coiffure-controle",
  storageBucket: "salon-coiffure-controle.firebasestorage.app",
  messagingSenderId: "471266094001",
  appId: "1:471266094001:web:f840df1aca47690dffab90"
};

// Initialisation de Firebase en mode compatibilité (compatible double-clic de fichier local)
firebase.initializeApp(firebaseConfig);

// Exportation globale pour les autres scripts
window.db = firebase.firestore();
window.firebaseConfig = firebaseConfig;
