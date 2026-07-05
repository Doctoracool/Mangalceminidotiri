/* =========================
   CONFIG 
========================= */
const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   CART SYSTEM
========================= */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   RENDER CHECKOUT
========================= */
function renderCheckout() {
  const container = document.getElementById("checkoutItems");
  const cart = getCart();

  if (!container) return;

  if (!cart.length) {
    container.innerHTML = "<p>Your cart is empty</p>";
    document.getElementById("totalAmount").innerText = "0 Pi";
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="item">
      <div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${item.price_pi} Pi x ${item.qty}</p>
      </div>

      <button onclick="removeItem(${index})">Remove</button>
    </div>
  `).join("");

  updateTotal();
}

/* =========================
   TOTAL CALCULATION
========================= */
function updateTotal() {
  const cart = getCart();

  const total = cart.reduce(
    (sum, item) => sum + (Number(item.price_pi) * Number(item.qty)),
    0
  );

  const totalEl = document.getElementById("totalAmount");
  if (totalEl) totalEl.innerText = total.toFixed(2) + " Pi";
}

/* =========================
   CHECKOUT PAYMENT (FIXED PI FLOW)
========================= */
function checkout() {
  const cart = getCart();
  const btn = document.getElementById("payBtn") || document.querySelector("button");

  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Processing...";
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + (Number(item.price_pi) * Number(item.qty)),
    0
  );

  if (!window.Pi) {
    alert("Pi SDK not available (use Pi Browser)");
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Pay with Pi";
    }
    return;
  }

  // SAFE INIT (no crash if already initialized)
  try {
    Pi.init({ version: "2.0" });
  } catch (e) {
    console.log("Pi already initialized");
  }

  Pi.authenticate(["payments"], function (auth) {

    Pi.createPayment({
      amount: totalAmount,
      memo: "Charcoal Marketplace Checkout",
      metadata: {
        items: cart
      }
    }, {

      /* =========================
         SERVER APPROVAL
      ========================= */
      onReadyForServerApproval: async function (paymentId) {
        try {
          await fetch(`${API}/payments/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
        } catch (err) {
          console.error("Approval error:", err);
        }
      },

      /* =========================
         SERVER COMPLETION
      ========================= */
      onReadyForServerCompletion: async function (paymentId, txid) {
        try {
          const res = await fetch(`${API}/payments/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid })
          });

          const data = await res.json().catch(() => ({}));

          if (data.success) {
            alert("Order successful ✔");

            localStorage.removeItem("cart");
            renderCheckout();

          } else {
            alert(data.message || "Payment failed");
          }

        } catch (err) {
          console.error("Completion error:", err);
          alert("Payment completion failed");
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerText = "Pay with Pi";
          }
        }
      }

    });

  }, function (error) {
    console.error(error);
    alert("Payment cancelled or failed");

    if (btn) {
      btn.disabled = false;
      btn.innerText = "Pay with Pi";
    }
  });
}

/* =========================
   REMOVE ITEM
========================= */
function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCheckout();
}

/* =========================
   SAFE HTML
========================= */
function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* =========================
   INIT
========================= */
renderCheckout();