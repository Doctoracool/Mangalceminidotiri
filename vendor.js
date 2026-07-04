const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   AUTH CHECK (SAFE)
========================= */
let token = localStorage.getItem("token"); // 🔥 FIXED: unified token system

if (!token) {
  window.location.href = "vendor-login.html";
}

/* =========================
   HEADERS
========================= */
function getHeaders() {
  return {
    Authorization: `Bearer ${token}`
  };
}

/* =========================
   FORM SUBMIT
========================= */
const form = document.getElementById("productForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = e.target.querySelector("button");

    if (btn) {
      btn.disabled = true;
      btn.innerText = "Uploading...";
    }

    const name = document.getElementById("name")?.value?.trim();
    const price_pi = document.getElementById("price_pi")?.value;
    const location = document.getElementById("location")?.value?.trim();
    const stock = document.getElementById("stock")?.value;
    const image = document.getElementById("image")?.files?.[0];

    if (!name || !price_pi || !location || !stock || !image) {
      alert("Please fill all fields");

      if (btn) {
        btn.disabled = false;
        btn.innerText = "Add Product";
      }
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price_pi", price_pi);
    formData.append("location", location);
    formData.append("stock", stock);
    formData.append("image", image);

    try {
      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "vendor-login.html";
        return;
      }

      if (!res.ok) {
        alert(data.message || "Upload failed");
        return;
      }

      alert("Product added successfully ✔");
      form.reset();
      loadMyProducts();

    } catch (err) {
      console.error("Upload error:", err);
      alert("Server error while uploading product");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Add Product";
      }
    }
  });
}

/* =========================
   LOAD MY PRODUCTS
========================= */
async function loadMyProducts() {
  const container = document.getElementById("myProducts");
  if (!container) return;

  try {
    container.innerHTML = "<p>Loading...</p>";

    const res = await fetch(`${API}/products/my`, {
      headers: getHeaders()
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "vendor-login.html";
      return;
    }

    const data = await res.json().catch(() => []);

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No products yet</p>";
      return;
    }

    container.innerHTML = data.map(p => `
      <div class="card">
        <img src="${getImageURL(p.image)}" />
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.location)}</p>
        <h4>${p.price_pi} Pi</h4>
        <p>Stock: ${p.stock}</p>
        <p>Status: ${p.status}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Load error:", err);
    container.innerHTML = "<p>Failed to load products</p>";
  }
}

/* =========================
   HELPERS (PRODUCTION SAFE)
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

/* =========================
   INIT (SAFE)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadMyProducts();
});