import React, { useEffect } from 'react';
import '../styles/Logout.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext'; 
import { useTranslation } from 'react-i18next';

const Logout = () => {
    const { logout } = useAuth(); 
    const { t } = useTranslation();

    useEffect(() => {
        logout();
    }, [logout]); 

    return (
        <div className="logout-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('logoutTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <h1>{t('logoutMessage')}</h1>
            <p>{t('logoutThanks')}</p>
            <button 
                onClick={() => window.location.href = '/login'} 
                className="login-button"
            >
                {t('loginAgain')}
            </button>
        </div>
    );
};

export default Logout;
