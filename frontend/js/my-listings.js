
const listingsMessage = document.getElementById("listingsMessage");
const listingsContainer = document.getElementById("listingsContainer");

const token = localStorage.getItem("token");

async function loadMyListings() {
    if (!token) {
        listingsMessage.textContent =
            "Please login as a property owner to view your listings.";
        listingsMessage.style.color = "red";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/properties/my-listings",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            listingsMessage.textContent =
                data.message || "Unable to load properties.";
            listingsMessage.style.color = "red";
            return;
        }

        listingsContainer.replaceChildren();

        if (data.properties.length === 0) {
            listingsMessage.textContent =
                "You have not added any properties yet.";
            return;
        }

        listingsMessage.textContent =
            `You have ${data.count} listed property/properties.`;

        data.properties.forEach((property) => {
            const card = document.createElement("div");
            card.className = "registration-card";

            const title = document.createElement("h2");
            title.textContent = property.title;

            const location = document.createElement("p");
            location.textContent = `Location: ${property.location}`;

            const rent = document.createElement("p");
            rent.textContent = `Monthly Rent: ₹${property.rent}`;

            const roomType = document.createElement("p");
            roomType.textContent = `Room Type: ${property.roomType}`;

            const amenities = document.createElement("p");
            amenities.textContent =
                `Amenities: ${(property.amenities || []).join(", ") || "Not specified"}`;

            const availabilityLabel = document.createElement("label");
            availabilityLabel.textContent = "Availability: ";

            const availabilitySelect = document.createElement("select");

            ["Available", "Not Available"].forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                availabilitySelect.appendChild(option);
            });

            // Older listings without a saved status are treated as Available
            availabilitySelect.value = property.availability || "Available";

            const updateButton = document.createElement("button");
            updateButton.type = "button";
            updateButton.textContent = "Update Availability";

            updateButton.addEventListener("click", () => {
                updateAvailability(
                    property._id,
                    availabilitySelect.value,
                    updateButton
                );
            });

            const editLink = document.createElement("a");
            editLink.href =
                `edit-property.html?id=${encodeURIComponent(property._id)}`;
            editLink.textContent = "Edit Property";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete Property";

            deleteButton.addEventListener("click", () => {
                deleteProperty(property._id, deleteButton);
            });

            card.append(
                title,
                location,
                rent,
                roomType,
                amenities,
                availabilityLabel,
                availabilitySelect,
                document.createElement("br"),
                updateButton,
                document.createElement("br"),
                editLink,
                document.createElement("br"),
                deleteButton
            );

            listingsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Load listings error:", error);

        listingsMessage.textContent =
            "Unable to connect to the server.";
        listingsMessage.style.color = "red";
    }
}


// Update property availability
async function updateAvailability(propertyId, availability, button) {
    button.disabled = true;
    button.textContent = "Updating...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}/availability`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ availability })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update availability.");
            button.disabled = false;
            button.textContent = "Update Availability";
            return;
        }

        alert("Property availability updated successfully!");
        loadMyListings();

    } catch (error) {
        console.error("Update availability error:", error);
        alert("Unable to connect to the server.");

        button.disabled = false;
        button.textContent = "Update Availability";
    }
}


// Delete a property
async function deleteProperty(propertyId, button) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this property?"
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/${encodeURIComponent(propertyId)}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to delete property.");
            button.disabled = false;
            button.textContent = "Delete Property";
            return;
        }

        alert("Property deleted successfully!");
        loadMyListings();

    } catch (error) {
        console.error("Delete property error:", error);

        alert("Unable to connect to the server.");

        button.disabled = false;
        button.textContent = "Delete Property";
    }
}


loadMyListings();
