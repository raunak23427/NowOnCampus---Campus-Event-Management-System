// View toggle functionality
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Favorite toggle functionality
document.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', function() {
        const icon = this.querySelector('.favorite-icon');
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            this.classList.add('favorited');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            this.classList.remove('favorited');
        }
    });
});

// Search functionality
document.querySelector('.search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('.event-card').forEach(card => {
        const title = card.querySelector('.event-title').textContent.toLowerCase();
        const description = card.querySelector('.event-description').textContent.toLowerCase();
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function (e) {
        // Prevent navigation if clicking on a star or inside the rating area
        if (e.target.classList.contains('star-icon') || e.target.closest('.event-rating')) {
            return; // Ignore clicks on stars or rating area
        }
        // If clicked element is inside a button, don't navigate
        if (!e.target.closest('button')) {
            window.location.href = 'event_details.html';
        }
    });
});

// Fetch and render events from the database
async function loadEvents(filterStatus = '', searchTerm = '', wishlistedIds = [], registeredIds = []) {
    const grid = document.getElementById('events-grid');
    grid.innerHTML = 'Loading...';
    try {
        const res = await fetch('http://localhost:3000/events');
        let events = await res.json();
        if (!Array.isArray(events) || events.length === 0) {
            grid.innerHTML = '<div>No events found.</div>';
            return;
        }

        // Fetch review summary
        const reviewsSummary = await fetchEventReviewsSummary();

        // Filter by status if filterStatus is set
        if (filterStatus) {
            events = events.filter(event => {
                let status = (event.event_status || '').toLowerCase();
                return status === filterStatus.toLowerCase();
            });
        }

        // Filter by search term if set
        if (searchTerm) {
            events = events.filter(event => {
                const title = (event.event_name || '').toLowerCase();
                const description = (event.description || '').toLowerCase();
                return title.includes(searchTerm) || description.includes(searchTerm);
            });
        }

        grid.innerHTML = events.map(event => {
            const isFavorited = wishlistedIds.includes(String(event.event_id));
            const favoriteBtnClass = isFavorited ? 'btn-favorite favorited' : 'btn-favorite';
            const favoriteIconClass = isFavorited ? 'favorite-icon fas' : 'favorite-icon far';
            const isRegistered = registeredIds.includes(String(event.event_id));
            const registerBtnClass = isRegistered ? 'btn-register registered' : 'btn-register';
            const registerBtnContent = isRegistered
                ? '<i class="fas fa-check register-icon"></i> Registered'
                : '<i class="fas fa-user-plus register-icon"></i> Register';
            const start = new Date(event.start_datetime);
            const dateStr = `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const typeBadge = event.event_type ? `<span class="event-type ${event.event_type.toLowerCase()}">${event.event_type}</span>` : '';
            const statusBadge = event.event_status ? `<span class="event-status ${event.event_status.toLowerCase()}">${event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)}</span>` : '';
            const dept = event.department || '-';
            const summary = reviewsSummary[event.event_id] || { avg_rating: '0.0', total_reviews: 0 };
            return `
                <div class="event-card" data-event-id="${event.event_id}">
                    <div class="event-icon-wrapper">
                        <div class="event-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="event-content">
                        <div class="event-badges">
                            ${typeBadge}
                            ${statusBadge}
                        </div>
                        <h3 class="event-title">${event.event_name}</h3>
                        <p class="event-description">${event.description}</p>
                        <div class="event-details">
                            <div class="event-detail">
                                <i class="fas fa-calendar-alt detail-icon"></i>
                                <span class="detail-text">${dateStr}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-map-marker-alt detail-icon"></i>
                                <span class="detail-text">${event.venue}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-users detail-icon"></i>
                                <span class="detail-text">${dept}</span>
                            </div>
                        </div>
                        <div class="event-actions">
                            <button class="${registerBtnClass}">
                                ${registerBtnContent}
                            </button>
                            <button class="${favoriteBtnClass}">
                                <i class="${favoriteIconClass} fa-heart"></i>
                            </button>
                        </div>
                        <div class="event-review-summary">
                            <span>
                                <i class="fas fa-star" style="color:gold"></i>
                                ${summary.avg_rating} (${summary.total_reviews} review${summary.total_reviews == 1 ? '' : 's'})
                            </span>
                        </div>
                        
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        grid.innerHTML = '<div>Failed to load events.</div>';
    }
}


// After rendering cards, add event listeners:
document.getElementById('events-grid').addEventListener('click', function(e) {
    // Star selection (just highlight, do not submit)
    if (e.target.classList.contains('star-icon')) {
        e.stopPropagation();
        e.preventDefault();
        const stars = e.target.parentElement.querySelectorAll('.star-icon');
        const selected = parseInt(e.target.getAttribute('data-value'));
        stars.forEach((star, idx) => {
            star.classList.toggle('fa-solid', idx < selected);
            star.classList.toggle('fa-regular', idx >= selected);
        });
        // Store selected rating on parent for submit
        e.target.parentElement.setAttribute('data-selected', selected);
        return;
    }

    // Submit review button
    if (e.target.classList.contains('btn-submit-review')) {
        e.stopPropagation();
        e.preventDefault();
        const ratingDiv = e.target.closest('.event-rating');
        const stars = ratingDiv.querySelector('.stars');
        const eventId = ratingDiv.getAttribute('data-event-id');
        const selected = stars.getAttribute('data-selected');
        const msg = ratingDiv.querySelector('.review-msg');
        if (!selected) {
            msg.textContent = 'Please select a rating!';
            msg.style.color = 'red';
            setTimeout(() => { msg.textContent = ''; }, 2000);
            return;
        }
        fetch('http://localhost:3000/api/rate-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, rating: selected, userId: currentUserId })
        })
        .then(res => res.json())
        .then(data => {
            msg.textContent = 'Review submitted!';
            msg.style.color = 'green';
            setTimeout(() => { msg.textContent = ''; }, 2000);
        })
        .catch(err => {
            msg.textContent = 'Error submitting rating.';
            msg.style.color = 'red';
            setTimeout(() => { msg.textContent = ''; }, 2000);
        });
        return;
    }

    // 2. Handle event card navigation (only if not clicking on a star)
    const card = e.target.closest('.event-card');
    // Prevent navigation if clicking inside the rating area (stars or submit button)
    if (
        card &&
        !e.target.closest('.event-rating') && // not clicking inside rating area
        !e.target.classList.contains('star-icon') &&
        !e.target.classList.contains('btn-submit-review')
    ) {
        const eventId = card.getAttribute('data-event-id');
        window.location.href = `event_details.html?event_id=${eventId}`;
    }
});

// Helper: get current user ID (replace with your actual logic)
const user = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = user.id;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('events-grid').addEventListener('click', function(e) {
        if (e.target.classList.contains('fa-star')) {
            const stars = e.target.parentElement;
            const eventId = stars.getAttribute('data-event-id');
            const rating = e.target.getAttribute('data-value');
            // Optionally highlight stars
            Array.from(stars.children).forEach((star, idx) => {
                star.classList.toggle('fa-solid', idx < rating);
                star.classList.toggle('fa-regular', idx >= rating);
            });
            // Send rating to backend
            fetch('http://localhost:3000/api/rate-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, rating, userId: currentUserId })
            })
            .then(res => res.json())
            .then(data => alert('Thank you for rating!'))
            .catch(err => alert('Error submitting rating.'));
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    let currentFilter = '';
    let currentSearch = '';
    let wishlistedIds = await fetchUserWishlist(currentUserId);
    let registeredIds = await fetchUserRegisteredEvents(currentUserId);

    function updateEvents() {
        loadEvents(currentFilter, currentSearch, wishlistedIds, registeredIds);
    }

    const statusSelect = document.querySelector('.filter-select');
    const searchInput = document.querySelector('.search-input');

    statusSelect.addEventListener('change', function() {
        currentFilter = this.value;
        updateEvents();
    });

    searchInput.addEventListener('input', function() {
        currentSearch = this.value.toLowerCase();
        updateEvents();
    });

    updateEvents();
});

// Delegate register and wishlist button click
document.getElementById('events-grid').addEventListener('click', async function(e) {
    // Register/Unregister toggle
    if (e.target.closest('.btn-register')) {
        const btn = e.target.closest('.btn-register');
        const card = e.target.closest('.event-card');
        const eventId = card.getAttribute('data-event-id');
        const isRegistered = btn.classList.contains('registered');
        if (!isRegistered) {
            // Register
            try {
                const res = await fetch('http://localhost:3000/registerEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.add('registered');
                    btn.innerHTML = '<i class="fas fa-check register-icon"></i> Registered';
                    btn.disabled = false; // allow unregister
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (err) {
                alert('Server error');
            }
        } else {
            // Unregister
            try {
                const res = await fetch('http://localhost:3000/unregisterEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.remove('registered');
                    btn.innerHTML = '<i class="fas fa-user-plus register-icon"></i> Register';
                    btn.disabled = false;
                } else {
                    alert(data.error || 'Unregister failed');
                }
            } catch (err) {
                alert('Server error');
            }
        }
        return;
    }
    // Wishlist toggle
    if (e.target.closest('.btn-favorite')) {
        const btn = e.target.closest('.btn-favorite');
        const card = btn.closest('.event-card');
        const eventId = card.getAttribute('data-event-id');
        const isFavorited = btn.classList.contains('favorited');
        if (!isFavorited) {
            // Add to wishlist
            try {
                const res = await fetch('http://localhost:3000/wishlistEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.add('favorited');
                    btn.querySelector('.favorite-icon').classList.remove('far');
                    btn.querySelector('.favorite-icon').classList.add('fas');
                } else {
                    alert(data.error || 'Wishlist failed');
                }
            } catch (err) {
                alert('Server error');
            }
        } else {
            // Remove from wishlist
            try {
                const res = await fetch('http://localhost:3000/unwishlistEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.remove('favorited');
                    btn.querySelector('.favorite-icon').classList.remove('fas');
                    btn.querySelector('.favorite-icon').classList.add('far');
                } else {
                    alert(data.error || 'Remove from wishlist failed');
                }
            } catch (err) {
                alert('Server error');
            }
        }
        return;
    }

    const card = e.target.closest('.event-card');
    if (card) {
        const eventId = card.getAttribute('data-event-id');
        window.location.href = `event_details.html?event_id=${eventId}`;
    }
});

//for 
async function fetchUserWishlist(userId) {
    try {
        const res = await fetch(`http://localhost:3000/userWishlist?user_id=${userId}`);
        if (!res.ok) return [];
        const data = await res.json();
        // data is an array of objects: [{event_id: 1}, ...]
        return data.map(item => String(item.event_id));
    } catch (err) {
        return [];
    }
}

async function fetchUserRegisteredEvents(userId) {
    try {
        const res = await fetch(`http://localhost:3000/userRegisteredEvents?user_id=${userId}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map(item => String(item.event_id));
    } catch (err) {
        return [];
    }
}

async function fetchEventReviewsSummary() {
    try {
        const res = await fetch('http://localhost:3000/api/event-reviews-summary');
        if (!res.ok) return {};
        const data = await res.json();
        // Convert to {event_id: {avg_rating, total_reviews}}
        return data.reduce((acc, row) => {
            acc[row.event_id] = {
                avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : '0.0',
                total_reviews: row.total_reviews
            };
            return acc;
        }, {});
    } catch {
        return {};
    }
}

let selectedRating = 0;
let currentEventId = null;

// Open modal when "Rate/Review" button is clicked
document.getElementById('events-grid').addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-rate-event')) {
    currentEventId = e.target.getAttribute('data-event-id');
    document.getElementById('rate-modal').style.display = 'block';
    document.getElementById('modal-review-msg').textContent = '';
    // Reset stars
    document.querySelectorAll('#modal-stars .star-icon').forEach(star => {
      star.classList.remove('fa-solid');
      star.classList.add('fa-regular');
    });
    selectedRating = 0;
  }
});

// Handle star selection in modal
document.querySelectorAll('#modal-stars .star-icon').forEach(star => {
  star.addEventListener('click', function() {
    selectedRating = parseInt(this.getAttribute('data-value'));
    document.querySelectorAll('#modal-stars .star-icon').forEach((s, idx) => {
      if (idx < selectedRating) {
        s.classList.add('fa-solid');
        s.classList.remove('fa-regular');
      } else {
        s.classList.remove('fa-solid');
        s.classList.add('fa-regular');
      }
    });
  });
});

// Submit review from modal
document.getElementById('submit-rating-btn').addEventListener('click', function() {
  if (!selectedRating) {
    document.getElementById('modal-review-msg').textContent = 'Please select a rating!';
    document.getElementById('modal-review-msg').style.color = 'red';
    return;
  }
  fetch('http://localhost:3000/api/rate-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: currentEventId, rating: selectedRating, userId: currentUserId })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('modal-review-msg').textContent = 'Review submitted!';
    document.getElementById('modal-review-msg').style.color = 'green';
    setTimeout(() => {
      document.getElementById('rate-modal').style.display = 'none';
    }, 1200);
  })
  .catch(err => {
    document.getElementById('modal-review-msg').textContent = 'Error submitting rating.';
    document.getElementById('modal-review-msg').style.color = 'red';
  });
});


// Close modal
document.getElementById('close-modal').onclick = function() {
  document.getElementById('rate-modal').style.display = 'none';
};

// Student Events Logic
async function loadStudentEvents() {
    const res = await fetch('http://localhost:3000/api/student-events');
    const events = await res.json();
    const list = document.getElementById('student-events-list');
    if (!events.length) {
        list.innerHTML = '<div class="no-events">No student events yet.</div>';
        return;
    }
    list.innerHTML = events.map(ev => `
        <div class="student-event-card">
            <h4>${ev.event_name}</h4>
            <div class="student-event-meta">
                <span><i class="fas fa-user"></i> ${ev.student_name}</span>
                <span><i class="fas fa-calendar-alt"></i> ${new Date(ev.event_date).toLocaleString()}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${ev.location || 'N/A'}</span>
            </div>
            <div class="student-event-desc">${ev.description || ''}</div>
        </div>
    `).join('');
}

document.getElementById('submit-student-event-btn').onclick = async function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    const name = document.getElementById('student-event-name').value.trim();
    const date = document.getElementById('student-event-date').value;
    const location = document.getElementById('student-event-location').value.trim();
    const desc = document.getElementById('student-event-description').value.trim();
    const msg = document.getElementById('student-event-msg');
    if (!userId) {
        msg.textContent = 'You must be logged in as a student to add events.';
        msg.style.color = 'red';
        return;
    }
    if (!name || !date) {
        msg.textContent = 'Event name and date are required.';
        msg.style.color = 'red';
        return;
    }
    const res = await fetch('http://localhost:3000/api/student-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            event_name: name,
            description: desc,
            event_date: date,
            location
        })
    });
    if (res.ok) {
        msg.textContent = 'Event added!';
        msg.style.color = 'green';
        document.getElementById('student-event-name').value = '';
        document.getElementById('student-event-date').value = '';
        document.getElementById('student-event-location').value = '';
        document.getElementById('student-event-description').value = '';
        loadStudentEvents();
    } else {
        msg.textContent = 'Failed to add event.';
        msg.style.color = 'red';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // ...other code...

    async function loadStudentEvents() {
        const res = await fetch('http://localhost:3000/api/student-events');
        const events = await res.json();
        const list = document.getElementById('student-events-list');
        if (!events.length) {
            list.innerHTML = '<div class="no-events">No student events yet.</div>';
            return;
        }
        list.innerHTML = events.map(ev => `
            <div class="student-event-card">
                <h4>${ev.event_name}</h4>
                <div class="student-event-meta">
                    <span><i class="fas fa-user"></i> ${ev.student_name}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${new Date(ev.event_date).toLocaleString()}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${ev.location || 'N/A'}</span>
                </div>
                <div class="student-event-desc">${ev.description || ''}</div>
            </div>
        `).join('');
    }

    const addBtn = document.getElementById('submit-student-event-btn');
    if (addBtn) {
        addBtn.onclick = async function() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;
            const name = document.getElementById('student-event-name').value.trim();
            const date = document.getElementById('student-event-date').value;
            const location = document.getElementById('student-event-location').value.trim();
            const desc = document.getElementById('student-event-description').value.trim();
            const msg = document.getElementById('student-event-msg');
            if (!userId) {
                msg.textContent = 'You must be logged in as a student to add events.';
                msg.style.color = 'red';
                return;
            }
            if (!name || !date) {
                msg.textContent = 'Event name and date are required.';
                msg.style.color = 'red';
                return;
            }
            const res = await fetch('http://localhost:3000/api/student-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    event_name: name,
                    description: desc,
                    event_date: date,
                    location
                })
            });
            if (res.ok) {
                msg.textContent = 'Event added!';
                msg.style.color = 'green';
                document.getElementById('student-event-name').value = '';
                document.getElementById('student-event-date').value = '';
                document.getElementById('student-event-location').value = '';
                document.getElementById('student-event-description').value = '';
                loadStudentEvents();
            } else {
                msg.textContent = 'Failed to add event.';
                msg.style.color = 'red';
            }
        };
    }

    loadStudentEvents();
});


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('timetable-upload-form').onsubmit = async function(e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const user_id = user.id;
        const year = document.getElementById('year-select').value;
        const course = document.getElementById('course-select').value;
        const fileInput = document.getElementById('timetable-pdf');
        const msg = document.getElementById('timetable-upload-msg');
        if (!user_id) {
            msg.textContent = 'You must be logged in to upload.';
            msg.style.color = 'red';
            return;
        }
        if (!year || !course || !fileInput.files.length) {
            msg.textContent = 'All fields are required.';
            msg.style.color = 'red';
            return;
        }
        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('year', year);
        formData.append('course', course);
        formData.append('timetable', fileInput.files[0]);
        const res = await fetch('http://localhost:3000/api/upload-timetable', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            msg.textContent = 'Timetable uploaded and notifications enabled!';
            msg.style.color = 'green';
        } else {
            msg.textContent = 'Upload failed.';
            msg.style.color = 'red';
        }
    };
});

/*
bugs:

i think there is a error
suppose i register an event and it is shown as registered and that event is an upcoming event
but when i filter on upcoming event, that same event is shown as unregistered eveent hough it is registered
*/