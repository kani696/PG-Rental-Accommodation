const propertyForm = document.getElementById("propertyForm");
const message = document.getElementById("message");

propertyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        message.textContent = "Please login before adding a property.";
        message.style.color = "red";
        return;
    }

    const amenities = Array.from(
        document.querySelectorAll(
            'input[name="amenities"]:checked'
        )
    ).map((checkbox) => checkbox.value);

    const propertyData = {
        title: document.getElementById("title").value.trim(),

        description:
            document.getElementById("description").value.trim(),

        location:
            document.getElementById("location").value.trim(),

        rent:
            Number(document.getElementById("rent").value),

        roomType:
            document.getElementById("roomType").value,

        amenities,

        contactNumber:
            document.getElementById("contactNumber").value.trim()
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
        console.error("Property submission error:", error);

        message.textContent =
            "Unable to connect to the server.";

        message.style.color = "red";
    }
});