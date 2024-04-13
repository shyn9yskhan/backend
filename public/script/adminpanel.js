document.addEventListener('DOMContentLoaded', function () {
    const adminPanelButtons = document.getElementById('adminPanelButtons');

    const deleteUserPanelButton = document.getElementById('deleteUserPanelButton');
    const deletePostPanelButton = document.getElementById('deletePostPanelButton');
    const updateUserRolePanelButton = document.getElementById('updateUserRolePanelButton');
    
    const deleteUserForm = document.getElementById('deleteUserForm');
    const userDelete = document.getElementById('deleteUserUsername');
    const deleteUserButton = document.getElementById('deleteUserButton');
    const cancelUserButton = document.getElementById('cancelUserButton');

    const deletePostForm = document.getElementById('deletePostForm');
    const postDelete = document.getElementById('deletePostID');
    const deletePostButton = document.getElementById('deletePostButton');
    const cancelPostButton = document.getElementById('cancelPostButton');

    const updateUserRoleForm = document.getElementById('updateUserRoleForm');
    const updateUser = document.getElementById('updateUserRoleID');
    const updateUserRoleText = document.getElementById('userRoleText');
    const submitUpdateButton = document.getElementById('submitUpdateButton');
    const cancelUpdateButton = document.getElementById('cancelUpdateButton');

deleteUserPanelButton.addEventListener('click', function() {
    adminPanelButtons.style.display = 'none';
    deleteUserForm.style.display = 'block';
    console.log('delete user');

});

deletePostPanelButton.addEventListener('click', function() {
    adminPanelButtons.style.display = 'none';
    deletePostForm.style.display = 'block';
    console.log('delete post');
});

updateUserRolePanelButton.addEventListener('click', function() {
    adminPanelButtons.style.display = 'none';
    updateUserRoleForm.style.display = 'block';
    console.log('update user role');
});

deleteUserButton.addEventListener('click', function() {
    const user = userDelete.value;
    deleteUser(user);
    deleteUserForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});
cancelUserButton.addEventListener('click', function() {
    deleteUserForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});

deletePostButton.addEventListener('click', function() {
    const post = postDelete.value;
    deletePost(post);
    deletePostForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});
cancelPostButton.addEventListener('click', function() {
    deletePostForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});

submitUpdateButton.addEventListener('click', function() {
    const user = updateUser.value;
    const role = updateUserRoleText.value;
    updateUserRole(user, role);
    updateUserRoleForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});
cancelUpdateButton.addEventListener('click', function() {
    updateUserRoleForm.style.display = 'none';
    adminPanelButtons.style.display = 'block';
});

async function deleteUser (username) {
    try {
        const response = await fetch(`/admin/deleteUser/${username}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          console.log('User deleted successfully');
        } else {
          console.error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
}

async function deletePost (id) {
    try {
        const response = await fetch(`/admin/deletePost/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          console.log('Post deleted successfully');
        } else {
          console.error('Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
}

async function updateUserRole (username, role) {
    try {
        const response = await fetch(`/admin/updateUserRole/${username}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: role })
        });
        if (response.ok) {
          console.log('User role updated successfully');
        } else {
          console.error('Failed to update user role');
        }
      } catch (error) {
        console.error('Error updating user role:', error);
      }
}

});