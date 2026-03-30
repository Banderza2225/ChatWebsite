// Get the login form element by its ID
const login = document.getElementById("login");

// Add an event listener for the form submission event
login.addEventListener("submit", async function(e) {
    // Prevent the default form submission behavior to handle it with JavaScript
    e.preventDefault();

    // Determine the API base URL based on the current hostname
    // If running locally (hostname is empty), use localhost; otherwise, use the production URL
    const API = window.location.hostname===""?"http://localhost:3000/" :"https://chatwebsite-fws0.onrender.com/";

    // Retrieve the email and password values from the input fields
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Send a POST request to the login endpoint with the user credentials
    const response = await fetch(API + "login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    // Parse the JSON response from the server
    const data = await response.json();

    // Display the response message to the user
    document.getElementById('message').innerText = data.message;

    // If user data is returned, store it in localStorage for session management
    if (data.user) {
        localStorage.setItem("UserData", JSON.stringify(data.user));
    }

    // If login is successful, redirect to the home page
    if (data.message === "Login successful!") {
        window.location.href = "Home.html";
    }
});

  







