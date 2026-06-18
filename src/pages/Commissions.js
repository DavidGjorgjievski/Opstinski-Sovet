import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Commissions.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

function Commissions() {
    const { t } = useTranslation();
    const { municipalityId } = useParams();
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const canManage = userInfo.role === 'ROLE_ADMIN';

    const [terms, setTerms] = useState([]);
    const [commissionsByTerm, setCommissionsByTerm] = useState({});
    const [loading, setLoading] = useState(true);

    const [addCommModal, setAddCommModal] = useState({ open: false, termId: null, name: '' });
    const [addMemberModal, setAddMemberModal] = useState({
        open: false, commissionId: null, termId: null, username: '', role: 'MEMBER',
    });
    const [termUsers, setTermUsers] = useState({});
    const [termUsersLoading, setTermUsersLoading] = useState(false);

    const currentMunicipality = (JSON.parse(localStorage.getItem('municipalities')) || [])
        .find(m => String(m.id) === String(municipalityId));

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const { data: termsData } = await api.get(
                    `/api/municipality-terms/municipality/${municipalityId}`
                );
                const sorted = [...termsData].sort(
                    (a, b) => new Date(b.termPeriod.split(' - ')[0]) - new Date(a.termPeriod.split(' - ')[0])
                );
                setTerms(sorted);

                const commMap = {};
                await Promise.all(sorted.map(async (term) => {
                    const res = await api.get(`/api/municipality-terms/${term.id}/commissions`);
                    commMap[term.id] = res.data;
                }));
                setCommissionsByTerm(commMap);
            } catch (err) {
                console.error('Error fetching commissions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [municipalityId]);

    const fetchTermUsers = useCallback(async (termId) => {
        if (termUsers[termId]) return;
        setTermUsersLoading(true);
        try {
            const { data } = await api.get(`/api/municipality-terms/${termId}/votable-users`);
            setTermUsers(prev => ({ ...prev, [termId]: data }));
        } catch (err) {
            console.error('Error fetching term users:', err);
        } finally {
            setTermUsersLoading(false);
        }
    }, [termUsers]);

    const handleAddCommission = async () => {
        if (!addCommModal.name.trim()) return;
        try {
            const { data } = await api.post(
                `/api/municipality-terms/${addCommModal.termId}/commissions`,
                { name: addCommModal.name.trim() }
            );
            setCommissionsByTerm(prev => ({
                ...prev,
                [addCommModal.termId]: [...(prev[addCommModal.termId] || []), data],
            }));
            setAddCommModal({ open: false, termId: null, name: '' });
        } catch (err) {
            console.error('Error creating commission:', err);
        }
    };

    const handleDeleteCommission = async (termId, commissionId) => {
        try {
            await api.delete(`/api/municipality-terms/${termId}/commissions/${commissionId}`);
            setCommissionsByTerm(prev => ({
                ...prev,
                [termId]: prev[termId].filter(c => c.id !== commissionId),
            }));
        } catch (err) {
            console.error('Error deleting commission:', err);
        }
    };

    const handleAddMember = async () => {
        if (!addMemberModal.username) return;
        try {
            await api.post(
                `/api/municipality-terms/${addMemberModal.termId}/commissions/${addMemberModal.commissionId}/members`,
                { username: addMemberModal.username, role: addMemberModal.role }
            );
            const { data } = await api.get(
                `/api/municipality-terms/${addMemberModal.termId}/commissions`
            );
            setCommissionsByTerm(prev => ({ ...prev, [addMemberModal.termId]: data }));
            setAddMemberModal({ open: false, commissionId: null, termId: null, username: '', role: 'MEMBER' });
        } catch (err) {
            console.error('Error adding member:', err);
        }
    };

    const handleRemoveMember = async (termId, commissionId, username) => {
        try {
            await api.delete(
                `/api/municipality-terms/${termId}/commissions/${commissionId}/members/${username}`
            );
            setCommissionsByTerm(prev => ({
                ...prev,
                [termId]: prev[termId].map(c =>
                    c.id === commissionId
                        ? { ...c, members: c.members.filter(m => m.username !== username) }
                        : c
                ),
            }));
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    const openAddMemberModal = (commissionId, termId) => {
        fetchTermUsers(termId);
        setAddMemberModal({ open: true, commissionId, termId, username: '', role: 'MEMBER' });
    };

    const closeAddMemberModal = () =>
        setAddMemberModal({ open: false, commissionId: null, termId: null, username: '', role: 'MEMBER' });

    const closeAddCommModal = () =>
        setAddCommModal({ open: false, termId: null, name: '' });

    const getTermYears = (termPeriod) => {
        const [start, end] = termPeriod.split(' - ');
        return `${new Date(start).getFullYear()} – ${new Date(end).getFullYear()}`;
    };

    const getAvailableUsers = (commissionId, termId) => {
        const users = termUsers[termId] || [];
        const commission = (commissionsByTerm[termId] || []).find(c => c.id === commissionId);
        const taken = new Set((commission?.members || []).map(m => m.username));
        return users.filter(u => !taken.has(u.username));
    };

    return (
        <div className="commissions-container">
            <HelmetProvider>
                <Helmet><title>{t('commissions.title')}</title></Helmet>
            </HelmetProvider>
            <Header />

            <main className="commissions-body">
                <div className="commissions-header">
                    <button className="back-button" onClick={() => navigate('/municipalities')}>
                        <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <div className="commissions-title-row">
                        <h1 className="commissions-title">{t('commissions.title')}</h1>
                        {currentMunicipality?.flagImage && (
                            <img
                                src={`data:image/png;base64,${currentMunicipality.flagImage}`}
                                alt="flag"
                                className="commissions-flag"
                            />
                        )}
                    </div>
                    {currentMunicipality?.name && (
                        <p className="commissions-subtitle">{t('commissions.subtitle', { name: currentMunicipality.name })}</p>
                    )}
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    <div className="commissions-content">
                        {terms.length === 0 && (
                            <p className="commissions-empty-state">{t('commissions.noTerms')}</p>
                        )}

                        {terms.map(term => (
                            <div key={term.id} className="commissions-term-group">
                                <div className="commissions-term-header">
                                    <h2 className="commissions-term-title">{getTermYears(term.termPeriod)}</h2>
                                    {canManage && (
                                        <button
                                            className="entity-add-button"
                                            onClick={() => setAddCommModal({ open: true, termId: term.id, name: '' })}
                                        >
                                            {t('commissions.addCommission')} <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    )}
                                </div>
                                <hr className="commissions-divider" />

                                {(commissionsByTerm[term.id] || []).length === 0 ? (
                                    <p className="commissions-empty-state">{t('commissions.noCommissions')}</p>
                                ) : (
                                    <div className="commissions-grid">
                                        {(commissionsByTerm[term.id] || []).map(commission => (
                                            <div key={commission.id} className="commission-card">
                                                <div className="commission-card-header">
                                                    <h3 className="commission-name">{commission.name}</h3>
                                                    {canManage && (
                                                        <button
                                                            className="commission-icon-btn commission-icon-btn--delete"
                                                            onClick={() => handleDeleteCommission(term.id, commission.id)}
                                                            title={t('commissions.deleteCommission')}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    )}
                                                </div>

                                                <ul className="commission-members-list">
                                                    {commission.members.length === 0 && (
                                                        <li className="commission-no-members">{t('commissions.noMembers')}</li>
                                                    )}
                                                    {commission.members.map(member => (
                                                        <li key={member.username} className={`commission-member-item${member.username === userInfo.username ? ' commission-member-item--mine' : ''}`}>
                                                            <div className="commission-member-info">
                                                                <span className="commission-member-name">
                                                                    {member.name} {member.surname}
                                                                </span>
                                                                <span className={`commission-role-badge ${member.role === 'PRESIDENT' ? 'badge-president' : 'badge-member'}`}>
                                                                    {member.role === 'PRESIDENT' ? t('commissions.rolePresident') : t('commissions.roleMember')}
                                                                </span>
                                                            </div>
                                                            {canManage && (
                                                                <button
                                                                    className="commission-icon-btn commission-icon-btn--remove"
                                                                    onClick={() => handleRemoveMember(term.id, commission.id, member.username)}
                                                                    title={t('commissions.removeMember')}
                                                                >
                                                                    <FontAwesomeIcon icon={faXmark} />
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {canManage && (
                                                    <button
                                                        className="commission-add-member-btn"
                                                        onClick={() => openAddMemberModal(commission.id, term.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} /> {t('commissions.addMember')}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Commission Modal */}
            {addCommModal.open && (
                <div className="commission-modal-overlay" onClick={closeAddCommModal}>
                    <div className="commission-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="commission-modal-title">{t('commissions.newCommission')}</h3>
                        <input
                            className="commission-modal-input"
                            type="text"
                            placeholder={t('commissions.namePlaceholder')}
                            value={addCommModal.name}
                            onChange={e => setAddCommModal(prev => ({ ...prev, name: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddCommission()}
                            autoFocus
                        />
                        <div className="commission-modal-actions">
                            <button className="btn-cancel-modal" onClick={closeAddCommModal}>
                                {t('commissions.cancel')}
                            </button>
                            <button
                                className="entity-add-button"
                                onClick={handleAddCommission}
                                disabled={!addCommModal.name.trim()}
                            >
                                {t('common.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {addMemberModal.open && (
                <div className="commission-modal-overlay" onClick={closeAddMemberModal}>
                    <div className="commission-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="commission-modal-title">{t('commissions.addMember')}</h3>
                        {termUsersLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." style={{ width: 40 }} />
                            </div>
                        ) : (
                            <>
                                <label className="commission-modal-label">{t('commissions.userLabel')}</label>
                                <select
                                    className="commission-modal-input"
                                    value={addMemberModal.username}
                                    onChange={e => setAddMemberModal(prev => ({ ...prev, username: e.target.value }))}
                                >
                                    <option value="">{t('commissions.selectUser')}</option>
                                    {getAvailableUsers(addMemberModal.commissionId, addMemberModal.termId).map(u => (
                                        <option key={u.username} value={u.username}>
                                            {u.name} {u.surname}
                                        </option>
                                    ))}
                                </select>

                                <label className="commission-modal-label">{t('commissions.roleLabel')}</label>
                                <select
                                    className="commission-modal-input"
                                    value={addMemberModal.role}
                                    onChange={e => setAddMemberModal(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="MEMBER">{t('commissions.roleMember')}</option>
                                    <option value="PRESIDENT">{t('commissions.rolePresident')}</option>
                                </select>
                            </>
                        )}
                        <div className="commission-modal-actions">
                            <button className="btn-cancel-modal" onClick={closeAddMemberModal}>
                                {t('commissions.cancel')}
                            </button>
                            <button
                                className="entity-add-button"
                                onClick={handleAddMember}
                                disabled={!addMemberModal.username || termUsersLoading}
                            >
                                {t('common.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && <Footer />}
        </div>
    );
}

export default Commissions;
