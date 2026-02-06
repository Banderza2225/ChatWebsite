const login = document.getElementById("login");

login.addEventListener("click",async function(e){

    e.preventDefault();

    const email=document.getElementById("email").value;

    const password=document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  document.getElementById('message').innerText = data.message;

  localStorage.setItem("UserData",JSON.stringify(data.user));

  if (data.message === "Login successful!") {
  window.location.href = "Home.html";
}

});









