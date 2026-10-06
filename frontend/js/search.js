const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const search = searchInput.value.trim();

    results.innerHTML = "<p>Searching...</p>";

    try {
        const response = await fetch(
            `http://localhost:5000/api/properties/search?search=${encodeURIComponent(search)}`
        );

        const data = await response.json();

        if (!response.ok) {
            results.innerHTML = `
                <div class="registration-card">
                    <p>${data.message}</p>
                </div>
            `;
            return;
        }

        if (data.properties.length === 0) {
            results.innerHTML = `
                <div class="registration-card">
                    <p>No properties found.</p>
                </div>
            `;
            return;
        }

        results.innerHTML = `
            <div class="registration-card">

                <h2>Search Results</h2>

                <p>
                    ${data.count} property/properties found.
                </p>

                ${data.properties.map((property) => `
                    <div class="property-result">

                        <h3>${property.title}</h3>

                        <p>
                            <strong>Location:</strong>
                            ${property.location}
                        </p>

                        <p>
                            <strong>Rent:</strong>
                            ₹${property.rent}
                        </p>

                        <p>
                            <strong>Room:</strong>
                            ${property.roomType}
                        </p>

                        <p>
                            ${property.description}
                        </p>

                        <button
                            type="button"
                            onclick="window.location.href='property-details.html?id=${property._id}'">
                            View Details
                        </button>

                    </div>
                `).join("")}

            </div>
        `;

    } catch (error) {

        console.error("Search error:", error);

        results.innerHTML = `
            <div class="registration-card">
                <p>Unable to connect to the server.</p>
            </div>
        `;
    }
});