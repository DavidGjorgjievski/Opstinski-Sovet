import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RestartTopicStatusModal from '../components/RestartTopicStatusModal';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faSquarePollVertical,
    faCirclePlay,
    faCircleStop,
    faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import useTopicCommissionVoteWebSocket from '../hooks/useTopicCommissionVoteWebSocket';
import '../styles/Topics.css';
import '../styles/Commissions.css';

const VOTE_FIELD_MAP = {
    YES: 'yes',
    NO: 'no',
    ABSTAINED: 'abstained',
    CANNOT_VOTE: 'cantVote',
    HAVE_NOT_VOTED: 'haveNotVoted',
};

const TopicCommissionsView = () => {
    const { id, idt, municipalityId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const selectedLang = localStorage.getItem('selectedLanguage') || 'mk';

    // Read fresh every render: other pages (profile/email/phone/image changes,
    // re-login) rewrite userInfo in localStorage, and vote/control access depends on it.
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const isAdmin = userInfo.role === 'ROLE_ADMIN';
    const commissionRolesKey = JSON.stringify(userInfo.commissionRoles || []);
    const commissionRoleMap = useMemo(
        () => JSON.parse(commissionRolesKey).reduce((acc, cr) => {
            acc[cr.commissionId] = cr.role;
            return acc;
        }, {}),
        [commissionRolesKey]
    );

    const [topicTitle, setTopicTitle] = useState('');
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentVotes, setCurrentVotes] = useState({});
    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [restartTarget, setRestartTarget] = useState(null);
    const votingInProgressRef = useRef(new Set());

    const commissionIds = useMemo(
        () => [...new Set(commissions.map(c => c.commissionId))],
        [commissions]
    );
    const { messages: voteMessages, sendCommissionVote } =
        useTopicCommissionVoteWebSocket(id, commissionIds);

    const currentSession = (JSON.parse(localStorage.getItem(`sessions_${municipalityId}`)) || [])
        .find(s => s.id === parseInt(id));
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const isSessionLocked = !isAdmin &&
        currentSession && new Date(currentSession.date) < twoMonthsAgo;

    // ROLE-level ability to vote; per-commission membership is checked in canVoteFor.
    const canVote = userInfo.status === 'ACTIVE' &&
        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER');
    const isMemberOf = (commissionId) => commissionRoleMap[commissionId] != null;
    const canVoteFor = (commission) => canVote && isMemberOf(commission.commissionId);
    const canControlCommission = (commission) =>
        isAdmin || commissionRoleMap[commission.commissionId] === 'PRESIDENT';

    const calculateProgress = () => {
        if (!commissions || commissions.length === 0) return 0;
        const finishedCount = commissions.filter(
            (commission) => commission.status === 'FINISHED'
        ).length;
        return Math.min((finishedCount / commissions.length) * 100, 100);
    };

    useEffect(() => {
        document.body.classList.add('commission-topics-bg');
        return () => document.body.classList.remove('commission-topics-bg');
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [topicRes, commissionsRes] = await Promise.all([
                api.get(`/api/topics/details/${idt}`),
                api.get(`/api/topics/${idt}/commissions`),
            ]);
            setTopicTitle(topicRes.data.title);
            setCommissions(commissionsRes.data);
        } catch (error) {
            console.error('Error fetching topic commissions:', error);
        } finally {
            setLoading(false);
        }
    }, [idt]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Stable key of the commissions the current user is a member of, so the
    // user-votes fetch only re-runs when that set changes (not on every re-render).
    const memberCommissionIdsKey = useMemo(() => {
        return [...new Set(commissions.map(c => c.commissionId))]
            .filter(cid => commissionRoleMap[cid] != null)
            .sort((a, b) => a - b)
            .join(',');
    }, [commissions, commissionRoleMap]);

    useEffect(() => {
        if (!canVote || !memberCommissionIdsKey) {
            setCurrentVotes({});
            return;
        }
        const ids = memberCommissionIdsKey.split(',');
        Promise.all(ids.map(cid =>
            api.get(`/api/sessions/${id}/commissions/${cid}/commission-topics-user-votes`)
                .then(res => res.data)
                .catch(() => [])
        )).then(results => {
            const votesMap = {};
            results.flat().forEach(([commissionTopicId, voteStatus]) => {
                votesMap[commissionTopicId] = voteStatus;
            });
            setCurrentVotes(votesMap);
        });
    }, [id, canVote, memberCommissionIdsKey]);

    // Apply live vote/status updates (a member voting here or on CommissionTopics.js,
    // or a president starting/finishing/restarting) to the matching card.
    useEffect(() => {
        if (voteMessages.length === 0) return;
        const last = voteMessages.at(-1);
        const updatedId = last.commissionTopicId;

        setCommissions((prev) =>
            prev.map((c) =>
                c.commissionTopicId === updatedId
                    ? {
                        ...c,
                        yes: last.yes,
                        no: last.no,
                        abstained: last.abstained,
                        cantVote: last.cantVote,
                        haveNotVoted: last.haveNotVoted,
                        absent: last.absent,
                        status: last.status,
                    }
                    : c
            )
        );

        if (last.voterUsername === userInfo.username && last.voteType) {
            setCurrentVotes((prev) => ({ ...prev, [updatedId]: last.voteType }));
        }

        if (last.status === 'CREATED') {
            setCurrentVotes((prev) => (
                updatedId in prev ? { ...prev, [updatedId]: 'HAVE_NOT_VOTED' } : prev
            ));
        }
    }, [voteMessages, userInfo.username]);

    const handleVote = async (commission, voteType) => {
        const ctId = commission.commissionTopicId;
        if (currentVotes[ctId] === voteType) return;
        if (votingInProgressRef.current.has(ctId)) return;
        votingInProgressRef.current.add(ctId);

        const prevVoteType = currentVotes[ctId];

        try {
            await api.post(`/api/commission-topics/vote/${ctId}/${voteType}`);

            setCurrentVotes((prev) => ({ ...prev, [ctId]: voteType }));

            setCommissions((prev) =>
                prev.map((c) => {
                    if (c.commissionTopicId !== ctId) return c;
                    const updated = { ...c };
                    const newField = VOTE_FIELD_MAP[voteType];
                    const prevField = VOTE_FIELD_MAP[prevVoteType];
                    if (newField) updated[newField] = (updated[newField] || 0) + 1;
                    if (prevField) updated[prevField] = Math.max(0, (updated[prevField] || 0) - 1);
                    return updated;
                })
            );

            sendCommissionVote(commission.commissionId, ctId, voteType, userInfo.username);
        } catch (error) {
            console.error('Error submitting commission vote:', error);
        } finally {
            votingInProgressRef.current.delete(ctId);
        }
    };

    const startVoting = async (commission) => {
        try {
            await api.get(`/api/commission-topics/${commission.commissionTopicId}/active`);
            await fetchData();
            sendCommissionVote(commission.commissionId, commission.commissionTopicId);
        } catch (error) {
            console.error('Error starting commission voting:', error);
        }
    };

    const finishVoting = async (commission) => {
        try {
            await api.get(`/api/commission-topics/${commission.commissionTopicId}/finish`);
            await fetchData();
            sendCommissionVote(commission.commissionId, commission.commissionTopicId);
        } catch (error) {
            console.error('Error finishing commission voting:', error);
        }
    };

    const openRestartModal = (commission) => {
        setRestartTarget(commission);
        setIsRestartModalOpen(true);
    };

    const closeRestartModal = () => {
        setIsRestartModalOpen(false);
        setRestartTarget(null);
    };

    const handleRestartConfirm = async () => {
        const target = restartTarget;
        closeRestartModal();
        if (!target?.commissionTopicId) return;
        try {
            await api.get(`/api/commission-topics/${target.commissionTopicId}/restart`);
            setCurrentVotes((prev) => {
                const updated = { ...prev };
                delete updated[target.commissionTopicId];
                return updated;
            });
            await fetchData();
            sendCommissionVote(target.commissionId, target.commissionTopicId);
        } catch (error) {
            console.error('Error restarting commission voting:', error);
        }
    };

    const renderVoteCell = (commission, voteType, extraClass, label) => {
        const ctId = commission.commissionTopicId;
        const votable = canVoteFor(commission);
        const isActive = commission.status === 'ACTIVE';
        const isFinished = commission.status === 'FINISHED';
        return (
            <div className="topic-item-body-detail-group-chunk">
                <div className="rez-container">
                    <span className="text-for-rez">{label}</span>
                </div>
                <div
                    onClick={votable && isActive ? () => handleVote(commission, voteType) : undefined}
                    className={[
                        'topic-button-vote', extraClass,
                        currentVotes[ctId] === voteType && votable ? 'active-vote' : '',
                        isActive && votable ? 'vote-activated vote-hover-enabled' : '',
                        isFinished ? `${extraClass}-finished` : '',
                    ].join(' ')}
                >
                    {commission[VOTE_FIELD_MAP[voteType]]}
                </div>
            </div>
        );
    };

    return (
        <div className="topics-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('topicCommissionsView.pageTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className="topcis-container-body">
                <div className="d-flex justify-content-center">
                    <div className="topic-header">
                        <div className="topic-header-title-div">
                            <button
                                className="back-button"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`)}
                            >
                                <span className="back-icon">
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </span>
                                <span className="back-text">{t('common.back')}</span>
                            </button>
                            <h1 className="topic-header-title mb-2">{t('topicCommissionsView.header')}</h1>

                            {commissions.length > 0 && (
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${calculateProgress()}%` }}
                                    ></div>
                                    <span className="progress-text">{Math.round(calculateProgress())}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {topicTitle && (
                    <div className="commission-topic-subtitle-wrapper">
                        <h5 className="commission-topic-subtitle">{topicTitle}</h5>
                    </div>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : commissions.length === 0 ? (
                    <p className="commissions-empty-state">{t('topicCommissionsView.noCommissions')}</p>
                ) : (
                    <div className="topic-body">
                        <div className="topic-div-rel">
                            <div className="topic-item topic-item-size commission-groups-wrapper">
                                {commissions.map(commission => (
                                    <div
                                        key={commission.commissionId}
                                        className={`topic-commission-group ${commission.status === 'FINISHED' ? 'finished-topic' : ''}`}
                                    >
                                        <h4 className="topic-commission-group-name">
                                            {commission.commissionName}
                                        </h4>

                                        {(commission.status === 'ACTIVE' || commission.status === 'FINISHED') && (
                                            <div className={`topic-item-body-detail ${
                                                commission.status === 'ACTIVE'
                                                    ? 'topic-item-body-detail-active'
                                                    : 'topic-item-body-detail-finish'
                                            }`}>
                                                <div className="topic-item-body-detail-group">
                                                    {renderVoteCell(commission, 'YES', 'vote-yes', t('topicsPage.yes'))}
                                                    {renderVoteCell(commission, 'NO', 'vote-no', t('topicsPage.no'))}
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    {renderVoteCell(commission, 'ABSTAINED', 'vote-abstained', t('topicsPage.abstained'))}
                                                    {renderVoteCell(commission, 'CANNOT_VOTE', 'vote-cantvote', t('topicsPage.cantVote'))}
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    {renderVoteCell(commission, 'HAVE_NOT_VOTED', 'vote-haventvote', t('topicsPage.notVoted'))}
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.absent')}</span>
                                                        </div>
                                                        <div className="topic-button-vote vote-absent">
                                                            {commission.absent}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">
                                                <div className="command-buttons">
                                                    <Link
                                                        to={`/municipalities/${municipalityId}/sessions/${id}/commissions/${commission.commissionId}/topics/details/${commission.commissionTopicId}`}
                                                        className={`gold-button ${selectedLang}`}
                                                    >
                                                        {commission.status === 'CREATED'
                                                            ? t('topicsPage.details')
                                                            : t('topicsPage.detailedResults')}&nbsp;
                                                        <FontAwesomeIcon icon={faSquarePollVertical} />
                                                    </Link>
                                                </div>

                                                {canControlCommission(commission) && !isSessionLocked && (
                                                    <div className="command-buttons-group">
                                                        {commission.status === 'CREATED' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => startVoting(commission)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t('topicsPage.startVoting')} <FontAwesomeIcon icon={faCirclePlay} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {commission.status === 'ACTIVE' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => finishVoting(commission)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t('topicsPage.finishVoting')} <FontAwesomeIcon icon={faCircleStop} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {commission.status === 'FINISHED' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => openRestartModal(commission)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t('topicsPage.restartVoting')} <FontAwesomeIcon icon={faRotateLeft} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {!loading && <Footer />}

            {isRestartModalOpen && (
                <RestartTopicStatusModal
                    isOpen={isRestartModalOpen}
                    onClose={closeRestartModal}
                    topicTitle={restartTarget?.commissionName}
                    onConfirm={handleRestartConfirm}
                />
            )}
        </div>
    );
};

export default TopicCommissionsView;
