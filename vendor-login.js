const API = "https://charcoal-marketplace-1.onrender.com/api";

/* =========================
   HELPERS
========================= */
function getEl(id) {
  return document.getElementById(id);
}

/* =========================
   EMAIL LOGIN
========================= */
async function loginVendor() {
  const email = getEl("email");
  const password = getEl("password");
  const btn = getEl("loginBtn");
  const msg = getEl("msg");

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

    const data = await res.json();

    if (!res.ok || !data.token) {
      msg.innerText = data.message || "Login failed";
      msg.style.color = "red";
      return;
    }

    // FIXED TOKEN NAME (IMPORTANT)
    localStorage.setItem("vendorToken", data.token);

    msg.innerText = "Login successful ✔";
    msg.style.color = "green";

    setTimeout(() => {
      window.location.href = "vendor.html";
    }, 800);

  } catch (err) {
    console.error(err);
    msg.innerText = "Server error";
  } finally {
    btn.disabled = false;
    btn.innerText = "Login";
  }
}

/* =========================
   PI LOGIN (FIXED - NO HANG)
========================= */
function loginWithPi() {
  const msg = getEl("msg");
  const btn = getEl("piLoginBtn");

  if (!window.Pi) {
    msg.innerText = "Pi Browser required";
    return;
  }

  msg.innerText = "Connecting to Pi...";
  btn.disabled = true;

  try {
    Pi.init({ version: "2.0" });
  } catch (e) {}

  const scopes = ["username", "payments"];

  Pi.authenticate(scopes, function(auth) {

    if (!auth?.accessToken || !auth?.user?.uid) {
      msg.innerText = "Pi authentication failed";
      btn.disabled = false;
      return;
    }

    fetch(`${API}/auth/pi-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: auth.accessToken,
        uid: auth.user.uid,
        username: auth.user.username
      })
    })
    .then(res => res.json())
    .then(data => {

      if (!data.token) {
        msg.innerText = data.message || "Login failed";
        btn.disabled = false;
        return;
      }

      // FIXED TOKEN NAME
      localStorage.setItem("vendorToken", data.token);

      msg.innerText = "Login successful ✔";

      window.location.href = "vendor.html";

    })
    .catch(err => {
      console.error(err);
      msg.innerText = "Server error";
      btn.disabled = false;
    });

  }, function(err) {
    console.error(err);
    msg.innerText = "Pi login cancelled or failed";
    btn.disabled = false;
  });
}

/* =========================
   ENTER KEY SUPPORT
========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginVendor();
});