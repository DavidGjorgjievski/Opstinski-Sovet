import React, { useEffect } from 'react';
import '../styles/Logout.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import AuthLayout from '../components/AuthLayout';

const Logout = () => {
    const { logout } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        logout();
    }, [logout]);

     return (
        <AuthLayout>
            <HelmetProvider>
                <Helmet>
                    <title>{`${t('logout.title')} | ${t('login.councilName')}`}</title>
                </Helmet>
            </HelmetProvider>

            <div className="login-container login-container--centered">
                <h1 className="login-heading">{t('logout.message')}</h1>
                <p className="login-subtitle">{t('logout.thanks')}</p>
                <button
                    type="button"
                    onClick={() => window.location.href = '/login'}
                    className="login-submit"
                >
                    {t('logout.loginAgain')}
                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                </button>
            </div>
        </AuthLayout>
    );
};

export default Logout;
