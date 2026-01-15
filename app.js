/*******************
 * Simple SPA Router
 *******************/
const routes = {
  "#home": "page-home",
  "#order": "page-order",
  "#success": "page-success",
  "#check": "page-check",
  "#owner-login": "page-owner-login",
  "#owner-dash": "page-owner-dash",
};

function showPage(hash) {
  const h = routes[hash] ? hash : "#home";
  Object.values(routes).forEach((id) => document.getElementById(id).classList.remove("active"));
  document.getElementById(routes[h]).classList.add("active");

  if (h === "#owner-dash") renderDashboard();
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (!nav) return;
  window.location.hash = nav.getAttribute("data-nav");
});

window.addEventListener("hashchange", () => showPage(window.location.hash));
if (!window.location.hash) window.location.hash = "#home";
showPage(window.location.hash);

document.getElementById("year").textContent = new Date().getFullYear();

/*******************
 * Cursor ice cream
 *******************/
const cursorIce = document.getElementById("cursorIce");
const pos = { x: 0, y: 0 };
const target = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  target.x = e.clientX + 10;
  target.y = e.clientY + 10;
  cursorIce.style.opacity = "1";
});
window.addEventListener("mouseleave", () => cursorIce.style.opacity = "0");

function tick() {
  pos.x += (target.x - pos.x) * 0.18;
  pos.y += (target.y - pos.y) * 0.18;
  cursorIce.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/*******************
 * Toast
 *******************/
const toastEl = document.getElementById("toast");
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/*******************
 * Audio (MP3 local)
 *******************/
const vibesAudio = document.getElementById("vibesAudio");

async function playVibes() {
  try {
    vibesAudio.volume = 0.85;
    await vibesAudio.play(); // will work after user gesture
  } catch {
    // autoplay might be blocked if no gesture
  }
}

/*******************
 * Overlay controls
 *******************/
const overlay = document.getElementById("audioOverlay");
const btnStartAudio = document.getElementById("btnStartAudio");
const btnNoAudio = document.getElementById("btnNoAudio");

function closeOverlay() {
  overlay.classList.add("hidden");
}

// Optional: overlay only once per browser
const SEEN_KEY = "alief_audio_overlay_seen_v1";
if (localStorage.getItem(SEEN_KEY) === "1") {
  overlay.classList.add("hidden");
} else {
  localStorage.setItem(SEEN_KEY, "1");
}

btnStartAudio.addEventListener("click", async () => {
  closeOverlay();
  toast("Vibes ON 🔊");
  await playVibes();
});

btnNoAudio.addEventListener("click", () => {
  closeOverlay();
  toast("Oke, lanjut tanpa suara.");
});

// Bonus: kalau user klik mana saja setelah overlay hilang, coba play lagi (buat jaga-jaga)
document.addEventListener("click", () => {
  if (overlay.classList.contains("hidden") && vibesAudio.paused) {
    playVibes();
  }
}, { once: true });

/*******************
 * Data (flavors)
 *******************/
const FLAVORS = [
  { key: "Vanilla", emoji: "🍦", note: "Klasik lembut, bikin tenang." },
  { key: "Cokelat", emoji: "🍫", note: "Rich & legit, paling laris." },
  { key: "Strawberry", emoji: "🍓", note: "Segar manis, wangi buah." },
  { key: "Matcha", emoji: "🍵", note: "Aromatik, creamy, classy." },
  { key: "Cookies", emoji: "🍪", note: "Crunchy bits, nagih." },
];

function moneyIDR(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function calcPrice(size, container, qty) {
  const base = size === "Small" ? 12000 : size === "Medium" ? 17000 : 22000;
  const add = container === "Cone" ? 2000 : 1000;
  const q = Math.max(1, Number(qty) || 1);
  return (base + add) * q;
}

function makeOrderId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALIEF-${y}${m}${day}-${rand}`;
}

/*******************
 * localStorage store
 *******************/
const ORDERS_KEY = "alief_eskrim_orders_v1";
const OWNER_KEY = "alief_owner_authed_v1";

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function getOrders() {
  return safeParse(localStorage.getItem(ORDERS_KEY), []);
}
function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}
function findOrder(id) {
  const needle = (id || "").trim().toLowerCase();
  return getOrders().find(o => (o.id || "").toLowerCase() === needle);
}
function updateOrderStatus(id, status) {
  const orders = getOrders();
  const needle = (id || "").trim().toLowerCase();
  const idx = orders.findIndex(o => (o.id || "").toLowerCase() === needle);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], status };
    saveOrders(orders);
  }
}
function isOwnerAuthed() { return localStorage.getItem(OWNER_KEY) === "1"; }
function setOwnerAuthed(v) { localStorage.setItem(OWNER_KEY, v ? "1" : "0"); }

/*******************
 * Landing flavor cards
 *******************/
const flavorCards = document.getElementById("flavorCards");
function renderFlavorCards() {
  flavorCards.innerHTML = "";
  FLAVORS.forEach((f) => {
    const div = document.createElement("div");
    div.className = "flavorCard";
    div.innerHTML = `
      <div class="flavorEmoji">${f.emoji}</div>
      <div class="flavorName">${f.key}</div>
      <div class="flavorNote">${f.note}</div>
    `;
    div.addEventListener("click", () => {
      document.getElementById("flavor").value = f.key;
      refreshSummary();
      window.location.hash = "#order";
      toast(`Rasa dipilih: ${f.key}`);
    });
    flavorCards.appendChild(div);
  });
}
renderFlavorCards();

/*******************
 * Order form
 *******************/
const elFlavor = document.getElementById("flavor");
const elContainer = document.getElementById("container");
const elSize = document.getElementById("size");
const elQty = document.getElementById("qty");
const elBuyerName = document.getElementById("buyerName");
const elPriceTop = document.getElementById("priceTop");
const elPriceBig = document.getElementById("priceBig");
const elSummaryLine = document.getElementById("summaryLine");

// fill flavor select
(function initFlavorSelect() {
  elFlavor.innerHTML = FLAVORS.map(f => `<option value="${f.key}">${f.emoji} ${f.key}</option>`).join("");
  elFlavor.value = "Vanilla";
})();

function refreshSummary() {
  const flavor = elFlavor.value;
  const container = elContainer.value;
  const size = elSize.value;
  const qty = elQty.value;
  const price = calcPrice(size, container, qty);
  elPriceTop.textContent = moneyIDR(price);
  elPriceBig.textContent = moneyIDR(price);
  elSummaryLine.textContent = `${flavor} • ${container} • ${size} • Qty ${Math.max(1, Number(qty) || 1)}`;
}

[elFlavor, elContainer, elSize, elQty].forEach(el => el.addEventListener("input", refreshSummary));
refreshSummary();

document.getElementById("btnOrder").addEventListener("click", () => {
  const flavor = elFlavor.value;
  const container = elContainer.value;
  const size = elSize.value;
  const qty = Math.max(1, Number(elQty.value) || 1);
  const buyerName = (elBuyerName.value || "").trim();

  const id = makeOrderId();
  addOrder({
    id,
    createdAtISO: new Date().toISOString(),
    flavor,
    container,
    size,
    qty,
    payment: "Cash",
    status: "NEW",
    buyerName: buyerName || undefined
  });

  document.getElementById("successOrderId").textContent = id;
  document.getElementById("checkId").value = id;

  toast("Order dibuat! Simpan Order ID kamu ya.");
  window.location.hash = "#success";
});

document.getElementById("goCheckFromSuccess").addEventListener("click", () => {
  const id = document.getElementById("successOrderId").textContent || "";
  document.getElementById("checkId").value = id;
});

document.getElementById("btnCopyId").addEventListener("click", async () => {
  const id = document.getElementById("successOrderId").textContent || "";
  try {
    await navigator.clipboard.writeText(id);
    toast("Order ID berhasil di-copy ✅");
  } catch {
    toast("Gagal copy. Kamu bisa salin manual ya.");
  }
});

/*******************
 * Check order
 *******************/
const checkId = document.getElementById("checkId");
const checkMsg = document.getElementById("checkMsg");
const checkResult = document.getElementById("checkResult");

function renderOrderResult(order) {
  if (!order) {
    checkMsg.textContent = "Order tidak ditemukan di perangkat ini.";
    checkResult.innerHTML = `
      Order tidak ditemukan.<div class="hr"></div>
      <div class="tiny">
        Tanpa database, cek order cuma bisa untuk order yang pernah dibuat di browser/perangkat ini.
      </div>`;
    return;
  }
  checkMsg.textContent = "";
  const statusText = order.status === "NEW" ? "Menunggu konfirmasi owner" : "Sudah dikonfirmasi ✅";

  checkResult.innerHTML = `
    <div style="color:var(--text); line-height:1.65;">
      <div><b>ID:</b> ${order.id}</div>
      <div><b>Status:</b> ${statusText}</div>
      <div><b>Rasa:</b> ${order.flavor}</div>
      <div><b>Wadah:</b> ${order.container}</div>
      <div><b>Ukuran:</b> ${order.size}</div>
      <div><b>Qty:</b> ${order.qty}</div>
      <div><b>Bayar:</b> ${order.payment}</div>
      ${order.buyerName ? `<div><b>Nama:</b> ${order.buyerName}</div>` : ""}
      <div class="hr"></div>
      <div class="tiny"><b>Silahkan datang ke Alief</b> untuk ambil pesanan kamu 😄</div>
    </div>`;
}

document.getElementById("btnCheck").addEventListener("click", () => {
  const id = (checkId.value || "").trim();
  if (!id) return toast("Masukkan Order ID dulu.");
  renderOrderResult(findOrder(id));
});

/*******************
 * Owner auth + dashboard
 *******************/
const OWNER_PASSWORD = "owner123"; // ganti ini kalau mau

document.getElementById("btnOwnerLogin").addEventListener("click", () => {
  const pass = document.getElementById("ownerPass").value || "";
  const ownerErr = document.getElementById("ownerErr");

  if (pass === OWNER_PASSWORD) {
    setOwnerAuthed(true);
    ownerErr.textContent = "";
    toast("Login owner berhasil.");
    window.location.hash = "#owner-dash";
  } else {
    ownerErr.textContent = "Password salah.";
  }
});

document.getElementById("btnOwnerGoDash").addEventListener("click", () => {
  if (!isOwnerAuthed()) return toast("Kamu belum login owner.");
  window.location.hash = "#owner-dash";
});

document.getElementById("btnLogout").addEventListener("click", () => {
  setOwnerAuthed(false);
  toast("Logout berhasil.");
  window.location.hash = "#owner-login";
});

document.getElementById("btnRefresh").addEventListener("click", () => {
  renderDashboard();
  toast("Dashboard di-refresh.");
});

let dashFilter = "ALL";
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    dashFilter = btn.getAttribute("data-filter");
    renderDashboard();
  });
});

function renderDashboard() {
  if (window.location.hash !== "#owner-dash") return;

  if (!isOwnerAuthed()) {
    toast("Silakan login owner dulu.");
    window.location.hash = "#owner-login";
    return;
  }

  const orders = getOrders();
  const filtered = orders.filter(o => dashFilter === "ALL" ? true : o.status === dashFilter);

  const dashEmpty = document.getElementById("dashEmpty");
  const dashTable = document.getElementById("dashTable");
  const dashBody = document.getElementById("dashBody");

  dashBody.innerHTML = "";

  if (!filtered.length) {
    dashEmpty.style.display = "block";
    dashTable.style.display = "none";
    return;
  }

  dashEmpty.style.display = "none";
  dashTable.style.display = "table";

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    tr.className = "tr";

    const created = new Date(o.createdAtISO).toLocaleString("id-ID");
    const statusTag = (o.status === "NEW")
      ? `<span class="tag">NEW</span>`
      : `<span class="tag">CONFIRMED ✅</span>`;

    const buyer = o.buyerName ? `<div class="tiny">Nama: ${o.buyerName}</div>` : "";

    tr.innerHTML = `
      <td>
        <div style="font-weight:900;">${o.id}</div>
        <div class="tiny">${created}</div>
        ${buyer}
      </td>
      <td>
        <span class="tag">${o.flavor}</span>
        <span class="tag">${o.container}</span>
        <span class="tag">${o.size}</span>
        <span class="tag">Qty ${o.qty}</span>
        <span class="tag">Cash</span>
      </td>
      <td>${statusTag}</td>
      <td>
        ${o.status === "NEW"
          ? `<button class="pill" data-confirm="${o.id}">Konfirmasi</button>`
          : `<span class="tiny">—</span>`}
      </td>
    `;
    dashBody.appendChild(tr);
  });

  dashBody.querySelectorAll("[data-confirm]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-confirm");
      updateOrderStatus(id, "CONFIRMED");
      toast("Order dikonfirmasi ✅");
      renderDashboard();
    });
  });
}
