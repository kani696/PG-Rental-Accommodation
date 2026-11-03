
const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

const message = document.getElementById("adminMessage");
const container = document.getElementById("listingsContainer");

if (!token || !user || user.role !== "admin") {
    alert("Admin login required!");
    window.location.href = "login.html";
}

async function loadListings() {
    try {
        const response = await fetch(`${API_URL}/properties/admin/listings`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load listings");
        }

        const properties = data.properties || [];

        document.getElementById("totalCount").textContent = properties.length;
        document.getElementById("pendingCount").textContent =
            properties.filter(p => p.verificationStatus === "Pending").length;
        document.getElementById("approvedCount").textContent =
            properties.filter(p => p.verificationStatus === "Approved").length;
        document.getElementById("rejectedCount").textContent =
            properties.filter(p => p.verificationStatus === "Rejected").length;

        container.innerHTML = "";

        if (properties.length === 0) {
            message.textContent = "No property listings found.";
            return;
        }

        message.textContent = "";

        properties.forEach(property => {
            const card = document.createElement("div");
            card.className = "registration-card";

            const ownerName = property.owner?.name || "Unknown";
            const ownerEmail = property.owner?.email || "Unknown";
            const status = property.verificationStatus || "Pending";

            card.innerHTML = `
                <h3>${property.title}</h3>
                <p><strong>Owner:</strong> ${ownerName}</p>
                <p><strong>Email:</strong> ${ownerEmail}</p>
                <p><strong>Location:</strong> ${property.location}</p>
                <p><strong>Rent:</strong> ₹${property.rent}</p>
                <p><strong>Room Type:</strong> ${property.roomType}</p>
                <p><strong>Availability:</strong> ${property.availability || "Available"}</p>
                <p><strong>Verification:</strong> ${status}</p>
            `;

            if (status === "Pending") {
                const approveButton = document.createElement("button");
                approveButton.textContent = "Approve";
                approveButton.addEventListener("click", () => {
                    updateStatus(property._id, "Approved");
                });

                const rejectButton = document.createElement("button");
                rejectButton.textContent = "Reject";
                rejectButton.addEventListener("click", () => {
                    updateStatus(property._id, "Rejected");
                });

                card.appendChild(approveButton);
                card.appendChild(rejectButton);
            }

            container.appendChild(card);
        });

    } catch (error) {
        message.textContent = error.message;
    }
}

async function updateStatus(propertyId, status) {
    try {
        const response = await fetch(
            `${API_URL}/properties/${propertyId}/verification`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update status");
        }

        alert(data.message);
        loadListings();

    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

if (token && user && user.role === "admin") {
    loadListings();
}
