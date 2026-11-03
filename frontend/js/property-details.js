
const propertyDetails = document.getElementById("propertyDetails");

const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");

async function loadPropertyDetails() {
    if (!propertyId) {
        propertyDetails.textContent = "Property ID is missing.";
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            propertyDetails.textContent = data.message;
            return;
        }

        const property = data.property;

        propertyDetails.replaceChildren();

        const fields = [
            ["Title", property.title],
            ["Description", property.description],
            ["Location", property.location],
            ["Monthly Rent", `₹${property.rent}`],
            ["Room Type", property.roomType],
            ["Availability", property.availability || "Available"],
            ["Contact Number", property.contactNumber],
            ["Amenities", (property.amenities || []).join(", ") || "Not specified"]
        ];

        fields.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            const strong = document.createElement("strong");

            strong.textContent = `${label}: `;
            paragraph.append(strong, document.createTextNode(value ?? ""));

            propertyDetails.appendChild(paragraph);
        });

        // Contact Owner link
        const contactLink = document.createElement("a");
        contactLink.href =
            `contact-owner.html?id=${encodeURIComponent(property._id)}`;
        contactLink.textContent = "Contact Owner";

        propertyDetails.appendChild(contactLink);

        // Booking form
        const heading = document.createElement("h2");
        heading.textContent = "Book This PG";
        propertyDetails.appendChild(heading);

        if ((property.availability || "Available") !== "Available") {
            const unavailable = document.createElement("p");
            unavailable.textContent = "This property is currently unavailable.";
            propertyDetails.appendChild(unavailable);
            return;
        }

        const form = document.createElement("form");
        form.id = "bookingForm";

        const dateLabel = document.createElement("label");
        dateLabel.textContent = "Move-in Date: ";

        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.id = "moveInDate";
        dateInput.required = true;

        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        dateInput.min = today.toISOString().split("T")[0];

        dateLabel.appendChild(dateInput);

        const messageLabel = document.createElement("label");
        messageLabel.textContent = "Message (optional): ";

        const messageInput = document.createElement("textarea");
        messageInput.id = "bookingMessage";
        messageInput.placeholder = "Write a message to the owner...";

        messageLabel.appendChild(messageInput);

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Send Booking Request";

        const result = document.createElement("p");
        result.id = "bookingResult";

        form.append(
            dateLabel,
            document.createElement("br"),
            messageLabel,
            document.createElement("br"),
            submitButton,
            result
        );

        propertyDetails.appendChild(form);

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const token = localStorage.getItem("token");

            if (!token) {
                alert("Please login as a student to book this property.");
                window.location.href = "login.html";
                return;
            }

            const user = JSON.parse(localStorage.getItem("user") || "{}");

            if (user.role !== "student") {
                result.textContent = "Only students can send booking requests.";
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            try {
                const bookingResponse = await fetch(
                    "http://localhost:5000/api/bookings",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            propertyId: property._id,
                            moveInDate: dateInput.value,
                            message: messageInput.value
                        })
                    }
                );

                const bookingData = await bookingResponse.json();

                if (!bookingResponse.ok) {
                    throw new Error(
                        bookingData.message || "Booking request failed."
                    );
                }

                result.textContent =
                    "Booking request submitted successfully!";

                form.reset();

            } catch (error) {
                result.textContent = error.message;
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Send Booking Request";
            }
        });

    } catch (error) {
        console.error("Property details error:", error);
        propertyDetails.textContent = "Unable to connect to the server.";
    }
}

loadPropertyDetails();
