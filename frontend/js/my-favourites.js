
const favouritesMessage = document.getElementById("favouritesMessage");
const favouritesContainer = document.getElementById("favouritesContainer");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

async function loadFavourites() {
    if (!token || !user || user.role !== "student") {
        favouritesMessage.textContent =
            "Please login as a student to view your favourites.";
        favouritesMessage.style.color = "red";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/favourites/my-favourites",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            favouritesMessage.textContent =
                data.message || "Unable to load favourites.";
            favouritesMessage.style.color = "red";
            return;
        }

        favouritesContainer.replaceChildren();

        if (data.favourites.length === 0) {
            favouritesMessage.textContent =
                "You have not saved any favourite properties yet.";
            return;
        }

        favouritesMessage.textContent =
            `You have saved ${data.count} favourite properties.`;

        data.favourites.forEach((favourite) => {
            const property = favourite.property;

            if (!property) {
                return;
            }

            const card = document.createElement("div");
            card.className = "registration-card";

            const title = document.createElement("h2");
            title.textContent = property.title;

            const location = document.createElement("p");
            location.textContent = `Location: ${property.location}`;

            const rent = document.createElement("p");
            rent.textContent = `Monthly Rent: ₹${property.rent}`;

            const room = document.createElement("p");
            room.textContent = `Room Type: ${property.roomType}`;

            const detailsLink = document.createElement("a");
            detailsLink.href =
                `property-details.html?id=${encodeURIComponent(property._id)}`;
            detailsLink.textContent = "View Details";

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Remove from Favourites";

            removeButton.addEventListener("click", () => {
                removeFavourite(favourite._id, removeButton);
            });

            card.append(
                title,
                location,
                rent,
                room,
                detailsLink,
                document.createElement("br"),
                removeButton
            );

            favouritesContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Load favourites error:", error);

        favouritesMessage.textContent =
            "Unable to connect to the server.";
        favouritesMessage.style.color = "red";
    }
}


// Remove a favourite property
async function removeFavourite(favouriteId, button) {
    button.disabled = true;
    button.textContent = "Removing...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/favourites/${encodeURIComponent(favouriteId)}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to remove favourite.");
            button.disabled = false;
            button.textContent = "Remove from Favourites";
            return;
        }

        loadFavourites();

    } catch (error) {
        console.error("Remove favourite error:", error);

        alert("Unable to connect to the server.");

        button.disabled = false;
        button.textContent = "Remove from Favourites";
    }
}


loadFavourites();
