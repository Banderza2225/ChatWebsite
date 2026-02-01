const login = document.getElementById("login");

login.addEventListener("submit",async function(e){

    e.preventDefault();

    const email=document.getElementById("email").value;

    const password=document.getElementById("password").value;

    const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  document.getElementById('message').innerText = data.message;

  if(data.message==='Login successful!'){

     window.location.href = "Home.html";


  }
});









