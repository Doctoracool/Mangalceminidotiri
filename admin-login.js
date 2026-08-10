/* =========================================================
   CHARCOAL MARKETPLACE - ADMIN LOGIN JS
========================================================= */


/* =========================================================
   API
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
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializePi();

});


/* =========================================================
   PI SDK INITIALIZATION
========================================================= */

function initializePi() {

  if (!window.Pi) {
    console.warn("Pi SDK not available.");
    return;
  }

  try {

    if (typeof Pi.init === "function") {

      Pi.init({
        version: "2.0"
      });

      console.log("Pi SDK initialized.");

    }

  } catch (error) {

    console.error(
      "Pi initialization failed:",
      error
    );

  }
}


/* =========================================================
   EMAIL / PASSWORD ADMIN LOGIN
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


  if (!emailEl || !passwordEl || !msg || !btn) {
    return;
  }


  const email =
    emailEl.value.trim();

  const password =
    passwordEl.value;


  /* =========================
     VALIDATION
  ========================= */

  if (!email || !password) {

    msg.innerText =
      "Please fill all fields.";

    return;
  }


  btn.disabled = true;

  msg.innerText =
    "Verifying admin account...";


  try {

    const res =
      await fetch(
        `${API}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );


    let data;

    try {

      data =
        await res.json();

    } catch {

      data = {};

    }


    /* =========================
       LOGIN FAILURE
    ========================= */

    if (!res.ok || !data.token) {

      msg.innerText =
        data.message ||
        "Invalid login credentials.";

      return;
    }


    /* =========================
       ADMIN VERIFICATION
    ========================= */

    if (
      !data.user ||
      data.user.role !== "admin"
    ) {

      msg.innerText =
        "Access denied. Admin account required.";

      return;
    }


    /* =========================
       SAVE ADMIN TOKEN
    ========================= */

    localStorage.setItem(
      "adminToken",
      data.token
    );


    /* Optional user information */

    if (data.user) {

      localStorage.setItem(
        "adminUser",
        JSON.stringify(data.user)
      );

    }


    msg.innerText =
      "Admin login successful ✔";


    /* =========================
       ADMIN DASHBOARD
    ========================= */

    setTimeout(() => {

      window.location.href =
        "admin.html";

    }, 700);


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


  if (!msg || !btn) {
    return;
  }


  /* =========================
     PI CHECK
  ========================= */

  if (!window.Pi) {

    msg.innerText =
      "Please open Charcoal Marketplace in Pi Browser.";

    return;
  }


  btn.disabled = true;

  msg.innerText =
    "Connecting to Pi...";


  try {

    /* =========================
       INITIALIZE PI
    ========================= */

    if (
      typeof Pi.init === "function"
    ) {

      Pi.init({
        version: "2.0"
      });

    }


    /* =========================
       AUTHENTICATE
    ========================= */

    const auth =
      await Pi.authenticate(
        [
          "username",
          "payments"
        ]
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
      "Verifying admin account...";


    /* =========================
       SEND TO BACKEND
    ========================= */

    const res =
      await fetch(
        `${API}/auth/pi-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              accessToken:
                auth.accessToken,

              uid:
                auth.user.uid,

              username:
                auth.user.username

            })
        }
      );


    let data;

    try {

      data =
        await res.json();

    } catch {

      data = {};

    }


    /* =========================
       BACKEND LOGIN FAILURE
    ========================= */

    if (!res.ok || !data.token) {

      msg.innerText =
        data.message ||
        "Pi login failed.";

      return;
    }


    /* =========================
       ADMIN ROLE CHECK
    ========================= */

    if (
      !data.user ||
      data.user.role !== "admin"
    ) {

      msg.innerText =
        "This Pi account is not an admin.";

      return;
    }


    /* =========================
       SAVE ADMIN SESSION
    ========================= */

    localStorage.setItem(
      "adminToken",
      data.token
    );


    localStorage.setItem(
      "adminUser",
      JSON.stringify(data.user)
    );


    msg.innerText =
      "Admin login successful ✔";


    /* =========================
       REDIRECT
    ========================= */

    setTimeout(() => {

      window.location.href =
        "admin.html";

    }, 700);


  } catch (error) {

    console.error(
      "Pi admin login error:",
      error
    );

    msg.innerText =
      "Pi authentication failed. Please try again.";

  } finally {

    btn.disabled = false;

  }

}