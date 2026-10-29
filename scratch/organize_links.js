const fs = require('fs');

// 1. Get the Tailwind Client App currently in index.html (or built script)
const tailwindClientApp = fs.readFileSync('c:/Users/USER/Documents/controlleur SA/public/index.html', 'utf8');

// Copy it to reservation.html
fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/reservation.html', tailwindClientApp, 'utf8');
console.log('Successfully set reservation.html to Client Mobile Web App! Length:', tailwindClientApp.length);

// 2. Build the Salon Tablet Interface for index.html
const salonTabletHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Écran Client - Yalo Glam's</title>
  
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
    /* Style personnalisé pour les actions rapides du haut */
    .quick-actions-bar {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .quick-action-btn {
      padding: 10px 18px;
      border-radius: 12px;
      border: 1px solid rgba(223, 183, 108, 0.4);
      background: rgba(223, 183, 108, 0.12);
      color: var(--accent-gold);
      font-weight: 700;
      font-size: 0.9rem;
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
  </style>
</head>
<body>

  <div class="app-container" id="main-container">
    <!-- En-tête de l'application -->
    <header>
      <div class="logo-container" style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 10px;">
        <img src="logo.png" alt="Yalo Glam's Logo" style="max-height: 80px; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);" onerror="this.src='icon-192.png';">
        <div class="logo" style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-title);">Yalo <span>Glam's</span></div>
      </div>
      <div class="subtitle" id="app-subtitle">Bienvenue ! Veuillez choisir votre prestation.</div>
    </header>

    <!-- Écran de configuration du salon (Affiché uniquement au premier lancement) -->
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
        <button class="quick-action-btn" style="border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.12); color: #4ade80;" onclick="openReservationsCheckModal()">
          📅 Réservations RDV
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
          <!-- Liste des éléments à sélectionner -->
          <div id="comp-selection-list" style="max-height: 400px; overflow-y: auto;">
            <!-- Rempli en JS -->
          </div>

          <!-- Panier / Résumé Composition -->
          <div class="panel-card" style="margin-bottom: 0;">
            <div class="panel-title">🛒 Votre Sélection</div>
            <div id="comp-selected-list" style="margin-bottom: 15px; max-height: 180px; overflow-y: auto;">
              <div style="color: var(--text-muted); font-size: 0.9rem;">Aucune prestation sélectionnée.</div>
            </div>

            <!-- Ajout d'élément personnalisé sur-mesure -->
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

            <button class="btn btn-confirm" id="btn-validate-comp" style="width: 100%; margin-top: 15px; padding: 12px;" onclick="validateCompositionOrder()" disabled>
              Valider ma Composition
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modale Choix Employé & Validation Commande -->
    <div class="modal-overlay" id="order-modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-title" id="order-modal-title">Valider la Prestation</div>
        <p class="modal-text">Choisissez l'employé(e) qui va réaliser la prestation :</p>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label class="form-label" for="employee-select">Coiffeur / Coiffeuse :</label>
          <select id="employee-select" class="select-custom" style="width: 100%;">
            <!-- Rempli en JS -->
          </select>
        </div>

        <div class="modal-summary" style="margin-bottom: 20px;">
          <div class="summary-item">
            <span>Prestation :</span>
            <span id="order-summary-name" style="font-weight: 700;">--</span>
          </div>
          <div class="summary-item">
            <span>Tarif Total :</span>
            <span id="order-summary-price" class="summary-price">-- FCFA</span>
          </div>
        </div>

        <div class="modal-buttons">
          <button class="btn btn-cancel" onclick="closeOrderModal()">Annuler</button>
          <button class="btn btn-confirm" id="btn-confirm-order" onclick="confirmOrderSubmit()">Confirmer & Envoyer</button>
        </div>
      </div>
    </div>

    <!-- Modale Pointage Arrivée Employé -->
    <div class="modal-overlay" id="presence-modal" style="display: none;">
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-title">📍 Pointage Arrivée Employé</div>
        <p class="modal-text">Veuillez sélectionner votre nom et saisir le code secret fourni ce matin par la patronne.</p>
        
        <form onsubmit="submitPresence(event)">
          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="presence-emp-select">Votre Nom (Employé) :</label>
            <select id="presence-emp-select" class="select-custom" style="width: 100%;" required>
              <!-- Rempli en JS -->
            </select>
          </div>

          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="presence-code-input">Code Secret du Jour :</label>
            <input type="password" id="presence-code-input" class="input-custom" placeholder="Entrez le code secret..." required>
          </div>

          <div id="presence-error" style="display: none; color: #f87171; font-size: 0.85rem; margin-bottom: 12px; text-align: left;"></div>

          <div class="modal-buttons">
            <button type="button" class="btn btn-cancel" onclick="closePresenceModal()">Fermer</button>
            <button type="submit" class="btn btn-confirm" id="btn-submit-presence">Valider ma Présence</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modale Consultation Réservations RDV du jour -->
    <div class="modal-overlay" id="reservations-check-modal" style="display: none;">
      <div class="modal-content" style="max-width: 520px; text-align: left;">
        <div class="modal-title">📅 Réservations Clientèle du Jour</div>
        <p class="modal-text">Consultez les rendez-vous pris par les clients pour aujourd'hui.</p>

        <div id="today-reservations-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
          <!-- Rempli en JS -->
        </div>

        <button class="btn btn-cancel" style="width: 100%;" onclick="closeReservationsCheckModal()">Fermer</button>
      </div>
    </div>

    <!-- Écran de Succès (Ticket Caisse Salon) -->
    <div id="success-screen" class="success-screen" style="display: none;">
      <div class="checkmark-circle">✓</div>
      <div class="success-title">Prestation Enregistrée !</div>
      <p class="subtitle" style="margin-bottom: 20px;">Le choix a été transmis à la caisse du salon.</p>

      <div class="panel-card" style="text-align: left; margin-bottom: 25px; border-color: var(--accent-gold);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted);">Ticket N° :</span>
          <span id="ticket-success-code" style="font-weight: 800; color: var(--accent-gold); font-size: 1.2rem;">--</span>
        </div>
        <div style="margin-bottom: 6px;"><strong>Prestation :</strong> <span id="ticket-success-service">--</span></div>
        <div style="margin-bottom: 6px;"><strong>Réalisé par :</strong> <span id="ticket-success-emp">--</span></div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 1.1rem; font-weight: 800; color: var(--accent-gold);">
          Total : <span id="ticket-success-price">-- FCFA</span>
        </div>
      </div>

      <button class="btn btn-confirm" style="width: 100%; padding: 14px; font-weight: 700;" onclick="resetClientOrderScreen()">
        Terminer & Retourner à l'accueil
      </button>
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

fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/index.html', salonTabletHtml, 'utf8');
console.log('Successfully set index.html to Salon Tablet Interface! Length:', salonTabletHtml.length);
