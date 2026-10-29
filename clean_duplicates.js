/**
 * Script de nettoyage des doublons dans Firestore - Yalo Glam's
 * Lance avec: node clean_duplicates.js
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { cert } = require('firebase-admin/app');

// Utilisation de Application Default Credentials
const app = initializeApp({
  projectId: 'salon-coiffure-controle'
});

const db = getFirestore(app);

// Liste de référence EXACTE des prestations (sans doublons)
const REFERENCE_SERVICES = {
  salon_1: [
    // Hommes
    { name: "Coiffure Homme Simple", price: 500, type: "coiffure_homme" },
    { name: "Coiffure avec Black", price: 1000, type: "coiffure_homme" },
    { name: "Coiffure avec Teinture", price: 2500, type: "coiffure_homme" },
    { name: "Lavage & Shampoing", price: 1000, type: "soin" },
    { name: "Dreadlocks", price: 5000, type: "coiffure_homme" },
    { name: "Twist", price: 5000, type: "coiffure_homme" },
    // Femmes
    { name: "Resta Américaine (Lace)", price: 3000, type: "coiffure_femme" },
    { name: "Passe Mèche", price: 2500, type: "coiffure_femme" },
    { name: "Posé Lace Frontal", price: 3000, type: "coiffure_femme" },
    { name: "Soin de Visage Complet", price: 4000, type: "soin" },
    { name: "Hammam Gommage", price: 4000, type: "soin" },
    { name: "Pédicure Chaud", price: 3000, type: "soin" },
    { name: "Pose Vernis Gel (Mains & Pieds)", price: 3000, type: "coiffure_femme" },
    { name: "Construction Gel & Gainage", price: 7000, type: "coiffure_femme" },
    // Packs Dames
    { name: "PACK 5000 (Dame)", price: 5000, type: "pack_femme", description: "Coiffure + Vernis gel capsule main et pied" },
    { name: "PACK 10000 (Dame)", price: 10000, type: "pack_femme", description: "Extension + Soins de visage éclat + Pose ongle vernis gel main et pied" },
    { name: "PACK 15000 (Dame)", price: 15000, type: "pack_femme", description: "Hammam + Gommage + Pédicure manucure + Coiffure + Pose vernis gel" },
    { name: "PACK 20000 (Dame)", price: 20000, type: "pack_femme", description: "Hammam gommage + Soins de visage luminothérapie + Construction gel main/pied + Coiffure" },
    { name: "PACK 25000 (Dame)", price: 25000, type: "pack_femme", description: "Hammam + Gommage + Soins de visage Hydra faciale + Pédicure manucure + Coiffure + Extension de cils" },
    // Packs Hommes
    { name: "PACK 5000 (Homme)", price: 5000, type: "pack_homme", description: "Pédicure complet + Coiffure complet + Teinture de cheveux + Manucure complet" },
    { name: "PACK 7000 (Homme)", price: 7000, type: "pack_homme", description: "Pédicure manucure complet + Coiffure avec barbe complète + Gommage facial purifiant + Massage relaxant dos" },
    { name: "PACK 10000 (Homme)", price: 10000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Coiffure style avec finition + Soins visage coup d'éclat" },
    { name: "PACK 15000 (Homme)", price: 15000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Visage luminothérapie + Coiffure style + Massage relaxant corps" },
    { name: "PACK 20000 (Homme)", price: 20000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Soins visage traitement au choix + Coiffure style + Massage corps entier" }
  ]
};

// Salon 2 a les mêmes prestations
REFERENCE_SERVICES.salon_2 = REFERENCE_SERVICES.salon_1.map(s => ({ ...s }));

async function cleanDuplicates() {
  const salons = ['salon_1', 'salon_2'];

  for (const salonId of salons) {
    console.log(`\n=== Nettoyage salon: ${salonId} ===`);

    // Récupérer toutes les prestations pour ce salon
    const snapshot = await db.collection('services').where('salonId', '==', salonId).get();
    console.log(`Trouvé ${snapshot.docs.length} prestations (doublons inclus)`);

    // Grouper par nom pour détecter les doublons
    const grouped = {};
    snapshot.docs.forEach(doc => {
      const name = doc.data().name;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(doc);
    });

    // Supprimer tous les doublons (garder le premier de chaque)
    const batch = db.batch();
    let deleted = 0;

    Object.entries(grouped).forEach(([name, docs]) => {
      if (docs.length > 1) {
        console.log(`  Doublon détecté: "${name}" (${docs.length}x) - Suppression de ${docs.length - 1} exemplaire(s)`);
        // Garder le premier, supprimer les autres
        for (let i = 1; i < docs.length; i++) {
          batch.delete(docs[i].ref);
          deleted++;
        }
      }
    });

    if (deleted > 0) {
      await batch.commit();
      console.log(`  ✅ ${deleted} doublon(s) supprimé(s) pour ${salonId}`);
    } else {
      console.log(`  ✅ Aucun doublon trouvé pour ${salonId}`);
    }
  }

  console.log('\n=== Nettoyage terminé ! ===');
  process.exit(0);
}

cleanDuplicates().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
