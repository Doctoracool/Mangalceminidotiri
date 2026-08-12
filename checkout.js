const API="https://charcoal-marketplace-2.onrender.com/api";
const PI_SANDBOX=location.hostname.includes("sandbox.minepi.com") || localStorage.getItem("PI_SANDBOX")==="true";

function getCart(){
  try{return JSON.parse(localStorage.getItem("cart"))||[];}catch{return [];}
}
function saveCart(cart){localStorage.setItem("cart",JSON.stringify(cart));}

function renderCheckout(){
  const box=document.getElementById("checkoutItems");
  const total=document.getElementById("totalAmount");
  const cart=getCart();
  if(!box)return;

  if(!cart.length){
    box.innerHTML="<p>Your cart is empty.</p>";
    if(total)total.textContent="0 Pi";
    return;
  }

  let sum=0;
  box.innerHTML=cart.map((item,index)=>{
    const price=Number(item.price??item.price_pi??0);
    const qty=Number(item.qty??item.quantity??1);
    sum+=price*qty;
    return `<div class="item">
      <div><strong>${escapeHTML(item.name)}</strong><p>${price.toFixed(2)} Pi × ${qty}</p></div>
      <button onclick="removeItem(${index})">Remove</button>
    </div>`;
  }).join("");

  if(total)total.textContent=sum.toFixed(2)+" Pi";
}

function removeItem(index){
  const cart=getCart();
  cart.splice(index,1);
  saveCart(cart);
  renderCheckout();
}

async function getAuthenticatedUser(){
  const existingToken=localStorage.getItem("token");
  const existingUser=localStorage.getItem("user");
  if(existingToken&&existingUser){
    try{
      const u=JSON.parse(existingUser);
      if(u?.id&&u?.pi_uid)return {token:existingToken,user:u};
    }catch{}
  }

  if(!window.Pi)throw new Error("Please open Charcoal Marketplace in Pi Browser");

  Pi.init(PI_SANDBOX?{version:"2.0",sandbox:true}:{version:"2.0"});
  const auth=await Pi.authenticate(["username","payments"],handleIncompletePayment);
  const res=await fetch(`${API}/auth/pi-login`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({accessToken:auth.accessToken})
  });
  const data=await res.json();
  if(!res.ok||!data.token)throw new Error(data.message||"Pi authentication failed");

  localStorage.setItem("token",data.token);
  localStorage.setItem("user",JSON.stringify(data.user));
  return {token:data.token,user:data.user,accessToken:auth.accessToken};
}

async function createCheckout(token){
  const cart=getCart();
  const items=cart.map(item=>({
    product_id:Number(item.id),
    quantity:Number(item.qty||1)
  }));

  const res=await fetch(`${API}/orders/checkout`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${token}`
    },
    body:JSON.stringify({items})
  });
  const data=await res.json();
  if(!res.ok)throw new Error(data.message||"Unable to create order");
  return data;
}

async function payWithPi(){
  const btn=document.getElementById("payBtn");
  const msg=document.getElementById("msg");
  const cart=getCart();

  if(!cart.length){msg.textContent="Your cart is empty.";return;}
  btn.disabled=true;btn.textContent="Preparing payment...";

  try{
    if(!window.Pi)throw new Error("Please open this app in Pi Browser");
    const auth=await Pi.authenticate(["username","payments"],handleIncompletePayment);

    /* The backend creates the order using database prices. */
    const loginRes=await fetch(`${API}/auth/pi-login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({accessToken:auth.accessToken})
    });
    const login=await loginRes.json();
    if(!loginRes.ok||!login.token)throw new Error(login.message||"Pi authentication failed");

    localStorage.setItem("token",login.token);
    localStorage.setItem("user",JSON.stringify(login.user));

    const checkout=await createCheckout(login.token);
    const amount=Number(checkout.total_pi);

    Pi.init(PI_SANDBOX?{version:"2.0",sandbox:true}:{version:"2.0"});

    btn.textContent="Waiting for Pi payment...";

    Pi.createPayment({
      amount,
      memo:`Charcoal Marketplace Order ${checkout.checkout_ref}`,
      metadata:{checkout_ref:checkout.checkout_ref}
    },{
      onReadyForServerApproval:async paymentId=>{
        const res=await fetch(`${API}/payments/approve`,{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${login.token}`
          },
          body:JSON.stringify({
            paymentId,
            checkout_ref:checkout.checkout_ref,
            accessToken:auth.accessToken
          })
        });
        const data=await res.json().catch(()=>({}));
        if(!res.ok||!data.success)throw new Error(data.message||"Payment approval failed");
      },

      onReadyForServerCompletion:async(paymentId,txid)=>{
        const res=await fetch(`${API}/payments/complete`,{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${login.token}`
          },
          body:JSON.stringify({
            paymentId,txid,
            accessToken:auth.accessToken
          })
        });
        const data=await res.json().catch(()=>({}));
        if(!res.ok||!data.success)throw new Error(data.message||"Payment completion failed");

        saveCart([]);
        renderCheckout();
        msg.textContent="Payment completed successfully ✔";
        btn.textContent="Paid ✔";
      },

      onCancel:async paymentId=>{
        await cancelPayment(login.token,paymentId,checkout.checkout_ref);
        msg.textContent="Payment cancelled.";
        btn.disabled=false;btn.textContent="Pay with Pi";
      },

      onError:async(error,payment)=>{
        console.error("Pi payment error:",error,payment);
        if(payment?.identifier)await cancelPayment(login.token,payment.identifier,checkout.checkout_ref);
        msg.textContent="Payment failed or was cancelled.";
        btn.disabled=false;btn.textContent="Try Again";
      }
    });
  }catch(error){
    console.error(error);
    msg.textContent=error.message||"Payment failed";
    btn.disabled=false;btn.textContent="Pay with Pi";
  }
}

async function cancelPayment(token,paymentId,checkout_ref){
  try{
    await fetch(`${API}/payments/cancel`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify({paymentId,checkout_ref})
    });
  }catch(e){console.error(e);}
}

async function handleIncompletePayment(payment){
  if(!payment?.identifier||!payment?.transaction?.txid||!window.Pi)return;
  try{
    const auth=await Pi.authenticate(["username","payments"]);
    const loginRes=await fetch(`${API}/auth/pi-login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({accessToken:auth.accessToken})
    });
    const login=await loginRes.json();
    if(!loginRes.ok||!login.token)return;

    localStorage.setItem("token",login.token);
    localStorage.setItem("user",JSON.stringify(login.user));

    await fetch(`${API}/payments/complete`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${login.token}`
      },
      body:JSON.stringify({
        paymentId:payment.identifier,
        txid:payment.transaction.txid,
        accessToken:auth.accessToken
      })
    });
  }catch(error){
    console.error("Incomplete payment recovery:",error);
  }
}

function escapeHTML(value){
  return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

document.addEventListener("DOMContentLoaded",()=>{
  renderCheckout();
  const btn=document.getElementById("payBtn");
  if(btn)btn.addEventListener("click",payWithPi);
});
