document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        document.body.innerHTML = '<h1>Please log in to access this page.</h1>';
        // Redirect to login page after a short delay
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    // Initial load of all sections
    loadMyLiveEvents();
    loadMyPendingEvents();
    loadMyApprovalRequests();

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Show/Hide Create Event Modal
    document.getElementById('btn-show-create-modal').addEventListener('click', () => {
        document.getElementById('create-event-modal').style.display = 'flex';
    });
    document.getElementById('create-event-cancel').addEventListener('click', () => {
        document.getElementById('create-event-modal').style.display = 'none';
        document.getElementById('create-event-form').reset();
    });

    // Handle Create Event Form Submission
    document.getElementById('create-event-form').addEventListener('submit', handleCreateEventSubmit);

    // Handle Approval Actions
    document.getElementById('approval-requests-tbody').addEventListener('click', handleApprovalAction);
    
    // Handle Pending Event Actions (Cancel)
    document.getElementById('pending-events-tbody').addEventListener('click', handlePendingEventAction);

    // Handle Live Event Actions (Edit/Cancel)
    document.getElementById('events-tbody').addEventListener('click', handleLiveEventAction);

    // Handle Edit Event Form Submission
    document.getElementById('edit-event-form').addEventListener('submit', handleEditEventSubmit);

    // Hide Edit Event Modal on cancel
    document.getElementById('edit-event-cancel').addEventListener('click', () => {
        document.getElementById('edit-event-modal').style.display = 'none';
        document.getElementById('edit-event-form').reset();
    });

    // Resubmit Approvers Modal Listeners
    document.getElementById('resubmit-approvers-form').addEventListener('submit', handleResubmitApproversSubmit);
    document.getElementById('resubmit-approvers-cancel').addEventListener('click', () => {
        document.getElementById('resubmit-approvers-modal').style.display = 'none';
    });
    
    // Event listeners for the filter dropdown in "My Live Events"
    const filterBtn = document.getElementById('event-filter-btn');
    const filterMenu = document.getElementById('event-filter-menu');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            filterMenu.style.display = filterMenu.style.display === 'block' ? 'none' : 'block';
        });
    }
    document.addEventListener('click', (e) => {
        if (filterMenu && filterBtn && !filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
            filterMenu.style.display = 'none';
        }
    });
    if (filterMenu) {
        filterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                currentEventFilter = item.getAttribute('data-filter');
                const filterNames = { all: 'All Events', upcoming: 'Upcoming', ongoing: 'Ongoing', past: 'Past', cancelled: 'Cancelled' };
                filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${filterNames[currentEventFilter]} <i class="fas fa-caret-down"></i>`;
                filterMenu.style.display = 'none';
                loadMyLiveEvents();
            });
        });
    }
}

let currentEventFilter = 'all';

async function handleCreateEventSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const created_by = user ? user.id : null;

    if (!created_by) {
        alert("You must be logged in to create an event.");
        return;
    }

    const formData = {
        event_name: document.getElementById('event-name').value.trim(),
        start_datetime: `${document.getElementById('event-start-date').value}T${document.getElementById('event-start-time').value}`,
        end_datetime: `${document.getElementById('event-end-date').value}T${document.getElementById('event-end-time').value}`,
        venue: document.getElementById('event-venue').value.trim(),
        event_type: document.getElementById('event-type').value.trim() || 'unlisted',
        department: document.getElementById('event-department').value.trim(),
        capacity: document.getElementById('event-capacity').value,
        organiser_name: document.getElementById('event-organiser').value.trim(),
        agenda: document.getElementById('event-agenda').value.trim(),
        description: document.getElementById('event-description').value.trim(),
        created_by: created_by,
        approver_emails: [
            document.getElementById('approver1-email').value.trim(),
            document.getElementById('approver2-email').value.trim(),
            document.getElementById('approver3-email').value.trim()
        ]
    };

    try {
        const response = await fetch('/createEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('create-event-modal').style.display = 'none';
            document.getElementById('create-event-form').reset();
            loadMyPendingEvents(); // Refresh the pending list
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert('Server error while creating event.');
        console.error(err);
    }
}

async function handleApprovalAction(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    const decision = btn.dataset.decision;
    const temp_event_id = btn.dataset.id;
    const user = JSON.parse(localStorage.getItem('user'));

    if (!decision || !temp_event_id || !user || !user.id) return;

    if (confirm(`Are you sure you want to ${decision} this event?`)) {
        try {
            const response = await fetch('/handle-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    temp_event_id,
                    approver_user_id: user.id,
                    decision
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                loadMyApprovalRequests(); // Refresh this user's request list
                loadMyLiveEvents(); // Refresh live events in case one was just approved
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert('Server error while handling approval.');
            console.error(err);
        }
    }
}

async function handlePendingEventAction(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    const temp_event_id = btn.dataset.id;
    if (!temp_event_id) return;

    // Handle Resubmit action
    if (btn.classList.contains('resubmit')) {
        const rejected_by = parseInt(btn.dataset.rejected, 10);
        const modal = document.getElementById('resubmit-approvers-modal');
        const emailInputsContainer = document.getElementById('resubmit-email-inputs');
        
        document.getElementById('resubmit-event-id').value = temp_event_id;
        emailInputsContainer.innerHTML = ''; // Clear previous inputs

        for (let i = 1; i <= rejected_by; i++) {
            const input = document.createElement('input');
            input.type = 'email';
            input.placeholder = `New Approver ${i} Email`;
            input.className = 'resubmit-email-input';
            input.required = true;
            input.style.display = 'block';
            input.style.width = '90%';
            input.style.padding = '8px';
            input.style.marginBottom = '10px';
            emailInputsContainer.appendChild(input);
        }
        
        modal.style.display = 'flex';
        return;
    }

    // Handle Cancel action
    if (btn.classList.contains('cancel-pending')) {
        if (confirm('Are you sure you want to cancel this event submission? This action cannot be undone.')) {
            try {
                const response = await fetch('/cancel-pending-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ temp_event_id })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadMyPendingEvents(); // Refresh the list
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (err) {
                alert('Server error while cancelling submission.');
                console.error(err);
            }
        }
    }
}

async function handleResubmitApproversSubmit(e) {
    e.preventDefault();
    const temp_event_id = document.getElementById('resubmit-event-id').value;
    const emailInputs = document.querySelectorAll('.resubmit-email-input');
    const new_approver_emails = Array.from(emailInputs).map(input => input.value.trim()).filter(email => email);

    if (new_approver_emails.length === 0) {
        alert('Please enter at least one new approver email.');
        return;
    }

    try {
        const response = await fetch('/resubmit-for-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_event_id, new_approver_emails })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('resubmit-approvers-modal').style.display = 'none';
            loadMyPendingEvents(); // Refresh the list
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert('Server error while resubmitting.');
        console.error(err);
    }
}

async function handleLiveEventAction(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    const event_id = btn.dataset.id;

    // Handle Edit
    if (btn.classList.contains('edit')) {
        try {
            const res = await fetch(`/event/${event_id}`);
            const event = await res.json();
            if (!res.ok) throw new Error(event.error || 'Failed to fetch event details');

            document.getElementById('edit-event-id').value = event.event_id;
            document.getElementById('edit-event-name').value = event.event_name;
            document.getElementById('edit-event-start-date').value = event.start_datetime.slice(0, 10);
            document.getElementById('edit-event-end-date').value = event.end_datetime.slice(0, 10);
            document.getElementById('edit-event-start-time').value = event.start_datetime.slice(11, 16);
            document.getElementById('edit-event-end-time').value = event.end_datetime.slice(11, 16);
            document.getElementById('edit-event-venue').value = event.venue;
            document.getElementById('edit-event-type').value = event.event_type || '';
            document.getElementById('edit-event-department').value = event.department || '';
            document.getElementById('edit-event-capacity').value = event.capacity;
            document.getElementById('edit-event-organiser').value = event.organiser_name || '';
            document.getElementById('edit-event-agenda').value = event.agenda || '';
            document.getElementById('edit-event-description').value = event.description || '';
            document.getElementById('edit-event-status').value = event.event_status || 'upcoming';
            
            document.getElementById('edit-event-modal').style.display = 'flex';
        } catch (err) {
            alert(`Error: ${err.message}`);
            console.error(err);
        }
    }

    // Handle Cancel
    if (btn.classList.contains('delete')) {
        if (confirm('Are you sure you want to cancel this event?')) {
            try {
                const response = await fetch('/cancelEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    loadMyLiveEvents();
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (err) {
                alert('Server error while cancelling event.');
                console.error(err);
            }
        }
    }
}

async function handleEditEventSubmit(e) {
    e.preventDefault();
    const event_id = document.getElementById('edit-event-id').value;
    const start_datetime = `${document.getElementById('edit-event-start-date').value}T${document.getElementById('edit-event-start-time').value}`;
    const end_datetime = `${document.getElementById('edit-event-end-date').value}T${document.getElementById('edit-event-end-time').value}`;

    const eventData = {
        event_id,
        event_name: document.getElementById('edit-event-name').value.trim(),
        start_datetime,
        end_datetime,
        venue: document.getElementById('edit-event-venue').value.trim(),
        event_type: document.getElementById('edit-event-type').value.trim() || 'unlisted',
        department: document.getElementById('edit-event-department').value.trim(),
        capacity: document.getElementById('edit-event-capacity').value,
        organiser_name: document.getElementById('edit-event-organiser').value.trim(),
        agenda: document.getElementById('edit-event-agenda').value.trim(),
        description: document.getElementById('edit-event-description').value.trim(),
        event_status: document.getElementById('edit-event-status').value
    };

    try {
        const response = await fetch('/updateEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('edit-event-modal').style.display = 'none';
            document.getElementById('edit-event-form').reset();
            loadMyLiveEvents();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert('Server error while updating event.');
        console.error(err);
    }
}

// SECTION 1: Load events awaiting the current user's approval
async function loadMyApprovalRequests() {
    const tbody = document.getElementById('approval-requests-tbody');
    const user = JSON.parse(localStorage.getItem('user'));
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    try {
        const res = await fetch(`/approval-requests?approver_user_id=${user.id}`);
        const requests = await res.json();

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No events are currently awaiting your approval.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(event => {
            const start = new Date(event.start_datetime);
            const dateStr = start.toLocaleDateString();
            const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <tr>
                    <td>
                        <div class="event-info">
                            <div class="event-name">${event.event_name}</div>
                            <div class="event-dept">${event.description.substring(0, 50)}...</div>
                        </div>
                    </td>
                    <td>
                        <div class="date-time">
                            <div>${dateStr}</div>
                            <div class="time">${timeStr}</div>
                        </div>
                    </td>
                    <td>${event.creator_name}</td>
                    <td>${event.venue}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn approve" title="Approve" data-id="${event.event_id}" data-decision="approved">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject" title="Reject" data-id="${event.event_id}" data-decision="rejected">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5">Failed to load approval requests.</td></tr>';
        console.error(err);
    }
}

// SECTION 2: Load events created by the user that are pending approval
async function loadMyPendingEvents() {
    const tbody = document.getElementById('pending-events-tbody');
    const user = JSON.parse(localStorage.getItem('user'));
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const res = await fetch(`/temporary-events?created_by=${user.id}`);
        const events = await res.json();

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">You have no events pending approval.</td></tr>';
            return;
        }

        tbody.innerHTML = events.map(event => {
            const start = new Date(event.start_datetime);
            const dateStr = start.toLocaleDateString();
            const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let statusHtml;
            let actionHtml;

            if (event.rejected_by > 0) {
                statusHtml = `<span class="status-badge rejected">Rejected by ${event.rejected_by}</span>`;
                actionHtml = `
                    <button class="action-btn resubmit" title="Resubmit with New Approvers" data-id="${event.event_id}" data-rejected="${event.rejected_by}">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="action-btn delete cancel-pending" title="Cancel Submission" data-id="${event.event_id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            } else {
                const status = event.status || 'pending';
                statusHtml = `<span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
                actionHtml = `
                    <button class="action-btn delete cancel-pending" title="Cancel Submission" data-id="${event.event_id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            }

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
                    <td>${statusHtml}</td>
                    <td>
                        <div class="action-buttons">
                            ${actionHtml}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6">Failed to load pending events.</td></tr>';
        console.error(err);
    }
}

// SECTION 3: Load live events created by the user
async function loadMyLiveEvents() {
    const tbody = document.getElementById('events-tbody');
    const user = JSON.parse(localStorage.getItem('user'));
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

    try {
        const res = await fetch(`/events?created_by=${user.id}`);
        let events = await res.json();

        if (currentEventFilter !== 'all') {
            events = events.filter(event => event.event_status === currentEventFilter);
        }

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No live events found. Approved events will appear here.</td></tr>';
            return;
        }

        tbody.innerHTML = events.map(event => {
            const start = new Date(event.start_datetime);
            const end = new Date(event.end_datetime);
            const dateStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            const timeStr = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const status = event.event_status || 'open';
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
                    <td>${event.registrations || 0}</td>
                    <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" title="Edit" data-id="${event.event_id}"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" title="Cancel" data-id="${event.event_id}"><i class="fas fa-times-circle"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7">Failed to load live events.</td></tr>';
        console.error(err);
    }
}