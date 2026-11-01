import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCheckToSlot, faEye } from '@fortawesome/free-solid-svg-icons';
import '../styles/Login.css';

// Shared two-panel layout for the public account pages (login, forgot and reset password)
function AuthLayout({ children }) {
    const { t } = useTranslation();

    const features = [
        { icon: faCalendarCheck, label: t('login.featureSessions') },
        { icon: faCheckToSlot, label: t('login.featureVoting') },
        { icon: faEye, label: t('login.featureTransparency') }
    ];

    return (
        <div className="login-page-wrapper">
            {/* Institutional panel */}
            <aside className="login-brand">
                <div className="login-brand-content">
                    <div className="login-emblem">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/grb.png`}
                            alt={t('login.country')}
                            className="login-logo"
                        />
                    </div>
                    <p className="login-country">{t('login.country')}</p>
                    <p className="login-council-name">{t('login.councilName')}</p>
                    <span className="login-brand-rule" />
                    <p className="login-tagline">{t('login.tagline')}</p>

                    <ul className="login-features">
                        {features.map(({ icon, label }) => (
                            <li key={label}>
                                <span className="login-feature-icon">
                                    <FontAwesomeIcon icon={icon} />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* Page content */}
            <main className="login-panel">
                {children}

                <footer className="login-footer">
                    © {new Date().getFullYear()} {t('login.councilName')} · {t('login.developedBy')} Codeflux
                </footer>
            </main>
        </div>
    );
}

export default AuthLayout;
