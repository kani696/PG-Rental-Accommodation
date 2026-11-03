
const bookingForm = document.getElementById("bookingForm");

const responseMessage = document.getElementById("responseMessage");

const bookingButton = document.getElementById("bookingButton");

bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const propertyId = document.getElementById("propertyId").value.trim();

    const moveInDate = document.getElementById("moveInDate").value;

    const message = document.getElementById("message").value.trim();

    // Get student authentication token
    const token = localStorage.getItem("token");

    if (!token) {
        responseMessage.textContent =
            "Please login as a student before booking.";

        responseMessage.style.color = "red";
        return;
    }

    if (!propertyId || !moveInDate) {
        responseMessage.textContent =
            "Please enter property ID and move-in date.";

        responseMessage.style.color = "red";
        return;
    }

    // Disable button while submitting
    bookingButton.disabled = true;
    bookingButton.textContent = "Submitting...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/bookings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    propertyId,
                    moveInDate,
                    message
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            responseMessage.textContent =
                "Booking request submitted successfully!";

            responseMessage.style.color = "green";

            bookingForm.reset();

        } else {
            responseMessage.textContent =
                data.message || "Booking request failed.";

            responseMessage.style.color = "red";
        }

    } catch (error) {
        responseMessage.textContent =
            "Unable to connect to the server.";

        responseMessage.style.color = "red";

    } finally {
        bookingButton.disabled = false;
        bookingButton.textContent = "Submit Booking Request";
    }
});
