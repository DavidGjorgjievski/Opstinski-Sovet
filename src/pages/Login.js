import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 
import '../styles/Login.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import i18n from '../i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

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

    // Login handler
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
                setErrorKey('invalidCredentials');
                throw new Error('Login failed');
            }

            const data = await response.json();
            const { token, userInfo } = data;
            const role = userInfo.role;
            login(token, JSON.stringify(userInfo), role); 
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            setErrorKey('invalidCredentials');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    // Language change handler
    const changeLanguage = (lang) => {
        setSelectedLang(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('selectedLanguage', lang);
    };

    return (
        <div className="login-container">
            <HelmetProvider>
                <Helmet><title>{t('loginTitle')}</title></Helmet>
            </HelmetProvider>

            <div className="login-header">
                <img src={`${process.env.PUBLIC_URL}/images/grb.png`} alt="Grb Gold" className="login-logo" />
            </div>

            <h2>{t('loginTitle')}</h2>
            {errorKey && <div className="error-message">{t(errorKey)}</div>}

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    name="username"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorKey(''); }}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorKey(''); }}
                    required
                />
                <input
                    type="submit"
                    className='login-button'
                    value={loading ? t('pleaseWait') : t('loginButton')}
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
                    {t('guestButton')}
                </button>
            </div>

            {/* Language selector */}
            <div className="language-dropdown-container">
                <label className="language-label">{t('selectLanguage')}</label>
                <div className="language-dropdown">
                    <button className="selected-language" onClick={() => setOpen(!open)}>
                        <img
                            src={`${process.env.PUBLIC_URL}/flags/${selectedLang}.png`}
                            alt={selectedLang}
                            className="lang-flag"
                        />
                        <span>
                            {selectedLang === 'mk' ? 'Македонски' :
                             selectedLang === 'en' ? 'English' :
                             selectedLang === 'de' ? 'Deutsch' :
                             'Shqip'}
                        </span>
                        <span>
                            <FontAwesomeIcon className="arrow-lang" icon={open ? faChevronUp : faChevronDown} />
                        </span>
                    </button>

                    {open && (
                        <div className="language-options">
                            {['mk', 'en', 'de', 'sq']
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
                                      src={`${process.env.PUBLIC_URL}/flags/${lang}.png`}
                                      alt={lang}
                                      className="lang-flag"
                                    />
                                    <span>
                                      {lang === 'mk' ? 'Македонски' :
                                       lang === 'en' ? 'English' :
                                       lang === 'de' ? 'Deutsch' :
                                       'Shqip'}
                                    </span>
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
