document.addEventListener('DOMContentLoaded', function() {
    const navSection = document.getElementById('auth-nav-section');
    const navMenu = document.querySelector('.nav-menu');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}

    // Helper: build nav links
    function navLink(href, icon, text, extra = '') {
        return `<a href="${href}" class="nav-link"${extra}><i class="${icon} nav-icon"></i>${text}</a>`;
    }

    // Remove My Calendar/Admin if present
    navMenu.querySelectorAll('li[data-dynamic]').forEach(li => li.remove());

    if (!user) {
        navSection.innerHTML = `
            <div class="auth-buttons">
                <a href="/html/login.html" class="btn btn-login">
                    <i class="fas fa-sign-in-alt btn-icon"></i> Login
                </a>
                <a href="/html/signup.html" class="btn btn-register">
                    <i class="fas fa-user-plus btn-icon"></i> Register
                </a>
            </div>
        `;
    } else {
        // Add My Calendar for all logged-in users
        const calendarLi = document.createElement('li');
        calendarLi.setAttribute('data-dynamic', 'calendar');
        calendarLi.innerHTML = navLink('calendar.html', 'fas fa-calendar-check', 'My Calendar');
        navMenu.insertBefore(calendarLi, navMenu.children[2] || null); // Insert after Events

        // Add Admin for admins only
        if (user.isAdmin) {
            const adminLi = document.createElement('li');
            adminLi.setAttribute('data-dynamic', 'admin');
            adminLi.innerHTML = navLink('admin_func.html', 'fas fa-cog', 'Admin');
            navMenu.appendChild(adminLi);
        }
        else{
            const createEventLi = document.createElement('li');
            createEventLi.setAttribute('data-dynamic', 'create_event');
            createEventLi.innerHTML = navLink('create_event.html', 'fas fa-create_event-check', 'Create')
            navMenu.insertBefore(createEventLi, navMenu.children[3] || null);
        }

        navSection.innerHTML = `
            <span class="welcome-text">Welcome, ${user.isAdmin ? 'Admin' : 'Student'}</span>
            <a href="#" class="btn btn-logout" id="logoutBtn">
                <i class="fas fa-sign-out-alt btn-icon"></i> Logout
            </a>
        `;
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            // If on calendar.html, redirect to home.html after logout
            if (window.location.pathname.endsWith('calendar.html')) {
                window.location.href = 'home.html';
            } else {
                window.location.reload();
            }
        });
    }

    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        // Remove any previous active class
        link.classList.remove('active');
        // If the link's href ends with the current page, set it active
        if (link.getAttribute('href') && link.getAttribute('href').endsWith(currentPage)) {
            link.classList.add('active');
        }
    });
});