const propertyForm = document.getElementById("propertyForm");
const message = document.getElementById("message");

propertyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        message.textContent =
            "Please login before adding a property.";
        message.style.color = "red";
        return;
    }

    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const location =
        document.getElementById("location").value.trim();

    const rent =
        Number(document.getElementById("rent").value);

    const roomType =
        document.getElementById("roomType").value;

    const contactNumber =
        document.getElementById("contactNumber").value.trim();

    const amenities = Array.from(
        document.querySelectorAll(
            'input[name="amenities"]:checked'
        )
    ).map((checkbox) => checkbox.value);

    // Client-side validation
    if (!title || !description || !location ||
        !rent || !roomType || !contactNumber) {

        message.textContent =
            "Please fill in all required fields.";

        message.style.color = "red";
        return;
    }

    if (rent <= 0) {
        message.textContent =
            "Rent must be greater than 0.";

        message.style.color = "red";
        return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
        message.textContent =
            "Contact number must contain exactly 10 digits.";

        message.style.color = "red";
        return;
    }

    const propertyData = {
        title,
        description,
        location,
        rent,
        roomType,
        amenities,
        contactNumber
    };

    try {
        const response = await fetch(
            "http://localhost:5000/api/properties",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(propertyData)
            }
        );

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            message.style.color = "green";
            propertyForm.reset();
        } else {
            message.style.color = "red";
        }

    } catch (error) {
        console.error(
            "Property submission error:",
            error
        );

        message.textContent =
            "Unable to connect to the server.";

        message.style.color = "red";
    }
});