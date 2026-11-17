import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircle, faChevronDown, faUsers, faDesktop, faMobileAlt, faTablet, faGlobe, faCalendarDays,
    faClock, faHourglass, faMagnifyingGlass, faXmark
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import useMonitoringWebSocket from '../hooks/useMonitoringWebSocket';
import UserAvatar from '../components/UserAvatar';
import { storeTermImages } from '../cache/imageCache';
import '../styles/Monitoring.css';

const IDLE_THRESHOLD_MS = 3 * 60 * 1000;
const FALLBACK_POLL_MS = 60000;
const WS_REFETCH_DEBOUNCE_MS = 3000;

// Same cache bucket the Admin panel uses for /api/admin/users/images
const IMAGE_CACHE_KEY = 'admin';

const ROLE_KEYS = {
    ROLE_USER: 'roles.user',
    ROLE_PRESIDENT: 'roles.president',
    ROLE_SPECTATOR: 'roles.spectator',
    ROLE_PRESENTER: 'roles.presenter',
    ROLE_ADMIN: 'roles.admin',
    ROLE_EDITOR: 'roles.editor',
    ROLE_MAYOR: 'roles.mayor',
    ROLE_GUEST: 'roles.guest',
};

function readStored(key, fallback) {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
}

function writeStored(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch { /* storage unavailable */ }
}

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

// Small reusable pill dropdown (used for status filter and sort)
function PillDropdown({ options, value, onChange, className = '' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    return (
        <div className={`monitoring-filter-wrapper ${className}`} ref={ref}>
            <div
                className={`monitoring-filter-selected ${open ? 'active' : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                {selected.icon && <span className="filter-icon">{selected.icon}</span>}
                <span>{selected.label}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`dropdown-chevron ${open ? 'open' : ''}`} />
            </div>
            {open && (
                <div className="monitoring-filter-options">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`monitoring-filter-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => { onChange(option.value); setOpen(false); }}
                        >
                            {option.icon && <span className="filter-icon">{option.icon}</span>}
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Monitoring() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monitoringFilter, setMonitoringFilter] = useState(() => readStored('monitoringFilter', 'all'));
    const [search, setSearch] = useState('');
    const [expandedUsers, setExpandedUsers] = useState({});
    const listRef = useRef(null);
    const { t, i18n } = useTranslation();

    useEffect(() => { writeStored('monitoringFilter', monitoringFilter); }, [monitoringFilter]);

    // ===== Data loading =====
    const filterRef = useRef(monitoringFilter);
    filterRef.current = monitoringFilter;

    const fetchUsers = useCallback(async () => {
        const filter = filterRef.current;
        try {
            let url = '/api/admin/users/last-login';
            if (filter !== 'all') url += `?status=${filter}`;
            const response = await api.get(url);
            // Ignore stale responses if the filter changed mid-flight
            if (filterRef.current === filter) setUsers(response.data);
        } catch (error) {
            console.error('Failed to load monitoring users', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchUsers();
        // Fallback polling — live updates normally come over the WebSocket
        const interval = setInterval(fetchUsers, FALLBACK_POLL_MS);
        return () => clearInterval(interval);
    }, [monitoringFilter, fetchUsers]);

    // Photos are not part of the (frequently refetched) list — load them once per visit
    useEffect(() => {
        api.get('/api/admin/users/images')
            .then(res => storeTermImages(IMAGE_CACHE_KEY, res.data))
            .catch(() => {});
    }, []);

    const debounceRef = useRef(null);
    const scheduleRefetch = useCallback(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchUsers, WS_REFETCH_DEBOUNCE_MS);
    }, [fetchUsers]);
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    useMonitoringWebSocket(scheduleRefetch);

    // ===== Clock (drives idle / online durations / relative times) =====
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const tick = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(tick);
    }, []);

    // ===== Formatting helpers =====
    const formatDate = (date) => {
        if (!date) return t('monitoring.never');
        return new Date(date).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
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

    // Today: relative ("5 min ago", "3 h ago"). Before today: date + time.
    const formatRelative = (date) => {
        if (!date) return t('monitoring.never');
        const d = new Date(date);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        if (d < todayStart) return formatDate(date);

        const diffSec = Math.max(0, Math.floor((now - d.getTime()) / 1000));
        if (diffSec < 60) return t('monitoring.time.justNow');
        if (diffSec < 3600) return t('monitoring.time.minutesAgo', { count: Math.floor(diffSec / 60) });
        return t('monitoring.time.hoursAgo', { count: Math.floor(diffSec / 3600) });
    };

    const formatDurationSince = (from) => {
        if (!from) return null;
        const diffMs = now - new Date(from).getTime();
        if (diffMs < 0) return null;
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) return t('monitoring.duration.hm', { h: hours, m: minutes });
        return t('monitoring.duration.m', { m: minutes });
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

    // Backend sends English values ("Desktop", "Mobile", "Tablet", "Unknown")
    const translateDevice = (value) => {
        if (!value) return '—';
        const key = value.toLowerCase();
        if (['desktop', 'mobile', 'tablet', 'unknown'].includes(key)) return t(`monitoring.devices.${key}`);
        return value;
    };

    const getDeviceIcon = (deviceType) => {
        if (!deviceType) return faDesktop;
        const d = deviceType.toLowerCase();
        if (d === 'mobile') return faMobileAlt;
        if (d === 'tablet') return faTablet;
        return faDesktop;
    };

    // ===== Derived per-user info =====
    const isOnline = (u) => u.onlineSessions > 0;

    // Earliest firstLogin among active sessions = how long the user has been continuously online
    const onlineSince = (u) => {
        if (!isOnline(u) || !u.sessions) return null;
        const starts = u.sessions
            .filter(s => s.active && s.firstLogin)
            .map(s => new Date(s.firstLogin).getTime());
        return starts.length ? Math.min(...starts) : null;
    };

    const getStatus = (u) => {
        if (!isOnline(u)) return 'offline';
        if (u.lastSeen && (now - new Date(u.lastSeen).getTime()) > IDLE_THRESHOLD_MS) return 'idle';
        return 'online';
    };

    // ===== Options =====
    const filterOptions = [
        { value: 'all', label: t('monitoring.filters.all'), icon: <FontAwesomeIcon icon={faUsers} /> },
        { value: 'online', label: t('monitoring.filters.online'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon online" /> },
        { value: 'offline', label: t('monitoring.filters.offline'), icon: <FontAwesomeIcon icon={faCircle} className="status-icon offline" /> }
    ];

    // ===== Click outside list collapses expanded cards =====
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (listRef.current && !listRef.current.contains(event.target)) setExpandedUsers({});
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleExpand = (username) => {
        setExpandedUsers(prev => ({ ...prev, [username]: !prev[username] }));
    };

    // ===== Search =====
    const locale = i18n.language || 'en';
    const fullName = (u) => `${u.name || ''} ${u.surname || ''}`.trim();

    const visibleUsers = useMemo(() => {
        const q = search.trim().toLocaleLowerCase(locale);
        const filtered = q
            ? users.filter(u =>
                [fullName(u), u.username, u.municipalityName]
                    .filter(Boolean)
                    .some(v => v.toLocaleLowerCase(locale).includes(q)))
            : users;
        return filtered;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users, search, locale]);

    // ===== Render pieces =====
    const renderBadges = (user) => {
        const roleKey = user.role && ROLE_KEYS[user.role];
        if (!roleKey) return null;
        return (
            <div className="monitoring-badges">
                {roleKey && (
                    <span className={`monitoring-badge role-badge role-${user.role.replace('ROLE_', '').toLowerCase()}`}>
                        {t(roleKey)}
                    </span>
                )}
            </div>
        );
    };

    const renderSessionCard = (session) => (
        <div key={session.id} className="monitoring-session-card">
            <div className="session-device-row">
                <FontAwesomeIcon icon={getDeviceIcon(session.deviceType)} className="session-device-icon" />
                <span className="session-device-type">{translateDevice(session.deviceType)}</span>
                <span className="session-separator">·</span>
                <FontAwesomeIcon icon={faGlobe} className="session-browser-icon" />
                <span className="session-browser">{translateDevice(session.browser)}</span>
                <span className="session-separator">·</span>
                <span className="session-os">{translateDevice(session.os)}</span>
            </div>
            {session.active && session.firstLogin && (
                <div className="session-online-duration">
                    <FontAwesomeIcon icon={faHourglass} className="session-duration-icon" />
                    <span>{t('monitoring.onlineFor')}: <strong>{formatDurationSince(session.firstLogin)}</strong></span>
                </div>
            )}
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
    );

    const renderUser = (user) => {
        const online = isOnline(user);
        const statusClass = getStatus(user);
        const hasSessions = user.sessions && user.sessions.length > 0;
        const isExpanded = expandedUsers[user.username];
        const since = onlineSince(user);

        return (
            <li className="monitoring-item" key={user.username}>
                <div
                    className={`monitoring-content ${hasSessions ? 'monitoring-content-clickable' : ''}`}
                    onClick={() => hasSessions && toggleExpand(user.username)}
                >
                    <div className="monitoring-user-image">
                        <UserAvatar
                            username={user.username}
                            name={user.name || ''}
                            surname={user.surname || ''}
                            termId={IMAGE_CACHE_KEY}
                            className="monitoring-avatar"
                        />
                    </div>
                    <div className="monitoring-user-info">
                        <div className="monitoring-user-name">{user.name} {user.surname}</div>
                        <div className="monitoring-user-username">@{user.username}</div>
                        {user.municipalityName && (
                            <div className="monitoring-user-municipality">{user.municipalityName}</div>
                        )}
                        {renderBadges(user)}
                        {hasSessions && online && (
                            <div className="monitoring-session-count">
                                {user.sessions.length} {user.sessions.length === 1 ? t('monitoring.session') : t('monitoring.sessions')}
                            </div>
                        )}
                    </div>
                    <div className="monitoring-user-status">
                        <div className="monitoring-user-lastseen" title={formatDate(user.lastSeen)}>
                            {formatRelative(user.lastSeen)}{" "}
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={`status-icon ${statusClass}`}
                                title={statusClass === 'idle' ? t('monitoring.statusIdle') : t(`monitoring.filters.${statusClass}`)}
                            />
                            {hasSessions && (
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    className={`session-expand-chevron ${isExpanded ? 'open' : ''}`}
                                />
                            )}
                        </div>
                        {online && (
                            <div className={`monitoring-status-pill ${statusClass}`}>
                                <span className="monitoring-status-pill-dot" />
                                <span className="monitoring-status-pill-label">
                                    {statusClass === 'idle' ? t('monitoring.statusIdle') : t('monitoring.filters.online')}
                                </span>
                                {(statusClass === 'idle' ? user.lastSeen : since) && (
                                    <>
                                        <span className="monitoring-status-pill-sep">·</span>
                                        <span className="monitoring-status-pill-time">
                                            {formatDurationSince(statusClass === 'idle' ? user.lastSeen : since)}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {hasSessions && (
                    <div className={`monitoring-sessions ${isExpanded ? 'open' : ''}`}>
                        {user.sessions.map(renderSessionCard)}
                    </div>
                )}
            </li>
        );
    };

    // Flat list: users active today first, then a divider, then the rest
    const renderFlatList = () => {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const isToday = u => isOnline(u) || (u.lastSeen && new Date(u.lastSeen) >= todayStart);
        const today = visibleUsers.filter(isToday);
        const earlier = visibleUsers.filter(u => !isToday(u));
        return (
            <ul className="monitoring-list-ul">
                {today.map(renderUser)}
                {today.length > 0 && earlier.length > 0 && (
                    <li className="monitoring-divider-item">
                        <hr className="monitoring-divider-line" />
                    </li>
                )}
                {earlier.map(renderUser)}
            </ul>
        );
    };

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

                    {/* Toolbar: search + status filter grouped on one row */}
                    <div className="monitoring-toolbar">
                        <div className="monitoring-search">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="monitoring-search-icon" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('monitoring.searchPlaceholder')}
                                className="monitoring-search-input"
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="monitoring-search-clear"
                                    onClick={() => setSearch('')}
                                    aria-label={t('monitoring.clearSearch')}
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            )}
                        </div>
                        <PillDropdown options={filterOptions} value={monitoringFilter} onChange={setMonitoringFilter} className="monitoring-toolbar-filter" />
                    </div>

                    <div className="monitoring-list">
                        {loading ? (
                            <div className="monitoring-loading-spinner">
                                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt={t('monitoring.loading')} />
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
                                            title={t('monitoring.filters.online')}
                                        />
                                        {t('monitoring.onlineUsers', { count: users.filter(isOnline).length })}
                                    </div>
                                )}
                                <div ref={listRef}>
                                    {visibleUsers.length === 0 ? (
                                        <p className="monitoring-empty">{t('monitoring.noResults')}</p>
                                    ) : renderFlatList()}
                                </div>
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
