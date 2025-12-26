import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import api from '../api/axios'; 
import '../styles/Monitoring.css';

function Monitoring() {
    const [userData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const { t } = useTranslation();

   useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/admin/users/last-login');
            // Sort users by lastSeen descending
            const sortedUsers = response.data.sort((a, b) => {
                return new Date(b.lastSeen) - new Date(a.lastSeen);
            });
            setUsers(sortedUsers);
        } catch (error) {
            console.error('Failed to load monitoring users', error);
        } finally {
            setLoading(false);
        }
    };

    fetchUsers();

    return () => cleanupMobileMenu();
}, []);


const formatLastSeen = (date) => {
    if (!date) return t('monitoring.never');

    return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

    return (
        <div className="monitoring-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('monitoring.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header userInfo={userData} />

            <main>
                <div className="monitoring-container-body">
                    <div className="monitoring-header">
                        <h1 className="monitoring-header-title">
                            {t('monitoring.title')}
                        </h1>
                    </div>

                    <div className="monitoring-list">
                        {loading ? (
                             <div className="monitoring-loading-spinner">
                                <img
                                    src={`${process.env.PUBLIC_URL}/images/loading.svg`}
                                    alt="Loading..."
                                />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="monitoring-empty">
                                {t('monitoring.noUsers')}
                            </p>
                        ) : (
                            <ul className="monitoring-list-ul">
                                {users.map(user => (
                                    <li key={user.username} className="monitoring-item">
                                        <div className="monitoring-content">

                                            <div className="monitoring-user-image">
                                                {user.image ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${user.image}`}
                                                        alt={user.username}
                                                    />
                                                ) : (
                                                    <div className="monitoring-image-placeholder" />
                                                )}
                                            </div>

                                            <div className="monitoring-user-info">
                                                <div className="monitoring-user-name">
                                                    {user.name} {user.surname}
                                                </div>
                                                <div className="monitoring-user-username">
                                                    @{user.username}
                                                </div>
                                            </div>

                                            <div className="monitoring-user-lastseen">
                                                {formatLastSeen(user.lastSeen)}
                                            </div>

                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Monitoring;
