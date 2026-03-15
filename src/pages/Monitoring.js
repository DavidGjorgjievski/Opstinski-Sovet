import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faChevronDown, faUsers, faDesktop, faMobileAlt, faTablet, faGlobe, faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import '../styles/Monitoring.css';

function resolvePageLabel(currentPage, t) {
    if (!currentPage) return '';
    try {
        const decoded = decodeURIComponent(currentPage);
        // If decoding changed the value, it was URL-encoded → return the enriched label as-is
        if (decoded !== currentPage) return decoded;
    } catch { /* malformed URI component, fall through */ }
    // Not URL-encoded — treat as i18n key (old format like 'topicsPage.pageTitle')
    return t(currentPage, { defaultValue: currentPage });
}

function Monitoring() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monitoringFilter, setMonitoringFilter] = useState(() => {
        return localStorage.getItem('monitoringFilter') || 'all';
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [expandedUsers, setExpandedUsers] = useState({});
    const dropdownRef = useRef(null);
    const listRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        localStorage.setItem('monitoringFilter', monitoringFilter);
    }, [monitoringFilter]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                let url = '/api/admin/users/last-login';
                if (monitoringFilter !== 'all') url += `?status=${monitoringFilter}`;
                const response = await api.get(url);
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to load monitoring users', error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchUsers();

        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, [monitoringFilter]);

    const formatDate = (date) => {
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

    const formatDateOnly = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTimeOnly = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const renderDateTime = (date) => {
        if (!date) return <span className="session-time-value">{t('monitoring.never')}</span>;
        return (
            <span className="session-time-value">
                <FontAwesomeIcon icon={faCalendarDays} className="session-dt-icon" />
                {formatDateOnly(date)}
                <FontAwesomeIcon icon={faClock} className="session-dt-icon" />
                {formatTimeOnly(date)}
            </span>
        );
    };

    const getDeviceIcon = (deviceType) => {
        if (!deviceType) return faDesktop;
        const d = deviceType.toLowerCase();
        if (d === 'mobile') return faMobileAlt;
        if (d === 'tablet') return faTablet;
        return faDesktop;
    };

    const filterOptions = [
        { value: 'all', label: t('monitoring.filters.all'), icon: <FontAwesomeIcon icon={faUsers} /> },
        { value: 'online', label: t('monitoring.filters.online'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon online" /> },
        { value: 'offline', label: t('monitoring.filters.offline'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon offline" /> }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (listRef.current && !listRef.current.contains(event.target)) {
                setExpandedUsers({});
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        setMonitoringFilter(option.value);
        setDropdownOpen(false);
    };

    const toggleExpand = (username) => {
        setExpandedUsers(prev => ({ ...prev, [username]: !prev[username] }));
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
                                <ul className="monitoring-list-ul" ref={listRef}>
                                    {users.map(user => {
                                        const isOnline = user.onlineSessions > 0;
                                        const hasSessions = user.sessions && user.sessions.length > 0;
                                        const isExpanded = expandedUsers[user.username];

                                        return (
                                            <li key={user.username} className="monitoring-item">
                                                {/* User row */}
                                                <div
                                                    className={`monitoring-content ${hasSessions ? 'monitoring-content-clickable' : ''}`}
                                                    onClick={() => hasSessions && toggleExpand(user.username)}
                                                >
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
                                                        {hasSessions && isOnline && (
                                                            <div className="monitoring-session-count">
                                                                {user.sessions.length} {user.sessions.length === 1 ? t('monitoring.session') : t('monitoring.sessions')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="monitoring-user-lastseen">
                                                        {formatDate(user.lastSeen)}{" "}
                                                        <FontAwesomeIcon
                                                            icon={faCircle}
                                                            className={isOnline ? 'status-icon online' : 'status-icon offline'}
                                                            title={isOnline ? 'Online' : 'Offline'}
                                                        />
                                                        {hasSessions && (
                                                            <FontAwesomeIcon
                                                                icon={faChevronDown}
                                                                className={`session-expand-chevron ${isExpanded ? 'open' : ''}`}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Session cards */}
                                                {hasSessions && (
                                                    <div className={`monitoring-sessions ${isExpanded ? 'open' : ''}`}>
                                                        {user.sessions.map(session => (
                                                            <div key={session.id} className="monitoring-session-card">
                                                                <div className="session-device-row">
                                                                    <FontAwesomeIcon icon={getDeviceIcon(session.deviceType)} className="session-device-icon" />
                                                                    <span className="session-device-type">{session.deviceType || '—'}</span>
                                                                    <span className="session-separator">·</span>
                                                                    <FontAwesomeIcon icon={faGlobe} className="session-browser-icon" />
                                                                    <span className="session-browser">{session.browser || '—'}</span>
                                                                    <span className="session-separator">·</span>
                                                                    <span className="session-os">{session.os || '—'}</span>
                                                                </div>
                                                                {session.active && session.currentPage && (() => {
                                                                    const label = resolvePageLabel(session.currentPage, t);
                                                                    const [pagePart, contextPart] = label.split('\n');
                                                                    return (
                                                                        <div className="session-current-page">
                                                                            <span className="session-time-label">{t('monitoring.currentPage')}:</span>
                                                                            <div className="session-page-value">
                                                                                <span className="session-page-title">{pagePart}</span>
                                                                                {contextPart && <span className="session-page-context">{contextPart}</span>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                <div className="session-times">
                                                                    <span className="session-time-label">{t('monitoring.firstLogin')}:</span>
                                                                    {renderDateTime(session.firstLogin)}
                                                                </div>
                                                                <div className="session-times">
                                                                    <span className="session-time-label">{t('monitoring.lastSeen')}:</span>
                                                                    {renderDateTime(session.lastSeen)}
                                                                </div>
                                                                {!session.active && session.lastLogout && (
                                                                    <div className="session-times">
                                                                        <span className="session-time-label">{t('monitoring.lastLogout')}:</span>
                                                                        {renderDateTime(session.lastLogout)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
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
