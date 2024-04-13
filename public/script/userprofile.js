async function loadUser() {
    const url = window.location.href;
    const profileUrl = url.match(/\/user\/user_profile\/(.*)/);

    if (profileUrl && profileUrl.length > 1) {
        const username = profileUrl[1];
    try {
        const response = await fetch(`/user/get_profile_info/${username}`);
        const UserData = await response.json();

        const response2 = await fetch(`/user/getPosts/${username}`);
        const postData = await response2.json();

        const response3 = await fetch(`/user/get_profile_bio/${username}`);
        const UserProfileInfo = await response3.json();

        document.getElementById('username').innerText = UserData.username;
        document.getElementById('followers').innerText = UserData.followers;
        document.getElementById('followings').innerText = UserData.followings;
        document.getElementById('posts').innerText = UserData.posts;

        document.getElementById('name').innerText = UserProfileInfo.name;
        document.getElementById('bio').innerText = UserProfileInfo.bio;

        const postsArea = document.getElementById('postsArea');
        postsArea.innerHTML = '';

        postData.forEach(post => {
            const postElement = document.createElement('div');
            postElement.textContent = post.content;
            postsArea.appendChild(postElement);
        });

    } catch (error) {
        console.error('Error loading user profile:', error);
    }
} else {
    console.error('Username not found in URL');
}
}

document.getElementById('followButton').addEventListener('click', async() => {
    const url = window.location.href;
    const profileUrl = url.match(/\/user\/user_profile\/(.*)/);

    if (profileUrl && profileUrl.length > 1) {
        const username = profileUrl[1];
        try {
            const response = await fetch(`/user/follow/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('User followed successfully');
                loadUser();
            }
            else {
                console.error('Failed to follow user');
            }
        }
        catch(error) {
            console.error('Error following user:', error);
        }
    }
    else {
        console.error('Username not found in URL');
    }
});

window.onload = loadUser;