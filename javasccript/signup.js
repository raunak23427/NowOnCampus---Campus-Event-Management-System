// Password toggle functionality
function setupPasswordToggle(toggleId, inputId) {
    document.getElementById(toggleId).addEventListener('click', function() {
        const passwordInput = document.getElementById(inputId);
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
}

setupPasswordToggle('passwordToggle', 'password');
setupPasswordToggle('confirmPasswordToggle', 'confirmPassword');

// Form validation
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    //get form values
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreement = document.getElementById('agreement').checked;
    
    // client side validation
    if (!firstName || !email || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    if (!agreement) {
        alert('Please agree to the Terms of Service and Privacy Policy.');
        return;
    }
    
    // If all validations pass, send data to server
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName,
            lastName,
            email,
            password
        })
    }).then(function(data){
        if (data.ok) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = 'login.html';
        } else {
            alert(data.error || 'Registration failed');
        }
    }).catch(function(error){
        console.error('Error:', error);
        alert('An error occurred during registration');
    });

    // try {
    // const response = await fetch('/signup', {
    //     method: 'POST',
    //     headers: {
    //     'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //     firstName,
    //     lastName,
    //     email,
    //     password
    //     })
    // });
    
    // const data = await response.json();
    
    // if (response.ok) {
    //     alert('Registration successful! Redirecting to login...');
    //     window.location.href = 'login.html';
    // } else {
    //     alert(data.error || 'Registration failed');
    // }
    // } catch (error) {
    // console.error('Error:', error);
    // alert('An error occurred during registration');
    // }
});

// Real-time password confirmation validation
document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#ef4444';
    } else {
        this.style.borderColor = '#d1d5db';
    }
});