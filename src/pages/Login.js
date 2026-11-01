import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import i18n from '../i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRightToBracket,
    faChevronDown,
    faCircleExclamation,
    faEye,
    faEyeSlash,
    faLock,
    faUser,
    faUserGroup
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/AuthLayout';


// Import flag images from assets (cached by Webpack/Vite automatically)
import mkFlag from '../assets/flags/mk.png';
import enFlag from '../assets/flags/en.png';
import deFlag from '../assets/flags/de.png';
import sqFlag from '../assets/flags/sq.png';

// Map languages to flags and names for cleaner code
const languageData = {
    mk: { name: 'Македонски', flag: mkFlag },
    en: { name: 'English', flag: enFlag },
    de: { name: 'Deutsch', flag: deFlag },
    sq: { name: 'Shqip', flag: sqFlag }
};

function Login() {
    const { t } = useTranslation();
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorKey, setErrorKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState(localStorage.getItem('selectedLanguage') || 'en');
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const detectBrowser = async () => {
        if (navigator.brave && await navigator.brave.isBrave()) return 'Brave';
        const ua = navigator.userAgent;
        if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Edge';
        if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        return 'Unknown';
    };

    const submitCredentials = async (user, pass) => {
        setLoading(true);
        setErrorKey('');

        try {
            const browser = await detectBrowser();
            const response = await fetch(process.env.REACT_APP_API_URL + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Browser-Name': browser },
                body: JSON.stringify({ username: user, password: pass }),
            });

            if (!response.ok) {
                setErrorKey('login.invalidCredentials');
                throw new Error('Login failed');
            }

            const data = await response.json();
            const { token, userInfo, sessionToken } = data;
            const role = userInfo.role;

            if (role === "ROLE_PRESENTER") {
                changeLanguage("mk");
            }
            login(token, JSON.stringify(userInfo), role, sessionToken);
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            setErrorKey('login.invalidCredentials');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    // Handle login
    const handleLogin = (e) => {
        e.preventDefault();
        submitCredentials(username, password);
    };

    // Handle language change
    const changeLanguage = (lang) => {
        setSelectedLang(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('selectedLanguage', lang);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <AuthLayout>
            <HelmetProvider>
                <Helmet><title>{`${t('login.loginButton')} | ${t('login.councilName')}`}</title></Helmet>
            </HelmetProvider>

            <div className="login-topbar">
                <div className="language-dropdown" ref={dropdownRef}>
                    <button
                        type="button"
                        className={`selected-language ${open ? 'open' : ''}`}
                        onClick={() => setOpen(!open)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                        aria-label={t('login.selectLanguage')}
                        aria-expanded={open}
                    >
                        <img src={languageData[selectedLang].flag} alt="" className="lang-flag" />
                        <span>{languageData[selectedLang].name}</span>
                        <FontAwesomeIcon className="arrow-lang" icon={faChevronDown} />
                    </button>

                    {open && (
                        <div className="language-options">
                            {Object.keys(languageData)
                                .filter(lang => lang !== selectedLang)
                                .map(lang => (
                                    <button
                                        type="button"
                                        key={lang}
                                        className="language-option"
                                        lang={lang}
                                        onClick={() => {
                                            changeLanguage(lang);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                                    >
                                        <img src={languageData[lang].flag} alt="" className="lang-flag" />
                                        <span>{languageData[lang].name}</span>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="login-container">
                <h1 className="login-heading">{t('login.heading')}</h1>
                <p className="login-subtitle">{t('login.subtitle')}</p>

                {errorKey && (
                    <div className="login-error" role="alert">
                        <FontAwesomeIcon icon={faCircleExclamation} />
                        <span>{t(errorKey)}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-field">
                        <label htmlFor="login-username">{t('login.username')}</label>
                        <div className="login-input-wrapper">
                            <FontAwesomeIcon icon={faUser} className="login-input-icon" />
                            <input
                                id="login-username"
                                type="text"
                                name="username"
                                className="login-input-field"
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck="false"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value.toLowerCase());
                                    setErrorKey('');
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <div className="login-label-row">
                            <label htmlFor="login-password">{t('login.password')}</label>
                            <Link to="/forgot-password" className="forgot-password-link">
                                {t("login.forgotPassword")}
                            </Link>
                        </div>
                        <div className="login-input-wrapper">
                            <FontAwesomeIcon icon={faLock} className="login-input-icon" />
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="login-input-field login-input-password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrorKey(''); }}
                                required
                            />
                            <button
                                type="button"
                                className="login-eye-button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                aria-pressed={showPassword}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="login-spinner" aria-hidden="true" />
                                {t('login.pleaseWait')}
                            </>
                        ) : (
                            <>
                                {t('login.loginButton')}
                                <FontAwesomeIcon icon={faArrowRightToBracket} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-divider"><span>{t('login.or')}</span></div>

                {/* Guest button */}
                <button
                    type="button"
                    className="login-guest"
                    disabled={loading}
                    onClick={() => submitCredentials('gostin.gostin', 'gostin')}
                >
                    <FontAwesomeIcon icon={faUserGroup} />
                    {t('login.guestButton')}
                </button>
            </div>
        </AuthLayout>
    );
}

export default Login;
