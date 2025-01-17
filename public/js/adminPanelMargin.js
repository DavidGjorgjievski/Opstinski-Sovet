// adminPanelMargin.js

// Function to dynamically adjust margin based on the number of users
function adjustUserListMargin(userCount) {
    const userListElement = document.querySelector('.admin-user-lists');

    if (userListElement) {
        // Calculate new margin: 50px per user
        const newMarginTop = userCount * 50;
        userListElement.style.marginTop = `${newMarginTop}px`;
        console.log(`Adjusted margin for ${userCount} users: ${newMarginTop}px`); // Log the adjusted margin
    }
}

// Check if user count is passed via a global variable
window.addEventListener('load', function () {
    console.log('adminPanelMargin.js is mounted'); // Log to confirm the script is mounted
    if (typeof window.userCount !== 'undefined') {
        adjustUserListMargin(window.userCount);
    }
});
