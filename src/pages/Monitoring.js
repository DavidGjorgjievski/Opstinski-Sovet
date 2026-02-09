import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faComputer, faChevronDown, faUsers } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios'; 
import '../styles/Monitoring.css';

function Monitoring() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monitoringFilter, setMonitoringFilter] = useState(() => {
        return localStorage.getItem('monitoringFilter') || 'all';
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        localStorage.setItem('monitoringFilter', monitoringFilter);
    }, [monitoringFilter]);

    useEffect(() => {
        const fetchUsers = async (selectedFilter = monitoringFilter) => {
            setLoading(true);
            try {
                let url = '/api/admin/users/last-login';
                if (selectedFilter !== 'all') url += `?status=${selectedFilter}`;
                const response = await api.get(url);
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to load monitoring users', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [monitoringFilter]);

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

    const filterOptions = [
        { value: 'all', label: t('monitoring.filters.all'), icon: <FontAwesomeIcon icon={faUsers} /> },
        { value: 'online', label: t('monitoring.filters.online'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon online" /> },
        { value: 'offline', label: t('monitoring.filters.offline'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon offline" /> }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        setMonitoringFilter(option.value);
        setDropdownOpen(false);
    };

    const selectedOption = filterOptions.find(o => o.value === monitoringFilter);

    return (
        <div className="monitoring-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('monitoring.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <main>
                <div className="monitoring-container-body">
                    <div className="monitoring-header">
                        <h1 className="monitoring-header-title">{t('monitoring.title')}</h1>
                    </div>

                    {/* Custom Dropdown */}
                    <div className="monitoring-filter-wrapper" ref={dropdownRef}>
                        <div 
                            className={`monitoring-filter-selected ${dropdownOpen ? 'active' : ''}`}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            {selectedOption.icon && <span className="filter-icon">{selectedOption.icon}</span>}
                            <span>{selectedOption.label}</span>
                            <FontAwesomeIcon 
                                icon={faChevronDown} 
                                className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} 
                            />
                        </div>
                        {dropdownOpen && (
                            <div className="monitoring-filter-options">
                                {filterOptions.map(option => (
                                    <div
                                        key={option.value}
                                        className={`monitoring-filter-option ${monitoringFilter === option.value ? 'selected' : ''}`}
                                        onClick={() => handleSelect(option)}
                                    >
                                        {option.icon && <span className="filter-icon">{option.icon}</span>}
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="monitoring-list">
                        {loading ? (
                            <div className="monitoring-loading-spinner">
                                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="monitoring-empty">{t('monitoring.noUsers')}</p>
                        ) : (
                            <div>
                               {monitoringFilter !== 'offline' && (
                                    <div className="monitoring-online-count">
                                        <FontAwesomeIcon 
                                            icon={faCircle} 
                                            className="status-icon online" 
                                            style={{ marginRight: '6px' }} 
                                            title={t('monitoring.online')}
                                        />
                                        {t('monitoring.onlineUsers', { count: users.filter(u => u.onlineSessions > 0).length })}
                                    </div>
                                )}
                                <ul className="monitoring-list-ul">
                                    {users.map(user => (
                                        <li key={user.username} className="monitoring-item">
                                            <div className="monitoring-content">
                                                <div className="monitoring-user-image">
                                                    {user.image ? (
                                                        <img src={`data:image/jpeg;base64,${user.image}`} alt={user.username} />
                                                    ) : (
                                                        <div className="monitoring-image-placeholder" />
                                                    )}
                                                </div>
                                                <div className="monitoring-user-info">
                                                    <div className="monitoring-user-name">{user.name} {user.surname}</div>
                                                    <div className="monitoring-user-username">@{user.username}</div>
                                                </div>
                                                <div className="monitoring-user-lastseen">
                                                    {formatLastSeen(user.lastSeen)}{" "}
                                                    <FontAwesomeIcon
                                                        icon={faCircle}
                                                        className={user.onlineSessions > 0 ? 'status-icon online' : 'status-icon offline'}
                                                        title={user.onlineSessions > 0 ? 'Online' : 'Offline'}
                                                    />
                                                    {user.onlineSessions > 1 && (
                                                        <span className="monitoring-multi-device">
                                                            <FontAwesomeIcon icon={faComputer} className="device-icon" title={`${user.onlineSessions} devices online`} />
                                                            <span className="device-count">{user.onlineSessions}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Monitoring;
