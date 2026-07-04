/* =========================
   CONFIG
========================= */
const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   ELEMENT HELPERS
========================= */
function getEl(id) {
  return document.getElementById(id);
}

/* =========================
   EMAIL LOGIN (VENDOR)
========================= */
async function loginVendor() {
  const email = getEl("email");
  const password = getEl("password");
  const btn = getEl("loginBtn");
  const msg = getEl("msg");

  if (!email || !password || !btn || !msg) return;

  if (!email.value || !password.value) {
    msg.innerText = "Please fill all fields";
    msg.style.color = "red";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Logging in...";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.token) {
      msg.innerText = data.message || "Login failed";
      msg.style.color = "red";
      return;
    }

    // ROLE CHECK
    if (data.user?.role !== "vendor") {
      msg.innerText = "Access denied (not vendor)";
      msg.style.color = "red";
      return;
    }

    // CONSISTENT TOKEN STORAGE (IMPORTANT FIX)
    localStorage.setItem("token", data.token);

    msg.innerText = "Login successful ✔";
    msg.style.color = "green";

    setTimeout(() => {
      window.location.href = "vendor-dashboard.html";
    }, 800);

  } catch (err) {
    console.error("Vendor login error:", err);
    msg.innerText = "Server error. Try again later.";
    msg.style.color = "red";
  } finally {
    btn.disabled = false;
    btn.innerText = "Login";
  }
}

/* =========================
   PI LOGIN (PRODUCTION SAFE)
========================= */
async function loginWithPi() {
  const msg = getEl("msg");
  const btn = getEl("piLoginBtn");

  if (!msg || !btn) return;

  // MUST run inside Pi Browser
  if (typeof window.Pi === "undefined") {
    msg.innerText = "Pi Browser required";
    msg.style.color = "red";
    return;
  }

  msg.innerText = "Connecting to Pi...";
  btn.disabled = true;

  try {
    // Safe init (avoid duplicate crash)
    try {
      if (typeof Pi.init === "function") {
        Pi.init({ version: "2.0" });
      }
    } catch (e) {}

    Pi.authenticate(["username", "payments"], async function (auth) {
      try {
        // SAFETY CHECK
        if (!auth?.accessToken || !auth?.user?.uid) {
          msg.innerText = "Invalid Pi authentication";
          btn.disabled = false;
          return;
        }

        const res = await fetch(`${API}/auth/pi-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: auth.accessToken,
            uid: auth.user.uid,
            username: auth.user.username
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.token) {
          msg.innerText = data.message || "Pi login failed";
          btn.disabled = false;
          return;
        }

        // ROLE CHECK
        if (data.user?.role !== "vendor") {
          msg.innerText = "Not a vendor account ❌";
          btn.disabled = false;
          return;
        }

        // CONSISTENT TOKEN STORAGE (CRITICAL FIX)
        localStorage.setItem("token", data.token);

        msg.innerText = "Login successful ✔";

        window.location.href = "vendor-dashboard.html";

      } catch (err) {
        console.error(err);
        msg.innerText = "Server error during Pi login";
      } finally {
        btn.disabled = false;
      }
    });

  } catch (err) {
    console.error(err);
    msg.innerText = "Pi authentication error";
    btn.disabled = false;
  }
}

/* =========================
   ENTER KEY SUPPORT (SAFE)
========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const active = document.activeElement;

    // only trigger if typing in input fields
    if (active && active.tagName === "INPUT") {
      loginVendor();
    }
  }
});