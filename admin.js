/* =========================================================
   CHARCOAL MARKETPLACE
   ADMIN DASHBOARD
========================================================= */

const API =
  "https://charcoal-marketplace-2.onrender.com/api";


/* =========================================================
   AUTH STATE
========================================================= */

let adminToken =
  localStorage.getItem("adminToken");


/* =========================================================
   REDIRECT
========================================================= */

function redirectToLogin() {

  localStorage.removeItem(
    "adminToken"
  );

  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   AUTH HEADERS
========================================================= */

function getHeaders() {

  adminToken =
    localStorage.getItem("adminToken");


  return {

    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${adminToken}`

  };

}


/* =========================================================
   VERIFY ADMIN
========================================================= */

async function verifyAdminAccess() {

  adminToken =
    localStorage.getItem("adminToken");


  if (!adminToken) {

    redirectToLogin();

    return false;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/me`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return false;

    }


    if (!response.ok) {

      throw new Error(
        "Admin verification failed"
      );

    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.admin ||
      data.admin.role !== "admin"
    ) {

      redirectToLogin();

      return false;

    }


    return true;


  } catch (error) {

    console.error(
      "Admin verification error:",
      error
    );

    alert(
      "Unable to verify administrator access."
    );

    redirectToLogin();

    return false;

  }

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const authorized =
      await verifyAdminAccess();


    if (!authorized) {
      return;
    }


    console.log(
      "✅ Administrator verified"
    );


    showSection(
      "dashboard"
    );


    loadDashboard();

    loadPendingProducts();

    loadPendingVendors();

  }
);


/* =========================================================
   SECTION NAVIGATION
========================================================= */

function showSection(sectionId) {

  const sections =
    document.querySelectorAll(
      ".section"
    );


  sections.forEach(
    section => {

      section.classList.remove(
        "active"
      );

    }
  );


  const target =
    document.getElementById(
      sectionId
    );


  if (target) {

    target.classList.add(
      "active"
    );

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

    const response =
      await fetch(
        `${API}/admin/dashboard`,
        {
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        "Dashboard request failed"
      );

    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.stats
    ) {

      return;

    }


    const stats =
      data.stats;


    const sales =
      document.getElementById(
        "sales"
      );

    const orders =
      document.getElementById(
        "ordersCount"
      );

    const vendors =
      document.getElementById(
        "vendorsCount"
      );

    const products =
      document.getElementById(
        "productsCount"
      );


    if (sales) {

      sales.textContent =
        `${Number(
          stats.sales || 0
        ).toFixed(2)} Pi`;

    }


    if (orders) {

      orders.textContent =
        stats.orders || 0;

    }


    if (vendors) {

      vendors.textContent =
        stats.vendors || 0;

    }


    if (products) {

      products.textContent =
        stats.products || 0;

    }


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  const confirmed =
    confirm(
      "Are you sure you want to logout?"
    );


  if (!confirmed) {
    return;
  }


  localStorage.removeItem(
    "adminToken"
  );


  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   PENDING PRODUCTS
========================================================= */

async function loadPendingProducts() {

  const container =
    document.getElementById(
      "pendingProducts"
    );


  if (!container) {
    return;
  }


  try {

    container.innerHTML =
      "<p>Loading products...</p>";


    const response =
      await fetch(
        `${API}/admin/products/pending`,
        {
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        "Products request failed"
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML =
        "<p>No pending products</p>";

      return;

    }


    container.innerHTML =
      data.map(
        product => `

        <div class="card">

          <img
            src="${getImageURL(
              product.image
            )}"
            alt="${escapeHTML(
              product.name
            )}"
          >

          <h3>
            ${escapeHTML(
              product.name
            )}
          </h3>

          <p>
            ${escapeHTML(
              product.location || ""
            )}
          </p>

          <p>
            Vendor:
            ${escapeHTML(
              product.vendor_name ||
              "Unknown"
            )}
          </p>

          <h4>
            ${Number(
              product.price_pi || 0
            ).toFixed(2)}
            Pi
          </h4>

          <button
            onclick="approveProduct(
              ${product.id}
            )"
          >
            Approve
          </button>

          <button
            onclick="rejectProduct(
              ${product.id}
            )"
          >
            Reject
          </button>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Pending products error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load pending products.</p>";

  }

}


/* =========================================================
   PENDING VENDORS
========================================================= */

async function loadPendingVendors() {

  const container =
    document.getElementById(
      "pendingVendors"
    );


  if (!container) {
    return;
  }


  try {

    container.innerHTML =
      "<p>Loading vendors...</p>";


    const response =
      await fetch(
        `${API}/admin/vendors/pending`,
        {
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        "Vendor request failed"
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML =
        "<p>No pending vendors</p>";

      return;

    }


    container.innerHTML =
      data.map(
        vendor => `

        <div class="card">

          <h3>
            ${escapeHTML(
              vendor.name
            )}
          </h3>

          <p>
            ${escapeHTML(
              vendor.email
            )}
          </p>

          <p>
            Applied:
            ${vendor.created_at
              ? new Date(
                  vendor.created_at
                ).toLocaleDateString()
              : "Unknown"}
          </p>

          <button
            onclick="approveVendor(
              ${vendor.id}
            )"
          >
            Approve
          </button>

          <button
            onclick="rejectVendor(
              ${vendor.id}
            )"
          >
            Reject
          </button>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Pending vendors error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load pending vendors.</p>";

  }

}


/* =========================================================
   APPROVE PRODUCT
========================================================= */

async function approveProduct(id) {

  if (
    !confirm(
      "Approve this product?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API}/admin/products/approve/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "Product approval failed."
      );

      return;

    }


    alert(
      "Product approved successfully ✔"
    );


    loadPendingProducts();

    loadDashboard();


  } catch (error) {

    console.error(
      "Approve product error:",
      error
    );

    alert(
      "Unable to approve product."
    );

  }

}


/* =========================================================
   REJECT PRODUCT
========================================================= */

async function rejectProduct(id) {

  if (
    !confirm(
      "Reject this product?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API}/admin/products/reject/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "Product rejection failed."
      );

      return;

    }


    alert(
      "Product rejected."
    );


    loadPendingProducts();

    loadDashboard();


  } catch (error) {

    console.error(
      "Reject product error:",
      error
    );

    alert(
      "Unable to reject product."
    );

  }

}


/* =========================================================
   APPROVE VENDOR
========================================================= */

async function approveVendor(id) {

  if (
    !confirm(
      "Approve this vendor?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API}/admin/vendors/approve/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "Vendor approval failed."
      );

      return;

    }


    alert(
      "Vendor approved successfully ✔"
    );


    loadPendingVendors();

    loadDashboard();


  } catch (error) {

    console.error(
      "Approve vendor error:",
      error
    );

    alert(
      "Unable to approve vendor."
    );

  }

}


/* =========================================================
   REJECT VENDOR
========================================================= */

async function rejectVendor(id) {

  if (
    !confirm(
      "Reject this vendor?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API}/admin/vendors/reject/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      redirectToLogin();

      return;

    }


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "Vendor rejection failed."
      );

      return;

    }


    alert(
      "Vendor rejected."
    );


    loadPendingVendors();

    loadDashboard();


  } catch (error) {

    console.error(
      "Reject vendor error:",
      error
    );

    alert(
      "Unable to reject vendor."
    );

  }

}


/* =========================================================
   IMAGE URL
========================================================= */

function getImageURL(path) {

  if (!path) {
    return "placeholder.png";
  }


  if (
    String(path).startsWith(
      "http"
    )
  ) {
    return path;
  }


  return (
    "https://charcoal-marketplace-2.onrender.com" +
    path
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value || "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}