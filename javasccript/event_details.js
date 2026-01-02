function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('event_id');
}

async function loadEventDetails() {
    const eventId = getEventIdFromUrl();
    if (!eventId) return;

    try {
        const res = await fetch(`http://localhost:3000/event/${eventId}`);
        if (!res.ok) {
            document.getElementById('event-title').textContent = 'Event not found';
            document.getElementById('event-description').innerHTML = '<p>Event not found.</p>';
            return;
        }
        const event = await res.json();
        const statusBadge = document.getElementById('event-status');
        if (statusBadge) {
            const status = (event.event_status || '').toLowerCase();
            statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusBadge.className = 'status-badge ' + status; // e.g., status-badge upcoming
        }

        // Fill all fields
        document.getElementById('event-title').textContent = event.event_name || '';
        document.getElementById('event-start').textContent = event.start_datetime
            ? new Date(event.start_datetime).toLocaleString()
            : '';
        document.getElementById('event-end').textContent = event.end_datetime
            ? new Date(event.end_datetime).toLocaleString()
            : '';
        document.getElementById('event-venue').textContent = event.venue || '';
        document.getElementById('event-organiser').textContent = event.organiser_name || '';
        document.getElementById('event-department').textContent = event.department || '';
        document.getElementById('event-registrations').textContent = event.registrations ?? '';
        document.getElementById('event-capacity').textContent = event.capacity ? `${event.capacity} attendees` : '';
        document.getElementById('event-type').textContent = event.event_type || '';

        // Description and agenda
        let descHtml = '';
        if (event.description) {
            descHtml += `<p>${event.description}</p>`;
        }
        if (event.agenda) {
            descHtml += `<h3>Agenda</h3><p>${event.agenda}</p>`;
        }
        document.getElementById('event-description').innerHTML = descHtml || '<p>No details available.</p>';
        updateActionButtons(eventId);
    } catch (err) {
        document.getElementById('event-title').textContent = 'Error loading event';
        document.getElementById('event-description').innerHTML = '<p>Failed to load event details.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    loadEventDetails();

    // Helper: get current user ID (replace with your actual logic)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id;
    const eventId = getEventIdFromUrl();

    // Hide review section for admins
    if (user.isAdmin) {
        const ratingSection = document.getElementById('event-rating-section');
        if (ratingSection) ratingSection.style.display = 'none';
        return;
    }

    let selectedRating = 0;
    const starsContainer = document.getElementById('detail-stars');
    const submitBtn = document.getElementById('detail-submit-review');
    const msgSpan = document.getElementById('detail-review-msg');

    // 1. Pre-fill previous review if exists
    if (currentUserId && eventId) {
        fetch(`http://localhost:3000/event/${eventId}/my-review/${currentUserId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.stars) {
                    selectedRating = data.stars;
                    // Highlight stars
                    starsContainer.querySelectorAll('.star-icon').forEach((s, idx) => {
                        if (idx < selectedRating) {
                            s.classList.add('fa-solid');
                            s.classList.remove('fa-regular');
                        } else {
                            s.classList.remove('fa-solid');
                            s.classList.add('fa-regular');
                        }
                    });
                    msgSpan.textContent = `You rated: ${selectedRating}/5 (you can update your review)`;
                    msgSpan.style.color = 'blue';
                }
            });
    }

    // 2. Star selection logic
    if (starsContainer && submitBtn && msgSpan) {
        const stars = starsContainer.querySelectorAll('.star-icon');
        // Hover effect
        stars.forEach((star, idx) => {
            star.addEventListener('mouseenter', function() {
                stars.forEach((s, i) => {
                    if (i <= idx) s.classList.add('fa-solid');
                    else s.classList.remove('fa-solid');
                });
            });
            star.addEventListener('mouseleave', function() {
                stars.forEach((s, i) => {
                    if (i < selectedRating) s.classList.add('fa-solid');
                    else s.classList.remove('fa-solid');
                });
            });
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.getAttribute('data-value'));
                stars.forEach((s, i) => {
                    if (i < selectedRating) s.classList.add('fa-solid');
                    else s.classList.remove('fa-solid');
                });
                msgSpan.textContent = '';
            });
        });

        // 3. Submit review logic (insert or update)
        submitBtn.addEventListener('click', function() {
            if (!currentUserId) {
                msgSpan.textContent = 'You must be logged in to submit a review.';
                msgSpan.style.color = 'red';
                return;
            }
            if (!selectedRating) {
                msgSpan.textContent = 'Please select a rating!';
                msgSpan.style.color = 'red';
                return;
            }
            fetch('http://localhost:3000/api/rate-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, rating: selectedRating, userId: currentUserId })
            })
            .then(res => res.json())
            .then(data => {
                msgSpan.textContent = 'Review submitted! (You can update your review anytime)';
                msgSpan.style.color = 'green';
            })
            .catch(err => {
                msgSpan.textContent = 'Error submitting rating.';
                msgSpan.style.color = 'red';
            });
        });
    }
});

// Fetch registration and wishlist status for this event
async function fetchUserEventStatus(eventId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id;
    const [regRes, wishRes] = await Promise.all([
        fetch(`http://localhost:3000/userRegisteredEvents?user_id=${currentUserId}`),
        fetch(`http://localhost:3000/userWishlist?user_id=${currentUserId}`)
    ]);
    const registeredEvents = await regRes.json();
    const wishlistedEvents = await wishRes.json();
    return {
        isRegistered: registeredEvents.some(ev => String(ev.event_id) === String(eventId)),
        isWishlisted: wishlistedEvents.some(ev => String(ev.event_id) === String(eventId))
    };
}

// Update button UI and handlers
async function updateActionButtons(eventId) {
    const registerBtn = document.getElementById('register-btn');
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (!registerBtn || !wishlistBtn) return;

    const { isRegistered, isWishlisted } = await fetchUserEventStatus(eventId);

    // Register button UI
    if (isRegistered) {
        registerBtn.classList.add('registered');
        registerBtn.innerHTML = '<i class="fas fa-check btn-icon"></i> Registered';
    } else {
        registerBtn.classList.remove('registered');
        registerBtn.innerHTML = '<i class="fas fa-user-plus btn-icon"></i> Register Now';
    }

    // Wishlist button UI
    const icon = wishlistBtn.querySelector('i');
    if (isWishlisted) {
        wishlistBtn.classList.add('wishlisted');
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        wishlistBtn.classList.remove('wishlisted');
        icon.classList.remove('fas');
        icon.classList.add('far');
    }

    // Register button click
    registerBtn.onclick = async function() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = user.id;
        if (!isRegistered) {
            // Register
            const res = await fetch('http://localhost:3000/registerEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Registration failed');
        } else {
            // Unregister
            const res = await fetch('http://localhost:3000/unregisterEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Unregister failed');
        }
    };

    // Wishlist button click
    wishlistBtn.onclick = async function() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = user.id;
        if (!isWishlisted) {
            // Add to wishlist
            const res = await fetch('http://localhost:3000/wishlistEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Failed to add to wishlist');
        } else {
            // Remove from wishlist
            const res = await fetch('http://localhost:3000/unwishlistEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Failed to remove from wishlist');
        }
    };
}

// Comments logic
const eventId = getEventIdFromUrl();
const user = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = user.id;

async function loadComments() {
    const res = await fetch(`http://localhost:3000/api/event-comments/${eventId}`);
    const comments = await res.json();
    const list = document.getElementById('comments-list');
    if (!comments.length) {
        list.innerHTML = '<div class="no-comments">No comments yet.</div>';
        return;
    }
    list.innerHTML = comments.map(c =>
        `<div class="comment" style="border-bottom:1px solid #eee;padding:8px 0;">
            <span class="comment-author" style="font-weight:bold;margin-right:8px;">${c.name}</span>
            <span class="comment-time" style="color:#888;font-size:0.9em;">${new Date(c.comment_time).toLocaleString()}</span>
            <div class="comment-text" style="margin:4px 0 0 0;">${c.comment}</div>
        </div>`
    ).join('');
}

document.getElementById('submit-comment-btn').onclick = async function() {
    const input = document.getElementById('comment-input');
    const msg = document.getElementById('comment-msg');
    const comment = input.value.trim();
    if (!currentUserId) {
        msg.textContent = 'You must be logged in to comment.';
        msg.style.color = 'red';
        return;
    }
    if (!comment) {
        msg.textContent = 'Comment cannot be empty.';
        msg.style.color = 'red';
        return;
    }
    const res = await fetch('http://localhost:3000/api/event-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId: currentUserId, comment })
    });
    if (res.ok) {
        input.value = '';
        msg.textContent = 'Comment posted!';
        msg.style.color = 'green';
        loadComments();
    } else {
        msg.textContent = 'Failed to post comment.';
        msg.style.color = 'red';
    }
};

loadComments();
