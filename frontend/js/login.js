const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            message.style.color = "green";

            // Store token for authenticated requests
            localStorage.setItem("token", data.token);

            // Store basic user information
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        } else {
            message.style.color = "red";
        }

    } catch (error) {
        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to the server.";

        message.style.color = "red";
    }
});