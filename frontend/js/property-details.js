
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

        const contactLink = document.createElement("a");
        contactLink.href =
            `contact-owner.html?id=${encodeURIComponent(property._id)}`;
        contactLink.textContent = "Contact Owner";

        propertyDetails.appendChild(contactLink);

    } catch (error) {
        console.error("Property details error:", error);
        propertyDetails.textContent = "Unable to connect to the server.";
    }
}

loadPropertyDetails();
