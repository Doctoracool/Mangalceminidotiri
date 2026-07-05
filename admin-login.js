const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   ELEMENT HELPERS
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

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    msg.innerText = "Please fill all fields";
    return;
  }

  btn.disabled = true;
  msg.innerText = "Logging in...";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      msg.innerText = data.message || "Login failed";
      return;
    }

    // ADMIN CHECK
    if (data.user.role !== "admin") {
      msg.innerText = "Access denied (not admin)";
      return;
    }

    localStorage.setItem("adminToken", data.token);

    msg.innerText = "Login successful ✔";

    setTimeout(() => {
      window.location.href = "admin.html";
    }, 800);

  } catch (err) {
    console.error(err);
    msg.innerText = "Network error";
  } finally {
    btn.disabled = false;
  }
}

/* =========================
   PI ADMIN LOGIN
========================= */
function loginWithPi() {
  const msg = getEl("msg");
  const btn = document.querySelector(".pi-btn");

  if (!window.Pi) {
    msg.innerText = "Pi Browser not detected";
    return;
  }

  msg.innerText = "Connecting to Pi...";
  btn.disabled = true;

  try {
    Pi.init({ version: "2.0" });

    Pi.authenticate(["username", "payments"], async function (auth) {

      try {
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
          msg.innerText = "Pi login failed";
          return;
        }

        // ADMIN CHECK
        if (data.user.role !== "admin") {
          msg.innerText = "Not admin account ❌";
          return;
        }

        localStorage.setItem("adminToken", data.token);

        msg.innerText = "Admin login successful ✔";

        setTimeout(() => {
          window.location.href = "admin.html";
        }, 800);

      } catch (err) {
        console.error(err);
        msg.innerText = "Server error";
      } finally {
        btn.disabled = false;
      }
    });

  } catch (err) {
    console.error(err);
    msg.innerText = "Pi authentication failed";
    btn.disabled = false;
  }
}