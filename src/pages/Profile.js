import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faPenToSquare,
    faLock,
    faPlus,
    faChevronLeft
} from '@fortawesome/free-solid-svg-icons';

function Profile() {
    const { t } = useTranslation();
    const cardRefs = useRef([]);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(() => {
        const stored = localStorage.getItem('userInfo');
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        const imageData = localStorage.getItem('image');
        if (imageData) {
            setUserData(prev => ({ ...prev, image: imageData }));
        }
    }, []);

    useEffect(() => {
        const firstHeight = cardRefs.current[0]?.offsetHeight;
        if (!firstHeight) return;

        cardRefs.current.forEach(card => {
            if (card) card.style.height = `${firstHeight}px`;
        });
    }, [userData]);

    const getRoleDisplay = (role) => {
        switch (role) {
            case "ROLE_USER": return t("roles.user");
            case "ROLE_ADMIN": return t("roles.admin");
            case "ROLE_PRESIDENT": return t("roles.president");
            case "ROLE_EDITOR": return t("roles.editor");
            case "ROLE_GUEST": return t("roles.guest");
            case "ROLE_MAYOR": return t("roles.mayor");
            default: return t("roles.unknown");
        }
    };

    const mandateDates = userData.municipalityTermDates || [];

    return (
        <div className="profile-modern-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("profile.title")}</title>
                </Helmet>
            </HelmetProvider>

            <Header isSticky />

            <main>
                <div className="profile-modern-grid">

                    {/* CARD 1 – MAIN */}
                    <div className="profile-modern-card" ref={el => cardRefs.current[0] = el}>
                         <button
                            className="profile-modern-card-back-button"
                            onClick={() => navigate('/')}
                        >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <h3 className="profile-modern-title">{t("profile.title")}</h3>

                        <div className="profile-modern-image-wrapper">
                            {userData.image ? (
                                <img
                                    src={`data:image/jpeg;base64,${userData.image}`}
                                    alt="Profile"
                                    className="profile-modern-image"
                                />
                            ) : (
                                <div className="profile-modern-image placeholder">
                                    {userData.name?.charAt(0)}
                                </div>
                            )}

                            {!["ROLE_EDITOR", "ROLE_GUEST", "ROLE_PRESENTER"].includes(userData.role) && (
                                <Link to="/profile/change-image-form" className="image-edit-btn">
                                    <FontAwesomeIcon icon={faCamera} />
                                </Link>
                            )}
                        </div>

                        <h2 className="profile-modern-name">
                            {userData.name} {userData.surname}
                        </h2>
                        <p className="profile-modern-username">@{userData.username}</p>

                        {/* EMAIL MOVED HERE */}
                       <div className="detail-row email-row">
                            <span className="label">{t("profile.email")}:</span>

                            <div className="email-inline">
                                <span className="value email-value">
                                    {userData.email || t("profile.notAvailable")}
                                </span>

                                <Link className="edit-email-btn" to="/profile/change-email-form">
                                    <FontAwesomeIcon icon={userData.email ? faPenToSquare : faPlus} />
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* CARD 2 – DETAILS */}
                    <div className="profile-modern-card secondary" ref={el => cardRefs.current[1] = el}>
                        <h3 className="profile-modern-title">{t("profile.details")}</h3>
                        <div className="detail-row">
                            <span className="label">{t("profile.municipality")}:</span>
                            <span className="value">
                                {userData.municipalityName || t("profile.notAvailable")}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t("profile.role")}:</span>
                            <span className="value">{getRoleDisplay(userData.role)}</span>
                        </div>
                       <div className="detail-row">
                            <span className="label">{t("profile.municipalityTerm")}:</span>
                            <span className="value">
                                {mandateDates.length > 0 ? (
                                    mandateDates.map((term, index) => (
                                        <div key={index} className="municipality-term">
                                            {term}
                                        </div>
                                    ))
                                ) : (
                                    t("profile.notAvailable")
                                    
                                )}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">{t("profile.status")}:</span>
                            <span className="value">
                                {userData.status === "ACTIVE"
                                    ? t("profile.statusActive")
                                    : userData.status === "INACTIVE"
                                        ? t("profile.statusInactive")
                                        : t("profile.notAvailable")}
                            </span>
                        </div>

                       <div className="detail-row password-row">
                            <span className="label">{t("profile.password")}:</span>
                            <Link className="edit-password-btn" to="/profile/change-password-form">
                                {t("profile.change")} <FontAwesomeIcon icon={faLock} />
                            </Link>
                        </div>
                    </div>

                   {/* CARD 3 – BIOGRAPHY */}
                        <div className="profile-modern-card secondary" ref={el => cardRefs.current[2] = el}>
                            <div className="bio-header">
                                <h3 className="profile-modern-title-bio">
                                    {t("profile.biography")}
                                </h3>

                                <Link className="bio-action-btn" to="/profile/edit-bio">
                                    <FontAwesomeIcon
                                        icon={userData.bio ? faPenToSquare : faPlus}
                                    />
                                </Link>
                            </div>

                            <p className="bio-text">
                                {userData.bio || t("profile.noBiography")}
                            </p>
                        </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Profile;
