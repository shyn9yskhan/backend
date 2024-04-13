document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const username = formData.get('username');

    try {
        const response = await fetch('/user/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        displaySearchResults(data);
    } catch (error) {
        console.error('Error searching for user:', error);
    }
});

function displaySearchResults(data) {
    const searchResultsContainer = document.getElementById('searchResults');

    if (data.username) {
        searchResultsContainer.innerHTML = `<p class="searchResult">${data.username}</p>`;
        const searchResult = document.querySelector('.searchResult');
        searchResult.addEventListener('click', () => {
            window.location.href = `/user/get_profile/${data.username}`;
        });
    } else {
        searchResultsContainer.innerHTML = `<p>user not found</p>`;
    }
}