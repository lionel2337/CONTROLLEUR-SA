// State Variables pour la réservation client & profil
let selectedBookingSalonId = 'salon_1';
let selectedBookingSalonName = "Yalo Glam's Shakespeare";
let selectedBookingTab = 'hommes';
let selectedBookingService = null;
let loadedBookingServices = [];
let currentClientProfile = null;

const SALON_EMPLOYEES_BOOKING = {
  salon_1: ["Premier disponible", "Marco (Coiffeur)", "Mistorine (Coiffeuse)", "Merveille (Coiffeuse)"],
  salon_2: ["Premier disponible", "Aimerant (Coiffeur)", "Clarisse (Coiffeuse)", "Brandone (Employé)"]
};

document.addEventListener("DOMContentLoaded", () => {
  // Définir la date minimale d'aujourd'hui
  const dateInput = document.getElementById("booking-date");
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  checkClientProfile();
  updateEmployeeDropdown();
  loadBookingServices();
  checkSpecialRequestHintDismissed();
  setTimeout(showPwaInstallBanner, 1500);
});

function checkSpecialRequestHintDismissed() {
  if (localStorage.getItem("yg_dismissed_special_hint") === "true") {
    const hintBox = document.getElementById("special-request-hint");
    if (hintBox) hintBox.style.display = "none";
  }
}

function dismissSpecialRequestHint() {
  localStorage.setItem("yg_dismissed_special_hint", "true");
  const hintBox = document.getElementById("special-request-hint");
  if (hintBox) hintBox.style.display = "none";
}

// ======================================================
// GESTION PROFIL CLIENT & DROIT A L'IMAGE
// ======================================================
function checkClientProfile() {
  const saved = localStorage.getItem("yg_client_profile");
  const modal = document.getElementById("client-auth-modal");

  if (saved) {
    try {
      currentClientProfile = JSON.parse(saved);
      applyClientProfile(currentClientProfile);
      if (modal) modal.style.display = "none";
    } catch (e) {
      if (modal) modal.style.display = "flex";
    }
  } else {
    if (modal) modal.style.display = "flex";
  }
}

function openAuthModal() {
  const modal = document.getElementById("client-auth-modal");
  if (currentClientProfile) {
    document.getElementById("auth-prenom").value = currentClientProfile.prenom || "";
    document.getElementById("auth-nom").value = currentClientProfile.nom || "";
    document.getElementById("auth-quartier").value = currentClientProfile.quartier || "";
    document.getElementById("auth-phone").value = currentClientProfile.phone || "";
    document.getElementById("auth-terms-check").checked = true;
  }
  if (modal) modal.style.display = "flex";
}

function saveClientAuth(event) {
  event.preventDefault();

  const prenom = document.getElementById("auth-prenom").value.trim();
  const nom = document.getElementById("auth-nom").value.trim();
  const quartier = document.getElementById("auth-quartier").value.trim();
  const phone = document.getElementById("auth-phone").value.trim();
  const termsChecked = document.getElementById("auth-terms-check").checked;

  if (!prenom || !nom || !quartier || !phone || !termsChecked) {
    alert("Veuillez remplir tous les champs et accepter la politique de confidentialité.");
    return;
  }

  currentClientProfile = {
    prenom: prenom,
    nom: nom,
    quartier: quartier,
    phone: phone,
    acceptedTermsAt: new Date().toISOString()
  };

  localStorage.setItem("yg_client_profile", JSON.stringify(currentClientProfile));
  applyClientProfile(currentClientProfile);

  const modal = document.getElementById("client-auth-modal");
  if (modal) modal.style.display = "none";
}

function applyClientProfile(profile) {
  if (!profile) return;

  const fullName = `${profile.prenom} ${profile.nom}`.trim();
  
  const elName = document.getElementById("welcome-name");
  const elQuartier = document.getElementById("welcome-quartier");

  if (elName) elName.textContent = fullName;
  if (elQuartier) elQuartier.textContent = profile.quartier ? `(${profile.quartier})` : '';

  // Pré-remplir les champs de réservation
  const inputName = document.getElementById("booking-client-name");
  const inputQuartier = document.getElementById("booking-client-quartier");
  const inputPhone = document.getElementById("booking-client-phone");

  if (inputName) inputName.value = fullName;
  if (inputQuartier) inputQuartier.value = profile.quartier || '';
  if (inputPhone) inputPhone.value = profile.phone || '';
}

// ======================================================
// NAVIGATION VUES (Rendez-vous vs Galerie Photos vs Avis)
// ======================================================
function switchMainView(viewId) {
  const btnBooking = document.getElementById("main-tab-booking");
  const btnGallery = document.getElementById("main-tab-gallery");
  const btnReviews = document.getElementById("main-tab-reviews");

  const viewBooking = document.getElementById("view-booking");
  const viewGallery = document.getElementById("view-gallery");
  const viewReviews = document.getElementById("view-reviews");

  if (btnBooking) btnBooking.classList.toggle("active", viewId === 'booking');
  if (btnGallery) btnGallery.classList.toggle("active", viewId === 'gallery');
  if (btnReviews) btnReviews.classList.toggle("active", viewId === 'reviews');

  if (viewBooking) viewBooking.style.display = viewId === 'booking' ? "block" : "none";
  if (viewGallery) viewGallery.style.display = viewId === 'gallery' ? "block" : "none";
  if (viewReviews) viewReviews.style.display = viewId === 'reviews' ? "block" : "none";
}

function quickBookFromGallery(serviceName, price, type) {
  switchMainView('booking');

  // Chercher la prestation dans la liste chargée
  let found = loadedBookingServices.find(s => s.name.toLowerCase().includes(serviceName.toLowerCase()));

  if (!found) {
    found = {
      id: `custom_${Date.now()}`,
      name: serviceName,
      price: price,
      type: type
    };
  }

  selectedBookingService = found;

  // Déterminer l'onglet correspondant
  if (type === 'coiffure_homme' || serviceName.toLowerCase().includes('black') || serviceName.toLowerCase().includes('teinture')) {
    switchBookingTab('hommes');
  } else if (type === 'coiffure_femme' || serviceName.toLowerCase().includes('traisse')) {
    switchBookingTab('femmes');
  }

  renderBookingServices();

  // Scroll fluide vers le choix du coiffeur / date
  const elem = document.getElementById("booking-employee-select");
  if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ======================================================
// SÉLECTION SALON & CHOIX COIFFEUR
// ======================================================
function selectBookingSalon(id, name) {
  selectedBookingSalonId = id;
  selectedBookingSalonName = name;

  const b1 = document.getElementById("btn-salon-1");
  const b2 = document.getElementById("btn-salon-2");

  if (b1) b1.classList.toggle("selected", id === 'salon_1');
  if (b2) b2.classList.toggle("selected", id === 'salon_2');

  updateEmployeeDropdown();
  loadBookingServices();
}

function updateEmployeeDropdown() {
  const select = document.getElementById("booking-employee-select");
  if (!select) return;

  select.innerHTML = "";
  const list = SALON_EMPLOYEES_BOOKING[selectedBookingSalonId] || [];

  list.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp;
    opt.textContent = emp;
    select.appendChild(opt);
  });

  onEmployeeSelectedInBooking();
}

function onEmployeeSelectedInBooking() {
  const select = document.getElementById("booking-employee-select");
  const attributionEl = document.getElementById("booking-employee-attribution");
  if (!select || !attributionEl) return;

  const val = select.value;
  if (val && val !== "Premier disponible") {
    attributionEl.innerHTML = `✂️ Prestation attribuée à : <strong style="color: var(--accent-gold);">${val}</strong>`;
  } else {
    attributionEl.innerHTML = `✂️ <em>Premier coiffeur/coiffeuse disponible sélectionné(e)</em>`;
  }
}

// ======================================================
// CHARGEMENT PRESTATIONS FIRESTORE
// ======================================================
function loadBookingServices() {
  const container = document.getElementById("booking-services-list");
  if (container) container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chargement des prestations...</div>`;

  db.collection("services")
    .where("salonId", "==", selectedBookingSalonId)
    .get()
    .then((snapshot) => {
      loadedBookingServices = [];
      snapshot.forEach((doc) => {
        const s = doc.data();
        s.id = doc.id;
        loadedBookingServices.push(s);
      });

      // Si aucuns tarifs personnalisés en BDD, ajouter par défaut
      if (loadedBookingServices.length === 0) {
        loadedBookingServices = [
          { id: 'def_1', name: 'Traçage', price: 500, type: 'coiffure_homme', salonId: selectedBookingSalonId },
          { id: 'def_2', name: 'Coiffure', price: 1000, type: 'coiffure_homme', salonId: selectedBookingSalonId },
          { id: 'def_3', name: 'Coiffure avec Black', price: 1500, type: 'coiffure_homme', salonId: selectedBookingSalonId },
          { id: 'def_4', name: 'Tresses Américaines', price: 3000, type: 'coiffure_femme', salonId: selectedBookingSalonId }
        ];
      }

      renderBookingServices();
    })
    .catch((err) => {
      console.error("Erreur chargement prestations :", err);
      if (container) container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px;">Erreur de chargement.</div>`;
    });
}

function switchBookingTab(tabId) {
  selectedBookingTab = tabId;

  const tH = document.getElementById("res-tab-hommes");
  const tF = document.getElementById("res-tab-femmes");
  const tP = document.getElementById("res-tab-packs");

  if (tH) tH.classList.toggle("active", tabId === 'hommes');
  if (tF) tF.classList.toggle("active", tabId === 'femmes');
  if (tP) tP.classList.toggle("active", tabId === 'packs');

  // Mettre à jour l'image de prévisualisation (Homme vs Femme)
  const imgEl = document.getElementById("booking-preview-img");
  const labelEl = document.getElementById("booking-preview-label");

  if (imgEl && labelEl) {
    if (tabId === 'femmes') {
      imgEl.src = "Prestation/Traisse Americaine.jpeg";
      labelEl.textContent = "✨ Modèle Coiffure Femme sélectionné";
    } else if (tabId === 'hommes') {
      imgEl.src = "Prestation/Coiffure avec Black.jpeg";
      labelEl.textContent = "💈 Modèle Coiffure Homme sélectionné";
    } else {
      imgEl.src = "Prestation/Dreadlocks.jpeg";
      labelEl.textContent = "🎁 Pack Soins & Coiffures Spéciales";
    }
  }

  renderBookingServices();
}

function renderBookingServices() {
  const container = document.getElementById("booking-services-list");
  if (!container) return;

  container.innerHTML = "";

  const checkIsPack = (s) => {
    const typeLower = (s.type || "").toLowerCase();
    const nameLower = (s.name || "").toLowerCase();
    return typeLower.startsWith("pack") || nameLower.includes("pack");
  };

  let filtered = [];
  if (selectedBookingTab === 'hommes') {
    filtered = loadedBookingServices.filter(s => (s.type === 'coiffure_homme' || s.type === 'soin' || !s.type) && !checkIsPack(s));
  } else if (selectedBookingTab === 'femmes') {
    filtered = loadedBookingServices.filter(s => (s.type === 'coiffure_femme' || s.type === 'soin' || !s.type) && !checkIsPack(s));
  } else if (selectedBookingTab === 'packs') {
    filtered = loadedBookingServices.filter(s => checkIsPack(s));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Aucune prestation disponible dans cette catégorie.</div>`;
    return;
  }

  filtered.forEach(service => {
    const isSelected = selectedBookingService && selectedBookingService.id === service.id;

    const card = document.createElement("div");
    card.className = `service-select-card ${isSelected ? 'selected' : ''}`;
    card.onclick = () => {
      selectedBookingService = service;
      renderBookingServices();
    };

    let descHtml = service.description ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${service.description}</div>` : '';

    card.innerHTML = `
      <div style="flex: 1; padding-right: 10px;">
        <div style="font-weight: 700; color: ${isSelected ? 'var(--accent-gold)' : 'var(--text-main)'};">${service.name}</div>
        ${descHtml}
      </div>
      <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem;">
        ${service.price.toLocaleString('fr-FR')} F
      </div>
    `;
    container.appendChild(card);
  });
}

// ======================================================
// ENREGISTREMENT RÉSERVATION FIRESTORE & WHATSAPP
// ======================================================
function submitBooking() {
  if (!selectedBookingService) {
    alert("Veuillez choisir une prestation à l'étape 2 ou depuis la galerie photo.");
    return;
  }

  const employeeName = document.getElementById("booking-employee-select").value;
  const specialRequests = document.getElementById("booking-special-requests") ? document.getElementById("booking-special-requests").value.trim() : "";
  const dateVal = document.getElementById("booking-date").value;
  const timeVal = document.getElementById("booking-time").value;
  const clientName = document.getElementById("booking-client-name").value.trim();
  const clientQuartier = document.getElementById("booking-client-quartier").value.trim();
  const clientPhone = document.getElementById("booking-client-phone").value.trim();

  if (!dateVal || !timeVal || !clientName || !clientPhone) {
    alert("Veuillez remplir la date, l'heure et vos coordonnées.");
    return;
  }

  const submitBtn = document.getElementById("btn-submit-booking");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enregistrement en cours...";

  const ticketCode = "YG-" + Math.floor(1000 + Math.random() * 9000);

  const reservationData = {
    ticketCode: ticketCode,
    salonId: selectedBookingSalonId,
    salonName: selectedBookingSalonName,
    serviceName: selectedBookingService.name,
    price: Number(selectedBookingService.price),
    employeeName: employeeName,
    specialRequests: specialRequests,
    date: dateVal,
    time: timeVal,
    clientName: clientName,
    clientQuartier: clientQuartier,
    clientPhone: clientPhone,
    status: "pending",
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("reservations").add(reservationData)
    .then(() => {
      // Succès : afficher l'écran de ticket
      document.getElementById("booking-form-container").style.display = "none";
      document.getElementById("booking-success-container").style.display = "block";

      document.getElementById("ticket-code").textContent = ticketCode;
      document.getElementById("ticket-client").textContent = clientName;
      document.getElementById("ticket-quartier").textContent = clientQuartier || 'Non précisé';
      document.getElementById("ticket-salon").textContent = selectedBookingSalonName;
      document.getElementById("ticket-service").textContent = selectedBookingService.name;
      document.getElementById("ticket-employee").textContent = employeeName;
      document.getElementById("ticket-datetime").textContent = `${dateVal} à ${timeVal}`;
      document.getElementById("ticket-price").textContent = `${selectedBookingService.price.toLocaleString('fr-FR')} FCFA`;

      // Préparer le lien WhatsApp
      const specialReqText = specialRequests ? `\n- *Demande Spéciale / Soin :* ${specialRequests}` : "";
      const message = `Bonjour Yalo Glam's !\n\nJ'ai effectué une réservation sur votre application :\n- *Ticket :* ${ticketCode}\n- *Nom :* ${clientName} (${clientQuartier})\n- *Salon :* ${selectedBookingSalonName}\n- *Prestation :* ${selectedBookingService.name} (${selectedBookingService.price.toLocaleString('fr-FR')} FCFA)\n- *Coiffeur(se) :* ${employeeName}${specialReqText}\n- *Date & Heure :* ${dateVal} à ${timeVal}\n\nMerci de me confirmer la prise en compte ! ✨`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      const waBtn = document.getElementById("whatsapp-link");
      if (waBtn) waBtn.href = waUrl;

      // Défiler vers le haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch((err) => {
      console.error("Erreur enregistrement réservation :", err);
      alert("Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer ma Réservation";
    });
}

function submitClientReview(event) {
  event.preventDefault();
  const name = document.getElementById("review-client-name").value.trim();
  const rating = document.getElementById("review-rating").value;
  const comment = document.getElementById("review-comment").value.trim();

  if (!name || !comment) return;

  const container = document.getElementById("reviews-list-container");
  if (!container) return;

  const stars = "⭐".repeat(Number(rating));

  const reviewCard = document.createElement("div");
  reviewCard.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px;";
  reviewCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div style="font-weight: 700; color: var(--accent-gold);">${name}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">À l'instant • ${stars}</div>
    </div>
    <p style="font-size: 0.88rem; color: #ffffff; line-height: 1.4;">
      "${comment}"
    </p>
  `;

  container.prepend(reviewCard);
  document.getElementById("review-comment").value = "";
  alert("Merci ! Votre avis a été publié avec succès. ✨");
}

function resetBookingForm() {
  document.getElementById("booking-success-container").style.display = "none";
  document.getElementById("booking-form-container").style.display = "block";
  selectedBookingService = null;
  renderBookingServices();
}

// ======================================================
// ENREGISTREMENT & DÉCLENCHEMENT INSTALLATION PWA
// ======================================================
let deferredPwaPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  showPwaInstallBanner();
});

window.addEventListener('appinstalled', () => {
  console.log('L\'application Yalo Glam\'s a été installée avec succès !');
  localStorage.setItem('yg_pwa_installed', '1');
  dismissPwaBanner();
});

function showPwaInstallBanner() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isAlreadyInstalled = localStorage.getItem('yg_pwa_installed') === '1';

  const banner = document.getElementById("pwa-install-banner");
  if (!banner) return;

  if (isStandalone || isAlreadyInstalled) {
    banner.style.display = "none";
  } else {
    banner.style.display = "flex";
  }
}

function dismissPwaBanner() {
  const banner = document.getElementById("pwa-install-banner");
  if (banner) banner.style.display = "none";
}

function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installée par le client !');
        localStorage.setItem('yg_pwa_installed', '1');
        dismissPwaBanner();
      }
      deferredPwaPrompt = null;
    });
  } else {
    alert("Votre navigateur ne permet pas l'installation automatique. Veuillez utiliser l'option 'Ajouter à l'écran d'accueil' depuis le menu de votre navigateur.");
  }
}

function closePwaHelpModal() {
  const modal = document.getElementById("pwa-help-modal");
  if (modal) modal.style.display = "none";
}

