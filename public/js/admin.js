// ======================================================
// ADMIN.JS — Tableau de bord Patronne — Yalo Glam's
// ======================================================

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

let currentTab = 'live';
let activeSalonFilter = 'all';
let activeDateFilter = 'today';
let isAudioEnabled = false;
let isInitialLoad = true;

let transactionsUnsubscribe = null;
let expensesUnsubscribe = null;
let presencesUnsubscribe = null;
let reservationsUnsubscribe = null;
let clientsUnsubscribe = null;

// Données en mémoire pour le filtrage local
let allTransactions = [];
let allExpenses = [];
let allPresences = [];
let allReservations = [];
let allClients = [];

let currentTransactions = [];
let currentExpenses = [];
let currentPresences = [];
let currentAdminReservations = [];

const SALONS = {
  salon_1: "Yalo Glam's Shakespeare",
  salon_2: "Yalo Glam's Opep"
};

const ALL_EMPLOYEES = [
  { name: "Marco",     role: "Coiffeur",  salonId: "salon_1" },
  { name: "Mistorine", role: "Coiffeuse", salonId: "salon_1" },
  { name: "Merveille", role: "Coiffeuse", salonId: "salon_1" },
  { name: "Aimeran",   role: "Coiffeur",  salonId: "salon_2" },
  { name: "Clarisse",  role: "Coiffeuse", salonId: "salon_2" }
];

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  generateQRCodes();
  startTransactionsListener();
  startAdminReservationsListener();
  startClientsListener();
  startExpensesListener();
  startPresencesListener();
  loadServicesSettings();
  loadDailyCodes();
  registerSW();
});

// ---- PWA Service Worker ----
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ---- Audio ----
function toggleAudio() {
  const btn = document.getElementById("audio-btn");
  const icon = document.getElementById("audio-icon");
  const text = document.getElementById("audio-text");
  isAudioEnabled = !isAudioEnabled;
  if (isAudioEnabled) {
    btn.classList.remove("off");
    icon.textContent = "🔊";
    text.textContent = "Alertes ON";
    playNotificationSound();
  } else {
    btn.classList.add("off");
    icon.textContent = "🔈";
    text.textContent = "Alertes sonores";
  }
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(); osc.stop(ctx.currentTime + 0.35);
      }, i * 120);
    });
  } catch (e) {}
}

// ---- Onglets ----
function switchTab(tabId) {
  currentTab = tabId;
  const tabs = ['live', 'reservations', 'clients', 'performance', 'expenses', 'presences', 'services', 'qrcodes'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    const content = document.getElementById(`content-${t}`);
    if (btn) btn.classList.toggle("active", t === tabId);
    if (content) content.classList.toggle("active", t === tabId);
  });

  if (tabId === 'clients') {
    if (!clientsUnsubscribe) startClientsListener();
    if (typeof rebuildAndRenderClientsTable === 'function') rebuildAndRenderClientsTable();
  }
}

// ---- QR Codes ----
function generateQRCodes() {
  let base;
  if (window.location.protocol === 'file:') {
    base = `https://salon-coiffure-controle.web.app`;
  } else {
    const p = window.location.pathname;
    base = window.location.origin + p.substring(0, p.lastIndexOf('/'));
  }

  const urls = {
    client: `${base}/index.html`,
    reservation: `${base}/reservation.html`,
    admin: `${base}/admin.html`
  };

  Object.keys(urls).forEach(key => {
    const el = document.getElementById(`url-${key}`);
    const img = document.getElementById(`qr-${key}`);
    if (el) el.textContent = urls[key];
    if (img) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urls[key])}`;
  });
}

// ======================================================
// FILTRAGE PAR SALON + DATE
// ======================================================
function filterDataBySalonAndDate(items) {
  const now = new Date();
  let startLimit = null, endLimit = null;

  if (activeDateFilter === 'today') {
    startLimit = new Date(); startLimit.setHours(0, 0, 0, 0);
  } else if (activeDateFilter === 'yesterday') {
    startLimit = new Date(); startLimit.setDate(now.getDate() - 1); startLimit.setHours(0, 0, 0, 0);
    endLimit = new Date(); endLimit.setDate(now.getDate() - 1); endLimit.setHours(23, 59, 59, 999);
  } else if (activeDateFilter === 'month') {
    startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return items.filter(item => {
    if (activeSalonFilter !== 'all' && item.salonId !== activeSalonFilter) return false;
    if (startLimit && item.timestamp) {
      const d = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
      if (d < startLimit) return false;
      if (endLimit && d > endLimit) return false;
    } else if (startLimit && !item.timestamp) return false;
    return true;
  });
}

function onSalonFilterChange() {
  activeSalonFilter = document.getElementById("salon-filter").value;
  startTransactionsListener();
  startAdminReservationsListener();
  startExpensesListener();
  renderPresences(currentPresences);
}

function onDateFilterChange() {
  activeDateFilter = document.getElementById("date-filter").value;
  startTransactionsListener();
  startAdminReservationsListener();
  startExpensesListener();
}

// ======================================================
// TRANSACTIONS (Ventes en Direct)
// ======================================================
function startTransactionsListener() {
  if (transactionsUnsubscribe) transactionsUnsubscribe();
  isInitialLoad = true;
  const tbody = document.getElementById("transactions-tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">Connexion...</td></tr>`;

  transactionsUnsubscribe = db.collection("transactions")
    .orderBy("timestamp", "desc").limit(500)
    .onSnapshot((snapshot) => {
      let newDetected = false;
      if (!isInitialLoad) {
        snapshot.docChanges().forEach(c => { if (c.type === "added") newDetected = true; });
      }

      allTransactions = [];
      snapshot.forEach(doc => { const d = doc.data(); d.id = doc.id; allTransactions.push(d); });

      currentTransactions = filterDataBySalonAndDate(allTransactions);
      renderTransactions(currentTransactions, snapshot.docChanges(), isInitialLoad);
      renderPerformance(currentTransactions);
      updateKPIs();

      if (newDetected && isAudioEnabled) playNotificationSound();
      isInitialLoad = false;
    }, err => {
      console.error(err);
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">Erreur de connexion.</td></tr>`;
    });
}

function renderTransactions(transactions, changes, initialLoad) {
  const tbody = document.getElementById("transactions-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">Aucune transaction pour cette période.</td></tr>`;
    return;
  }

  const newIds = [];
  if (!initialLoad && changes) changes.forEach(c => { if (c.type === "added") newIds.push(c.doc.id); });

  transactions.forEach(t => {
    const row = document.createElement("tr");
    if (newIds.includes(t.id)) row.className = "new-row";

    let heure = "--:--";
    if (t.timestamp) {
      const d = t.timestamp.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
      heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    const sc = t.salonId === 'salon_1' ? 'badge-salon-1' : 'badge-salon-2';
    row.innerHTML = `
      <td>${heure}</td>
      <td><span class="badge-salon ${sc}">${escapeHtml(SALONS[t.salonId] || t.salonId || '--')}</span></td>
      <td style="font-weight:700;color:var(--accent-gold);">${escapeHtml(t.employeeName || '--')}</td>
      <td>${escapeHtml(t.serviceName)}</td>
      <td style="color:#22c55e;font-weight:800;">${Number(t.price).toLocaleString('fr-FR')} FCFA</td>
      <td><button class="btn-delete" onclick="deleteTransaction('${escapeHtml(t.id)}')" style="padding:5px 10px;font-size:0.8rem;">🗑️</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Recherche dans les transactions
function filterLiveTable() {
  const q = document.getElementById("search-live").value.toLowerCase();
  const filtered = currentTransactions.filter(t =>
    (t.serviceName || '').toLowerCase().includes(q) ||
    (t.employeeName || '').toLowerCase().includes(q) ||
    (SALONS[t.salonId] || '').toLowerCase().includes(q)
  );
  renderTransactions(filtered, [], true);
}

function deleteTransaction(id) {
  if (confirm("Supprimer cette transaction de l'historique ?")) {
    db.collection("transactions").doc(id).delete();
  }
}

function deleteAllTransactions() {
  if (!confirm("⚠️ Êtes-vous sûre de vouloir effacer TOUT l'historique des ventes ? Cette action est irréversible !")) return;
  const batch = db.batch();
  currentTransactions.forEach(t => batch.delete(db.collection("transactions").doc(t.id)));
  batch.commit().then(() => alert("Historique effacé.")).catch(e => alert("Erreur : " + e.message));
}

// ======================================================
// RÉSERVATIONS
// ======================================================
function startAdminReservationsListener() {
  if (reservationsUnsubscribe) reservationsUnsubscribe();

  reservationsUnsubscribe = db.collection("reservations")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allReservations = [];
      snapshot.forEach(doc => { const r = doc.data(); r.id = doc.id; allReservations.push(r); });
      currentAdminReservations = filterDataBySalonAndDate(allReservations);
      renderAdminReservations(currentAdminReservations);
      if (typeof rebuildAndRenderClientsTable === 'function') rebuildAndRenderClientsTable();
    }, err => console.error(err));
}

function renderAdminReservations(list) {
  const tbody = document.getElementById("reservations-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Aucune réservation.</td></tr>`;
    return;
  }

  list.forEach(r => {
    const statusMap = {
      pending:   `<span style="background:rgba(234,179,8,.15);color:#eab308;border:1px solid rgba(234,179,8,.3);padding:3px 8px;border-radius:6px;font-size:0.8rem;font-weight:700;">🟡 En attente</span>`,
      confirmed: `<span style="background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.3);padding:3px 8px;border-radius:6px;font-size:0.8rem;font-weight:700;">🔵 Confirmée</span>`,
      completed: `<span style="background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);padding:3px 8px;border-radius:6px;font-size:0.8rem;font-weight:700;">✅ Encaissée</span>`,
      cancelled: `<span style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);padding:3px 8px;border-radius:6px;font-size:0.8rem;font-weight:700;">🔴 Annulée</span>`
    };
    const sc = r.salonId === 'salon_1' ? 'badge-salon-1' : 'badge-salon-2';
    const waLink = `https://wa.me/${(r.clientPhone||'').replace(/\D/g,'')}?text=${encodeURIComponent(`Bonjour ${r.clientName}, votre RDV ${r.ticketCode||''} — ${r.serviceName} le ${r.date} à ${r.time}.`)}`;

    const canCash = r.status === 'pending' || r.status === 'confirmed';
    const row = document.createElement("tr");
    
    const safeService = (r.serviceName||'').replace(/'/g,"\\'").replace(/"/g,"&quot;");
    const safeEmp = (r.employeeName||'').replace(/'/g,"\\'").replace(/"/g,"&quot;");

    row.innerHTML = `
      <td style="font-weight:800;color:var(--accent-gold);">${escapeHtml(r.ticketCode||'RDV')}</td>
      <td><strong>${escapeHtml(r.clientName)}</strong> ${r.clientQuartier ? `<span style="font-size:0.78rem;color:var(--accent-gold);">(${escapeHtml(r.clientQuartier)})</span>` : ''}<br><span style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(r.clientPhone)}</span></td>
      <td><span class="badge-salon ${sc}">${escapeHtml(SALONS[r.salonId]||r.salonId)}</span></td>
      <td>${escapeHtml(r.serviceName)}<br><span style="color:var(--accent-gold);font-size:0.82rem;">${Number(r.price).toLocaleString('fr-FR')} FCFA</span></td>
      <td>${escapeHtml(r.employeeName||'Premier dispo')}</td>
      <td style="font-size:0.85rem;"><strong>${escapeHtml(r.date)}</strong><br>${escapeHtml(r.time)}</td>
      <td>${statusMap[r.status] || statusMap.pending}</td>
      <td>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <a href="${waLink}" target="_blank" style="background:#25D366;color:white;padding:4px 8px;border-radius:6px;font-size:0.78rem;text-decoration:none;font-weight:700;">WA</a>
          ${canCash ? `<button class="btn btn-confirm" style="padding:4px 8px;font-size:0.78rem;" onclick="convertAdminReservationToSale('${escapeHtml(r.id)}','${safeService}',${r.price},'${safeEmp}','${escapeHtml(r.salonId)}')">✓ Encaisser</button>` : ''}
          <button class="btn-delete" onclick="deleteReservation('${escapeHtml(r.id)}')" style="padding:4px 8px;font-size:0.78rem;">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function filterReservationsTable() {
  const q = document.getElementById("search-reservations").value.toLowerCase();
  const filtered = currentAdminReservations.filter(r =>
    (r.clientName||'').toLowerCase().includes(q) ||
    (r.serviceName||'').toLowerCase().includes(q) ||
    (r.ticketCode||'').toLowerCase().includes(q) ||
    (SALONS[r.salonId]||'').toLowerCase().includes(q)
  );
  renderAdminReservations(filtered);
}

function convertAdminReservationToSale(resId, serviceName, price, employeeName, salonId) {
  const emp = employeeName && !employeeName.toLowerCase().includes("premier") ? employeeName : "Marco";
  db.collection("transactions").add({
    serviceName, price: Number(price), employeeName: emp,
    employeeRole: "Coiffeur(se)", salonId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => db.collection("reservations").doc(resId).update({ status: "completed" }))
    .then(() => alert("Réservation encaissée ! Transaction comptabilisée."))
    .catch(err => console.error(err));
}

function deleteReservation(id) {
  if (confirm("Supprimer cette réservation ?")) {
    db.collection("reservations").doc(id).delete();
  }
}

// ======================================================
// PERFORMANCE DU PERSONNEL
// ======================================================
function isSameEmployee(name1, name2) {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim().replace(/[^a-z]/g, '');
  const n2 = name2.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (n1 === n2) return true;
  if ((n1.includes('aimer') || n1.includes('emer')) && (n2.includes('aimer') || n2.includes('emer'))) return true;
  return n1.includes(n2) || n2.includes(n1);
}

function renderPerformance(transactions) {
  const tbody = document.getElementById("performance-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const targets = ALL_EMPLOYEES.filter(e => activeSalonFilter === 'all' || e.salonId === activeSalonFilter);
  targets.forEach(emp => {
    const empT = transactions.filter(t => isSameEmployee(t.employeeName, emp.name));
    const sc = emp.salonId === 'salon_1' ? 'badge-salon-1' : 'badge-salon-2';
    const total = empT.reduce((s, t) => s + (t.price || 0), 0);
    const row = document.createElement("tr");
    row.setAttribute('data-emp', emp.name.toLowerCase());
    row.innerHTML = `
      <td style="font-weight:700;font-size:1.05rem;">${emp.name}</td>
      <td>${emp.role}</td>
      <td><span class="badge-salon ${sc}">${SALONS[emp.salonId]}</span></td>
      <td style="font-weight:600;">${empT.length} prestation(s)</td>
      <td style="color:#22c55e;font-weight:800;">${total.toLocaleString('fr-FR')} FCFA</td>
    `;
    tbody.appendChild(row);
  });
}

function filterPerformanceTable() {
  const q = document.getElementById("search-performance").value.toLowerCase();
  document.querySelectorAll("#performance-tbody tr").forEach(row => {
    row.style.display = (row.getAttribute('data-emp') || '').includes(q) ? '' : 'none';
  });
}

// ======================================================
// DÉPENSES
// ======================================================
function startExpensesListener() {
  if (expensesUnsubscribe) expensesUnsubscribe();

  expensesUnsubscribe = db.collection("expenses")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allExpenses = [];
      snapshot.forEach(doc => { const e = doc.data(); e.id = doc.id; allExpenses.push(e); });
      currentExpenses = filterDataBySalonAndDate(allExpenses);
      renderExpenses(currentExpenses);
      updateKPIs();
    }, err => console.error(err));
}

function renderExpenses(expenses) {
  const container = document.getElementById("expenses-settings-list");
  if (!container) return;
  container.innerHTML = "";

  if (expenses.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">Aucune dépense enregistrée.</div>`;
    return;
  }

  expenses.forEach(e => {
    let dateStr = "--";
    if (e.timestamp) {
      const d = e.timestamp.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
      dateStr = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    }
    const div = document.createElement("div");
    div.className = "service-settings-item";
    div.setAttribute('data-search', (e.title||'').toLowerCase());
    div.innerHTML = `
      <div class="service-details" style="flex:1;">
        <div style="font-weight:700;color:#ef4444;">${escapeHtml(e.title)}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(SALONS[e.salonId]||e.salonId)} · ${dateStr}</div>
      </div>
      <div style="font-weight:800;color:#ef4444;font-size:1rem;margin-right:12px;">-${Number(e.amount).toLocaleString('fr-FR')} FCFA</div>
      <button class="btn-delete" onclick="deleteExpense('${escapeHtml(e.id)}')">🗑️</button>
    `;
    container.appendChild(div);
  });
}

function filterExpensesList() {
  const q = document.getElementById("search-expenses").value.toLowerCase();
  document.querySelectorAll("#expenses-settings-list .service-settings-item").forEach(el => {
    el.style.display = (el.getAttribute('data-search') || '').includes(q) ? '' : 'none';
  });
}

function addExpense(event) {
  event.preventDefault();
  const title = document.getElementById("expense-title-input").value.trim();
  const amount = Number(document.getElementById("expense-amount-input").value);
  const salonId = document.getElementById("expense-salon-input").value;
  if (!title || isNaN(amount) || amount <= 0) return alert("Saisissez un motif et un montant valide.");

  const btn = event.target.querySelector("button[type='submit']");
  btn.disabled = true;
  db.collection("expenses").add({
    title, amount, salonId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("expense-title-input").value = "";
    document.getElementById("expense-amount-input").value = "";
    alert("Dépense enregistrée !");
  }).catch(err => alert("Erreur : " + err.message))
    .finally(() => btn.disabled = false);
}

function deleteExpense(id) {
  if (confirm("Supprimer cette dépense ?")) {
    db.collection("expenses").doc(id).delete();
  }
}

function deleteAllExpenses() {
  if (!confirm("⚠️ Effacer TOUTES les dépenses de cette période ? Irréversible !")) return;
  const batch = db.batch();
  currentExpenses.forEach(e => batch.delete(db.collection("expenses").doc(e.id)));
  batch.commit().then(() => alert("Dépenses effacées.")).catch(e => alert("Erreur : " + e.message));
}

// ======================================================
// PRÉSENCES
// ======================================================
function startPresencesListener() {
  if (presencesUnsubscribe) presencesUnsubscribe();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  presencesUnsubscribe = db.collection("presences")
    .where("date", "==", today)
    .onSnapshot(snapshot => {
      allPresences = [];
      snapshot.forEach(doc => { const p = doc.data(); p.id = doc.id; allPresences.push(p); });
      currentPresences = allPresences;
      renderPresences(currentPresences);
    }, err => console.error(err));
}

function renderPresences(presences) {
  const tbody = document.getElementById("presences-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const targets = ALL_EMPLOYEES.filter(e => activeSalonFilter === 'all' || e.salonId === activeSalonFilter);
  targets.forEach(emp => {
    const clk = presences.find(p => p.employeeName === emp.name);
    let heure = "--:--";
    let badge = `<span style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);padding:3px 8px;border-radius:6px;font-size:0.82rem;font-weight:700;">🔴 Non pointé</span>`;
    if (clk) {
      if (clk.timestamp) {
        const d = clk.timestamp.toDate ? clk.timestamp.toDate() : new Date(clk.timestamp);
        heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
      }
      badge = `<span style="background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);padding:3px 8px;border-radius:6px;font-size:0.82rem;font-weight:700;">🟢 Présent</span>`;
    }
    const sc = emp.salonId === 'salon_1' ? 'badge-salon-1' : 'badge-salon-2';
    const row = document.createElement("tr");
    row.setAttribute('data-search', emp.name.toLowerCase());
    row.innerHTML = `
      <td style="font-weight:700;">${escapeHtml(emp.name)}</td>
      <td><span class="badge-salon ${sc}">${escapeHtml(SALONS[emp.salonId])}</span></td>
      <td style="font-weight:600;">${heure}</td>
      <td>${badge}</td>
    `;
    tbody.appendChild(row);
  });
}

function filterPresencesTable() {
  const q = document.getElementById("search-presences").value.toLowerCase();
  document.querySelectorAll("#presences-tbody tr").forEach(row => {
    row.style.display = (row.getAttribute('data-search') || '').includes(q) ? '' : 'none';
  });
}

// ======================================================
// CODES SECRETS DU JOUR
// ======================================================
function loadDailyCodes() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const el = document.getElementById("presence-today-date");
  if (el) el.textContent = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  db.collection("presence_codes").doc(today).onSnapshot(doc => {
    if (!doc.exists || !doc.data().codes) generateOrRegenerateDailyCodes();
    else renderDailyCodes(doc.data().codes);
  });
}

function generateOrRegenerateDailyCodes() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const codes = {};
  ALL_EMPLOYEES.forEach(e => { codes[e.name] = Math.floor(1000 + Math.random() * 9000).toString(); });
  db.collection("presence_codes").doc(today).set({ codes, date: today, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
}

function renderDailyCodes(codes) {
  const c = document.getElementById("daily-codes-container");
  if (!c) return;
  c.innerHTML = "";
  ALL_EMPLOYEES.forEach(emp => {
    const code = codes[emp.name] || "----";
    const sc = emp.salonId === 'salon_1' ? 'badge-salon-1' : 'badge-salon-2';
    const div = document.createElement("div");
    div.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;margin-bottom:8px;";
    div.innerHTML = `
      <div>
        <div style="font-weight:700;">${escapeHtml(emp.name)} <span style="font-size:0.78rem;color:var(--text-muted);">(${escapeHtml(emp.role)})</span></div>
        <span class="badge-salon ${sc}" style="font-size:0.72rem;">${escapeHtml(SALONS[emp.salonId])}</span>
      </div>
      <div style="font-family:monospace;font-size:1.5rem;font-weight:800;color:var(--accent-gold);letter-spacing:4px;background:rgba(223,183,108,.08);padding:4px 10px;border-radius:6px;">${escapeHtml(code)}</div>
    `;
    c.appendChild(div);
  });
}

// ======================================================
// SERVICES / TARIFS
// ======================================================
let servicesUnsubscribe = null;
let allServiceItems = [];

function loadServicesSettings() {
  if (servicesUnsubscribe) return;
  const list = document.getElementById("services-settings-list");
  if (list && allServiceItems.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">Chargement...</div>`;
  }

  servicesUnsubscribe = db.collection("services")
    .onSnapshot(snapshot => {
      allServiceItems = [];
      snapshot.forEach(doc => { const s = doc.data(); s.id = doc.id; allServiceItems.push(s); });
      renderServicesList();
    }, err => {
      console.error("Erreur chargement services:", err);
      if (list) list.innerHTML = `<div style="padding:20px;text-align:center;color:#ef4444;">Erreur de chargement.</div>`;
    });
}

function renderServicesList() {
  const list = document.getElementById("services-settings-list");
  if (!list) return;

  const salonId = (document.getElementById("services-salon-select") || {}).value || 'salon_1';
  const filtered = allServiceItems.filter(s => s.salonId === salonId);

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">Aucune prestation enregistrée pour ce salon.</div>`;
    return;
  }

  const typeNames = {
    coiffure_homme: "👨 Homme",
    soin: "🧴 Soin",
    coiffure_femme: "💇‍♀️ Femme",
    pack_femme: "🎁 Pack Dame",
    pack_homme: "🎁 Pack Homme"
  };

  filtered.forEach(s => {
    const div = document.createElement("div");
    div.className = "service-settings-item";
    div.setAttribute('data-search', (s.name || '').toLowerCase());
    div.innerHTML = `
      <div class="service-details" style="flex:1;padding-right:10px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="service-settings-name">${escapeHtml(s.name)}</span>
          ${s.type ? `<span style="font-size:0.72rem;background:rgba(255,255,255,.05);padding:2px 6px;border-radius:4px;color:var(--accent-gold);">${escapeHtml(typeNames[s.type]||s.type)}</span>` : ''}
        </div>
        <div class="service-settings-price">${Number(s.price).toLocaleString('fr-FR')} FCFA</div>
        ${s.description ? `<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;">${escapeHtml(s.description)}</div>` : ''}
      </div>
      <button class="btn-delete" onclick="deleteService('${escapeHtml(s.id)}')">🗑️ Supprimer</button>
    `;
    list.appendChild(div);
  });
}

function filterServicesList() {
  const q = document.getElementById("search-services").value.toLowerCase();
  document.querySelectorAll("#services-settings-list .service-settings-item").forEach(el => {
    el.style.display = (el.getAttribute('data-search') || '').includes(q) ? '' : 'none';
  });
}

function addService(event) {
  event.preventDefault();
  const name = document.getElementById("service-name-input").value.trim();
  const price = Number(document.getElementById("service-price-input").value);
  const type = document.getElementById("service-type-input").value;
  const description = document.getElementById("service-desc-input").value.trim();
  const salonId = document.getElementById("service-salon-input").value;
  if (!name || isNaN(price)) return;

  const btn = event.target.querySelector("button[type='submit']");
  btn.disabled = true; btn.textContent = "Enregistrement...";

  if (salonId === "both") {
    // Ajouter simultanément aux 2 salons
    const batch = db.batch();
    const doc1 = db.collection("services").doc();
    const doc2 = db.collection("services").doc();
    batch.set(doc1, { name, price, type, description, salonId: "salon_1" });
    batch.set(doc2, { name, price, type, description, salonId: "salon_2" });

    batch.commit()
      .then(() => {
        document.getElementById("service-name-input").value = "";
        document.getElementById("service-price-input").value = "";
        document.getElementById("service-desc-input").value = "";
        alert("Prestation ajoutée aux DEUX salons !");
        renderServicesList();
      })
      .catch(err => alert("Erreur : " + err.message))
      .finally(() => { btn.disabled = false; btn.textContent = "Enregistrer la prestation"; });
  } else {
    db.collection("services").add({ name, price, type, description, salonId })
      .then(() => {
        document.getElementById("service-name-input").value = "";
        document.getElementById("service-price-input").value = "";
        document.getElementById("service-desc-input").value = "";
        alert("Prestation ajoutée !");
        document.getElementById("services-salon-select").value = salonId;
        renderServicesList();
      })
      .catch(err => alert("Erreur : " + err.message))
      .finally(() => { btn.disabled = false; btn.textContent = "Enregistrer la prestation"; });
  }
}

function deleteService(id) {
  if (confirm("Supprimer cette prestation ? Elle disparaîtra de l'interface clients.")) {
    db.collection("services").doc(id).delete();
  }
}

// ======================================================
// KPIs
// ======================================================
function updateKPIs() {
  const revenue = currentTransactions.reduce((s, t) => s + (t.price || 0), 0);
  const expenses = currentExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = revenue - expenses;
  const clients = currentTransactions.length;
  const avg = clients > 0 ? Math.round(revenue / clients) : 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
  set("stat-revenue", `${revenue.toLocaleString('fr-FR')}<span>FCFA</span>`);
  set("stat-expenses", `${expenses.toLocaleString('fr-FR')}<span>FCFA</span>`);
  const profEl = document.getElementById("stat-profit");
  if (profEl) {
    profEl.style.color = profit >= 0 ? 'var(--accent-gold)' : '#ef4444';
    profEl.innerHTML = `${profit.toLocaleString('fr-FR')}<span>FCFA</span>`;
  }
  set("stat-clients", clients);
  set("stat-average", `${avg.toLocaleString('fr-FR')}<span>FCFA</span>`);
}

// ======================================================
// CLIENTÈLE & SUIVI FIDÉLITÉ
// ======================================================
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

let rawClientsMap = {};

function startClientsListener() {
  if (clientsUnsubscribe) clientsUnsubscribe();

  clientsUnsubscribe = db.collection("clients")
    .onSnapshot((querySnapshot) => {
      rawClientsMap = {};
      querySnapshot.forEach((doc) => {
        const client = doc.data();
        const p = (client.phone || doc.id || '').replace(/\D/g, '');
        if (p) {
          client.id = doc.id;
          client.phone = p;
          rawClientsMap[p] = client;
        }
      });
      rebuildAndRenderClientsTable();
    }, (error) => {
      console.error("Erreur lecture clientèle :", error);
      rebuildAndRenderClientsTable();
    });
}

function rebuildAndRenderClientsTable() {
  const clientMap = {};

  // 1. Profils de la collection clients
  Object.keys(rawClientsMap).forEach(p => {
    const c = rawClientsMap[p];
    clientMap[p] = {
      id: c.id || p,
      name: c.name || ('Client ' + p),
      quartier: c.quartier || '',
      phone: p,
      coiffuresCount: Number(c.coiffuresCount || 0),
      pedicuresCount: Number(c.pedicuresCount || 0),
      soinsVisageCount: Number(c.soinsVisageCount || 0),
      coiffuresResetAt: c.coiffuresResetAt || null,
      pedicuresResetAt: c.pedicuresResetAt || null,
      soinsVisageResetAt: c.soinsVisageResetAt || null
    };
  });

  // 2. Traitement des réservations (filtrées par date de remise à 0)
  const resList = (typeof allReservations !== 'undefined' && allReservations.length > 0) ? allReservations : [];
  const resCounts = {};

  resList.forEach(r => {
    const p = (r.clientPhone || r.phone || '').toString().replace(/\D/g, '');
    if (p) {
      if (!resCounts[p]) {
        resCounts[p] = {
          coiffures: 0, pedicures: 0, visage: 0,
          name: r.clientName || ('Client ' + p),
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

  // 3. Fusionner les réservations
  Object.keys(resCounts).forEach(p => {
    const info = resCounts[p];
    if (!clientMap[p]) {
      clientMap[p] = {
        id: p,
        name: info.name,
        quartier: info.quartier,
        phone: p,
        coiffuresCount: info.coiffures,
        pedicuresCount: info.pedicures,
        soinsVisageCount: info.visage
      };
    } else {
      clientMap[p].coiffuresCount = Math.max(clientMap[p].coiffuresCount || 0, info.coiffures);
      clientMap[p].pedicuresCount = Math.max(clientMap[p].pedicuresCount || 0, info.pedicures);
      clientMap[p].soinsVisageCount = Math.max(clientMap[p].soinsVisageCount || 0, info.visage);
      if (!clientMap[p].name || clientMap[p].name.startsWith('Client ')) clientMap[p].name = info.name;
      if (!clientMap[p].quartier) clientMap[p].quartier = info.quartier;
    }
  });

  allClients = Object.values(clientMap);

  const statClientsEl = document.getElementById("stat-clients");
  if (statClientsEl) {
    statClientsEl.textContent = allClients.length;
  }

  renderClientsTable();
}

function renderClientsTable() {
  const tbody = document.getElementById("clients-tbody");
  if (!tbody) return;

  const searchVal = (document.getElementById("search-clients")?.value || "").trim().toLowerCase();

  let filtered = allClients.filter(c => {
    if (!searchVal) return true;
    const nameLower = (c.name || "").toLowerCase();
    const quartierLower = (c.quartier || "").toLowerCase();
    const phoneLower = (c.phone || "").toLowerCase();
    return nameLower.includes(searchVal) || quartierLower.includes(searchVal) || phoneLower.includes(searchVal);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">Aucun client trouvé.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    let coiffures = c.coiffuresCount || 0;
    let pedicures = c.pedicuresCount || 0;
    let soinsVisage = c.soinsVisageCount || 0;

    // Plafonnement
    if (coiffures > 10) coiffures = 10;
    if (pedicures > 5) pedicures = 5;
    if (soinsVisage > 5) soinsVisage = 5;

    let rewardBadge = `<span style="color:var(--text-muted); font-size:0.82rem;">En cours</span>`;
    let actionBtn = `<span style="color:var(--text-muted); font-size:0.82rem;">--</span>`;

    if (coiffures >= 10) {
      rewardBadge = `<span style="background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.4); padding:4px 8px; border-radius:8px; font-weight:700; font-size:0.8rem;">🎁 COIFFURE GRATUITE DÉBLOQUÉE</span>`;
      actionBtn = `<button class="btn btn-confirm" style="padding:6px 12px; font-size:0.8rem; background:#eab308; color:#1a030f; font-weight:800;" onclick="validateReward('${escapeHtml(c.id)}', 'coiffures')">✅ Validation Terminée (Remise à 0)</button>`;
    } else if (pedicures >= 5) {
      rewardBadge = `<span style="background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.4); padding:4px 8px; border-radius:8px; font-weight:700; font-size:0.8rem;">🎁 PÉDICURE GRATUITE DÉBLOQUÉE</span>`;
      actionBtn = `<button class="btn btn-confirm" style="padding:6px 12px; font-size:0.8rem; background:#eab308; color:#1a030f; font-weight:800;" onclick="validateReward('${escapeHtml(c.id)}', 'pedicures')">✅ Validation Terminée (Remise à 0)</button>`;
    } else if (soinsVisage >= 5) {
      rewardBadge = `<span style="background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.4); padding:4px 8px; border-radius:8px; font-weight:700; font-size:0.8rem;">🎁 SOIN VISAGE GRATUIT DÉBLOQUÉ</span>`;
      actionBtn = `<button class="btn btn-confirm" style="padding:6px 12px; font-size:0.8rem; background:#eab308; color:#1a030f; font-weight:800;" onclick="validateReward('${escapeHtml(c.id)}', 'soinsVisage')">✅ Validation Terminée (Remise à 0)</button>`;
    }

    return `
      <tr>
        <td style="font-weight:700; color:white;">${escapeHtml(c.name || 'Client anonyme')}</td>
        <td style="color:var(--accent-gold); font-size:0.88rem;">${escapeHtml(c.quartier || 'Non précisé')}</td>
        <td>
          <a href="https://wa.me/237${escapeHtml(c.phone || '')}" target="_blank" style="color:#4ade80; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
            📱 ${escapeHtml(c.phone || 'N/A')}
          </a>
        </td>
        <td><strong style="color:${coiffures >= 10 ? '#facc15' : 'white'};">${coiffures}</strong> / 10</td>
        <td><strong style="color:${pedicures >= 5 ? '#facc15' : 'white'};">${pedicures}</strong> / 5</td>
        <td><strong style="color:${soinsVisage >= 5 ? '#facc15' : 'white'};">${soinsVisage}</strong> / 5</td>
        <td>${rewardBadge}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

function filterClientsTable() {
  renderClientsTable();
}

function validateReward(clientId, rewardType) {
  if (!confirm("Confirmer que le client a bénéficié de sa prestation gratuite en salon ? (Le compteur spécifique sera remis à 0)")) return;

  const nowIso = new Date().toISOString();
  const updateData = {
    lastRewardValidatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (rewardType === 'coiffures') {
    updateData.coiffuresCount = 0;
    updateData.coiffuresResetAt = nowIso;
  } else if (rewardType === 'pedicures') {
    updateData.pedicuresCount = 0;
    updateData.pedicuresResetAt = nowIso;
  } else if (rewardType === 'soinsVisage') {
    updateData.soinsVisageCount = 0;
    updateData.soinsVisageResetAt = nowIso;
  }

  const targetClient = allClients.find(c => String(c.id) === String(clientId) || String(c.phone) === String(clientId));
  const docId = (targetClient && targetClient.phone) ? String(targetClient.phone) : String(clientId);

  if (targetClient) {
    if (rewardType === 'coiffures') { targetClient.coiffuresCount = 0; targetClient.coiffuresResetAt = nowIso; }
    if (rewardType === 'pedicures') { targetClient.pedicuresCount = 0; targetClient.pedicuresResetAt = nowIso; }
    if (rewardType === 'soinsVisage') { targetClient.soinsVisageCount = 0; targetClient.soinsVisageResetAt = nowIso; }
    if (targetClient.phone) updateData.phone = targetClient.phone;
    if (targetClient.name) updateData.name = targetClient.name;
    if (targetClient.quartier) updateData.quartier = targetClient.quartier;
  }

  db.collection("clients").doc(docId).set(updateData, { merge: true })
    .then(() => {
      alert("✅ Prestation gratuite validée avec succès ! Le compteur du client a été remis à 0.");
      rebuildAndRenderClientsTable();
    })
    .catch((err) => {
      console.error("Erreur validation prestation gratuite admin:", err);
      const safeId = (targetClient && targetClient.phone) ? targetClient.phone.replace(/\D/g, '') : String(docId).replace(/\D/g, '');
      if (safeId) {
        db.collection("clients").doc(safeId).set(updateData, { merge: true })
          .then(() => {
            alert("✅ Prestation gratuite validée avec succès ! Le compteur du client a été remis à 0.");
            rebuildAndRenderClientsTable();
          })
          .catch(e => {
            console.error("Erreur fallback admin:", e);
            alert("Erreur lors de la validation : " + e.message);
          });
      } else {
        alert("Erreur lors de la validation : " + err.message);
      }
    });
}

