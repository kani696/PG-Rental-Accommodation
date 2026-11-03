
const propertyDetails = document.getElementById("propertyDetails");

const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");

let selectedRating = 0;

// Load property details
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

        // Contact Owner
        const contactLink = document.createElement("a");
        contactLink.href =
            `contact-owner.html?id=${encodeURIComponent(property._id)}`;
        contactLink.textContent = "Contact Owner";

        propertyDetails.appendChild(contactLink);

        // Booking section
        const heading = document.createElement("h2");
        heading.textContent = "Book This PG";
        propertyDetails.appendChild(heading);

        if ((property.availability || "Available") === "Available") {
            createBookingForm(property);
        } else {
            const unavailable = document.createElement("p");
            unavailable.textContent =
                "This property is currently unavailable.";
            propertyDetails.appendChild(unavailable);
        }

        // Load reviews
        await loadReviews();

        // Review form
        createReviewForm(property);

    } catch (error) {
        console.error("Property details error:", error);
        propertyDetails.textContent = "Unable to connect to the server.";
    }
}


// Create booking form
function createBookingForm(property) {
    const form = document.createElement("form");
    form.id = "bookingForm";

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Move-in Date: ";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "moveInDate";
    dateInput.required = true;

    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().split("T")[0];

    dateLabel.appendChild(dateInput);

    const messageLabel = document.createElement("label");
    messageLabel.textContent = "Message (optional): ";

    const messageInput = document.createElement("textarea");
    messageInput.id = "bookingMessage";
    messageInput.placeholder = "Write a message to the owner...";

    messageLabel.appendChild(messageInput);

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Send Booking Request";

    const result = document.createElement("p");
    result.id = "bookingResult";

    form.append(
        dateLabel,
        document.createElement("br"),
        messageLabel,
        document.createElement("br"),
        submitButton,
        result
    );

    propertyDetails.appendChild(form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login as a student to book this property.");
            window.location.href = "login.html";
            return;
        }

        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (user.role !== "student") {
            result.textContent =
                "Only students can send booking requests.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const response = await fetch(
                "http://localhost:5000/api/bookings",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        propertyId: property._id,
                        moveInDate: dateInput.value,
                        message: messageInput.value
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Booking failed.");
            }

            result.textContent =
                "Booking request submitted successfully!";

            form.reset();

        } catch (error) {
            result.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send Booking Request";
        }
    });
}


// Display rating stars
function displayStars(rating) {
    const roundedRating = Math.round(Number(rating));

    return "★".repeat(roundedRating) +
        "☆".repeat(5 - roundedRating);
}


// Load property reviews
async function loadReviews() {
    const summary = document.getElementById("ratingSummary");
    const reviewsList = document.getElementById("reviewsList");

    try {
        const response = await fetch(
            `http://localhost:5000/api/reviews/${encodeURIComponent(propertyId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load reviews");
        }

        summary.replaceChildren();

        const ratingText = document.createElement("h3");
        ratingText.textContent =
            `${data.averageRating} / 5 ${displayStars(data.averageRating)}`;

        const countText = document.createElement("p");
        countText.textContent =
            `${data.totalReviews} reviews`;

        summary.append(ratingText, countText);

        reviewsList.replaceChildren();

        if (data.reviews.length === 0) {
            reviewsList.textContent = "No reviews yet. Be the first!";
            return;
        }

        data.reviews.forEach((review) => {
            const card = document.createElement("div");
            card.className = "review-card";

            const name = document.createElement("strong");
            name.textContent =
                review.student?.name || "Student";

            const stars = document.createElement("p");
            stars.className = "stars";
            stars.textContent = displayStars(review.rating);

            const comment = document.createElement("p");
            comment.textContent = review.comment;

            const date = document.createElement("small");
            date.textContent =
                new Date(review.createdAt).toLocaleDateString();

            card.append(name, stars, comment, date);
            reviewsList.appendChild(card);
        });

    } catch (error) {
        summary.textContent = "Unable to load ratings.";
        reviewsList.textContent = error.message;
    }
}


// Create review form
function createReviewForm(property) {
    const section = document.getElementById("reviewFormSection");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || user.role !== "student") {
        section.textContent =
            "Please login as a student to submit a review.";
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Write Your Review";

    const form = document.createElement("form");
    form.className = "review-form";

    const ratingLabel = document.createElement("p");
    ratingLabel.textContent = "Select your rating:";

    const starsContainer = document.createElement("div");
    starsContainer.className = "stars";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "☆";

        star.addEventListener("click", () => {
            selectedRating = i;

            const allStars = starsContainer.querySelectorAll(".star");

            allStars.forEach((item, index) => {
                item.textContent = index < i ? "★" : "☆";
            });
        });

        starsContainer.appendChild(star);
    }

    const comment = document.createElement("textarea");
    comment.placeholder = "Share your experience...";
    comment.required = true;
    comment.rows = 4;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit Review";

    const result = document.createElement("p");
    result.id = "reviewResult";

    form.append(
        ratingLabel,
        starsContainer,
        comment,
        submitButton,
        result
    );

    section.append(heading, form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (selectedRating === 0) {
            result.textContent = "Please select a star rating.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const response = await fetch(
                `http://localhost:5000/api/reviews/${encodeURIComponent(property._id)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        rating: selectedRating,
                        comment: comment.value
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Review submission failed.");
            }

            result.textContent = "Review submitted successfully!";

            form.reset();
            selectedRating = 0;

            starsContainer.querySelectorAll(".star").forEach((star) => {
                star.textContent = "☆";
            });

            await loadReviews();

        } catch (error) {
            result.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Review";
        }
    });
}


// Start
loadPropertyDetails();
