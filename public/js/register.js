document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        // Determine user type based on current page
        const isProfessional = window.location.pathname.includes('/professional/');
        const userData = {
            name,
            email,
            phone,
            password,
            userType: isProfessional ? 'professional' : 'client'
        };
        
        // Add profession field for professionals
        if (isProfessional) {
            userData.profession = document.getElementById('profession').value;
        }
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and redirect to dashboard
                localStorage.setItem('token', data.token);
                
                if (isProfessional) {
                    window.location.href = '../professional/dashboard.html';
                } else {
                    window.location.href = '../client/dashboard.html';
                }
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration');
        }
    });
    
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token and redirect to appropriate dashboard
        verifyTokenAndRedirect();
    }
});

async function verifyTokenAndRedirect() {
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            if (user.userType === 'client') {
                if (!window.location.pathname.includes('/client/')) {
                    window.location.href = '../client/dashboard.html';
                }
            } else {
                if (!window.location.pathname.includes('/professional/')) {
                    window.location.href = '../professional/dashboard.html';
                }
            }
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('token');
    }
}
