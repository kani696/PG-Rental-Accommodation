
const API_URL = "http://localhost:5000/api/notifications";

const token = localStorage.getItem("token");

const notificationList = document.getElementById("notificationList");

// Check login
if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
}

// Fetch notifications
async function loadNotifications() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const notifications = await response.json();

        if (!response.ok) {
            throw new Error(notifications.message || "Unable to load notifications");
        }

        notificationList.innerHTML = "";

        if (notifications.length === 0) {
            notificationList.innerHTML =
                '<p class="empty-message">You have no notifications yet 🔔</p>';
            return;
        }

        notifications.forEach(notification => {
            const card = document.createElement("div");

            card.className = notification.isRead
                ? "notification-card"
                : "notification-card unread";

            const message = document.createElement("p");
            message.className = "notification-message";
            message.textContent = notification.message;

            const date = document.createElement("p");
            date.className = "notification-date";
            date.textContent = new Date(notification.createdAt).toLocaleString();

            const details = document.createElement("div");
            details.appendChild(message);
            details.appendChild(date);

            card.appendChild(details);

            const button = document.createElement("button");
            button.className = "read-btn";
            button.textContent = notification.isRead
                ? "Read"
                : "Mark as Read";

            button.disabled = notification.isRead;

            button.addEventListener("click", () => {
                markAsRead(notification._id);
            });

            card.appendChild(button);

            notificationList.appendChild(card);
        });

    } catch (error) {
        notificationList.innerHTML =
            `<p class="empty-message">${error.message}</p>`;
    }
}


// Mark notification as read
async function markAsRead(id) {
    try {
        const response = await fetch(`${API_URL}/${id}/read`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to update notification");
        }

        loadNotifications();

    } catch (error) {
        alert(error.message);
    }
}


// Load notifications when page opens
if (token) {
    loadNotifications();
}
