/* =========================================================
   CHARCOAL MARKETPLACE
   ADMIN LOGIN
========================================================= */

const API =
  "https://charcoal-marketplace-2.onrender.com/api";


/* =========================================================
   ELEMENT HELPER
========================================================= */

function getEl(id) {
  return document.getElementById(id);
}


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      If an admin token already exists,
      verify it before allowing access.
    */

    checkExistingAdmin();

  }
);


/* =========================================================
   EXISTING ADMIN CHECK
========================================================= */

async function checkExistingAdmin() {

  const token =
    localStorage.getItem("adminToken");

  if (!token) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API}/admin/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (response.ok) {

      window.location.replace(
        "admin.html"
      );

    } else {

      localStorage.removeItem(
        "adminToken"
      );

    }

  } catch (error) {

    console.warn(
      "Existing admin check failed:",
      error
    );

  }

}


/* =========================================================
   EMAIL ADMIN LOGIN
========================================================= */

async function login() {

  const emailEl =
    getEl("email");

  const passwordEl =
    getEl("password");

  const msg =
    getEl("msg");

  const btn =
    getEl("loginBtn");


  const email =
    emailEl.value.trim();

  const password =
    passwordEl.value;


  if (!email || !password) {

    msg.innerText =
      "Please enter your email and password.";

    return;

  }


  btn.disabled = true;

  msg.innerText =
    "Verifying administrator account...";


  try {

    const response =
      await fetch(
        `${API}/auth/admin-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      !response.ok ||
      !data.success ||
      !data.token
    ) {

      msg.innerText =
        data.message ||
        "Admin login failed.";

      return;

    }


    if (
      !data.user ||
      data.user.role !== "admin"
    ) {

      msg.innerText =
        "Access denied.";

      return;

    }


    /*
      Store ONLY the admin JWT.
    */

    localStorage.setItem(
      "adminToken",
      data.token
    );


    msg.innerText =
      "Administrator verified ✔";


    setTimeout(
      () => {

        window.location.replace(
          "admin.html"
        );

      },
      500
    );


  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    msg.innerText =
      "Unable to connect to the server.";

  } finally {

    btn.disabled = false;

  }

}


/* =========================================================
   PI ADMIN LOGIN
========================================================= */

async function loginWithPi() {

  const msg =
    getEl("msg");

  const btn =
    getEl("piLoginBtn");


  if (!window.Pi) {

    msg.innerText =
      "Please open the marketplace inside Pi Browser.";

    return;

  }


  btn.disabled = true;

  msg.innerText =
    "Connecting to Pi Network...";


  try {

    Pi.init({
      version: "2.0"
    });


    const auth =
      await Pi.authenticate(
        ["username", "payments"]
      );


    if (
      !auth ||
      !auth.accessToken ||
      !auth.user
    ) {

      msg.innerText =
        "Pi authentication failed.";

      return;

    }


    msg.innerText =
      "Verifying administrator account...";


    const response =
      await fetch(
        `${API}/auth/pi-admin-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            accessToken:
              auth.accessToken,

          })
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      !response.ok ||
      !data.success ||
      !data.token
    ) {

      msg.innerText =
        data.message ||
        "Pi admin login failed.";

      return;

    }


    if (
      !data.user ||
      data.user.role !== "admin"
    ) {

      msg.innerText =
        "This Pi account is not an administrator.";

      return;

    }


    localStorage.setItem(
      "adminToken",
      data.token
    );


    msg.innerText =
      "Admin verification successful ✔";


    setTimeout(
      () => {

        window.location.replace(
          "admin.html"
        );

      },
      500
    );


  } catch (error) {

    console.error(
      "Pi admin login error:",
      error
    );

    msg.innerText =
      "Pi administrator authentication failed.";

  } finally {

    btn.disabled = false;

  }

}