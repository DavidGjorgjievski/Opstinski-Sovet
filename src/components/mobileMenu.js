export const initializeMobileMenu = () => {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    const toggleMobileMenu = (event) => {
        mobileNav.classList.toggle('show');
        event.stopPropagation();
    };

    const closeMobileMenu = (event) => {
        const isClickInsideMenu = mobileNav.contains(event.target) || menuToggle.contains(event.target);
        if (!isClickInsideMenu && mobileNav.classList.contains('show')) {
            mobileNav.classList.remove('show');
        }
    };

    menuToggle.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', closeMobileMenu);

    return () => {
        menuToggle.removeEventListener('click', toggleMobileMenu);
        document.removeEventListener('click', closeMobileMenu);
    };
};