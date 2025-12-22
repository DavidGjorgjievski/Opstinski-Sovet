import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Sessions.css'; 
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import SessionConfirmModal from '../components/SessionConfirmModal';
import NoTopicsExportModal from '../components/NoTopicsExportModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faPenToSquare, faTrash, faPlus, faChevronDown, faChevronUp, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from "react-i18next";
import api from '../api/axios';


function Sessions() {
    const { t } = useTranslation();
    const { municipalityId } = useParams();

    const [sessions, setSessions] = useState([]);
    const [municipalityTerms, setMunicipalityTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const dropdownRefs = useRef({});
    const [showNoTopicsModal, setShowNoTopicsModal] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    // Fetch Municipality Terms
   useEffect(() => {
    const fetchMunicipalityTerms = async () => {
        const cacheKey = `municipalityMandates_${municipalityId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            setMunicipalityTerms(JSON.parse(cachedData));
            return;
        }

        try {
            const { data } = await api.get(
                `/api/municipality-terms/municipality/${municipalityId}`
            );

            setMunicipalityTerms(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));

        } catch (error) {
            console.error('Error fetching Municipality Terms:', error);
        }
    };

    if (municipalityId) {
        fetchMunicipalityTerms();
    }
}, [municipalityId]);


    // Fetch Sessions
    useEffect(() => {
    const cacheKey = `sessions_${municipalityId}`;
    const cachedSessions = localStorage.getItem(cacheKey);

    if (cachedSessions) {
        setSessions(JSON.parse(cachedSessions));
        setLoading(false);
    }

    const fetchSessions = async () => {
        try {
            const { data } = await api.get(
                `/api/municipalities/${municipalityId}/sessions`
            );

            setSessions(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));

        } catch (error) {
            console.error('Error fetching sessions:', error);
            // 401 / 403 handled globally by interceptor → modal
        } finally {
            setLoading(false);
        }
    };

    if (municipalityId) {
        fetchSessions();
    }

    const cleanupMobileMenu = initializeMobileMenu();
    sessionStorage.removeItem('scrollPosition');

    return () => cleanupMobileMenu();
}, [municipalityId]);


    // Scroll to hash if exists
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1));
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sessions]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            let insideDropdown = false;
            Object.values(dropdownRefs.current).forEach(ref => {
                if (ref && ref.contains(event.target)) insideDropdown = true;
            });
            if (!insideDropdown) setOpenMenuId(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteClick = (session) => {
        setSelectedSession(session);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSession(null);
    };

    const handleConfirmDelete = async () => {
    if (!selectedSession) return;

    try {
        await api.delete(`/api/sessions/delete/${selectedSession.id}`);

        // Update local state
        setSessions(prev =>
            prev.filter(s => s.id !== selectedSession.id)
        );

        handleCloseModal();

    } catch (error) {
        console.error('Error deleting session:', error);
        // 401 / 403 handled globally by Axios interceptor
    }
};


   const handleExportClick = async (sessionId, sessionName) => {
    setExportLoading(true);

    try {
        const response = await api.get(
            `/api/sessions/export/${sessionId}`,
            {
                responseType: 'blob',
                validateStatus: status =>
                    status === 200 || status === 204
            }
        );

        if (response.status === 204) {
            setShowNoTopicsModal(true);
            return;
        }

        // ✅ Normal PDF download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const cleanFilename = sessionName
            ? sessionName
                .replace(/[<>:"/\\|?*]+/g, '')
                .replace(/\s+/g, '_') + '.pdf'
            : `session_${sessionId}.pdf`;

        const a = document.createElement('a');
        a.href = url;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error exporting session:', error);
    } finally {
        setExportLoading(false);
    }
};



    // Group sessions by municipalityMandateId
    const sessionsByMandate = [...municipalityTerms]
        .sort((a, b) => new Date(b.termPeriod.split(' - ')[0]) - new Date(a.termPeriod.split(' - ')[0])) // newest first
        .map(term => {
            const termSessions = sessions
                .filter(s => s.municipalityMandateId === term.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest sessions first
            return { term, sessions: termSessions };
        });

    const canAddSession =
    (
        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_EDITOR') &&
        userInfo.status === "ACTIVE" &&
        municipalityId === userInfo.municipalityId
    ) ||
    userInfo.role === 'ROLE_ADMIN';

    return (
        <div className="sessions-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('session.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header userInfo={userInfo} />

            <main className="session-body-container">
                <div className={`session-header 
                    ${sessions.length === 1 ? 'session-header-size1' : ''} 
                    ${sessions.length === 0 ? 'session-header-empty' : ''}
                `}>
                    <div className='session-header-div'>
                        <h1 className="session-header-title">{t('session.title')}</h1>
                        <p>{t('session.subtitle')}</p>
                    </div>
                    {canAddSession && (
                        <div className="session-button-container">
                            <a href={`/municipalities/${municipalityId}/sessions/add-form`}>
                                <button className="session-add-button">
                                    {t('session.add')} <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </a>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    <>
                        {/* Newest mandate sessions first, without header */}
                        {sessionsByMandate.length > 0 && sessionsByMandate[0].sessions.length > 0 && (
                            <div className="session-grid-container size-3">
                                {sessionsByMandate[0].sessions.map(session => (
                                    <SessionItem
                                        key={session.id}
                                        session={session}
                                        term={sessionsByMandate[0].term}
                                        municipalityId={municipalityId}
                                        userInfo={userInfo}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        dropdownRefs={dropdownRefs}
                                        handleDeleteClick={handleDeleteClick}
                                        handleExportClick={handleExportClick}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Older mandates with headers */}
                        {sessionsByMandate.slice(1).map(({ term, sessions: termSessions }) => (
                            <div key={term.id} className="session-mandate-group">
                                <h3 className="mandate-header">
                                    {new Date(term.termPeriod.split(' - ')[0]).getFullYear()} - {new Date(term.termPeriod.split(' - ')[1]).getFullYear()}
                                </h3>
                                <hr />
                                <div className="session-grid-container size-3">
                                    {termSessions.map(session => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            term={term}
                                            municipalityId={municipalityId}
                                            userInfo={userInfo}
                                            openMenuId={openMenuId}
                                            setOpenMenuId={setOpenMenuId}
                                            dropdownRefs={dropdownRefs}
                                            handleDeleteClick={handleDeleteClick}
                                            handleExportClick={handleExportClick}
                                            t={t}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                         {(sessionsByMandate.length === 0 ||
                            sessionsByMandate.every(m => m.sessions.length === 0)) && (
                            <div className="no-sessions-message">
                                {t('session.noSessions')}
                            </div>
                        )}
                    </>
                )}

                {exportLoading && (
                    <div className="modal-overlay">
                        <div className="export-loading-spinner">
                            <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt={t('session.exportLoading')} />
                        </div>
                    </div>
                )}

                <SessionConfirmModal
                    show={showModal}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmDelete}
                    sessionName={selectedSession ? selectedSession.name : ''}
                />

                <NoTopicsExportModal
                    show={showNoTopicsModal}
                    onClose={() => setShowNoTopicsModal(false)}
                />
            </main>

            {!loading && <Footer />}
        </div>
    );
}

const SessionItem = ({ session, term, municipalityId, userInfo, openMenuId, setOpenMenuId, dropdownRefs, handleDeleteClick, handleExportClick, t }) => {
    const formatDateByLanguage = (dateString, t) => {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const months = t('months', { returnObjects: true });
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    return (
        <div className="session-item">
            <span id={`session-${session.id}`} className="id-selector-session"></span>

            <img
                src={
                    term.termImage
                        ? `data:image/jpeg;base64,${term.termImage}`
                        : "/images/session-image.jpg"
                }
                alt="Term"
                className="session-image"
            />
            <div className="session-info">
                <div className="session-text">
                    <h2 className='session-name'>{session.name}</h2>
                    <p className='session-date'>{formatDateByLanguage(session.date, t)}</p>
                </div>

                <div className="all-session-buttons d-flex flex-row justify-content-between align-items-start w-100">
                    <div className="w-50 pe-2">
                        <a
                            href={`/municipalities/${municipalityId}/sessions/${session.id}/${userInfo.role === 'ROLE_PRESENTER' ? 'topics-presentation' : 'topics'}`}
                            className="button-see-content w-100"
                        >
                            {userInfo.role === 'ROLE_PRESENTER'
                                ? t('session.present')
                                : (<>{t('session.view')} <FontAwesomeIcon icon={faMagnifyingGlass} /></>)
                            }
                        </a>
                    </div>

                    <div className="w-50">
                        <div
                            className="admin-dropdown-wrapper w-100"
                            ref={(el) => (dropdownRefs.current[session.id] = el)}
                        >
                            <button
                                className="button-option-content w-100"
                                onClick={() => setOpenMenuId(openMenuId === session.id ? null : session.id)}
                            >
                                {t('session.options')} <FontAwesomeIcon icon={openMenuId === session.id ? faChevronUp : faChevronDown} />
                            </button>

                            {openMenuId === session.id && (
                                <div className="admin-dropdown">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleExportClick(session.id, session.name);
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} /> {t('session.export')}
                                    </button>

                                    {((
                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_EDITOR') &&
                                        userInfo.status === "ACTIVE" &&
                                        municipalityId === userInfo.municipalityId &&
                                        Array.isArray(userInfo.municipalityTermIds) &&
                                        userInfo.municipalityTermIds.includes(session.municipalityMandateId)
                                    )
                                        || userInfo.role === 'ROLE_ADMIN') && (
                                        <>
                                            <a
                                                className="dropdown-item"
                                                href={`/municipalities/${municipalityId}/sessions/edit/${session.id}`}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} /> {t('session.edit')}
                                            </a>
                                            <button
                                                className="dropdown-item delete"
                                                onClick={() => {
                                                    handleDeleteClick(session);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} /> {t('session.delete')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sessions;
