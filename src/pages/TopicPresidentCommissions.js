import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import RemoveCommissionConfirmModal from '../components/RemoveCommissionConfirmModal';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import '../styles/AddTopicForm.css';

const TopicPresidentCommissions = () => {
    const { id, idt, municipalityId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [topicTitle, setTopicTitle] = useState('');
    const [commissions, setCommissions] = useState([]);
    const [pendingRemoval, setPendingRemoval] = useState(null);

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const { data } = await api.get(`/api/sessions/${id}/topics/${idt}`);
                setTopicTitle(data.title);
            } catch (error) {
                console.error('Error fetching the topic:', error);
            }
        };

        fetchTopic();
    }, [id, idt]);

    const fetchCommissions = async () => {
        try {
            const { data } = await api.get(`/api/topics/${idt}/president-commissions`);
            setCommissions(data);
        } catch (error) {
            console.error('Error fetching president commissions:', error);
        }
    };

    useEffect(() => {
        if (idt) fetchCommissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idt]);

    const addCommission = async (commissionId) => {
        try {
            await api.post(`/api/topics/${idt}/commissions/${commissionId}`);
            setCommissions(prev =>
                prev.map(c =>
                    c.commissionId === commissionId ? { ...c, assigned: true, status: 'CREATED' } : c
                )
            );
        } catch (error) {
            console.error('Error adding topic to commission:', error);
        }
    };

    const removeCommission = async (commissionId) => {
        try {
            await api.delete(`/api/topics/${idt}/commissions/${commissionId}`);
            setCommissions(prev =>
                prev.map(c =>
                    c.commissionId === commissionId ? { ...c, assigned: false, status: null } : c
                )
            );
        } catch (error) {
            console.error('Error removing topic from commission:', error);
        }
    };

    const toggleCommission = (commission) => {
        if (commission.assigned) {
            if (commission.status === 'ACTIVE' || commission.status === 'FINISHED') {
                setPendingRemoval(commission);
                return;
            }
            removeCommission(commission.commissionId);
        } else {
            addCommission(commission.commissionId);
        }
    };

    const statusLabel = (status) => {
        if (status === 'ACTIVE') return t('addTopicForm.statusOptions.active');
        if (status === 'FINISHED') return t('addTopicForm.statusOptions.finished');
        if (status === 'CREATED') return t('addTopicForm.statusOptions.created');
        return null;
    };

    return (
        <HelmetProvider>
            <div className="add-topic-container">
                <Helmet>
                    <title>{t('topicPresidentCommissions.pageTitle')}</title>
                </Helmet>

                <Header isSticky={true} />

                <div className="add-topic-body-container">
                    <div className="add-topic-header-div">
                        <h1>{t('topicPresidentCommissions.header')}</h1>
                    </div>

                    {topicTitle && (
                        <p className="text-center mb-3">
                            <strong>{topicTitle}</strong>
                        </p>
                    )}

                    {commissions.length === 0 ? (
                        <p className="optional-text text-center">
                            {t('topicPresidentCommissions.noCommissions')}
                        </p>
                    ) : (
                        <div className="topic-commissions-grid">
                            {commissions.map(commission => (
                                <label
                                    key={commission.commissionId}
                                    className={`topic-commission-chip ${commission.assigned ? 'topic-commission-chip--checked' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="topic-commission-chip-input"
                                        checked={commission.assigned}
                                        onChange={() => toggleCommission(commission)}
                                    />
                                    <span className="topic-commission-chip-box">
                                        <FontAwesomeIcon icon={faCheck} className="topic-commission-chip-check" />
                                    </span>
                                    <span className="topic-commission-chip-label">
                                        {commission.commissionName}
                                        {commission.assigned && statusLabel(commission.status) && (
                                            <span className="topic-commission-chip-status">
                                                {' '}({statusLabel(commission.status)})
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 d-flex flex-start">
                        <button
                            type="button"
                            className="add-form-back-button"
                            onClick={() =>
                                navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`)
                            }
                        >
                            <span className="back-icon">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </span>
                            {t('common.back')}
                        </button>
                    </div>
                </div>

                <RemoveCommissionConfirmModal
                    isOpen={!!pendingRemoval}
                    commissionName={pendingRemoval?.commissionName || ''}
                    onClose={() => setPendingRemoval(null)}
                    onConfirm={() => {
                        removeCommission(pendingRemoval.commissionId);
                        setPendingRemoval(null);
                    }}
                />
            </div>
        </HelmetProvider>
    );
};

export default TopicPresidentCommissions;
