
const dashboardMessage = document.getElementById("dashboardMessage");
const dashboardStats = document.getElementById("dashboardStats");
const propertiesContainer = document.getElementById("propertiesContainer");
const bookingsContainer = document.getElementById("bookingsContainer");
const ownerWelcome = document.getElementById("ownerWelcome");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");


async function loadOwnerDashboard() {

    if (!token || !user) {
        dashboardMessage.textContent =
            "Please login to access the owner dashboard.";
        return;
    }

    if (user.role !== "owner") {
        dashboardMessage.textContent =
            "Access denied. This dashboard is only for property owners.";
        return;
    }

    ownerWelcome.textContent = `Welcome, ${user.name || "Property Owner"}!`;

    try {
        const response = await fetch(
            "http://localhost:5000/api/bookings/owner-dashboard",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            dashboardMessage.textContent =
                data.message || "Unable to load dashboard.";
            return;
        }

        dashboardMessage.textContent = "";
        displayStats(data.dashboard);
        displayProperties(data.dashboard.properties);
        displayBookings(data.dashboard.recentBookings);

    } catch (error) {
        console.error("Dashboard error:", error);

        dashboardMessage.textContent =
            "Unable to connect to the server.";
    }
}


// Display dashboard statistics
function displayStats(dashboard) {

    const stats = [
        ["Total Properties", dashboard.totalProperties],
        ["Total Bookings", dashboard.totalBookings],
        ["Pending Bookings", dashboard.pendingBookings],
        ["Approved Bookings", dashboard.approvedBookings],
        ["Rejected Bookings", dashboard.rejectedBookings]
    ];

    dashboardStats.replaceChildren();

    const card = document.createElement("div");
    card.className = "registration-card";

    stats.forEach(([label, value]) => {
        const section = document.createElement("div");
        section.className = "property-result";

        const heading = document.createElement("h3");
        heading.textContent = label;

        const count = document.createElement("p");
        count.textContent = value;

        section.append(heading, count);
        card.appendChild(section);
    });

    dashboardStats.appendChild(card);
}


// Display owner's properties
function displayProperties(properties) {

    propertiesContainer.replaceChildren();

    if (properties.length === 0) {
        propertiesContainer.textContent =
            "You have not listed any properties yet.";
        return;
    }

    properties.forEach(property => {

        const card = document.createElement("div");
        card.className = "property-result";

        const title = document.createElement("h3");
        title.textContent = property.title;

        const location = document.createElement("p");
        location.textContent = `Location: ${property.location}`;

        const rent = document.createElement("p");
        rent.textContent = `Monthly Rent: ₹${property.rent}`;

        const room = document.createElement("p");
        room.textContent = `Room Type: ${property.roomType}`;

        card.append(title, location, rent, room);
        propertiesContainer.appendChild(card);
    });
}


// Display recent booking requests
function displayBookings(bookings) {

    bookingsContainer.replaceChildren();

    if (bookings.length === 0) {
        bookingsContainer.textContent =
            "No booking requests received yet.";
        return;
    }

    bookings.forEach(booking => {

        const card = document.createElement("div");
        card.className = "property-result";

        const studentName = document.createElement("h3");
        studentName.textContent =
            booking.student?.name || "Student information unavailable";

        const email = document.createElement("p");
        email.textContent =
            `Student Email: ${booking.student?.email || "Unavailable"}`;

        const property = document.createElement("p");
        property.textContent =
            `Property: ${booking.property?.title || "Unavailable"}`;

        const location = document.createElement("p");
        location.textContent =
            `Location: ${booking.property?.location || "Unavailable"}`;

        const moveInDate = document.createElement("p");
        moveInDate.textContent =
            `Move-in Date: ${new Date(booking.moveInDate).toLocaleDateString()}`;

        const message = document.createElement("p");
        message.textContent =
            `Message: ${booking.message || "No message provided"}`;

        const status = document.createElement("p");
        status.textContent = `Status: ${booking.status}`;

        card.append(
            studentName,
            email,
            property,
            location,
            moveInDate,
            message,
            status
        );

        bookingsContainer.appendChild(card);
    });
}


loadOwnerDashboard();
