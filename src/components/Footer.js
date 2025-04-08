import React from 'react';
import '../styles/Footer.css'

const Footer = () => {
    return (
        <footer className="footer text-white text-center">
            <p>&copy; {new Date().getFullYear()} Codeflux Macedonia</p>
        </footer>
    );
};

export default Footer;
