import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import api from '../api/axios';
import useCommissionVoteWebSocket from '../hooks/useCommissionVoteWebSocket';
import '../styles/AddTopicForm.css';

export const COMMISSION_TOPIC_STATUSES = [
    'CREATED',
    'ACTIVE',
    'FINISHED',
    'NO_REPRESENTATIVE',
    'NO_PROPOSED_MEMBER',
    'REVIEWED_AT_SESSION',
];

function EditCommissionTopicStatus() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { municipalityId, sessionId, commissionId, commissionTopicId } = useParams();
    const { sendCommissionVote } = useCommissionVoteWebSocket(sessionId, commissionId);

    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const [initialStatus, setInitialStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const dropdownRef = useRef(null);

    // Go back to the page that opened this one (CommissionTopics or TopicCommissionsView)
    const backUrl = location.state?.from ||
        `/municipalities/${municipalityId}/sessions/${sessionId}/commissions/${commissionId}/topics`;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        api.get(`/api/commission-topics/${commissionTopicId}/details`)
            .then(({ data }) => {
                setTitle(data.title || '');
                setStatus(data.status);
                setInitialStatus(data.status);
            })
            .catch((err) => console.error('Error fetching commission topic:', err))
            .finally(() => setLoading(false));
    }, [commissionTopicId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropUp(window.innerHeight - rect.bottom < 260);
        }
        setOpen((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        if (status === initialStatus) {
            navigate(backUrl);
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.put(`/api/commission-topics/${commissionTopicId}/status/${status}`);
            await sendCommissionVote(commissionTopicId);
            navigate(backUrl);
        } catch (err) {
            console.error('Error changing commission topic status:', err);
            setError(err.response?.data?.message || t('commissions.saveStatusError'));
            setSaving(false);
        }
    };

    return (
        <HelmetProvider>
            <div className="add-topic-container">
                <Helmet>
                    <title>{t('commissions.editStatusTitle')}</title>
                </Helmet>

                <Header isSticky={true} />

                <div className="add-topic-body-container">
                    <div>
                        <div className="add-topic-header-div">
                            <h1>{t('commissions.editStatusTitle')}</h1>
                        </div>

                        {loading ? (
                            <div className="loading-spinner">
                                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                            </div>
                        ) : (
                            <div className="row justify-content-center">
                                <div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label className="label-add">{t('addTopicForm.topicTitle')}</label>
                                            <p className="mb-1">{title}</p>
                                        </div>

                                        <div className="topic-status-select-wrapper mt-3" ref={dropdownRef}>
                                            <label className="label-add">{t('commissions.selectStatus')}</label>

                                            <div className="custom-select-box" onClick={toggleDropdown} tabIndex={0}>
                                                {t(`commissions.topicStatus.${status}`)}
                                            </div>

                                            {open && (
                                                <div className={`custom-options ${dropUp ? 'drop-up' : ''}`}>
                                                    {COMMISSION_TOPIC_STATUSES.map((value) => (
                                                        <div
                                                            key={value}
                                                            className={`custom-option ${status === value ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setStatus(value);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            {t(`commissions.topicStatus.${value}`)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {error && <div className="text-danger mt-2">{error}</div>}

                                        <div className="mt-3 d-flex flex-start">
                                            <button type="submit" className="add-form-submit-button me-2" disabled={saving}>
                                                <FontAwesomeIcon icon={faPenToSquare} className="me-2" />
                                                {t('commissions.save')}
                                            </button>

                                            <button
                                                type="button"
                                                className="add-form-back-button"
                                                onClick={() => navigate(backUrl)}
                                            >
                                                <span className="back-icon">
                                                    <FontAwesomeIcon icon={faChevronLeft} />
                                                </span>
                                                {t('common.back')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}

export default EditCommissionTopicStatus;
