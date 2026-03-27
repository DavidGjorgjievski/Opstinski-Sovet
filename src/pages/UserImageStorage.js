import React, { useEffect, useState, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSort, faSortUp, faSortDown, faImage, faUser } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import '../styles/UserImageStorage.css';

const ROLE_LABELS = {
    ROLE_ADMIN: 'Admin',
    ROLE_USER: 'User',
    ROLE_PRESIDENT: 'President',
    ROLE_SPECTATOR: 'Spectator',
    ROLE_PRESENTER: 'Presenter',
    ROLE_EDITOR: 'Editor',
    ROLE_MAYOR: 'Mayor',
    ROLE_GUEST: 'Guest',
};

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function sizeColor(bytes) {
    if (!bytes) return 'uis-size-none';
    if (bytes < 15000) return 'uis-size-small';
    if (bytes < 35000) return 'uis-size-medium';
    return 'uis-size-large';
}

function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return <FontAwesomeIcon icon={faSort} className="uis-sort-icon" />;
    return <FontAwesomeIcon icon={sortDir === 'asc' ? faSortUp : faSortDown} className="uis-sort-icon uis-sort-active" />;
}

export default function UserImageStorage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState('sizeBytes');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/api/admin/users/image-storage')
            .then(res => setUsers(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir(field === 'sizeBytes' ? 'desc' : 'asc');
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return users.filter(u =>
            !q ||
            u.username.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.surname.toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q)
        );
    }, [users, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av = a[sortField] ?? '';
            let bv = b[sortField] ?? '';
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filtered, sortField, sortDir]);

    // Summary stats
    const stats = useMemo(() => {
        const withImage = users.filter(u => u.sizeBytes > 0);
        const totalBytes = withImage.reduce((s, u) => s + u.sizeBytes, 0);
        return {
            total: users.length,
            withImage: withImage.length,
            noImage: users.length - withImage.length,
            totalBytes,
            avgBytes: withImage.length ? Math.round(totalBytes / withImage.length) : 0,
        };
    }, [users]);

    return (
        <div className="uis-page">
            <HelmetProvider>
                <Helmet><title>{t('imageStorage.pageTitle')}</title></Helmet>
            </HelmetProvider>
            <Header />

            <main className="uis-main">
                <div className="uis-top-bar">
                    <button className="back-button" onClick={() => navigate('/admin-panel')}>
                        <span className="back-icon">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <h1 className="uis-title">
                        <FontAwesomeIcon icon={faImage} /> {t('imageStorage.pageTitle')}
                    </h1>
                </div>

                {/* Summary cards */}
                {!loading && (
                    <div className="uis-stats">
                        <div className="uis-stat-card">
                            <span className="uis-stat-value">{stats.total}</span>
                            <span className="uis-stat-label">{t('imageStorage.totalUsers')}</span>
                        </div>
                        <div className="uis-stat-card uis-stat-green">
                            <span className="uis-stat-value">{stats.withImage}</span>
                            <span className="uis-stat-label">{t('imageStorage.withImage')}</span>
                        </div>
                        <div className="uis-stat-card uis-stat-gray">
                            <span className="uis-stat-value">{stats.noImage}</span>
                            <span className="uis-stat-label">{t('imageStorage.noImage')}</span>
                        </div>
                        <div className="uis-stat-card uis-stat-blue">
                            <span className="uis-stat-value">{formatBytes(stats.totalBytes)}</span>
                            <span className="uis-stat-label">{t('imageStorage.totalSize')}</span>
                        </div>
                        <div className="uis-stat-card uis-stat-purple">
                            <span className="uis-stat-value">{formatBytes(stats.avgBytes)}</span>
                            <span className="uis-stat-label">{t('imageStorage.avgPerUser')}</span>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="uis-search-wrap">
                    <input
                        className="uis-search"
                        type="text"
                        placeholder={t('imageStorage.searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    <div className="uis-table-wrap">
                        <table className="uis-table">
                            <thead>
                                <tr>
                                    <th className="uis-th uis-th-img">{t('imageStorage.colImage')}</th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('username')}>
                                        {t('imageStorage.colUsername')} <SortIcon field="username" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('name')}>
                                        {t('imageStorage.colName')} <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('surname')}>
                                        {t('imageStorage.colSurname')} <SortIcon field="surname" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('role')}>
                                        {t('imageStorage.colRole')} <SortIcon field="role" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('format')}>
                                        {t('imageStorage.colFormat')} <SortIcon field="format" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                    <th className="uis-th uis-th-sortable" onClick={() => handleSort('sizeBytes')}>
                                        {t('imageStorage.colSize')} <SortIcon field="sizeBytes" sortField={sortField} sortDir={sortDir} />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(user => (
                                    <tr key={user.username} className="uis-row">
                                        <td className="uis-td uis-td-img">
                                            {user.image ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${user.image}`}
                                                    alt={`${user.name} ${user.surname}`}
                                                    className="uis-avatar"
                                                />
                                            ) : (
                                                <div className="uis-avatar uis-avatar-placeholder">
                                                    <FontAwesomeIcon icon={faUser} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="uis-td uis-td-username">{user.username}</td>
                                        <td className="uis-td">{user.name}</td>
                                        <td className="uis-td">{user.surname}</td>
                                        <td className="uis-td">
                                            <span className={`uis-role-badge uis-role-${user.role?.toLowerCase().replace('role_', '')}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="uis-td">
                                            {user.format ? (
                                                <span className="uis-format-badge">{user.format}</span>
                                            ) : (
                                                <span className="uis-none">—</span>
                                            )}
                                        </td>
                                        <td className="uis-td">
                                            <span className={`uis-size-badge ${sizeColor(user.sizeBytes)}`}>
                                                {formatBytes(user.sizeBytes)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sorted.length === 0 && (
                            <div className="uis-empty">{t('imageStorage.noMatch')}</div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
