import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faRightFromBracket, faBars, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useParams } from "react-router-dom";
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import mkFlag from '../assets/flags/mk.png';
import enFlag from '../assets/flags/en.png';
import deFlag from '../assets/flags/de.png';
import sqFlag from '../assets/flags/sq.png';


function Header({ userInfo }) {
    const { t } = useTranslation();
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const [openLang, setOpenLang] = useState(false);
    const profileLangRef = useRef(null);
    const { municipalityId } = useParams();

    const [selectedLang, setSelectedLang] = useState(localStorage.getItem('selectedLanguage') || 'mk');


const languageData = {
    mk: { flag: mkFlag, label: 'Македонски' },
    en: { flag: enFlag, label: 'English' },
    de: { flag: deFlag, label: 'Deutsch' },
    sq: { flag: sqFlag, label: 'Shqip' }
};

    let municipalityImage = null;
    if (municipalityId) {
        const municipalities = JSON.parse(localStorage.getItem("municipalities") || "[]");
        const municipality = municipalities.find(
            (m) => m.id === Number(municipalityId)
        );
        if (municipality) {
            municipalityImage = municipality.logoImage;
        }
    }

    const toggleMobileMenu = () => {
        setMobileNavOpen(!isMobileNavOpen);
    };

    const getActiveClass = (path) => {
        return window.location.pathname === path ? 'active' : '';
    };

    // ✅ Reload page on logo click
    useEffect(() => {
        const logoImg = document.getElementById('logo-img');
        const handleClick = () => {
            window.location.reload();
        };
        if (logoImg) {
            logoImg.addEventListener('click', handleClick);
        }
        return () => {
            if (logoImg) {
                logoImg.removeEventListener('click', handleClick);
            }
        };
    }, []);

    // ✅ Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileLangRef.current && !profileLangRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
                setOpenLang(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ✅ Language change
    const changeLanguage = (lang) => {
        setSelectedLang(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('selectedLanguage', lang);
        setOpenLang(false);
    };

    return (
        <header>
            <nav>
                <div className="d-flex flex-row">
                    <div>
                        <img
                            id="logo-img"
                            src={
                                municipalityImage
                                    ? `data:image/png;base64,${municipalityImage}`
                                    : `${process.env.PUBLIC_URL}/images/grb.png`
                            }
                            className="logo-img"
                            alt="Logo"
                        />
                    </div>

                    {/* Mobile Navigation */}
                    <div id="mobile-menu-toggle" className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        <FontAwesomeIcon icon={faBars} className="hamburger-icon" />
                    </div>
                    <ul className={`nav-item-mobile ${isMobileNavOpen ? 'open' : ''}`} id="mobile-nav">
                        <li><Link to="/">{t('nav.home')}</Link></li>
                        <li><Link to="/municipalities">{t('nav.municipalities')}</Link></li>
                        {userInfo.municipalityId && userInfo.municipalityId !== "Not Assigned" && (
                            <li className={getActiveClass(`/municipalities/${userInfo.municipalityId}/sessions`)}>
                                <Link to={`/municipalities/${userInfo.municipalityId}/sessions`}>{t('nav.mySessions')}</Link>
                            </li>
                        )}
                        <li style={{ display: userInfo.role === 'ROLE_ADMIN' ? 'block' : 'none' }}>
                            <Link to="/admin-panel">{t('nav.adminPanel')}</Link>
                        </li>
                    </ul>
                </div>

                {/* Desktop Navigation */}
                <ul className="nav-item" id="desktop-nav">
                    <li className={getActiveClass('/')}><Link to="/">{t('nav.home')}</Link></li>
                    <li className={getActiveClass('/municipalities')}><Link to="/municipalities">{t('nav.municipalities')}</Link></li>
                    {userInfo.municipalityId && userInfo.municipalityId !== "Not Assigned" && (
                        <li className={getActiveClass(`/municipalities/${userInfo.municipalityId}/sessions`)}>
                            <Link to={`/municipalities/${userInfo.municipalityId}/sessions`}>{t('nav.mySessions')}</Link>
                        </li>
                    )}
                    <li className={getActiveClass('/admin-panel')} style={{ display: userInfo.role === 'ROLE_ADMIN' ? 'block' : 'none' }}>
                        <Link to="/admin-panel">{t('nav.adminPanel')}</Link>
                    </li>
                </ul>

                <div ref={profileLangRef} className="profile-lang-wrapper">
                    {/* Language Selector */}
                    <div className="language-dropdown-container-header">
                        <button
                            className="selected-language-header"
                            onClick={() => setOpenLang(!openLang)}
                        >
                            <img
                                src={languageData[selectedLang].flag}
                                alt={selectedLang}
                                className="lang-flag-header"
                            />
                            <FontAwesomeIcon
                                className="arrow-lang-header"
                                icon={openLang ? faChevronUp : faChevronDown}
                            />
                        </button>

                         {openLang && (
                            <div className="language-options-header">
                                {Object.keys(languageData)
                                    .filter(lang => lang !== selectedLang)
                                    .map(lang => (
                                        <div
                                            key={lang}
                                            className="language-option-header"
                                            onClick={() => changeLanguage(lang)}
                                        >
                                            <img
                                                src={languageData[lang].flag}
                                                alt={lang}
                                                className="lang-flag-header"
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Profile Picture */}
                    <img
                        src={`data:image/jpeg;base64,${userInfo.image}`}
                        className="header-image"
                        alt="User Profile"
                        onClick={() => setProfileMenuOpen((open) => !open)}
                    />
                    {isProfileMenuOpen && (
                        <div className="profile-dropdown">
                            <p className="fw-bold">{userInfo.name} {userInfo.surname}</p>
                            {userInfo.role !== 'ROLE_GUEST' && (
                                <Link to="/profile">
                                    <FontAwesomeIcon icon={faGear} /> {t('nav.settings')}
                                </Link>
                            )}
                            <Link to="/logout">
                                <FontAwesomeIcon icon={faRightFromBracket} /> {t('nav.logout')}
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Header;
