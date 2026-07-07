const API = "https://charcoal-marketplace-1.onrender.com/api";

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupSearch();
  updateCartUI();
});

/* =========================
   LOAD PRODUCTS
========================= */
async function loadProducts() {
  const container = document.getElementById("products");

  try {
    container.innerHTML = "<p>Loading products...</p>";

    const res = await fetch(`${API}/products`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      container.innerHTML = "<p>No products found</p>";
      return;
    }

    allProducts = data;
    renderProducts(data);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load products</p>";
  }
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products) {
  const container = document.getElementById("products");

  container.innerHTML = products.map(p => `
    <div class="card">
      <img src="${getImageURL(p.image)}" />
      <h3>${escapeHTML(p.name)}</h3>
      <p>${escapeHTML(p.location || "")}</p>
      <h4>${p.price_pi} Pi</h4>

      <button onclick="addToCart(${p.id}, '${escapeHTML(p.name)}', ${p.price_pi})">
        Add to Cart
      </button>
    </div>
  `).join("");
}

/* =========================
   CART SYSTEM
========================= */
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   CART UI
========================= */
function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  document.getElementById("cartCount").innerText = count;
  document.getElementById("cartTotal").innerText = total.toFixed(2) + " Pi";

  const container = document.getElementById("cartItems");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>Cart is empty</p>";
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <b>${item.name}</b>
        <p>${item.price} Pi x ${item.qty}</p>
      </div>

      <button onclick="removeFromCart(${item.id})">X</button>
    </div>
  `).join("");
}

/* =========================
   CART MODAL
========================= */
function openCart() {
  document.getElementById("cartModal").style.display = "flex";
  updateCartUI();
}

function closeCart() {
  document.getElementById("cartModal").style.display = "none";
}

/* =========================
   SEARCH
========================= */
function setupSearch() {
  const input = document.getElementById("searchInput");

  if (!input) return;

  input.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(value) ||
      (p.location || "").toLowerCase().includes(value)
    );

    renderProducts(filtered);
  });
}

/* =========================
   CHECKOUT (PI PAYMENT)
========================= */
function goToCheckout() {
  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  if (!window.Pi) {
    alert("Pi Browser not available");
    return;
  }

  try {
    Pi.init({ version: "2.0" });
  } catch (e) {}

  Pi.authenticate(["payments"], function(auth) {

    Pi.createPayment({
      amount: totalAmount,
      memo: "Charcoal Marketplace Order",
      metadata: { cart }
    }, {

      onReadyForServerApproval: async function(paymentId) {
        await fetch(`${API}/payments/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId })
        });
      },

      onReadyForServerCompletion: async function(paymentId, txid) {
        const res = await fetch(`${API}/payments/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txid })
        });

        const data = await res.json();

        if (data.success) {
          alert("Payment successful ✔");

          cart = [];
          saveCart();
          updateCartUI();
          closeCart();

        } else {
          alert("Payment failed");
        }
      }

    });

  }, function(err) {
    console.error(err);
    alert("Payment cancelled or failed");
  });
}

async function loginWithPi() {
  const msg = getEl("msg");
  const btn = getEl("piLoginBtn");

  if (!msg || !btn) return;

  if (!window.Pi) {
    msg.innerText = "Open in Pi Browser";
    msg.style.color = "red";
    return;
  }

  btn.disabled = true;
  msg.innerText = "Connecting to Pi...";

  try {
    // INIT ONCE SAFELY
    if (typeof Pi.init === "function") {
      Pi.init({ version: "2.0" });
    }

    // ✅ USE PROMISE STYLE (FIXES HANGING)
    const scopes = ["username", "payments"];

    const auth = await Pi.authenticate(scopes);

    if (!auth || !auth.accessToken || !auth.user) {
      msg.innerText = "Pi authentication failed";
      btn.disabled = false;
      return;
    }

    msg.innerText = "Verifying account...";

    const res = await fetch(`${API}/auth/pi-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: auth.accessToken,
        uid: auth.user.uid,
        username: auth.user.username
      })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      msg.innerText = data.message || "Login failed";
      btn.disabled = false;
      return;
    }

    // ROLE CHECK
    if (data.user?.role !== "vendor") {
      msg.innerText = "Not allowed (vendor only)";
      btn.disabled = false;
      return;
    }

    localStorage.setItem("token", data.token);

    msg.innerText = "Login successful ✔";

    setTimeout(() => {
      window.location.href = "vendor-dashboard.html";
    }, 800);

  } catch (err) {
    console.error("Pi login error:", err);
    msg.innerText = "Pi login failed. Try again.";
  } finally {
    btn.disabled = false;
  }
}
/* ==
=======================
   HELPERS
========================= */
function getImageURL(path) {
  if (!path) return "placeholder.png";
  if (path.startsWith("http")) return path;
  return "https://charcoal-marketplace-1.onrender.com" + path;
}

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}