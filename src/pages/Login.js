import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import i18n from '../i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

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

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorKey, setErrorKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState(localStorage.getItem('selectedLanguage') || 'mk');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(process.env.REACT_APP_API_URL + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setErrorKey('login.invalidCredentials');
                throw new Error('Login failed');
            }

            const data = await response.json();
            const { token, userInfo } = data;
            const role = userInfo.role;
            login(token, JSON.stringify(userInfo), role);
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            setErrorKey('login.invalidCredentials');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    // Handle language change
    const changeLanguage = (lang) => {
        setSelectedLang(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('selectedLanguage', lang);
    };

    return (
        <div className="login-container">
            <HelmetProvider>
                <Helmet><title>{t('login.title')}</title></Helmet>
            </HelmetProvider>

            {/* Logo stays in public/images */}
            <div className="login-header">
                <img
                    src={`${process.env.PUBLIC_URL}/images/grb.png`}
                    alt="Grb Gold"
                    className="login-logo"
                />
            </div>

            <h2>{t('login.title')}</h2>
            {errorKey && <div className="error-message">{t(errorKey)}</div>}

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    name="username"
                    placeholder={t('login.username')}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorKey(''); }}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t('login.password')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorKey(''); }}
                    required
                />
                <input
                    type="submit"
                    className='login-button'
                    value={loading ? t('login.pleaseWait') : t('login.loginButton')}
                    disabled={loading}
                />
            </form>

            <div>
                <button
                    className='guest-button'
                    onClick={() => {
                        setUsername('gostin.gostin');
                        setPassword('gostin');
                        setTimeout(() => {
                            document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }, 0);
                    }}
                >
                    {t('login.guestButton')}
                </button>
            </div>

            {/* Language Selector */}
            <div className="language-dropdown-container">
                <label className="language-label">{t('login.selectLanguage')}</label>
                <div className="language-dropdown">
                    <button className="selected-language" onClick={() => setOpen(!open)}>
                        <img
                            src={languageData[selectedLang].flag}
                            alt={selectedLang}
                            className="lang-flag"
                        />
                        <span>{languageData[selectedLang].name}</span>
                        <FontAwesomeIcon className="arrow-lang" icon={open ? faChevronUp : faChevronDown} />
                    </button>

                    {open && (
                        <div className="language-options">
                            {Object.keys(languageData)
                                .filter(lang => lang !== selectedLang)
                                .map(lang => (
                                    <div
                                        key={lang}
                                        className="language-option"
                                        onClick={() => {
                                            changeLanguage(lang);
                                            setOpen(false);
                                        }}
                                    >
                                        <img
                                            src={languageData[lang].flag}
                                            alt={lang}
                                            className="lang-flag"
                                        />
                                        <span>{languageData[lang].name}</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;
