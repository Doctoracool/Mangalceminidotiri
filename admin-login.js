/* =========================
   CONFIG (RENDER FIXED)
========================= */
const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   SAFE ELEMENT ACCESS
========================= */
function getEl(id) {
  return document.getElementById(id);
}

/* =========================
   EMAIL ADMIN LOGIN
========================= */
async function login() {
  const emailEl = getEl("email");
  const passwordEl = getEl("password");
  const msg = getEl("msg");
  const btn = getEl("loginBtn");

  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    if (msg) msg.innerText = "Please fill all fields";
    return;
  }

  if (btn) btn.disabled = true;
  if (msg) msg.innerText = "Logging in...";

  try {
    const res = await fetch(`${API}/auth/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.token) {
      if (msg) msg.innerText = data.message || "Login failed";
      return;
    }

    if (data.user?.role !== "admin") {
      if (msg) msg.innerText = "Access denied (not admin)";
      return;
    }

    localStorage.setItem("adminToken", data.token);

    if (msg) msg.innerText = "Login successful ✔";

    setTimeout(() => {
      window.location.href = "admin.html";
    }, 800);

  } catch (err) {
    console.error("Admin login error:", err);
    if (msg) msg.innerText = "Network error";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* =========================
   PI LOGIN (ADMIN ONLY)
========================= */
function loginWithPi() {
  const msg = getEl("msg");
  const btn = document.querySelector(".pi-btn");

  if (!window.Pi) {
    if (msg) msg.innerText = "Pi Browser not detected";
    return;
  }

  if (msg) msg.innerText = "Connecting to Pi...";
  if (btn) btn.disabled = true;

  try {
    Pi.init({ version: "2.0" });

    Pi.authenticate(["username", "payments"], async function (auth) {
      try {
        const res = await fetch(`${API}/auth/pi-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accessToken: auth.accessToken,
            uid: auth.user.uid,
            username: auth.user.username
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          if (msg) msg.innerText = "Pi login failed";
          return;
        }

        if (data.user?.role !== "admin") {
          if (msg) msg.innerText = "Not admin account ❌";
          return;
        }

        localStorage.setItem("adminToken", data.token);

        if (msg) msg.innerText = "Pi admin login successful ✔";

        setTimeout(() => {
          window.location.href = "admin.html";
        }, 800);

      } catch (err) {
        console.error("Pi login error:", err);
        if (msg) msg.innerText = "Server error during Pi login";
      } finally {
        if (btn) btn.disabled = false;
      }
    });

  } catch (err) {
    console.error("Pi auth error:", err);
    if (msg) msg.innerText = "Pi authentication failed";
    if (btn) btn.disabled = false;
  }
}