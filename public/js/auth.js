document.addEventListener('DOMContentLoaded', () => {
    const loginForms = document.querySelectorAll('#loginForm');
    
    loginForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Store token in localStorage
                    localStorage.setItem('token', data.token);
                    
                    // Redirect based on user type
                    if (data.user.userType === 'client') {
                        window.location.href = '../client/dashboard.html';
                    } else {
                        window.location.href = '../professional/dashboard.html';
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during login');
            }
        });
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
