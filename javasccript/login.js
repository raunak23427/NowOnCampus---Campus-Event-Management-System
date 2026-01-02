// Password toggle functionality
document.getElementById('passwordToggle').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
});

// // Demo credential click functionality
// document.querySelectorAll('.demo-email').forEach(email => {
//     email.addEventListener('click', function() {
//         document.getElementById('email').value = this.textContent;
//     });
// });

// document.querySelectorAll('.demo-password').forEach(password => {
//     password.addEventListener('click', function() {
//         document.getElementById('password').value = this.textContent;
//     });
// });

// // Form submission
// document.getElementById('loginForm').addEventListener('submit', function(e) {
//     e.preventDefault();
    
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
    
//     // Simple validation
//     if (email && password) {
//         alert('Login functionality would be implemented here!');
//     }
// });
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;

    // Simple validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                rememberMe // Optional: Can be used for longer session cookies
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Login successful
            alert(data.message);
            
            // Store user data (simplified - in real app use more secure methods)
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on user role
            if (data.user.isAdmin) {
                window.location.href = 'home.html';
            } else {
                window.location.href = 'home.html';
            }
        } else {
            // Login failed
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});