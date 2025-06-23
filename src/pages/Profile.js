import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Profile.css'; 
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faLock } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';


function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {}; 
    });

    useEffect(() => {
        const imageData = localStorage.getItem('image'); 
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }

        sessionStorage.removeItem('scrollPosition');

        const cleanupMobileMenu = initializeMobileMenu();

        return () => {
            cleanupMobileMenu(); 
        };
    }, [navigate]);

    const { username, name, surname, image, role } = userData;

    const getRoleDisplay = (role) => {
        switch (role) {
            case "ROLE_USER":
                return "Советник";
            case "ROLE_PRESIDENT":
                return "Претседател на совет";
            case "ROLE_SPECTATOR":
                return "Набљудувач";
            case "ROLE_PRESENTER":
                return "Презентер";
            case "ROLE_ADMIN":
                return "Админ";
            case "ROLE_GUEST":
                return "Гостин"; 
            default:
                return "Непозната улога";
        }
    };

    return (
        <div className="profile-container">
            <HelmetProvider>
                <Helmet>
                    <title>Профил</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} /> 
            <main>
                <div className="content-container">
                        <div className="profile-image-wrapper">
                            <img
                            src={`data:image/jpeg;base64,${image}`}
                            className="profile-image"
                            alt="Profile"
                            />
                            <a href="/profile/change-image-form" className="change-image-link">
                                <button className="camera-button">
                                    <FontAwesomeIcon icon={faCamera} />
                                </button>
                            </a>
                        </div>

                    <div className="profile-details modern-card">
                        <div className="detail-row">
                            <span className="label">Корисничко име: </span>
                            <span className="value">{username}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Име и презиме: </span>
                            <span className="value">{`${name} ${surname}`}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Улога: </span>
                            <span className="value">{getRoleDisplay(role)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Општина: </span>
                            <span className="value">
                            {userData.municipalityName &&
                            userData.municipalityName !== "Not Assigned"
                                ? userData.municipalityName.replace(/^Општина\s+/i, '')
                                : '/'}
                            </span>
                        </div>
                        <div className="change-password">
                            <a href="/profile/change-password-form">
                            <button className="modern-button">Промени лозинка <FontAwesomeIcon icon={faLock} /></button>
                            </a>
                        </div>
                    </div>
                </div>

            </main>
                {userData != null && <Footer />}

        </div>
    );
}

export default Profile;
