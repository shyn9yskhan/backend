document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
    })
    .then(response => {
        if (response.ok) {
            console.log('Logout successful. Redirecting to /auth/login');
            window.location.href = '/auth/login';
        } else {
            console.error('Logout failed. Response status:', response.status);
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});