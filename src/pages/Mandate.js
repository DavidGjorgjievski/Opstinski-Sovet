import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import '../styles/Mandate.css'; 
import { useTranslation } from 'react-i18next';

function Mandate() {
    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });

    const { t } = useTranslation();

    useEffect(() => {
        const imageData = localStorage.getItem('image');
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }

        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, []);

    return (
        <div className="mandate-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('mandate.title')}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} isSticky={true} />
            <main>
                <div className="mandate-container-body">
                    <div className="mandate-header">
                        <h1 className="mandate-header-title">{t('mandate.title')}</h1>
                        <button className="mandate-add-button">{t('mandate.addButton')} <FontAwesomeIcon icon={faPlus} /></button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Mandate;
