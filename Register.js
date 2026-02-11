const login = document.getElementById("login");

login.addEventListener("submit",async function(e){
   const API = "https://proliferous-inconclusively-callen.ngrok-free.dev";
    e.preventDefault();

    const email=document.getElementById("email").value;

    const password=document.getElementById("password").value;

    const response = await fetch(API+'/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  document.getElementById('message').innerText = data.message;
});