async function loadUser() {
    try {
        const response = await fetch('/user/my_profile_info');
        const UserData = await response.json();

        const response2 = await fetch('/user/getPosts');
        const postData = await response2.json();

        const response3 = await fetch('/user/my_profile_bio');
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
    }
    catch (error) {
        console.error('Error loading user profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const createPostButton = document.getElementById('createPostButton');
    const postForm = document.getElementById('postForm');
    const postContent = document.getElementById('postContent');
    const submitPostButton = document.getElementById('submitPostButton');
    const cancelPostButton = document.getElementById('cancelPostButton');

    createPostButton.addEventListener('click', function () {
        postForm.style.display = 'block';
    });

    cancelPostButton.addEventListener('click', function () {
        postForm.style.display = 'none';
    });

    submitPostButton.addEventListener('click', function () {
        const content = postContent.value;
        // Здесь вы можете отправить содержимое поста на сервер
        // и выполнить соответствующие действия
        // Например, вызвать функцию для создания нового поста
        createNewPost(content);
        // После отправки поста скройте форму
        postForm.style.display = 'none';
    });

    async function createNewPost (content) {
        // Ваша логика для создания нового поста

        try {
            const response = await fetch('/user/create_new_post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({postText: content })
            });
            if (response.ok) {
                console.log('Post created successfully');
                loadUser();
            }
            else {
                console.error('Failed to create post');
            }
        }
        catch(error) {
            console.error('Error creating post:', error);
        }

        console.log('New post created with content:', content);
    }
});


document.addEventListener('DOMContentLoaded', function () {
    const editProfileButton = document.getElementById('editProfile');
    const editProfileForm = document.getElementById('editProfileForm');
    const profileInfo = document.getElementById('profileInfo');
    const name = document.getElementById('editedName');
    const bio = document.getElementById('editedBio');
    const submitInfoButton = document.getElementById('submitInfoButton');
    const cancelInfoButton = document.getElementById('cancelInfoButton');

    editProfileButton.addEventListener('click', function () {
        profileInfo.style.display = 'none';
        editProfileForm.style.display = 'block';
    });

    cancelInfoButton.addEventListener('click', function () {
        editProfileForm.style.display = 'none';
        profileInfo.style.display = 'block';
    });

    submitInfoButton.addEventListener('click', function () {
        const profileName = name.value;
        const profileBio = bio.value;

        editNewProfileInfo(profileName, profileBio);
        
        editProfileForm.style.display = 'none';
        profileInfo.style.display = 'block';
    });

    async function editNewProfileInfo (name, bio) {
        try {
            const response = await fetch('/user/edit_profile_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({profileName: name, profileBio: bio})
            });
            if (response.ok) {
                console.log('Profile info editted');
                loadUser();
            }
            else {
                console.error('Failed to edit profile');
            }
        }
        catch(error) {
            console.error('Error editing profile:', error);
        }
    }
});

window.onload = loadUser;