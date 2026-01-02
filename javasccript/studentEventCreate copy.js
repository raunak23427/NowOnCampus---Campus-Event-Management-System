// Tab functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Admin management
// Show edit password form when edit button is clicked
// Show Edit Admin Password Modal
document.getElementById('admins-tbody').addEventListener('click', function(e) {
    if (e.target.closest('.action-btn.edit')) {
        const btn = e.target.closest('.action-btn.edit');
        const email = btn.getAttribute('data-email');
        document.getElementById('edit-admin-email').value = email;
        document.getElementById('edit-admin-password-modal').style.display = 'flex';
    }
});

// Hide Edit Admin Password Modal
document.getElementById('edit-admin-password-cancel').addEventListener('click', () => {
    document.getElementById('edit-admin-password-modal').style.display = 'none';
    document.getElementById('edit-admin-password-form').reset();
});

// Handle edit password form submission
document.getElementById('edit-admin-password-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('edit-admin-email').value;
    const password = document.getElementById('edit-admin-password').value;
    const confirm = document.getElementById('edit-admin-confirm').value;

    if (password !== confirm) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/updateAdminPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            const form = document.getElementById('edit-admin-password-form');
            form.style.display = 'none';
            form.reset();
        } else {
            alert(data.error || 'Error updating password');
        }
    } catch (err) {
        alert('Server error');
    }
});

// Handle delete button click for admins
document.getElementById('admins-tbody').addEventListener('click', async function(e) {
    if (e.target.closest('.action-btn.delete')) {
        const btn = e.target.closest('.action-btn.delete');
        const email = btn.getAttribute('data-email');
        if (confirm('Are you sure you want to delete this admin?')) {
            try {
                const response = await fetch('http://localhost:3000/deleteAdmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadAdmins();
                } else {
                    alert(data.error || 'Error deleting admin');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});

// Show Create Admin Modal
document.getElementById('btn-create-admin').addEventListener('click', () => {
    document.getElementById('create-admin-modal').style.display = 'flex';
});

// Hide Create Admin Modal
document.getElementById('create-admin-cancel').addEventListener('click', () => {
    document.getElementById('create-admin-modal').style.display = 'none';
    document.getElementById('create-admin-form').reset();
});

// Handle form submission
document.getElementById('create-admin-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const confirm = document.getElementById('admin-confirm').value;

    if (password !== confirm) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/createAdmin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Reload or fetch updated list
            const form = document.getElementById('create-admin-form');
            form.style.display = 'none';
            form.reset();
            loadAdmins();
        } else {
            alert(data.error || 'Error creating admin');
        }
    } catch (err) {
        alert('Server error');
    }
});

// Function to render admins
async function loadAdmins() {
    const tbody = document.getElementById('admins-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const res = await fetch('http://localhost:3000/admins');
        const admins = await res.json();
        if (admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No admins found.</td></tr>';
            return;
        }
        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>${admin.name}</td>
                <td>${admin.email}</td>
                <td><span class="role-badge admin">Admin</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" title="Edit" data-email="${admin.email}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" data-email="${admin.email}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4">Failed to load admins.</td></tr>';
    }
}
// Call loadAdmins on page load and after creating an admin
document.addEventListener('DOMContentLoaded', loadAdmins);

//////////////////////////////////////////////////////////////////////////////////////////////////
//student management
// Function to render students
async function loadStudents() {
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const res = await fetch('http://localhost:3000/students');
        const students = await res.json();
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No students found.</td></tr>';
            return;
        }
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td><span class="role-badge student">Student</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" title="Edit" data-email="${student.email}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" data-email="${student.email}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4">Failed to load students.</td></tr>';
    }
}
// Call loadStudents on page load
document.addEventListener('DOMContentLoaded', loadStudents);

// Show Edit Student Password Modal
document.getElementById('students-tbody').addEventListener('click', function(e) {
    if (e.target.closest('.action-btn.edit')) {
        const btn = e.target.closest('.action-btn.edit');
        const email = btn.getAttribute('data-email');
        document.getElementById('edit-student-email').value = email;
        document.getElementById('edit-student-password-modal').style.display = 'flex';
    }
});

// Hide Edit Student Password Modal
document.getElementById('edit-student-password-cancel').addEventListener('click', () => {
    document.getElementById('edit-student-password-modal').style.display = 'none';
    document.getElementById('edit-student-password-form').reset();
});

// Handle edit student password form submission
document.getElementById('edit-student-password-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('edit-student-email').value;
    const password = document.getElementById('edit-student-password').value;
    const confirm = document.getElementById('edit-student-confirm').value;

    if (password !== confirm) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/updateStudentPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            const form = document.getElementById('edit-student-password-form');
            form.style.display = 'none';
            form.reset();
        } else {
            alert(data.error || 'Error updating password');
        }
    } catch (err) {
        alert('Server error');
    }
});

// Handle delete button click for students
document.getElementById('students-tbody').addEventListener('click', async function(e) {
    if (e.target.closest('.action-btn.delete')) {
        const btn = e.target.closest('.action-btn.delete');
        const email = btn.getAttribute('data-email');
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                const response = await fetch('http://localhost:3000/deleteStudent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadStudents();
                } else {
                    alert(data.error || 'Error deleting student');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////
//event management
// Show the Create Event popup
document.querySelector('.tab-pane#events-tab .btn-create').addEventListener('click', () => {
    document.getElementById('create-event-modal').style.display = 'flex';
});

// Hide the popup on cancel
document.getElementById('create-event-cancel').addEventListener('click', () => {
    document.getElementById('create-event-modal').style.display = 'none';
    document.getElementById('create-event-form').reset();
});

// Handle form submission
document.getElementById('create-event-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    // Gather form data
    const name = document.getElementById('event-name').value.trim();
    const startDate = document.getElementById('event-start-date').value;
    const endDate = document.getElementById('event-end-date').value;
    const startTime = document.getElementById('event-start-time').value;
    const endTime = document.getElementById('event-end-time').value;
    const venue = document.getElementById('event-venue').value.trim();
    const type = document.getElementById('event-type').value.trim() || 'unlisted';
    const department = document.getElementById('event-department').value.trim();
    const capacity = document.getElementById('event-capacity').value;
    const organiser = document.getElementById('event-organiser').value.trim();
    const agenda = document.getElementById('event-agenda').value.trim();
    const description = document.getElementById('event-description').value.trim();
    const user  = JSON.parse(localStorage.getItem('user'));
    const created_by = user ? user.id : null

    // Get approver emails
    const approver1_email = document.getElementById('approver1-email').value.trim();
    const approver2_email = document.getElementById('approver2-email').value.trim();
    const approver3_email = document.getElementById('approver3-email').value.trim();

    if(!created_by){
        alert("You must be logged in to create a event");
        return;
    }

    // Combine date and time for start and end
    const start_datetime = `${startDate}T${startTime}`;
    const end_datetime = `${endDate}T${endTime}`;

    try {
        const response = await fetch('http://localhost:3000/createEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: name,
                start_datetime,
                end_datetime,
                venue,
                event_type: type,
                department,
                capacity,
                organiser_name: organiser,
                agenda,
                description,
                created_by,
                approver_emails: [approver1_email, approver2_email, approver3_email]
            })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('create-event-modal').style.display = 'none';
            document.getElementById('create-event-form').reset();
            loadEvents();
            // Optionally, reload events here
        } else {
            alert(data.error || 'Error creating event');
        }
    } catch (err) {
        alert('Server error');
    }
});


// Dropdown toggle
let currentEventFilter = 'all';
const filterBtn = document.getElementById('event-filter-btn');
const filterMenu = document.getElementById('event-filter-menu');
filterBtn.addEventListener('click', () => {
    filterMenu.style.display = filterMenu.style.display === 'block' ? 'none' : 'block';
});
document.addEventListener('click', (e) => {
    if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
        filterMenu.style.display = 'none';
    }
});

// Filtering logic
// Mapping for button text
const filterNames = {
    all: 'All Events',
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    past: 'Past',
    cancelled: 'Cancelled'
};

filterMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        currentEventFilter = item.getAttribute('data-filter');
        filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${filterNames[currentEventFilter]} <i class="fas fa-caret-down"></i>`;
        filterMenu.style.display = 'none';
        loadEvents();
    });
});

// Set initial button text
filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${filterNames[currentEventFilter]} <i class="fas fa-caret-down"></i>`;

// Function to render events
async function loadEvents() {
    const tbody = document.getElementById('events-tbody');
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        tbody.innerHTML = '<tr><td colspan="7">Please log in to view your created events.</td></tr>';
        return;
    }
    const userId = user.id;
    try {
        const res = await fetch(`http://localhost:3000/events?created_by=${userId}`);
        let events = await res.json();
        if (!Array.isArray(events)) events = [];

        // Filter events according to currentEventFilter
        if (currentEventFilter !== 'all') {
            events = events.filter(event => {
                // If your DB has event_status, use it directly:
                if (event.event_status) {
                    return event.event_status === currentEventFilter;
                }
                // Fallback: calculate status on frontend
                const now = new Date();
                const start = new Date(event.start_datetime);
                const end = new Date(event.end_datetime);
                if (currentEventFilter === 'upcoming') {
                    return start > now;
                }
                if (currentEventFilter === 'ongoing') {
                    return start <= now && end >= now;
                }
                if (currentEventFilter === 'past') {
                    return end < now;
                }
                if (currentEventFilter === 'cancelled') {
                    return event.event_status === 'cancelled';
                }
                return true;
            });
        }

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No events found.</td></tr>';
            return;
        }
        tbody.innerHTML = events.map(event => {
            // Format date and time
            const start = new Date(event.start_datetime);
            const end = new Date(event.end_datetime);
            const dateStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            const timeStr = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            // Status badge
            let status = event.event_status || 'open';
            let statusClass = 'open';
            if (status === 'upcoming') statusClass = 'upcoming';
            else if (status === 'ongoing') statusClass = 'ongoing';
            else if (status === 'past') statusClass = 'past';
            else if (status === 'cancelled') statusClass = 'cancelled';
            return `
                <tr>
                    <td>
                        <div class="event-info">
                            <div class="event-name">${event.event_name}</div>
                        </div>
                    </td>
                    <td>
                        <div class="date-time">
                            <div>${dateStr}</div>
                            <div class="time">${timeStr}</div>
                        </div>
                    </td>
                    <td>${event.venue}</td>
                    <td>${event.capacity}</td>
                    <td>${event.registrations}</td>
                    <td><span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" title="Edit" data-id="${event.event_id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" title="cancel" data-id="${event.event_id}">
                                <i class="fas fa-times-circle"></i>
                            </button>
                            <button class="action-btn delete" title="Delete" data-id="${event.event_id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7">Failed to load events.</td></tr>';
    }
}
// Call loadEvents on page load and after creating an event
document.addEventListener('DOMContentLoaded', loadEvents);

// Handle cancel and delete button click for events
document.getElementById('events-tbody').addEventListener('click', async function(e) {
    // Cancel event
    if (e.target.closest('.action-btn[title="cancel"]')) {
        const btn = e.target.closest('.action-btn[title="cancel"]');
        const event_id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to cancel this event?')) {
            try {
                const response = await fetch('http://localhost:3000/cancelEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadEvents();
                } else {
                    alert(data.error || 'Error cancelling event');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
    // Delete event
    if (e.target.closest('.action-btn[title="Delete"]')) {
        const btn = e.target.closest('.action-btn[title="Delete"]');
        const event_id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this event?')) {
            try {
                const response = await fetch('http://localhost:3000/deleteEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadEvents();
                } else {
                    alert(data.error || 'Error deleting event');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});
// Show edit event modal and populate fields
document.getElementById('events-tbody').addEventListener('click', async function(e) {
    if (e.target.closest('.action-btn.edit')) {
        const btn = e.target.closest('.action-btn.edit');
        const event_id = btn.getAttribute('data-id');
        // Fetch event details from backend
        try {
            const res = await fetch(`http://localhost:3000/event/${event_id}`);
            const event = await res.json();
            if (!event || !event.event_id) {
                alert('Failed to fetch event details');
                return;
            }
            document.getElementById('edit-event-id').value = event.event_id;
            document.getElementById('edit-event-name').value = event.event_name;
            document.getElementById('edit-event-start-date').value = event.start_datetime.slice(0,10);
            document.getElementById('edit-event-end-date').value = event.end_datetime.slice(0,10);
            document.getElementById('edit-event-start-time').value = event.start_datetime.slice(11,16);
            document.getElementById('edit-event-end-time').value = event.end_datetime.slice(11,16);
            document.getElementById('edit-event-venue').value = event.venue;
            document.getElementById('edit-event-type').value = event.event_type || '';
            document.getElementById('edit-event-department').value = event.department || '';
            document.getElementById('edit-event-capacity').value = event.capacity;
            document.getElementById('edit-event-organiser').value = event.organiser_name || '';
            document.getElementById('edit-event-agenda').value = event.agenda || '';
            document.getElementById('edit-event-description').value = event.description || '';
            document.getElementById('edit-event-modal').style.display = 'flex';
            document.getElementById('edit-event-status').value = event.event_status || 'upcoming';
        } catch (err) {
            alert('Server error');
        }
    }
});

// Hide edit modal on cancel
document.getElementById('edit-event-cancel').addEventListener('click', () => {
    document.getElementById('edit-event-modal').style.display = 'none';
    document.getElementById('edit-event-form').reset();
});

// Handle edit event form submission
document.getElementById('edit-event-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const event_id = document.getElementById('edit-event-id').value;
    const event_name = document.getElementById('edit-event-name').value.trim();
    const start_date = document.getElementById('edit-event-start-date').value;
    const end_date = document.getElementById('edit-event-end-date').value;
    const start_time = document.getElementById('edit-event-start-time').value;
    const end_time = document.getElementById('edit-event-end-time').value;
    const venue = document.getElementById('edit-event-venue').value.trim();
    const event_type = document.getElementById('edit-event-type').value.trim() || 'unlisted';
    const department = document.getElementById('edit-event-department').value.trim();
    const capacity = document.getElementById('edit-event-capacity').value;
    const organiser_name = document.getElementById('edit-event-organiser').value.trim();
    const agenda = document.getElementById('edit-event-agenda').value.trim();
    const description = document.getElementById('edit-event-description').value.trim();
    const event_status = document.getElementById('edit-event-status').value;
    const start_datetime = `${start_date}T${start_time}`;
    const end_datetime = `${end_date}T${end_time}`;

    try {
        const response = await fetch('http://localhost:3000/updateEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_id,
                event_name,
                start_datetime,
                end_datetime,
                venue,
                event_type,
                department,
                capacity,
                organiser_name,
                agenda,
                description,
                event_status
            })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('edit-event-modal').style.display = 'none';
            document.getElementById('edit-event-form').reset();
            loadEvents();
        } else {
            alert(data.error || 'Error updating event');
        }
    } catch (err) {
        alert('Server error');
    }
});

// Fetch and display statistics
async function loadStats() {
    try {
        const res = await fetch('http://localhost:3000/adminStats');
        const stats = await res.json();
        document.getElementById('stat-total-events').textContent = stats.totalEvents ?? 0;
        document.getElementById('stat-active-events').textContent = stats.activeEvents ?? 0;
        document.getElementById('stat-total-admins').textContent = stats.totalAdmins ?? 0;
        document.getElementById('stat-total-students').textContent = stats.totalStudents ?? 0;
    } catch (err) {
        // Optionally handle error
    }
}
document.addEventListener('DOMContentLoaded', loadStats);

// Allow closing any modal by clicking the overlay (outside the form)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.style.display = 'none';
            const form = overlay.querySelector('form');
            if (form) form.reset();
        }
    });
});

