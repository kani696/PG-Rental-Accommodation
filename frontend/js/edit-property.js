
const editPropertyForm = document.getElementById("editPropertyForm");
const editMessage = document.getElementById("editMessage");
const updateButton = document.getElementById("updateButton");

const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");

const token = localStorage.getItem("token");


// Load existing property details
async function loadProperty() {
    if (!token) {
        editMessage.textContent = "Please login as a property owner.";
        editMessage.style.color = "red";
        editPropertyForm.hidden = true;
        return;
    }

    if (!propertyId) {
        editMessage.textContent = "Property ID is missing.";
        editMessage.style.color = "red";
        editPropertyForm.hidden = true;
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            editMessage.textContent =
                data.message || "Unable to load property.";
            editMessage.style.color = "red";
            editPropertyForm.hidden = true;
            return;
        }

        const property = data.property;

        // Only allow the owner to edit their own property
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (!user || user.role !== "owner" ||
            String(property.owner) !== String(user.id)) {

            editMessage.textContent =
                "You are not authorized to edit this property.";

            editMessage.style.color = "red";
            editPropertyForm.hidden = true;
            return;
        }

        document.getElementById("title").value = property.title;
        document.getElementById("description").value = property.description;
        document.getElementById("location").value = property.location;
        document.getElementById("rent").value = property.rent;
        document.getElementById("roomType").value = property.roomType;
        document.getElementById("contactNumber").value = property.contactNumber;

        document.querySelectorAll('input[name="amenities"]').forEach(
            (checkbox) => {
                checkbox.checked =
                    (property.amenities || []).includes(checkbox.value);
            }
        );

        editMessage.textContent = "Property details loaded successfully.";
        editMessage.style.color = "green";

    } catch (error) {
        console.error("Load property error:", error);

        editMessage.textContent = "Unable to connect to the server.";
        editMessage.style.color = "red";
    }
}


// Update property details
editPropertyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!token || !propertyId) {
        return;
    }

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const location = document.getElementById("location").value.trim();
    const rent = Number(document.getElementById("rent").value);
    const roomType = document.getElementById("roomType").value;
    const contactNumber =
        document.getElementById("contactNumber").value.trim();

    const amenities = Array.from(
        document.querySelectorAll('input[name="amenities"]:checked')
    ).map((checkbox) => checkbox.value);

    if (!title || !description || !location ||
        !rent || !roomType || !contactNumber) {

        editMessage.textContent = "Please fill in all required fields.";
        editMessage.style.color = "red";
        return;
    }

    if (rent <= 0) {
        editMessage.textContent = "Rent must be greater than 0.";
        editMessage.style.color = "red";
        return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
        editMessage.textContent =
            "Contact number must contain exactly 10 digits.";
        editMessage.style.color = "red";
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

    updateButton.disabled = true;
    updateButton.textContent = "Updating...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(propertyData)
            }
        );

        const data = await response.json();

        editMessage.textContent =
            data.message || "Unable to update property.";

        editMessage.style.color = response.ok ? "green" : "red";

    } catch (error) {
        console.error("Update property error:", error);

        editMessage.textContent = "Unable to connect to the server.";
        editMessage.style.color = "red";

    } finally {
        updateButton.disabled = false;
        updateButton.textContent = "Update Property";
    }
});


loadProperty();
