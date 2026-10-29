// Utilitaire de sécurisation XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Variables d'état locales
let currentSalonId = localStorage.getItem('salonId');
let currentSalonName = localStorage.getItem('salonName');
let selectedService = null;
let allLoadedServices = [];
let activeClientTab = 'hommes'; // Par défaut : 'hommes', 'femmes', 'packs', 'composition'
let selectedComposition = [];   // Liste des services sélectionnés pour la composition spéciale

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  checkConfiguration();
});

// Vérifie si la tablette a été configurée pour un salon
function checkConfiguration() {
  const setupScreen = document.getElementById("setup-screen");
  const servicesScreen = document.getElementById("services-screen");
  const salonInfo = document.getElementById("salon-info");
  const salonNameBadge = document.getElementById("salon-name-badge");
  const appSubtitle = document.getElementById("app-subtitle");

  if (!currentSalonId) {
    setupScreen.style.display = "flex";
    servicesScreen.style.display = "none";
    salonInfo.style.display = "none";
    appSubtitle.textContent = "Configuration initiale de la tablette.";
  } else {
    setupScreen.style.display = "none";
    servicesScreen.style.display = "block";
    salonInfo.style.display = "block";
    salonNameBadge.textContent = currentSalonName;
    appSubtitle.textContent = "Bienvenue ! Veuillez choisir votre prestation.";
    loadServices();
  }
}

// Configurer le salon pour cet écran
function setupSalon(id, name) {
  localStorage.setItem('salonId', id);
  localStorage.setItem('salonName', name);
  currentSalonId = id;
  currentSalonName = name;
  checkConfiguration();
}

// Réinitialiser la configuration (utile pour changer de salon)
function resetSalon() {
  if (confirm("Voulez-vous réinitialiser le salon configuré pour cet écran ?")) {
    localStorage.removeItem('salonId');
    localStorage.removeItem('salonName');
    currentSalonId = null;
    currentSalonName = null;
    document.getElementById("success-screen").style.display = "none";
    checkConfiguration();
  }
}

// Charger les prestations depuis Firestore pour le salon actuel
function loadServices() {
  const servicesList = document.getElementById("services-list");
  servicesList.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; color: var(--text-muted);">Chargement des prestations...</div>`;

  db.collection("services")
    .where("salonId", "==", currentSalonId)
    .onSnapshot((querySnapshot) => {
      allLoadedServices = [];

      if (querySnapshot.empty) {
        // Si aucune prestation n'existe pour ce salon, on crée la liste complète
        createDefaultServices();
        return;
      }

      // --- Déduplication automatique : supprimer les doublons en Firestore ---
      const seen = {};
      const toDelete = [];

      querySnapshot.forEach((doc) => {
        const service = doc.data();
        const nameNorm = (service.name || "").trim().toLowerCase();
        const key = nameNorm;

        if (seen[key]) {
          // Doublon détecté → marquer pour suppression
          toDelete.push(doc.ref);
        } else {
          seen[key] = true;
          service.id = doc.id;
          allLoadedServices.push(service);
        }
      });

      // Supprimer les doublons silencieusement
      if (toDelete.length > 0) {
        console.log(`🧹 Suppression de ${toDelete.length} doublon(s) de prestations...`);
        const batch = db.batch();
        toDelete.forEach(ref => batch.delete(ref));
        batch.commit().catch(err => console.warn("Erreur suppression doublons:", err));
      }

      // Effectuer le rendu des prestations selon l'onglet actif
      renderClientServices();
    }, (error) => {
      console.error("Erreur lors de la lecture des prestations :", error);
      servicesList.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; color: #ef4444;">Erreur de connexion avec la base de données.</div>`;
    });
}

// --- Système d'onglets catégories ---
function switchClientTab(tabId) {
  activeClientTab = tabId;

  // Réinitialiser la recherche lors du changement d'onglet
  const searchInput = document.getElementById("service-search-input");
  if (searchInput) searchInput.value = "";

  // Mettre à jour l'apparence des boutons d'onglets
  document.getElementById("btn-tab-hommes").classList.toggle("active", tabId === 'hommes');
  document.getElementById("btn-tab-femmes").classList.toggle("active", tabId === 'femmes');
  document.getElementById("btn-tab-packs").classList.toggle("active", tabId === 'packs');
  document.getElementById("btn-tab-composition").classList.toggle("active", tabId === 'composition');

  // Basculer l'affichage des conteneurs
  if (tabId === 'composition') {
    document.getElementById("standard-services-view").style.display = "none";
    document.getElementById("composition-services-view").style.display = "block";
    renderCompositionSelection();
  } else {
    document.getElementById("standard-services-view").style.display = "block";
    document.getElementById("composition-services-view").style.display = "none";
    renderClientServices();
  }
}

// Fonction appelée lors de la saisie dans la barre de recherche
function onSearchInput() {
  renderClientServices();
}

// --- Rendu des prestations standard ---
function renderClientServices() {
  const servicesList = document.getElementById("services-list");
  servicesList.innerHTML = "";

  // Filtrer les prestations selon la catégorie
  let filtered = [];

  // Détection robuste des packs (si le type commence par "pack" ou si le nom contient "pack")
  const checkIsPack = (s) => {
    const typeLower = (s.type || "").toLowerCase();
    const nameLower = (s.name || "").toLowerCase();
    return typeLower.startsWith("pack") || nameLower.includes("pack");
  };

  if (activeClientTab === 'hommes') {
    // Catégorie Hommes : types "coiffure_homme" et "soin" (SANS les packs)
    filtered = allLoadedServices.filter(s => (s.type === 'coiffure_homme' || s.type === 'soin') && !checkIsPack(s));
  } else if (activeClientTab === 'femmes') {
    // Catégorie Femmes : toutes les prestations simples (SANS les packs)
    filtered = allLoadedServices.filter(s => !checkIsPack(s));
  } else if (activeClientTab === 'packs') {
    // Catégorie Packs : uniquement ce qui est identifié comme un pack
    filtered = allLoadedServices.filter(s => checkIsPack(s));
  }

  // Filtrer également selon la barre de recherche (si un mot clé est saisi)
  const searchVal = document.getElementById("service-search-input").value.trim().toLowerCase();
  if (searchVal) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(searchVal));
  }

  if (filtered.length === 0) {
    servicesList.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; color: var(--text-muted);">Aucune prestation disponible dans cette catégorie.</div>`;
    return;
  }

  filtered.forEach((service) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.onclick = () => openModal(service);

    // Emoji selon le nom ou type
    let emoji = "💇‍♂️";
    const nameLower = service.name.toLowerCase();

    if (service.type && service.type.startsWith("pack")) {
      emoji = "🎁";
    } else if (nameLower.includes("femme") || nameLower.includes("dame") || nameLower.includes("tress") || nameLower.includes("foulard") || nameLower.includes("lace") || nameLower.includes("mèche") || nameLower.includes("vernis") || nameLower.includes("ongle") || nameLower.includes("extension") || nameLower.includes("cils")) {
      emoji = "💇‍♀️";
    } else if (nameLower.includes("barbe") || nameLower.includes("rasage") || nameLower.includes("black")) {
      emoji = "🧔";
    } else if (nameLower.includes("shamp") || nameLower.includes("soin") || nameLower.includes("lavage") || nameLower.includes("visage") || nameLower.includes("hammam") || nameLower.includes("gommage") || nameLower.includes("pédicure") || nameLower.includes("manucure") || nameLower.includes("massage")) {
      emoji = "🧴";
    } else if (nameLower.includes("enfant") || nameLower.includes("bébé")) {
      emoji = "👶";
    }

    let descHtml = "";
    if (service.description) {
      descHtml = `<div class="service-description">${escapeHtml(service.description)}</div>`;
    }

    card.innerHTML = `
      <div class="service-icon" style="font-size: 2.7rem;">${emoji}</div>
      <div style="width: 100%;">
        <div class="service-name">${escapeHtml(service.name)}</div>
        <div class="service-price" style="display: inline-block; margin-top: 5px;">${service.price.toLocaleString('fr-FR')} FCFA</div>
        ${descHtml}
      </div>
    `;
    servicesList.appendChild(card);
  });
}

// --- Rendu et gestion de la Composition Spéciale ---
function renderCompositionSelection() {
  const listContainer = document.getElementById("comp-selection-list");
  listContainer.innerHTML = "";

  // Ne proposer que les prestations simples (pas les packs) pour éviter les doublons dans la composition
  const simpleServices = allLoadedServices.filter(s => !s.type || !s.type.startsWith("pack"));

  if (simpleServices.length === 0) {
    listContainer.innerHTML = `<div style="padding: 20px; color: var(--text-muted); text-align: center;">Aucune prestation disponible.</div>`;
    return;
  }

  simpleServices.forEach((service) => {
    const isSelected = selectedComposition.some(s => s.id === service.id);

    const row = document.createElement("div");
    row.className = `comp-item-row ${isSelected ? 'selected' : ''}`;
    row.onclick = () => toggleCompositionService(service);

    row.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div class="comp-checkbox">${isSelected ? '✓' : ''}</div>
        <span style="font-weight: 600;">${escapeHtml(service.name)}</span>
      </div>
      <span style="color: var(--accent-gold); font-weight: 700;">${service.price.toLocaleString('fr-FR')} F</span>
    `;
    listContainer.appendChild(row);
  });

  updateCompositionSummary();
}

function toggleCompositionService(service) {
  const index = selectedComposition.findIndex(s => s.id === service.id);
  if (index > -1) {
    selectedComposition.splice(index, 1);
  } else {
    selectedComposition.push(service);
  }
  renderCompositionSelection();
}

// Ajouter une prestation écrite manuellement (sur-mesure)
function addCustomServiceToComposition() {
  const nameInput = document.getElementById("custom-item-name");
  const priceInput = document.getElementById("custom-item-price");

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);

  if (!name || isNaN(price) || price < 0) {
    alert("Veuillez saisir un nom de prestation et un tarif valide.");
    return;
  }

  const customItem = {
    id: "custom_" + Date.now(),
    name: `${name} (Sur-mesure)`,
    price: price,
    isCustom: true
  };

  selectedComposition.push(customItem);
  nameInput.value = "";
  priceInput.value = "";

  renderCompositionSelection();
}

// Enlever un service de la composition (sélectionné ou écrit sur-mesure)
function removeServiceFromComposition(id) {
  const index = selectedComposition.findIndex(s => s.id === id);
  if (index > -1) {
    selectedComposition.splice(index, 1);
  }
  renderCompositionSelection();
}

function updateCompositionSummary() {
  const selectedList = document.getElementById("comp-selected-list");
  const totalPriceEl = document.getElementById("comp-total-price");
  const validateBtn = document.getElementById("btn-validate-comp");

  selectedList.innerHTML = "";

  if (selectedComposition.length === 0) {
    selectedList.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">
        Aucune prestation sélectionnée.
      </div>
    `;
    totalPriceEl.textContent = "0 FCFA";
    validateBtn.disabled = true;
    return;
  }

  let total = 0;
  selectedComposition.forEach((service) => {
    total += service.price;

    const chip = document.createElement("div");
    chip.className = "comp-selected-chip";
    chip.innerHTML = `
      <span>${escapeHtml(service.name)}</span>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: var(--accent-gold); font-weight: 600;">${service.price.toLocaleString('fr-FR')} F</span>
        <span style="color: #f87171; cursor: pointer; font-weight: 800; font-size: 1.2rem; line-height: 1; padding: 2px 4px;" title="Retirer" onclick="removeServiceFromComposition('${escapeHtml(service.id)}')">×</span>
      </div>
    `;
    selectedList.appendChild(chip);
  });

  totalPriceEl.textContent = `${total.toLocaleString('fr-FR')} FCFA`;
  validateBtn.disabled = false;
}

function validateComposition() {
  if (selectedComposition.length === 0) return;

  const names = selectedComposition.map(s => s.name).join(" + ");
  const totalPrice = selectedComposition.reduce((sum, s) => sum + s.price, 0);

  const compService = {
    name: `Composition (${names})`,
    price: totalPrice
  };

  openModal(compService);
}

let isCreatingServices = false;

// --- Remplissage de la base de données avec tous les services unifiés (SANS DOUBLONS) ---
function createDefaultServices() {
  if (isCreatingServices) return;
  isCreatingServices = true;

  const allServices = [
    // ===== PRESTATIONS HOMMES =====
    { name: "Coiffure Homme Simple", price: 500, type: "coiffure_homme" },
    { name: "Coiffure avec Black", price: 1000, type: "coiffure_homme" },
    { name: "Coiffure avec Teinture", price: 2500, type: "coiffure_homme" },
    { name: "Lavage & Shampoing", price: 1000, type: "soin" },
    { name: "Dreadlocks", price: 5000, type: "coiffure_homme" },
    { name: "Twist", price: 5000, type: "coiffure_homme" },

    // ===== PRESTATIONS FEMMES =====
    { name: "Resta Américaine (Lace)", price: 3000, type: "coiffure_femme" },
    { name: "Passe Mèche", price: 2500, type: "coiffure_femme" },
    { name: "Posé Lace Frontal", price: 3000, type: "coiffure_femme" },
    { name: "Soin de Visage Complet", price: 4000, type: "soin" },
    { name: "Hammam Gommage", price: 4000, type: "soin" },
    { name: "Pédicure Chaud", price: 3000, type: "soin" },
    { name: "Pose Vernis Gel (Mains & Pieds)", price: 3000, type: "coiffure_femme" },
    { name: "Construction Gel & Gainage", price: 7000, type: "coiffure_femme" },

    // ===== PACKS DAMES =====
    { name: "PACK 5000 (Dame)", price: 5000, type: "pack_femme", description: "Coiffure + Vernis gel capsule main et pied" },
    { name: "PACK 10000 (Dame)", price: 10000, type: "pack_femme", description: "Extension + Soins de visage éclat + Pose ongle vernis gel main et pied" },
    { name: "PACK 15000 (Dame)", price: 15000, type: "pack_femme", description: "Hammam + Gommage + Pédicure manucure + Coiffure + Pose vernis gel" },
    { name: "PACK 20000 (Dame)", price: 20000, type: "pack_femme", description: "Hammam gommage + Soins de visage luminothérapie + Construction gel main/pied + Coiffure" },
    { name: "PACK 25000 (Dame)", price: 25000, type: "pack_femme", description: "Hammam + Gommage + Soins de visage Hydra faciale + Pédicure manucure + Coiffure + Extension de cils" },

    // ===== PACKS HOMMES =====
    { name: "PACK 5000 (Homme)", price: 5000, type: "pack_homme", description: "Pédicure complet + Coiffure complet + Teinture de cheveux + Manucure complet" },
    { name: "PACK 7000 (Homme)", price: 7000, type: "pack_homme", description: "Pédicure manucure complet + Coiffure avec barbe complète + Gommage facial purifiant + Massage relaxant dos" },
    { name: "PACK 10000 (Homme)", price: 10000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Coiffure style avec finition + Soins visage coup d'éclat" },
    { name: "PACK 15000 (Homme)", price: 15000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Visage luminothérapie + Coiffure style + Massage relaxant corps" },
    { name: "PACK 20000 (Homme)", price: 20000, type: "pack_homme", description: "Hammam traditionnel + Gommage savon noir + Soins visage traitement au choix + Coiffure style + Massage corps entier" }
  ];

  // Étape 1 : Vérifier s'il n'y a VRAIMENT aucune prestation (double check pour concurrence)
  db.collection("services").where("salonId", "==", currentSalonId).get()
    .then((snapshot) => {
      if (!snapshot.empty) {
        console.log("Services déjà présents, annulation de la création par défaut.");
        return Promise.resolve(); // Annule
      }
      
      const createBatch = db.batch();
      allServices.forEach((service) => {
        const docRef = db.collection("services").doc();
        createBatch.set(docRef, {
          name: service.name,
          price: service.price,
          type: service.type,
          description: service.description || "",
          salonId: currentSalonId
        });
      });
      return createBatch.commit();
    })
    .then(() => {
      console.log("✅ Prestations Yalo Glam's créées pour :", currentSalonId);
    })
    .catch((err) => console.error("Erreur création prestations :", err))
    .finally(() => {
      isCreatingServices = false;
    });
}

// --- Données des employés par Salon ---
const SALON_EMPLOYEES = {
  salon_1: [
    { name: "Marco", role: "Coiffeur" },
    { name: "Mistorine", role: "Coiffeuse" },
    { name: "Merveille", role: "Coiffeuse" }
  ],
  salon_2: [
    { name: "Aimeran", role: "Coiffeur" },
    { name: "Clarisse", role: "Coiffeuse" },
    { name: "Brandone", role: "Employé" }
  ]
};

let selectedEmployee = null;

// --- Gestion de la boîte de dialogue de confirmation ---
function openModal(service) {
  selectedService = service;
  selectedEmployee = null;

  document.getElementById("summary-name").textContent = service.name;
  document.getElementById("summary-price").textContent = `${service.price.toLocaleString('fr-FR')} FCFA`;
  
  // Générer les boutons de sélection d'employé pour le salon actuel
  const empContainer = document.getElementById("employee-selection-container");
  empContainer.innerHTML = "";

  const employees = SALON_EMPLOYEES[currentSalonId] || [];
  
  employees.forEach(emp => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "client-tab-btn";
    btn.style.padding = "8px 14px";
    btn.style.fontSize = "0.9rem";
    btn.textContent = `${emp.name} (${emp.role})`;
    
    btn.onclick = () => {
      // Désélectionner les autres boutons
      Array.from(empContainer.children).forEach(child => {
        child.style.background = "rgba(255, 255, 255, 0.03)";
        child.style.borderColor = "rgba(255, 255, 255, 0.08)";
        child.style.color = "var(--text-muted)";
      });
      // Sélectionner le bouton cliqué
      btn.style.background = "var(--accent-gold)";
      btn.style.borderColor = "var(--accent-gold)";
      btn.style.color = "#121212";
      
      selectedEmployee = emp;

      // Activer le bouton de confirmation
      const confirmBtn = document.getElementById("confirm-btn");
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
    };

    empContainer.appendChild(btn);
  });

  // Réinitialiser le bouton de confirmation
  const confirmBtn = document.getElementById("confirm-btn");
  confirmBtn.disabled = true;
  confirmBtn.style.opacity = "0.6";

  const modal = document.getElementById("confirm-modal");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);

  confirmBtn.onclick = submitTransaction;
}

function closeModal() {
  const modal = document.getElementById("confirm-modal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
  selectedService = null;
  selectedEmployee = null;
}

// Enregistrer la transaction dans Firestore avec le nom de l'employé
function submitTransaction() {
  if (!selectedService || !selectedEmployee) {
    alert("Veuillez sélectionner l'employé(e) qui a réalisé la prestation.");
    return;
  }

  const confirmBtn = document.getElementById("confirm-btn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Envoi...";

  db.collection("transactions").add({
    serviceName: selectedService.name,
    price: Number(selectedService.price),
    employeeName: selectedEmployee.name,
    employeeRole: selectedEmployee.role,
    salonId: currentSalonId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    closeModal();
    showSuccess();
  })
  .catch((error) => {
    console.error("Erreur lors de l'enregistrement :", error);
    alert("Une erreur s'est produite. Veuillez réessayer.");
  })
  .finally(() => {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirmer";
  });
}

// --- Gestion du Pointage d'Arrivée (Présence) ---
function openPresenceModal() {
  const select = document.getElementById("presence-employee-select");
  select.innerHTML = "";

  const employees = SALON_EMPLOYEES[currentSalonId] || [];
  employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.name;
    opt.textContent = `${emp.name} (${emp.role})`;
    select.appendChild(opt);
  });

  document.getElementById("presence-code-input").value = "";
  
  const modal = document.getElementById("presence-modal");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

function closePresenceModal() {
  const modal = document.getElementById("presence-modal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Validation du code secret de présence du jour
function submitPresenceClockIn() {
  const empName = document.getElementById("presence-employee-select").value;
  const inputCode = document.getElementById("presence-code-input").value.trim();

  if (!empName || !inputCode || inputCode.length !== 4) {
    alert("Veuillez entrer votre code à 4 chiffres.");
    return;
  }

  // Obtenir la date du jour au format YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Vérifier d'abord si l'employé a déjà pointé aujourd'hui
  db.collection("presences")
    .where("employeeName", "==", empName)
    .where("salonId", "==", currentSalonId)
    .where("date", "==", todayStr)
    .get()
    .then((presenceSnapshot) => {
      if (!presenceSnapshot.empty) {
        alert(`✋ Vous avez déjà pointé présent pour aujourd'hui (${todayStr}).`);
        return;
      }

      // Si pas encore pointé, vérifier le code secret
      db.collection("presence_codes").doc(todayStr).get()
        .then((doc) => {
          let validCode = null;
          if (doc.exists && doc.data().codes) {
            validCode = doc.data().codes[empName];
          }

          if (validCode && validCode === inputCode) {
            // Le code est valide ! Enregistrer le pointage dans la collection presences
            return db.collection("presences").add({
              employeeName: empName,
              salonId: currentSalonId,
              date: todayStr,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
              closePresenceModal();
              alert(`🟢 Présence validée avec succès pour ${empName} à ${now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} ! Bonne journée de travail.`);
            });
          } else {
            alert(`❌ Code secret incorrect pour ${empName}. Veuillez demander votre code du jour à la patronne.`);
          }
        })
        .catch((error) => {
          console.error("Erreur lors de la vérification du code :", error);
          alert("Erreur de connexion. Impossible de vérifier le code.");
        });
    })
    .catch((error) => {
      console.error("Erreur vérification présence :", error);
      alert("Erreur de connexion.");
    });
}

// --- Écouteur des Réservations Client en ligne sur la tablette salon ---
let salonReservationsUnsubscribe = null;
let pendingSalonReservations = [];

function startSalonReservationsListener() {
  if (salonReservationsUnsubscribe) salonReservationsUnsubscribe();

  salonReservationsUnsubscribe = db.collection("reservations")
    .where("salonId", "==", currentSalonId)
    .where("status", "==", "pending")
    .onSnapshot((snapshot) => {
      pendingSalonReservations = [];
      snapshot.forEach(doc => {
        const r = doc.data();
        r.id = doc.id;
        pendingSalonReservations.push(r);
      });

      const badge = document.getElementById("res-badge-count");
      if (badge) {
        if (pendingSalonReservations.length > 0) {
          badge.textContent = pendingSalonReservations.length;
          badge.style.display = "inline-block";
        } else {
          badge.style.display = "none";
        }
      }
    });
}

// Helper normalization for string matching (accents & lowercasing)
function normalizeStr(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function openSalonReservationsModal() {
  const container = document.getElementById("salon-reservations-list");
  if (!container) return;

  container.innerHTML = "";

  if (pendingSalonReservations.length === 0) {
    container.innerHTML = `<div style="padding: 25px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Aucune réservation en attente dans la file.</div>`;
  } else {
    pendingSalonReservations.forEach(r => {
      const card = document.createElement("div");
      card.style.cssText = "padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(223,183,108,0.25); border-radius: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px;";
      
      const safeService = escapeHtml(r.serviceName || '');
      const safeEmp = escapeHtml(r.employeeName || 'Premier disponible');
      const paramService = (r.serviceName || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const paramEmp = (r.employeeName || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem;">🎟️ ${escapeHtml(r.ticketCode || 'RDV')}</span>
          <span style="font-size: 0.82rem; color: #4ade80; font-weight: 700;">📅 ${escapeHtml(r.date || 'Aujourd\'hui')} à ${escapeHtml(r.time || '')}</span>
        </div>
        <div style="font-weight: 700; font-size: 1.05rem; color: white;">
          ${escapeHtml(r.clientName || 'Client')} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">(${escapeHtml(r.clientQuartier || r.quartier || 'Non précisé')})</span>
        </div>
        <div style="color: var(--text-main); font-size: 0.9rem;">
          Prestation : <strong style="color: var(--accent-gold);">${safeService}</strong> (${(r.price || 0).toLocaleString('fr-FR')} FCFA)
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          Coiffeur(se) demandé(e) : <strong style="color: white;">${safeEmp}</strong>
        </div>
        <button class="btn btn-confirm" style="width: 100%; padding: 10px; font-size: 0.88rem; margin-top: 6px; background: var(--accent-gold); color: #121212; font-weight: 800;" onclick="convertReservationToSale('${escapeHtml(r.id)}', '${paramService}', ${r.price || 0}, '${paramEmp}')">
          ✓ Le client est là : Valider & Encaisser (${(r.price || 0).toLocaleString('fr-FR')} FCFA)
        </button>
      `;
      container.appendChild(card);
    });
  }

  const modal = document.getElementById("salon-reservations-modal");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

function closeSalonReservationsModal() {
  const modal = document.getElementById("salon-reservations-modal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Convertir un rendez-vous en vente réelle
function convertReservationToSale(resId, serviceName, price, reqEmployee) {
  // Trouver un coiffeur valide
  const employees = SALON_EMPLOYEES[currentSalonId] || [];
  let chosenEmp = employees.find(e => reqEmployee && reqEmployee.includes(e.name)) || employees[0];

  if (!chosenEmp) {
    alert("Veuillez configurer un coiffeur pour ce salon.");
    return;
  }

  db.collection("transactions").add({
    serviceName: serviceName,
    price: Number(price),
    employeeName: chosenEmp.name,
    employeeRole: chosenEmp.role,
    salonId: currentSalonId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    // Marquer la réservation comme terminée
    return db.collection("reservations").doc(resId).update({
      status: "completed"
    });
  }).then(() => {
    closeSalonReservationsModal();
    showSuccess();
  }).catch((err) => {
    console.error("Erreur conversion réservation :", err);
    alert("Erreur lors de la validation du rendez-vous.");
  });
}

// Lancer le listener des réservations après chargement
const oldLoadServices = loadServices;
loadServices = function() {
  oldLoadServices();
  startSalonReservationsListener();
};

// Afficher l'écran de succès temporaire
function showSuccess() {
  const servicesScreen = document.getElementById("services-screen");
  const successScreen = document.getElementById("success-screen");
  const appSubtitle = document.getElementById("app-subtitle");

  servicesScreen.style.display = "none";
  successScreen.style.display = "flex";
  appSubtitle.style.visibility = "hidden";

  // Vider la composition après succès
  selectedComposition = [];

  setTimeout(() => {
    successScreen.style.display = "none";
    servicesScreen.style.display = "block";
    appSubtitle.style.visibility = "visible";
    // Revenir à la catégorie par défaut
    switchClientTab('hommes');
  }, 5000);
}

// --- Modale Fidélité Client & Validation Prestation Gratuite sur Tablette ---
let allFidelityClients = [];

function determineLoyaltyCategory(serviceName, category) {
  const sLower = (serviceName || '').toLowerCase();
  const cLower = (category || '').toLowerCase();

  if (sLower.includes('pédicure') || sLower.includes('pedicure') || sLower.includes('manucure') || sLower.includes('pied')) {
    return 'pedicuresCount';
  }
  if (sLower.includes('visage') || sLower.includes('soin') || sLower.includes('gommage') || sLower.includes('hammam') || sLower.includes('hydra')) {
    return 'soinsVisageCount';
  }
  if (
    cLower.includes('homme') || cLower.includes('femme') ||
    sLower.includes('coiffure') || sLower.includes('coupe') || sLower.includes('black') ||
    sLower.includes('tracage') || sLower.includes('traçage') || sLower.includes('teinture') ||
    sLower.includes('barbe') || sLower.includes('rasage') || sLower.includes('dreadlock') ||
    sLower.includes('twist') || sLower.includes('lace') || sLower.includes('mèche') ||
    sLower.includes('meche') || sLower.includes('resta') || sLower.includes('tresse') ||
    sLower.includes('tissage') || sLower.includes('perruque') || sLower.includes('extension') ||
    sLower.includes('gainage') || sLower.includes('gel') || sLower.includes('shampoing') ||
    sLower.includes('lavage') || sLower.includes('pack')
  ) {
    return 'coiffuresCount';
  }
  return 'coiffuresCount';
}

function openSalonFidelityModal() {
  const modal = document.getElementById("salon-fidelity-modal");
  if (!modal) return;
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
  loadSalonFidelityClients();
}

function closeSalonFidelityModal() {
  const modal = document.getElementById("salon-fidelity-modal");
  if (!modal) return;
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

function loadSalonFidelityClients() {
  const container = document.getElementById("salon-fidelity-list");
  if (container) container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 20px; text-align: center;">Chargement de la file des clients...</div>`;

  db.collection("clients").get().then((snapshot) => {
    allFidelityClients = [];
    const clientMap = {};

    snapshot.forEach((doc) => {
      const c = doc.data();
      const name = c.name || (c.prenom && c.nom ? `${c.prenom} ${c.nom}` : c.prenom || c.nom || doc.id);
      const phone = (c.phone || doc.id || '').toString().replace(/\D/g, '');
      const key = phone || normalizeStr(name);

      if (key) {
        clientMap[key] = {
          id: doc.id,
          name: name,
          quartier: c.quartier || '',
          phone: phone,
          coiffuresCount: Number(c.coiffuresCount || 0),
          pedicuresCount: Number(c.pedicuresCount || 0),
          soinsVisageCount: Number(c.soinsVisageCount || 0),
          coiffuresResetAt: c.coiffuresResetAt || null,
          pedicuresResetAt: c.pedicuresResetAt || null,
          soinsVisageResetAt: c.soinsVisageResetAt || null
        };
      }
    });

    db.collection("reservations").get().then((resSnapshot) => {
      const resCounts = {};

      resSnapshot.forEach(doc => {
        const r = doc.data();
        const rName = r.clientName || r.name || '';
        const rPhone = (r.clientPhone || r.phone || '').toString().replace(/\D/g, '');
        const p = rPhone || normalizeStr(rName);

        if (p) {
          if (!resCounts[p]) {
            resCounts[p] = {
              coiffures: 0, pedicures: 0, visage: 0,
              name: rName || 'Client ' + rPhone,
              quartier: r.clientQuartier || r.quartier || ''
            };
          }

          const clientProf = clientMap[p];
          const rTime = r.timestamp ? (r.timestamp.toDate ? r.timestamp.toDate().getTime() : new Date(r.timestamp).getTime()) : (r.date ? new Date(r.date).getTime() : Date.now());
          const cat = determineLoyaltyCategory(r.serviceName, r.category);

          if (cat === 'coiffuresCount') {
            const resetTime = clientProf && clientProf.coiffuresResetAt ? new Date(clientProf.coiffuresResetAt).getTime() : 0;
            if (!resetTime || rTime > resetTime) resCounts[p].coiffures++;
          } else if (cat === 'pedicuresCount') {
            const resetTime = clientProf && clientProf.pedicuresResetAt ? new Date(clientProf.pedicuresResetAt).getTime() : 0;
            if (!resetTime || rTime > resetTime) resCounts[p].pedicures++;
          } else if (cat === 'soinsVisageCount') {
            const resetTime = clientProf && clientProf.soinsVisageResetAt ? new Date(clientProf.soinsVisageResetAt).getTime() : 0;
            if (!resetTime || rTime > resetTime) resCounts[p].visage++;
          }
        }
      });

      // Fusionner les compteurs de réservations avec clientMap
      Object.keys(resCounts).forEach(p => {
        const info = resCounts[p];
        let matchedKey = p;
        if (!clientMap[matchedKey]) {
          const foundKey = Object.keys(clientMap).find(k => normalizeStr(clientMap[k].name) === normalizeStr(info.name));
          if (foundKey) matchedKey = foundKey;
        }

        if (!clientMap[matchedKey]) {
          clientMap[matchedKey] = {
            id: matchedKey,
            name: info.name,
            quartier: info.quartier,
            phone: p,
            coiffuresCount: info.coiffures,
            pedicuresCount: info.pedicures,
            soinsVisageCount: info.visage
          };
        } else {
          clientMap[matchedKey].coiffuresCount = Math.max(clientMap[matchedKey].coiffuresCount || 0, info.coiffures);
          clientMap[matchedKey].pedicuresCount = Math.max(clientMap[matchedKey].pedicuresCount || 0, info.pedicures);
          clientMap[matchedKey].soinsVisageCount = Math.max(clientMap[matchedKey].soinsVisageCount || 0, info.visage);
          if (!clientMap[matchedKey].name || clientMap[matchedKey].name.startsWith('Client ')) clientMap[matchedKey].name = info.name;
          if (!clientMap[matchedKey].quartier) clientMap[matchedKey].quartier = info.quartier;
        }
      });

      allFidelityClients = Object.values(clientMap);
      renderSalonFidelityList();
    }).catch((e) => {
      console.warn("Res snapshot fallback:", e);
      allFidelityClients = Object.values(clientMap);
      renderSalonFidelityList();
    });
  }).catch((err) => {
    console.error("Erreur chargement fidélité salon :", err);
    renderSalonFidelityList();
  });
}

function renderSalonFidelityList() {
  const container = document.getElementById("salon-fidelity-list");
  if (!container) return;



  let filtered = allFidelityClients.filter(c => {
    const coiffures = c.coiffuresCount || 0;
    const pedicures = c.pedicuresCount || 0;
    const soinsVisage = c.soinsVisageCount || 0;
    return coiffures >= 10 || pedicures >= 5 || soinsVisage >= 5;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 25px; text-align: center;">Aucun client enregistré dans la file.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    let coiffures = c.coiffuresCount || 0;
    let pedicures = c.pedicuresCount || 0;
    let soinsVisage = c.soinsVisageCount || 0;

    // Plafonnement logique
    if (coiffures > 10) coiffures = 10;
    if (pedicures > 5) pedicures = 5;
    if (soinsVisage > 5) soinsVisage = 5;

    let hasReward = false;
    let rewardText = "";
    let rewardType = "";

    if (coiffures >= 10) {
      hasReward = true;
      rewardText = "🎁 COIFFURE GRATUITE DÉBLOQUÉE !";
      rewardType = "coiffures";
    } else if (pedicures >= 5) {
      hasReward = true;
      rewardText = "🎁 PÉDICURE GRATUITE DÉBLOQUÉE !";
      rewardType = "pedicures";
    } else if (soinsVisage >= 5) {
      hasReward = true;
      rewardText = "🎁 SOIN VISAGE GRATUIT DÉBLOQUÉ !";
      rewardType = "soinsVisage";
    }

    const quartierText = c.quartier ? ` (${c.quartier})` : '';

    return `
      <div class="queue-item-card" style="background: ${hasReward ? 'rgba(234, 179, 8, 0.18)' : 'rgba(255,255,255,0.03)'}; border: 1.5px solid ${hasReward ? '#facc15' : 'rgba(223,183,108,0.2)'}; border-radius: 12px; padding: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: ${hasReward ? '0 4px 15px rgba(234,179,8,0.25)' : 'none'};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 800; color: white; font-size: 1.1rem;">
            ${escapeHtml(c.name || 'Client Salon')} <span style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 600;">${escapeHtml(quartierText)}</span>
          </div>
          ${hasReward ? `<span style="background: #eab308; color: #121212; font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 12px; border: 1px solid #facc15;">🎁 PRESTATION OFFERTE</span>` : `<span style="color: var(--text-muted); font-size: 0.78rem;">En cours</span>`}
        </div>
        
        <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 14px; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px;">
          <span>💈 Coiffures: <strong style="color:${coiffures>=10?'#facc15':'white'}">${coiffures}/10</strong></span>
          <span>💅 Pédicures: <strong style="color:${pedicures>=5?'#facc15':'white'}">${pedicures}/5</strong></span>
          <span>🧴 Visage: <strong style="color:${soinsVisage>=5?'#facc15':'white'}">${soinsVisage}/5</strong></span>
        </div>

        ${hasReward ? `
          <div style="background: rgba(234,179,8,0.25); border: 1px solid #eab308; color: #facc15; padding: 8px 12px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; text-align: center;">
            ${rewardText}
          </div>
          <button class="btn btn-confirm" style="width: 100%; padding: 10px; font-size: 0.9rem; background: #eab308; color: #121212; font-weight: 800; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(234,179,8,0.3);" onclick="validateSalonReward('${escapeHtml(c.id)}', '${rewardType}')">
            ✅ Valider Prestation Gratuite (Remise à 0)
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

function filterSalonFidelityList() {
  renderSalonFidelityList();
}

function validateSalonReward(clientId, rewardType) {
  if (!confirm("Valider cette prestation gratuite pour le client ? (Le compteur sera remis à zéro)")) return;

  const nowIso = new Date().toISOString();
  const updateData = {
    lastRewardValidatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (rewardType === 'coiffures') { updateData.coiffuresCount = 0; updateData.coiffuresResetAt = nowIso; }
  if (rewardType === 'pedicures') { updateData.pedicuresCount = 0; updateData.pedicuresResetAt = nowIso; }
  if (rewardType === 'soinsVisage') { updateData.soinsVisageCount = 0; updateData.soinsVisageResetAt = nowIso; }

  const targetClient = allFidelityClients.find(c => String(c.id) === String(clientId) || String(c.phone) === String(clientId));
  const docId = (targetClient && targetClient.phone) ? String(targetClient.phone) : String(clientId);

  if (targetClient) {
    if (rewardType === 'coiffures') { targetClient.coiffuresCount = 0; targetClient.coiffuresResetAt = nowIso; }
    if (rewardType === 'pedicures') { targetClient.pedicuresCount = 0; targetClient.pedicuresResetAt = nowIso; }
    if (rewardType === 'soinsVisage') { targetClient.soinsVisageCount = 0; targetClient.soinsVisageResetAt = nowIso; }
    if (targetClient.name) updateData.name = targetClient.name;
    if (targetClient.phone) updateData.phone = targetClient.phone;
    if (targetClient.quartier) updateData.quartier = targetClient.quartier;
  }

  db.collection("clients").doc(docId).set(updateData, { merge: true }).then(() => {
    alert("✅ Prestation gratuite validée ! Le compteur du client a été remis à 0.");
    loadSalonFidelityClients();
  }).catch((err) => {
    console.error("Erreur validation fidélité salon :", err);
    const safeId = (targetClient && targetClient.phone) ? targetClient.phone.replace(/\D/g, '') : String(docId).replace(/\D/g, '');
    if (safeId) {
      db.collection("clients").doc(safeId).set(updateData, { merge: true }).then(() => {
        alert("✅ Prestation gratuite validée ! Le compteur du client a été remis à 0.");
        loadSalonFidelityClients();
      }).catch(e => alert("Erreur lors de la validation."));
    } else {
      alert("Erreur lors de la validation.");
    }
  });
}

