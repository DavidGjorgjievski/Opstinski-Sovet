import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Profile.css';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faLock } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next'; // ✅ i18next hook

function Profile() {
    const { t } = useTranslation();
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
                return t("roles.user");
            case "ROLE_PRESIDENT":
                return t("roles.president");
            case "ROLE_SPECTATOR":
                return t("roles.spectator");
            case "ROLE_PRESENTER":
                return t("roles.presenter");
            case "ROLE_ADMIN":
                return t("roles.admin");
            case "ROLE_GUEST":
                return t("roles.guest");
            default:
                return t("roles.unknown");
        }
    };

    return (
        <div className="profile-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("profile.title")}</title>
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
                            <span className="label">{t("profile.username")}: </span>
                            <span className="value">{username}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t("profile.fullName")}: </span>
                            <span className="value">{`${name} ${surname}`}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t("profile.role")}: </span>
                            <span className="value">{getRoleDisplay(role)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t("profile.municipality")}: </span>
                            <span className="value">
                                {userData.municipalityName &&
                                userData.municipalityName !== "Not Assigned"
                                    ? userData.municipalityName.replace(/^Општина\s+/i, '')
                                    : '/'}
                            </span>
                        </div>
                        <div className="change-password">
                            <a href="/profile/change-password-form">
                                <button className="modern-button">
                                    {t("profile.changePassword")} <FontAwesomeIcon icon={faLock} />
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
            {userData && <Footer />}
        </div>
    );
}

export default Profile;
