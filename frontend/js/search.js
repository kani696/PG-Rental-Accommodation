
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const maxRentInput = document.getElementById("maxRent");
const roomTypeInput = document.getElementById("roomType");
const results = document.getElementById("results");

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    params.append("search", searchInput.value.trim());

    if (maxRentInput.value !== "") {
        params.append("maxRent", maxRentInput.value);
    }

    if (roomTypeInput.value !== "") {
        params.append("roomType", roomTypeInput.value);
    }

    results.textContent = "Searching...";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/search?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
            results.textContent = data.message;
            return;
        }

        if (data.properties.length === 0) {
            results.textContent = "No properties found.";
            return;
        }

        const card = document.createElement("div");
        card.className = "registration-card";

        const heading = document.createElement("h2");
        heading.textContent = "Search Results";
        card.appendChild(heading);

        const count = document.createElement("p");
        count.textContent = `${data.count} properties found`;
        card.appendChild(count);

        data.properties.forEach((property) => {
            const item = document.createElement("div");
            item.className = "property-result";

            const title = document.createElement("h3");
            title.textContent = property.title;

            const location = document.createElement("p");
            location.textContent = `Location: ${property.location}`;

            const rent = document.createElement("p");
            rent.textContent = `Rent: ₹${property.rent}`;

            const room = document.createElement("p");
            room.textContent = `Room: ${property.roomType}`;

            const detailsLink = document.createElement("a");
            detailsLink.href =
                `property-details.html?id=${encodeURIComponent(property._id)}`;
            detailsLink.textContent = "View Details";

            const favouriteButton = document.createElement("button");
            favouriteButton.type = "button";
            favouriteButton.textContent = "♡ Add to Favourites";

            favouriteButton.addEventListener("click", async () => {
                const token = localStorage.getItem("token");
                const user = JSON.parse(
                    localStorage.getItem("user") || "null"
                );

                if (!token) {
                    alert("Please login as a student to save favourites.");
                    return;
                }

                if (!user || user.role !== "student") {
                    alert("Only students can save favourite properties.");
                    return;
                }

                favouriteButton.disabled = true;

                try {
                    const favouriteResponse = await fetch(
                        "http://localhost:5000/api/favourites",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                propertyId: property._id
                            })
                        }
                    );

                    const favouriteData = await favouriteResponse.json();

                    if (favouriteResponse.ok) {
                        favouriteButton.textContent = "♥ Saved to Favourites";
                        favouriteButton.style.backgroundColor = "green";
                    } else {
                        alert(favouriteData.message || "Unable to save favourite.");
                        favouriteButton.disabled = false;
                    }

                } catch (error) {
                    console.error("Favourite error:", error);
                    alert("Unable to connect to the server.");
                    favouriteButton.disabled = false;
                }
            });

            item.append(
                title,
                location,
                rent,
                room,
                detailsLink,
                document.createElement("br"),
                favouriteButton
            );

            card.appendChild(item);
        });

        results.replaceChildren(card);

    } catch (error) {
        console.error("Search error:", error);
        results.textContent = "Unable to connect to the server.";
    }
});
