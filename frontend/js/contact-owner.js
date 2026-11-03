
const contactForm = document.getElementById("contactForm");
const responseMessage = document.getElementById("responseMessage");
const submitButton = document.getElementById("submitButton");

const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");

contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!propertyId) {
        responseMessage.textContent = "Property ID is missing.";
        return;
    }

    const senderName = document.getElementById("senderName").value.trim();
    const senderEmail = document.getElementById("senderEmail").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!senderName || !senderEmail || !message) {
        responseMessage.textContent = "Please fill in all fields.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}/contact`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senderName,
                    senderEmail,
                    message
                })
            }
        );

        const data = await response.json();

        responseMessage.textContent = data.message;

        responseMessage.style.color =
            response.ok ? "green" : "red";

        if (response.ok) {
            contactForm.reset();
        }

    } catch (error) {
        console.error("Contact error:", error);
        responseMessage.textContent =
            "Unable to connect to the server.";
        responseMessage.style.color = "red";

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Inquiry";
    }
});
