const fs = require('fs');

// =========================================================================
// 1. BUILD PERFECT INDEX.HTML (SALON TABLET INTERFACE)
// =========================================================================
const salonIndexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Écran Tablette Salon - Yalo Glam's</title>
  
  <!-- PWA & Mobile Web App Meta Tags -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2b0216">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Yalo Glam's">
  <link rel="apple-touch-icon" href="icon-192.png">

  <!-- Styles -->
  <link rel="stylesheet" href="css/style.css">
  <style>
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .quick-action-btn {
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid rgba(223, 183, 108, 0.4);
      background: rgba(223, 183, 108, 0.12);
      color: var(--accent-gold);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quick-action-btn:hover {
      background: rgba(223, 183, 108, 0.25);
      transform: translateY(-2px);
    }
    .res-badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 6px;
    }
  </style>
</head>
<body>

  <div class="app-container" id="main-container">
    <!-- En-tête de l'application -->
    <header>
      <div class="logo-container" style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 10px;">
        <img src="logo.png" alt="Yalo Glam's Logo" style="max-height: 85px; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);" onerror="this.src='icon-192.png';">
        <div class="logo" style="font-size: 2.3rem; font-weight: 800; font-family: var(--font-title);">Yalo <span>Glam's</span></div>
      </div>
      <div class="subtitle" id="app-subtitle">Bienvenue ! Veuillez choisir votre prestation.</div>
    </header>

    <!-- Écran de configuration du salon (Affiché au premier lancement) -->
    <div id="setup-screen" class="salon-setup" style="display: none;">
      <h2>Configuration de la Tablette Salon</h2>
      <p class="subtitle">Sélectionnez le salon où se trouve cet écran :</p>
      <div class="salon-options">
        <button class="btn-setup" onclick="setupSalon('salon_1', 'Yalo Glam\'s Shakespeare')">📍 Yalo Glam's Shakespeare</button>
        <button class="btn-setup" onclick="setupSalon('salon_2', 'Yalo Glam\'s Opep')">📍 Yalo Glam's Opep</button>
      </div>
    </div>

    <!-- Écran principal : Grille des prestations & Caisse -->
    <div id="services-screen" style="display: none;">
      
      <!-- Actions Rapides : Pointage & Réservations RDV -->
      <div class="quick-actions-bar">
        <button class="quick-action-btn" onclick="openPresenceModal()">
          📍 Pointage Arrivée
        </button>
        <button class="quick-action-btn" style="border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.12); color: #4ade80;" onclick="openSalonReservationsModal()">
          📅 Réservations RDV <span id="res-badge-count" class="res-badge" style="display: none;">0</span>
        </button>
      </div>

      <!-- Onglets Catégories Client -->
      <div class="client-tabs">
        <button class="client-tab-btn active" id="btn-tab-hommes" onclick="switchClientTab('hommes')">👨 Hommes</button>
        <button class="client-tab-btn" id="btn-tab-femmes" onclick="switchClientTab('femmes')">👩 Femmes</button>
        <button class="client-tab-btn" id="btn-tab-packs" onclick="switchClientTab('packs')">🎁 Packs</button>
        <button class="client-tab-btn" id="btn-tab-composition" onclick="switchClientTab('composition')">✨ Composition Spéciale</button>
      </div>

      <!-- Barre de recherche -->
      <div style="margin-bottom: 20px;">
        <input type="text" id="service-search-input" class="input-custom" placeholder="🔍 Rechercher une coiffure, un soin..." oninput="onSearchInput()" style="width: 100%; padding: 12px 18px; font-size: 0.95rem;">
      </div>

      <!-- VUE STANDARD : Grille des prestations -->
      <div id="standard-services-view">
        <div class="services-grid" id="services-list">
          <div style="grid-column: 1/-1; padding: 40px; color: var(--text-muted);">
            Chargement des prestations...
          </div>
        </div>
      </div>

      <!-- VUE COMPOSITION SPÉCIALE -->
      <div id="composition-services-view" style="display: none;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="color: var(--accent-gold); font-family: var(--font-title); font-size: 1.3rem;">Composition Sur-Mesure</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Sélectionnez plusieurs prestations ou ajoutez un soin personnalisé.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; align-items: start;">
          <div id="comp-selection-list" style="max-height: 400px; overflow-y: auto;">
            <!-- Rempli en JS -->
          </div>

          <div class="panel-card" style="margin-bottom: 0;">
            <div class="panel-title">🛒 Votre Sélection</div>
            <div id="comp-selected-list" style="margin-bottom: 15px; max-height: 180px; overflow-y: auto;">
              <div style="color: var(--text-muted); font-size: 0.9rem;">Aucune prestation sélectionnée.</div>
            </div>

            <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 8px;">➕ Ajouter un soin sur-mesure</div>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="text" id="custom-item-name" class="input-custom" placeholder="Nom (ex: Shampoing bio)" style="flex: 1; padding: 8px 10px; font-size: 0.85rem;">
                <input type="number" id="custom-item-price" class="input-custom" placeholder="Prix F" style="width: 90px; padding: 8px 10px; font-size: 0.85rem;">
              </div>
              <button class="btn btn-confirm" style="width: 100%; padding: 8px; font-size: 0.82rem;" onclick="addCustomServiceToComposition()">+ Ajouter à la composition</button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: 15px; font-size: 1.1rem; font-weight: 800;">
              <span>Total :</span>
              <span id="comp-total-price" style="color: var(--accent-gold);">0 FCFA</span>
            </div>

            <button class="btn btn-confirm" id="btn-validate-comp" style="width: 100%; margin-top: 15px; padding: 12px;" onclick="validateComposition()" disabled>
              Valider ma Composition
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modale Confirmation Choix Prestation & Choix Employé -->
    <div class="modal-overlay" id="confirm-modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-title">Confirmer la Prestation</div>
        <p class="modal-text">Choisissez l'employé(e) qui réalise la prestation :</p>
        
        <div id="employee-selection-container" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;">
          <!-- Boutons employés générés en JS -->
        </div>

        <div class="modal-summary" style="margin-bottom: 20px;">
          <div class="summary-item">
            <span>Prestation :</span>
            <span id="summary-name" style="font-weight: 700;">--</span>
          </div>
          <div class="summary-item">
            <span>Tarif :</span>
            <span id="summary-price" class="summary-price">-- FCFA</span>
          </div>
        </div>

        <div class="modal-buttons">
          <button class="btn btn-cancel" onclick="closeModal()">Annuler</button>
          <button class="btn btn-confirm" id="confirm-btn" disabled style="opacity: 0.6;">Confirmer & Encaisser</button>
        </div>
      </div>
    </div>

    <!-- Modale Pointage Arrivée Employé -->
    <div class="modal-overlay" id="presence-modal" style="display: none;">
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-title">📍 Pointage Arrivée Employé</div>
        <p class="modal-text">Sélectionnez votre nom et saisissez le code secret du jour fourni par la patronne.</p>
        
        <form onsubmit="event.preventDefault(); submitPresenceClockIn();">
          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="presence-employee-select">Votre Nom (Employé) :</label>
            <select id="presence-employee-select" class="select-custom" style="width: 100%;" required>
              <!-- Rempli en JS -->
            </select>
          </div>

          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="presence-code-input">Code Secret du Jour (4 chiffres) :</label>
            <input type="password" id="presence-code-input" class="input-custom" placeholder="Ex: 1234" maxlength="4" required>
          </div>

          <div class="modal-buttons">
            <button type="button" class="btn btn-cancel" onclick="closePresenceModal()">Fermer</button>
            <button type="submit" class="btn btn-confirm">Valider ma Présence</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modale Réservations RDV du Jour -->
    <div class="modal-overlay" id="salon-reservations-modal" style="display: none;">
      <div class="modal-content" style="max-width: 540px; text-align: left;">
        <div class="modal-title">📅 Réservations Clientèle en Attente</div>
        <p class="modal-text">Consultez et validez les rendez-vous pris en ligne par les clients.</p>

        <div id="salon-reservations-list" style="max-height: 340px; overflow-y: auto; margin-bottom: 15px;">
          <!-- Rempli en JS -->
        </div>

        <button class="btn btn-cancel" style="width: 100%;" onclick="closeSalonReservationsModal()">Fermer</button>
      </div>
    </div>

    <!-- Écran de Succès -->
    <div id="success-screen" class="success-screen" style="display: none;">
      <div class="checkmark-circle">✓</div>
      <div class="success-title">Prestation Enregistrée !</div>
      <div class="success-text">Le choix a été transmis à la caisse du salon.</div>
      <p class="subtitle">Merci de votre visite chez Yalo Glam's !</p>
    </div>

    <!-- Pied de page -->
    <footer>
      <div id="salon-info" style="display: none;">
        Écran configuré pour : <span class="salon-badge" id="salon-name-badge" onclick="resetSalon()">Nom du Salon</span>
      </div>
      <div style="margin-top: 10px; font-size: 0.8rem; color: rgba(255,255,255,0.2);">
        Yalo Glam's © 2026. Tous droits réservés.
      </div>
    </footer>
  </div>

  <!-- Firebase Compat SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  
  <script src="js/config.js"></script>
  <script src="js/client.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  </script>
</body>
</html>`;

fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/index.html', salonIndexHtml, 'utf8');
console.log('Successfully saved perfect index.html (Salon Tablet Interface)! Length:', salonIndexHtml.length);

// =========================================================================
// 2. BUILD PERFECT RESERVATION.HTML (CLIENT MOBILE WEB APP)
// =========================================================================
let reservationAppHtml = fs.readFileSync('c:/Users/USER/Documents/controlleur SA/public/index_base.html', 'utf8');

// Ensure explicit focus & touch handling in CSS
const customCssFix = `
    input, textarea, select {
      -webkit-user-select: text !important;
      user-select: text !important;
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }
`;
reservationAppHtml = reservationAppHtml.replace('body {', customCssFix + '\n    body {');

// 1. Add preview container right under Step 2 category selection
const step2InsertTarget = `<div class="space-y-2 pt-1" data-purpose="service-items-list" id="services-container">`;
const previewComponent = `
<!-- Dynamic Preview Image Component -->
<div id="booking-preview-card" class="my-4 rounded-2xl overflow-hidden border border-amber-500/30 bg-[#240616] shadow-lg transition-all duration-300">
  <div class="relative h-52 w-full bg-neutral-900">
    <img id="booking-preview-img" src="Prestation/Coiffure avec Black.jpeg" alt="Preview Modèle" class="w-full h-full object-cover transition-all duration-300">
    <span id="booking-preview-badge" class="absolute top-3 right-3 bg-black/80 backdrop-blur-sm border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
      💈 Modèle Coiffure Homme
    </span>
  </div>
  <div id="booking-employee-attribution" class="p-3 text-center text-sm font-semibold text-brand-gold bg-brand-wine/80 border-t border-amber-500/20">
    ✂️ Fait par : Premier coiffeur/coiffeuse disponible
  </div>
</div>
`;
reservationAppHtml = reservationAppHtml.replace(step2InsertTarget, previewComponent + '\n' + step2InsertTarget);

// 2. Add Step 4: Demandes Spéciales before Step 4 Date&Time
const step4DateTarget = `<!-- BEGIN: Step4DateTimeSelection -->`;
const stepSpecialRequestsComponent = `
<!-- BEGIN: StepSpecialRequests -->
<section class="bg-brand-card/60 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/15 space-y-4" data-purpose="step-special-requests">
  <div class="flex items-center gap-2.5">
    <span class="w-7 h-7 rounded-full bg-brand-gold text-brand-darkwine font-bold text-sm flex items-center justify-center shadow-md">4</span>
    <h2 class="text-base font-bold text-amber-100">Demandes Spéciales & Soins Optionnels</h2>
  </div>
  
  <!-- Hint Message Box -->
  <div id="special-hint-box" class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-amber-100 flex items-start justify-between gap-3">
    <div class="space-y-1">
      <span class="font-bold text-brand-gold">💡 Besoin d'un soin particulier ?</span>
      <p class="text-xs text-amber-200/90 leading-relaxed">
        Si vous souhaitez un shampooing pour le traitement des pellicules, un masque réparateur ou tout autre soin spécifique, décrivez-le ici lors de votre réservation.
      </p>
    </div>
    <button type="button" onclick="dismissSpecialHint()" class="py-1.5 px-3.5 rounded-xl bg-brand-gold text-brand-darkwine text-xs font-bold whitespace-nowrap shadow hover:brightness-105 active:scale-95 transition">
      D'accord 👍
    </button>
  </div>

  <textarea id="input-special-requests" rows="3" class="w-full bg-white text-gray-900 text-sm font-semibold rounded-xl p-3.5 border-none focus:ring-2 focus:ring-brand-gold placeholder:text-gray-400" placeholder="Ex: Je souhaite un shampooing spécial pour le traitement des pellicules lors de mon passage..."></textarea>
</section>
<!-- END: StepSpecialRequests -->
`;
reservationAppHtml = reservationAppHtml.replace(step4DateTarget, stepSpecialRequestsComponent + '\n' + step4DateTarget);

// Change numbers for Date/Time (5) and Customer Details (6)
reservationAppHtml = reservationAppHtml.replace(
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">4</span>\n<h2 class="text-sm font-bold text-amber-100">Date et Heure`,
  `<span class="w-7 h-7 rounded-full bg-brand-gold text-brand-darkwine font-bold text-sm flex items-center justify-center shadow-md">5</span>\n<h2 class="text-base font-bold text-amber-100">Date et Heure`
);

reservationAppHtml = reservationAppHtml.replace(
  `<span class="w-6 h-6 rounded-full bg-brand-gold text-brand-darkwine font-bold text-xs flex items-center justify-center shadow-md">5</span>\n<h2 class="text-sm font-bold text-amber-100">Vos Coordonnées`,
  `<span class="w-7 h-7 rounded-full bg-brand-gold text-brand-darkwine font-bold text-sm flex items-center justify-center shadow-md">6</span>\n<h2 class="text-base font-bold text-amber-100">Vos Coordonnées`
);

// 3. Replace Salons in bottom navigation with Avis
const navSalonsTarget = `<button class="flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition" id="nav-item-salons" onclick="scrollToSalons()" type="button">
<div class="p-1 mb-0.5">
<svg class="w-5 h-5 stroke-current" fill="none" stroke="currentColor" viewbox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</div>
<span class="text-[10px] font-medium tracking-tight">Salons</span>
</button>`;

const navReviewsComponent = `<button class="flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition" id="nav-item-reviews" onclick="switchView('reviews')" type="button">
<div class="p-1 mb-0.5">
<svg class="w-5 h-5 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
</div>
<span class="text-xs font-semibold tracking-tight">Avis</span>
</button>`;

reservationAppHtml = reservationAppHtml.replace(navSalonsTarget, navReviewsComponent);

// 4. Update Gallery Cards to use local Prestation/ images, employee credits, and remove duration
const gallerySectionOld = reservationAppHtml.substring(
  reservationAppHtml.indexOf('<div class="space-y-4"'),
  reservationAppHtml.indexOf('<!-- ============================================== -->\n<!-- MODAL 1:')
);

const gallerySectionNew = `<div class="space-y-6">
  <!-- Card 1: Tresses Américaines Premium -->
  <article class="gallery-item-card femme bg-[#240616] rounded-2xl overflow-hidden border border-amber-500/20 shadow-xl" data-tags="femme">
    <div class="relative h-64 w-full bg-neutral-900">
      <img alt="Tresses Américaines" class="w-full h-full object-cover" src="Prestation/Traisse Americaine.jpeg"/>
      <span class="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow">
        👩 Coiffure Dame
      </span>
      <span class="absolute top-3 right-3 bg-brand-gold text-brand-darkwine font-bold text-xs px-3.5 py-1.5 rounded-full shadow">
        5000 F CFA
      </span>
    </div>
    <div class="p-4 space-y-3">
      <h3 class="text-base font-bold text-brand-gold">Tresses Américaines Premium</h3>
      <p class="text-xs text-gray-300 leading-relaxed font-light">
        Nattes plaquées américaines géométriques avec pointes bouclées en cascade d'une brillance extrême.
      </p>
      <div class="pt-3 border-t border-amber-500/15 flex items-center justify-between gap-2">
        <div class="text-xs text-brand-gold font-semibold">✂️ Fait par : Mistorine (Coiffeuse)</div>
        <div class="flex gap-2">
          <button class="py-2 px-3 rounded-xl bg-amber-500/20 text-brand-gold text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition" onclick="switchView('reviews')">💬 Avis</button>
          <button class="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine text-xs font-bold shadow active:scale-95 transition" onclick="bookSpecificService('femmes', 'Tresses Américaines', '5000 F')">📅 Réserver</button>
        </div>
      </div>
    </div>
  </article>

  <!-- Card 2: Dreadlocks & Locks -->
  <article class="gallery-item-card locks femme bg-[#240616] rounded-2xl overflow-hidden border border-amber-500/20 shadow-xl" data-tags="locks femme">
    <div class="relative h-64 w-full bg-neutral-900">
      <img alt="Dreadlocks & Nattes Artistiques" class="w-full h-full object-cover" src="Prestation/Dreadlocks.jpeg"/>
      <span class="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow">
        💈 Locks & Soins
      </span>
      <span class="absolute top-3 right-3 bg-brand-gold text-brand-darkwine font-bold text-xs px-3.5 py-1.5 rounded-full shadow">
        5000 F CFA
      </span>
    </div>
    <div class="p-4 space-y-3">
      <h3 class="text-base font-bold text-brand-gold">Dreadlocks & Nattes Artistiques</h3>
      <p class="text-xs text-gray-300 leading-relaxed font-light">
        Création et entretien minutieux de locks, vanilles sculptées, et finitions nettes aux huiles nourrissantes.
      </p>
      <div class="pt-3 border-t border-amber-500/15 flex items-center justify-between gap-2">
        <div class="text-xs text-brand-gold font-semibold">✂️ Fait par : Aimeran (Coiffeur)</div>
        <div class="flex gap-2">
          <button class="py-2 px-3 rounded-xl bg-amber-500/20 text-brand-gold text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition" onclick="switchView('reviews')">💬 Avis</button>
          <button class="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine text-xs font-bold shadow active:scale-95 transition" onclick="bookSpecificService('femmes', 'Dreadlocks', '5000 F')">📅 Réserver</button>
        </div>
      </div>
    </div>
  </article>

  <!-- Card 3: Coiffure avec Black -->
  <article class="gallery-item-card homme bg-[#240616] rounded-2xl overflow-hidden border border-amber-500/20 shadow-xl" data-tags="homme">
    <div class="relative h-64 w-full bg-neutral-900">
      <img alt="Coiffure avec Black" class="w-full h-full object-cover" src="Prestation/Coiffure avec Black.jpeg"/>
      <span class="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow">
        👨 Homme
      </span>
      <span class="absolute top-3 right-3 bg-brand-gold text-brand-darkwine font-bold text-xs px-3.5 py-1.5 rounded-full shadow">
        1500 F CFA
      </span>
    </div>
    <div class="p-4 space-y-3">
      <h3 class="text-base font-bold text-brand-gold">Coiffure avec Black & Traçage</h3>
      <p class="text-xs text-gray-300 leading-relaxed font-light">
        Coupe homme soignée, application de noir au pinceau et contours travaillés au millimètre.
      </p>
      <div class="pt-3 border-t border-amber-500/15 flex items-center justify-between gap-2">
        <div class="text-xs text-brand-gold font-semibold">✂️ Fait par : Marco (Coiffeur)</div>
        <div class="flex gap-2">
          <button class="py-2 px-3 rounded-xl bg-amber-500/20 text-brand-gold text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition" onclick="switchView('reviews')">💬 Avis</button>
          <button class="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine text-xs font-bold shadow active:scale-95 transition" onclick="bookSpecificService('hommes', 'Coiffure avec Black', '1500 F')">📅 Réserver</button>
        </div>
      </div>
    </div>
  </article>

  <!-- Card 4: Coiffure avec Teinture -->
  <article class="gallery-item-card homme bg-[#240616] rounded-2xl overflow-hidden border border-amber-500/20 shadow-xl" data-tags="homme">
    <div class="relative h-64 w-full bg-neutral-900">
      <img alt="Coiffure avec Teinture" class="w-full h-full object-cover" src="Prestation/coiffure avec Teinture.jpeg"/>
      <span class="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow">
        ✨ Teinture & Style
      </span>
      <span class="absolute top-3 right-3 bg-brand-gold text-brand-darkwine font-bold text-xs px-3.5 py-1.5 rounded-full shadow">
        2500 F CFA
      </span>
    </div>
    <div class="p-4 space-y-3">
      <h3 class="text-base font-bold text-brand-gold">Coiffure avec Teinture & Dégradé</h3>
      <p class="text-xs text-gray-300 leading-relaxed font-light">
        Couleur éclatante dorée/blonde avec dégradé américain parfait.
      </p>
      <div class="pt-3 border-t border-amber-500/15 flex items-center justify-between gap-2">
        <div class="text-xs text-brand-gold font-semibold">✂️ Fait par : Clarisse (Coiffeuse)</div>
        <div class="flex gap-2">
          <button class="py-2 px-3 rounded-xl bg-amber-500/20 text-brand-gold text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition" onclick="switchView('reviews')">💬 Avis</button>
          <button class="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine text-xs font-bold shadow active:scale-95 transition" onclick="bookSpecificService('hommes', 'Coiffure avec Teinture', '2500 F')">📅 Réserver</button>
        </div>
      </div>
    </div>
  </article>
</div>`;

reservationAppHtml = reservationAppHtml.replace(gallerySectionOld, gallerySectionNew);

// 5. Add view-reviews HTML before END: MainContent
const mainContentEndTarget = '</main>';
const viewReviewsComponent = `
<!-- ============================================== -->
<!-- VIEW 3: AVIS & COMMUNAUTÉ VIEW                 -->
<!-- ============================================== -->
<div class="space-y-4 view-transition hidden" id="view-reviews">
  <section class="bg-brand-card/75 backdrop-blur-md rounded-2xl p-4 border border-amber-500/20 shadow-lg text-center space-y-2">
    <h2 class="text-lg font-serif font-bold text-brand-gold">⭐ Avis & Expérience Clients</h2>
    <p class="text-xs text-amber-200/70">Partagez votre expérience et échangez avec la communauté Yalo Glam's</p>
  </section>

  <!-- Rating Score Card -->
  <section class="bg-gradient-to-r from-amber-500/20 via-brand-wine to-amber-700/20 rounded-2xl p-4 border border-amber-400/30 text-center space-y-1 shadow-lg">
    <div class="text-3xl font-extrabold text-brand-gold font-serif">4.9 / 5</div>
    <div class="text-base text-brand-gold tracking-widest">⭐⭐⭐⭐⭐</div>
    <div class="text-[10px] text-amber-200/80">Basé sur plus de 120 avis vérifiés de clients du salon</div>
  </section>

  <!-- Submit Review Form Card -->
  <section class="bg-brand-card/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/15 space-y-3">
    <h3 class="text-xs font-bold text-brand-gold uppercase tracking-wider">✏️ Laisser un commentaire & une note</h3>
    <form id="review-submit-form" onsubmit="handleReviewSubmit(event)" class="space-y-2.5">
      <div class="grid grid-cols-2 gap-2">
        <input id="rev-name-input" type="text" placeholder="Votre Nom / Prénom" required style="-webkit-user-select: text !important; user-select: text !important; pointer-events: auto !important;" class="bg-white text-gray-900 text-sm font-semibold rounded-xl py-2.5 px-3.5 border-none focus:ring-2 focus:ring-brand-gold">
        <select id="rev-rating-input" style="pointer-events: auto !important;" class="bg-white text-gray-900 text-sm font-semibold rounded-xl py-2.5 px-3.5 border-none focus:ring-2 focus:ring-brand-gold">
          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
          <option value="4">⭐⭐⭐⭐ (4/5)</option>
          <option value="3">⭐⭐⭐ (3/5)</option>
        </select>
      </div>
      <textarea id="rev-comment-input" rows="3" placeholder="Ex: Dégradé parfait réalisé par Marco ! Très bon accueil..." required style="-webkit-user-select: text !important; user-select: text !important; pointer-events: auto !important;" class="w-full bg-white text-gray-900 text-sm font-semibold rounded-xl p-3.5 border-none focus:ring-2 focus:ring-brand-gold placeholder:text-gray-400"></textarea>
      <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldDark text-brand-darkwine font-bold text-sm shadow-gold-sm hover:brightness-105 transition">
        Publier mon avis
      </button>
    </form>
  </section>

  <!-- Reviews Feed -->
  <section class="space-y-3.5" id="reviews-feed">
    <div class="bg-[#240616] p-4 rounded-2xl border border-amber-500/20 space-y-2 shadow-md">
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold text-brand-gold">Vanessa K. (Bastos)</span>
        <span class="text-xs text-amber-200/60">Il y a 2h • ⭐⭐⭐⭐⭐</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "Les tresses américaines faites par Mistorine sont juste magnifiques ! Le tracé est parfait et ça ne tire pas du tout. Je recommande vivement !"
      </p>
      <div class="p-2.5 rounded-xl bg-amber-500/10 border-l-2 border-brand-gold text-xs text-amber-200">
        👑 <strong class="text-brand-gold">Patronne Yalo Glam's :</strong> Merci beaucoup Vanessa ! Toute l'équipe s'efforce d'offrir la meilleure qualité. À très bientôt !
      </div>
    </div>

    <div class="bg-[#240616] p-4 rounded-2xl border border-amber-500/20 space-y-2 shadow-md">
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold text-brand-gold">Thierry M. (Mimboman)</span>
        <span class="text-xs text-amber-200/60">Hier • ⭐⭐⭐⭐⭐</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "Superbe coupe au Black par Marco. Très pro et ponctuel sur la réservation."
      </p>
      <div class="p-2.5 rounded-xl bg-amber-500/10 border-l-2 border-brand-gold text-xs text-amber-200">
        👑 <strong class="text-brand-gold">Patronne Yalo Glam's :</strong> Merci Thierry ! Marco est ravi que la prestation vous ait plu.
      </div>
    </div>
  </section>
</div>
`;
reservationAppHtml = reservationAppHtml.replace(mainContentEndTarget, viewReviewsComponent + '\n' + mainContentEndTarget);

// Add JS helper functions and state handlers
const jsInsertTarget = `function selectCategory(catKey) {`;
const jsHelpers = `
  // Updated Employees List per Salon
  const SALON_EMPLOYEES_CONFIG = {
    shakespeare: ['Marco', 'Mistorine', 'Merveille'],
    opep: ['Aimerant', 'Clarisse', 'Brandone']
  };

  function updateStylistDropdownForSalon() {
    const sel = document.getElementById('select-stylist');
    if (!sel) return;

    const employees = SALON_EMPLOYEES_CONFIG[state.selectedSalon] || ['Marco', 'Mistorine', 'Merveille'];
    sel.innerHTML = '<option value="Premier disponible">Premier disponible (Recommandé)</option>';

    employees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp;
      opt.textContent = \`\${emp} (Coiffeur/Coiffeuse)\`;
      sel.appendChild(opt);
    });

    updateStylistAttribution();
  }

  function checkSpecialHintDismissed() {
    if (localStorage.getItem('yg_dismissed_special_hint') === 'true') {
      const el = document.getElementById('special-hint-box');
      if (el) el.style.display = 'none';
    }
  }

  function dismissSpecialHint() {
    localStorage.setItem('yg_dismissed_special_hint', 'true');
    const el = document.getElementById('special-hint-box');
    if (el) el.style.display = 'none';
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('rev-name-input').value.trim();
    const rating = document.getElementById('rev-rating-input').value;
    const comment = document.getElementById('rev-comment-input').value.trim();

    if (!name || !comment) return;

    const feed = document.getElementById('reviews-feed');
    if (!feed) return;

    const stars = "⭐".repeat(Number(rating));
    const card = document.createElement('div');
    card.className = "bg-[#240616] p-4 rounded-2xl border border-amber-500/20 space-y-2 shadow-md";
    card.innerHTML = \`
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold text-brand-gold">\${name}</span>
        <span class="text-xs text-amber-200/60">À l'instant • \${stars}</span>
      </div>
      <p class="text-xs text-gray-200 leading-relaxed font-light">
        "\${comment}"
      </p>
    \`;

    feed.prepend(card);
    document.getElementById('rev-comment-input').value = '';
    showToast('Avis publié avec succès !');
  }

  function updatePreviewImage(catKey) {
    const imgEl = document.getElementById('booking-preview-img');
    const badgeEl = document.getElementById('booking-preview-badge');
    if (!imgEl || !badgeEl) return;

    if (catKey === 'femmes') {
      imgEl.src = 'Prestation/Traisse Americaine.jpeg';
      badgeEl.innerHTML = '✨ Modèle Coiffure Femme';
    } else if (catKey === 'hommes') {
      imgEl.src = 'Prestation/Coiffure avec Black.jpeg';
      badgeEl.innerHTML = '💈 Modèle Coiffure Homme';
    } else {
      imgEl.src = 'Prestation/Dreadlocks.jpeg';
      badgeEl.innerHTML = '🎁 Pack Soins & Esthétique';
    }
  }

  function updateStylistAttribution() {
    const stylistSelect = document.getElementById('select-stylist');
    const attrEl = document.getElementById('booking-employee-attribution');
    if (!stylistSelect || !attrEl) return;

    const val = stylistSelect.value;
    if (val && val !== 'Premier disponible') {
      attrEl.innerHTML = \`✂️ Fait par : <strong class="text-brand-goldLight">\${val}</strong>\`;
    } else {
      attrEl.innerHTML = \`✂️ Fait par : Premier coiffeur/coiffeuse disponible\`;
    }
  }
`;

reservationAppHtml = reservationAppHtml.replace(jsInsertTarget, jsHelpers + '\n' + jsInsertTarget);

// In selectCategory(catKey), call updatePreviewImage(catKey)
reservationAppHtml = reservationAppHtml.replace('badge.textContent = labels[catKey];', 'badge.textContent = labels[catKey];\n    updatePreviewImage(catKey);');

// Update switchView to handle 'reviews'
const switchViewOld = `function switchView(viewId) {
    state.currentView = viewId;
    const viewBooking = document.getElementById('view-booking');
    const viewGallery = document.getElementById('view-gallery');
    const tabBooking = document.getElementById('tab-btn-booking');
    const tabGallery = document.getElementById('tab-btn-gallery');
    const navRdv = document.getElementById('nav-item-rdv');
    const navGallery = document.getElementById('nav-item-gallery');

    if (viewId === 'booking') {
      viewBooking.classList.remove('hidden');
      viewBooking.classList.add('block');
      viewGallery.classList.remove('block');
      viewGallery.classList.add('hidden');

      // Update primary tabs
      tabBooking.className = "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all";
      tabGallery.className = "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";

      // Update bottom nav
      navRdv.className = "flex flex-col items-center py-1 text-brand-gold transition";
      navRdv.querySelector('div').className = "p-1 rounded-xl bg-brand-gold/15 mb-0.5";
      navGallery.className = "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navGallery.querySelector('div').className = "p-1 mb-0.5";
    } else {
      viewGallery.classList.remove('hidden');
      viewGallery.classList.add('block');
      viewBooking.classList.remove('block');
      viewBooking.classList.add('hidden');

      // Update primary tabs
      tabGallery.className = "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all";
      tabBooking.className = "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";

      // Update bottom nav
      navGallery.className = "flex flex-col items-center py-1 text-brand-gold transition";
      navGallery.querySelector('div').className = "p-1 rounded-xl bg-brand-gold/15 mb-0.5";
      navRdv.className = "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      navRdv.querySelector('div').className = "p-1 mb-0.5";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }`;

const switchViewNew = `function switchView(viewId) {
    state.currentView = viewId;
    const viewBooking = document.getElementById('view-booking');
    const viewGallery = document.getElementById('view-gallery');
    const viewReviews = document.getElementById('view-reviews');

    const tabBooking = document.getElementById('tab-btn-booking');
    const tabGallery = document.getElementById('tab-btn-gallery');

    const navRdv = document.getElementById('nav-item-rdv');
    const navGallery = document.getElementById('nav-item-gallery');
    const navReviews = document.getElementById('nav-item-reviews');

    if (viewBooking) viewBooking.className = viewId === 'booking' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';
    if (viewGallery) viewGallery.className = viewId === 'gallery' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';
    if (viewReviews) viewReviews.className = viewId === 'reviews' ? 'space-y-4 view-transition block' : 'space-y-4 view-transition hidden';

    if (tabBooking) {
      tabBooking.className = viewId === 'booking' 
        ? "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all"
        : "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";
    }
    if (tabGallery) {
      tabGallery.className = viewId === 'gallery' 
        ? "py-3 px-3 rounded-2xl bg-[#521334] border-2 border-brand-gold text-brand-goldLight text-xs font-bold flex items-center justify-center gap-2 shadow-gold-sm transition-all"
        : "py-3 px-3 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-amber-500/20 text-gray-200 text-xs font-medium flex items-center justify-center gap-2 transition hover:text-brand-gold";
    }

    if (navRdv) {
      navRdv.className = viewId === 'booking' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      if (navRdv.querySelector('div')) navRdv.querySelector('div').className = viewId === 'booking' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }
    if (navGallery) {
      navGallery.className = viewId === 'gallery' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      if (navGallery.querySelector('div')) navGallery.querySelector('div').className = viewId === 'gallery' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }
    if (navReviews) {
      navReviews.className = viewId === 'reviews' ? "flex flex-col items-center py-1 text-brand-gold transition" : "flex flex-col items-center py-1 text-amber-200/60 hover:text-brand-gold transition";
      if (navReviews.querySelector('div')) navReviews.querySelector('div').className = viewId === 'reviews' ? "p-1 rounded-xl bg-brand-gold/15 mb-0.5" : "p-1 mb-0.5";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }`;

reservationAppHtml = reservationAppHtml.replace(switchViewOld, switchViewNew);

// Update selectSalon to also update stylists
reservationAppHtml = reservationAppHtml.replace(
  'updateSummary();\n  }',
  'updateSummary();\n    updateStylistDropdownForSalon();\n  }'
);

// Add DOMContentLoaded listeners
const domLoadOld = `// Date and Time listeners for live summary update`;
const domLoadNew = `
  document.addEventListener('DOMContentLoaded', () => {
    checkSpecialHintDismissed();
    updateStylistDropdownForSalon();
    const selStylist = document.getElementById('select-stylist');
    if (selStylist) selStylist.addEventListener('change', updateStylistAttribution);
  });
  // Date and Time listeners for live summary update`;

reservationAppHtml = reservationAppHtml.replace(domLoadOld, domLoadNew);

// Remove any trailing extra prompt tags
const bodyEndIndex = reservationAppHtml.indexOf('</body></html>');
if (bodyEndIndex !== -1) {
  reservationAppHtml = reservationAppHtml.substring(0, bodyEndIndex + 14);
}

fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/reservation.html', reservationAppHtml, 'utf8');
console.log('Successfully saved perfect reservation.html (Client Mobile Web App)! Length:', reservationAppHtml.length);
