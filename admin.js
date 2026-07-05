/* =========================
   CONFIG (RENDER SAFE)
========================= */
const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   AUTH TOKEN CHECK
========================= */
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "admin-login.html";
}

/* =========================
   SAFE HEADERS
========================= */
function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadPendingProducts();
  loadPendingVendors();
});

/* =========================
   LOAD PENDING PRODUCTS
========================= */
async function loadPendingProducts() {
  const container = document.getElementById("pendingProducts");
  if (!container) return;

  try {
    container.innerHTML = "<p>Loading products...</p>";

    const res = await fetch(`${API}/admin/products/pending`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      container.innerHTML = "<p>Failed to load products</p>";
      return;
    }

    const data = await res.json().catch(() => []);

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No pending products</p>";
      return;
    }

    container.innerHTML = data.map(p => `
      <div class="card">
        <img src="${getImageURL(p.image)}" />
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.location)}</p>
        <h4>${p.price_pi} Pi</h4>

        <button onclick="approveProduct(${p.id})">Approve</button>
        <button onclick="rejectProduct(${p.id})">Reject</button>
      </div>
    `).join("");

  } catch (err) {
    console.error("Products load error:", err);
    container.innerHTML = "<p>Error loading products</p>";
  }
}

/* =========================
   LOAD PENDING VENDORS
========================= */
async function loadPendingVendors() {
  const container = document.getElementById("pendingVendors");
  if (!container) return;

  try {
    container.innerHTML = "<p>Loading vendors...</p>";

    const res = await fetch(`${API}/admin/vendors/pending`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      container.innerHTML = "<p>No vendor endpoint or access denied</p>";
      return;
    }

    const data = await res.json().catch(() => []);

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No pending vendors</p>";
      return;
    }

    container.innerHTML = data.map(v => `
      <div class="card">
        <h3>${escapeHTML(v.name)}</h3>
        <p>${escapeHTML(v.email)}</p>

        <button onclick="approveVendor(${v.id})">Approve</button>
        <button onclick="rejectVendor(${v.id})">Reject</button>
      </div>
    `).join("");

  } catch (err) {
    console.error("Vendor load error:", err);
    container.innerHTML = "<p>Error loading vendors</p>";
  }
}

/* =========================
   PRODUCT ACTIONS
========================= */
async function approveProduct(id) {
  try {
    const res = await fetch(`${API}/admin/products/approve/${id}`, {
      method: "POST",
      headers: getHeaders()
    });

    if (res.ok) loadPendingProducts();
  } catch (err) {
    console.error(err);
  }
}

async function rejectProduct(id) {
  try {
    const res = await fetch(`${API}/admin/products/reject/${id}`, {
      method: "POST",
      headers: getHeaders()
    });

    if (res.ok) loadPendingProducts();
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   VENDOR ACTIONS
========================= */
async function approveVendor(id) {
  try {
    const res = await fetch(`${API}/admin/vendors/approve/${id}`, {
      method: "POST",
      headers: getHeaders()
    });

    if (res.ok) loadPendingVendors();
  } catch (err) {
    console.error(err);
  }
}

async function rejectVendor(id) {
  try {
    const res = await fetch(`${API}/admin/vendors/reject/${id}`, {
      method: "POST",
      headers: getHeaders()
    });

    if (res.ok) loadPendingVendors();
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   IMAGE HANDLER (RENDER SAFE)
========================= */
function getImageURL(path) {
  if (!path) return "placeholder.png";
  if (path.startsWith("http")) return path;

  return "https://charcoal-marketplace-1.onrender.com" + path;
}

/* =========================
   SAFE HTML ESCAPE
========================= */
function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}