import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Amendments.css';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import RestartAmendmentStatusModal from '../components/RestartAmendmentStatusModal';
import AmendmentConfirmModal from '../components/AmendmentConfirmModal';
import useAmendmentVoteWebSocket from "../hooks/useAmendmentVoteWebSocket";
import useNewAmendmentWebSocket from "../hooks/useNewAmendmentWebSocket";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronLeft, 
    faPlus, 
    faEllipsisV, 
    faPenToSquare, 
    faTrash,
    faCircleStop,
    faRotateLeft,
    faCirclePlay,
    faSquarePollVertical
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';


function Amendments() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { municipalityId, id, idt } = useParams();
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')), []);
    const selectedLang = localStorage.getItem("selectedLanguage") || "mk";
    const [amendments, setAmendments] = useState([]);
    const [topicTitle, setTopicTitle] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [topics, setTopics] = useState([]); // for progress bar
    const [openMenus, setOpenMenus] = useState({}); // track which amendment menu is open
    const menuRefs = useRef({}); // refs for each amendment menu
    const [currentVotes, setCurrentVotes] = useState({});
    const [isRestartAmendmentModalOpen, setIsRestartAmendmentModalOpen] = useState(false);
    const [restartAmendmentId, setRestartAmendmentId] = useState(null);
    const [restartAmendmentTitle, setRestartAmendmentTitle] = useState("");
    const [isDeleteAmendmentModalOpen, setIsDeleteAmendmentModalOpen] = useState(false);
    const [deleteAmendmentId, setDeleteAmendmentId] = useState(null);
    const [deleteAmendmentTitle, setDeleteAmendmentTitle] = useState("");
    const currentSession = (JSON.parse(localStorage.getItem(`sessions_${municipalityId}`)) || [])
        .find(s => s.id === parseInt(id));
    
    const { messages: amendmentMessages, sendVote: sendAmendmentVote } =
    useAmendmentVoteWebSocket(idt);

    const { messages: newAmendmentMessages, sendNewAmendment } = useNewAmendmentWebSocket(idt);

    const toggleMenu = (amendmentId) => {
    setOpenMenus(prev => ({
        ...prev,
        [amendmentId]: !prev[amendmentId]
    }));
};

const openDeleteAmendmentModal = (amendmentId, amendmentTitle) => {
    setDeleteAmendmentId(amendmentId);
    setDeleteAmendmentTitle(amendmentTitle);
    setIsDeleteAmendmentModalOpen(true);
};

const closeDeleteAmendmentModal = () => {
    setIsDeleteAmendmentModalOpen(false);
    setDeleteAmendmentId(null);
};

const handleDeleteAmendmentConfirm = async () => {
    try {
        await api.delete(`/api/topics/${idt}/amendments/${deleteAmendmentId}`);

        await fetchAmendments();

        sendNewAmendment(`DELETE_AMENDMENT_${deleteAmendmentId}`);

    } catch (error) {
        console.error("Error deleting amendment:", error);
    }

    closeDeleteAmendmentModal();
};

    useEffect(() => {
        sessionStorage.removeItem('scrollPosition');
    }, []);

    const saveScrollPosition = () => {
        sessionStorage.setItem('scrollPosition', window.scrollY);
    };

const fetchAmendments = useCallback(async () => {
    try {
        const response = await api.get(`/api/topics/${idt}/amendments`);
        const data = response.data || {};
        const amendmentsArray = Array.isArray(data.amendments) ? data.amendments : [];
        setAmendments(amendmentsArray);
        setTopicTitle(data.topicTitle || "");
        setLoaded(true);
        setTopics(Array.isArray(data.topics) ? data.topics : []); // for progress
        return amendmentsArray; // ✅ return for WebSocket
    } catch (error) {
        console.error("Error fetching amendments:", error);
        setAmendments([]);
        setTopicTitle("");
        setTopics([]);
        setLoaded(true);
        return []; // ✅ safe fallback
    }
}, [idt]);

    useEffect(() => {
        fetchAmendments();
    }, [fetchAmendments]);

    const hasAmendmentAccess = (
        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
        userInfo.status === "ACTIVE" &&
        Number(municipalityId) === Number(userInfo.municipalityId) &&
        Array.isArray(userInfo.municipalityTermIds) &&
        currentSession &&
        userInfo.municipalityTermIds.includes(Number(currentSession.municipalityMandateId))
    );
    
    const hasAmendmentPermission = (
        (
            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
            userInfo.status === "ACTIVE" &&
            Number(municipalityId) === Number(userInfo.municipalityId) &&
            Array.isArray(userInfo.municipalityTermIds) &&
            currentSession &&
            userInfo.municipalityTermIds.includes(Number(currentSession.municipalityMandateId))
        ) || userInfo.role === 'ROLE_ADMIN'
    );

    // Progress calculation
    const calculateProgress = () => {
        if (!amendments || amendments.length === 0) return 0;
        const finishedCount = amendments.filter(
            (amendments) =>
                amendments.status === "FINISHED"
        ).length;
        return Math.min((finishedCount / amendments.length) * 100, 100);
    };

    const handleAmendmentPdfFetch = async (pdfId) => {
    try {
        const response = await api.get(`/api/topics/${idt}/amendments/pdf/${pdfId}`, {
            responseType: "blob", // important for PDF
            headers: { Accept: "application/pdf" },
        });

        const url = URL.createObjectURL(response.data);
        window.open(url, "_blank");

        // revoke the object URL after some time to free memory
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
        console.error("Error fetching amendment PDF:", error);
    }
};

    const canVote = (
        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
        userInfo.status === "ACTIVE" &&
        Number(municipalityId) === Number(userInfo.municipalityId) &&
        Array.isArray(userInfo.municipalityTermIds) &&
        currentSession &&
        userInfo.municipalityTermIds.includes(Number(currentSession.municipalityMandateId))
    );

    const fetchAmendmentUserVotes = useCallback(async () => {
        if (!['ROLE_USER', 'ROLE_PRESIDENT'].includes(userInfo.role)) return;

        try {
            const response = await api.get(
                `/api/topics/${idt}/amendments/user-votes`
            );

            const votesMap = {};
            response.data.forEach(([amendmentId, voteStatus]) => {
                votesMap[amendmentId] = voteStatus;
            });

            setCurrentVotes(votesMap);
        } catch (error) {
            console.error("Error fetching amendment user votes:", error);
        }
    }, [idt, userInfo.role]);

        useEffect(() => {
        fetchAmendmentUserVotes();
    }, [fetchAmendmentUserVotes]);


const handleAmendmentVote = async (amendmentId, voteType) => {

    // Prevent duplicate vote
    if (currentVotes[amendmentId] === voteType) {
        console.log("Amendment vote unchanged, request skipped");
        return;
    }

    try {
        await api.post(
            `/api/topics/${idt}/amendments/vote/${amendmentId}/${voteType}`
        );

        console.log(`${voteType} amendment vote submitted`);

        // Optimistic UI update
        setCurrentVotes((prevVotes) => ({
            ...prevVotes,
            [amendmentId]: voteType,
        }));

        // 🔥 Notify others via WebSocket
        sendAmendmentVote(amendmentId);

    } catch (error) {
        console.error("Error submitting amendment vote:", error);

        if (error.response?.status === 409) {
            console.warn("Amendment vote conflict");
        }
    }
};


const startAmendmentVoting = async (amendmentId, topicId) => {
    try {
        // Send GET request to backend
        await api.get(`/api/topics/${topicId}/amendments/${amendmentId}/active`);
        console.log('Amendment voting started successfully');

        // Refresh amendments list
        await fetchAmendments();

        // Update currentVotes for ROLE_USER and ROLE_PRESIDENT only
        if (['ROLE_USER', 'ROLE_PRESIDENT'].includes(userInfo.role)) {
            setCurrentVotes((prevVotes) => ({
                ...prevVotes,
                [String(amendmentId)]: 'HAVE_NOT_VOTED',
            }));
        }


    } catch (error) {
        console.error('Error starting amendment voting:', error);
        // Optional: show toast/alert
    }
};



// Finish amendment voting
const finishAmendmentVoting = async (amendmentId, topicId) => {
    try {
        console.log("amendmentId" + amendmentId);
        console.log("topicId" + topicId);
        await api.get(
            `/api/topics/${topicId}/amendments/${amendmentId}/finish`
        );

        console.log('Amendment voting finished successfully');

        // Refresh amendments list
        await fetchAmendments();

        // Optional: reset local vote state if needed
        if (userInfo.role !== "ROLE_ADMIN") {
            setCurrentVotes((prevVotes) => ({
                ...prevVotes,
                [String(amendmentId)]: null, // Clear vote or leave as is
            }));
        }

    } catch (error) {
        console.error('Error finishing amendment voting:', error);
    }
};

// Restart amendment voting (requires backend support)
const restartAmendmentVoting = async (amendmentId, topicId) => {
    try {
        // If backend has no "restart" endpoint, you can "update" status to CREATED/ACTIVE
        await api.post(
            `/api/topics/${topicId}/amendments/${amendmentId}/restart`,
            {
                title: "",      // Can be ignored if backend supports partial update
                status: "CREATED" // Or "ACTIVE" depending on desired state
            }
        );

        console.log('Amendment voting restarted successfully');

        // Refresh amendments list
        await fetchAmendments();

        // Only reset votes for regular users
        if (['ROLE_USER', 'ROLE_PRESIDENT'].includes(userInfo.role)) {
            setCurrentVotes((prevVotes) => {
                const updatedVotes = { ...prevVotes };
                delete updatedVotes[amendmentId]; // Remove old vote
                return updatedVotes;
            });
        }

    } catch (error) {
        console.error('Error restarting amendment voting:', error);
    }
};

useEffect(() => {
    if (amendmentMessages.length === 0) return;

    const lastResult = amendmentMessages.at(-1);
    const updatedAmendmentId = lastResult.amendmentId;

    // Update amendment vote counts and status
    setAmendments((prevAmendments) =>
        prevAmendments.map((amendment) =>
            amendment.id === updatedAmendmentId
                ? {
                    ...amendment,
                    yes: lastResult.yes,
                    no: lastResult.no,
                    abstained: lastResult.abstained,
                    cantVote: lastResult.cantVote,
                    haveNotVoted: lastResult.haveNotVoted,
                    absent: lastResult.absent,
                    status: lastResult.status,
                }
                : amendment
        )
    );

    // Reset currentVotes if amendment voting restarted
    if (lastResult.status === "CREATED") {
        setCurrentVotes((prevVotes) => ({
            ...prevVotes,
            [updatedAmendmentId]: "HAVE_NOT_VOTED",
        }));
    }

}, [amendmentMessages]);

useEffect(() => {
  if (newAmendmentMessages.length > 0) {
    (async () => {
      const updatedAmendments = await fetchAmendments(); // now returns array safely

      setCurrentVotes(prevVotes => {
        const newVotes = { ...prevVotes };
        updatedAmendments.forEach(amendment => {
          if (!(amendment.id in newVotes)) {
            newVotes[amendment.id] = "HAVE_NOT_VOTED"; 
          }
        });
        localStorage.setItem(`currentVotes_amendments_${idt}`, JSON.stringify(newVotes));
        return newVotes;
      });
    })();
  }
}, [newAmendmentMessages, fetchAmendments, idt]);

const openRestartAmendmentModal = (amendmentId, amendmentTitle) => {
    setRestartAmendmentId(amendmentId);
    setRestartAmendmentTitle(amendmentTitle);
    setIsRestartAmendmentModalOpen(true);
};

const hasAmendmentPermissionsStatus = (
    (
        userInfo.role === 'ROLE_PRESIDENT' &&
        userInfo.status === "ACTIVE" &&
        Number(municipalityId) === Number(userInfo.municipalityId) &&
        Array.isArray(userInfo.municipalityTermIds) &&
        currentSession &&
        userInfo.municipalityTermIds.includes(
            Number(currentSession.municipalityMandateId)
        )
    ) || userInfo.role === 'ROLE_ADMIN'
);

const closeRestartAmendmentModal = () => {
    setIsRestartAmendmentModalOpen(false);
    setRestartAmendmentId(null);
};

const handleRestartAmendmentConfirm = () => {
    if (restartAmendmentId) {
        restartAmendmentVoting(restartAmendmentId, idt);
    }
    closeRestartAmendmentModal();
};

 useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(menuRefs.current).forEach((key) => {
                if (menuRefs.current[key] && !menuRefs.current[key].contains(event.target)) {
                    setOpenMenus(prev => ({ ...prev, [key]: false }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="amendments-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('amendments.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <main className="amendments-body-container">
                <div className='d-flex justify-content-center'>
                    <div className="topic-header">
                        <div className='topic-header-title-div'>

                            {/* Back button (hidden on mobile via CSS) */}
                            <button
                                className="back-button"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`)}
                            >
                                <span className="back-icon">
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </span>
                                <span className="back-text">
                                    {t("topicsPage.backButton")}
                                </span>
                            </button>

                            {/* Main Page Title */}
                            <h1 className="topic-header-title mb-2">
                                {t("amendments.title")}
                            </h1>

                            {/* Progress bar for topics */}
                            {["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_USER", "ROLE_MAYOR", "ROLE_EDITOR"].includes(userInfo.role) && amendments.length > 0 && (
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${calculateProgress(topics)}%` }}
                                    ></div>
                                    <span className="progress-text">{Math.round(calculateProgress(topics))}%</span>
                                </div>
                            )}
                        </div>

                        {/* Add button */}
                        <div className="session-button-container">
                            <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/amendments/${idt}/add-form`}>
                                {hasAmendmentAccess && (
                                    <button className="entity-add-button" onClick={saveScrollPosition}>
                                    {t("topicsPage.addTopicButton")} <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Topic Title below main heading */}
                {topicTitle && (
                    <div className="topic-subtitle-wrapper">
                        <h5 className="topic-subtitle">{topicTitle}</h5>
                    </div>
                )}

                <div className="topic-body">

                    {/* {!loaded && (
                        <p>{t("amendments.loading") || "Loading..."}</p>
                    )}

                    {loaded && amendments.length === 0 && (
                        <p>{t("amendments.noAmendments") || "No amendments yet."}</p>
                    )} */}

                    {loaded && amendments.length > 0 &&
                        amendments
                            .sort((a, b) => a.order_id - b.order_id)
                            .map(amendment => (

                                <div key={amendment.id} className='topic-div-rel'>

                                    <span
                                        id={`amendment-${amendment.id}`}
                                        className="topic-span-id"
                                    ></span>

                                    <div className={`topic-item 
                                        ${(amendment.status === 'FINISHED' || amendment.status === 'WITHDRAWN' || amendment.status === 'INFORMATION') ? 'finished-topic' : ''} 
                                        topic-item-size`}
                                    >
                                        <div className="topic-header-div">
                                            <h3 className="text-center">
                                                {amendment.pdfFileId ? (
                                                    <span
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleAmendmentPdfFetch(amendment.pdfFileId);
                                                        }}
                                                        className={`
                                                            topic-header-text topic-header-pdf
                                                            ${["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_PRESIDENT", "ROLE_USER"].includes(userInfo?.role) ? "ape-width" : ""}
                                                            ${["ROLE_MAYOR", "ROLE_SPECTATOR"].includes(userInfo?.role) ? "user-width" : ""}
                                                            ${userInfo?.role === "ROLE_GUEST" ? "guest-width" : ""}
                                                        `}
                                                    >
                                                        {amendment.title}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={`
                                                            topic-header-text
                                                            ${["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_PRESIDENT", "ROLE_USER"].includes(userInfo?.role) ? "ape-width" : ""}
                                                            ${["ROLE_MAYOR", "ROLE_SPECTATOR"].includes(userInfo?.role) ? "user-width" : ""}
                                                            ${userInfo?.role === "ROLE_GUEST" ? "guest-width" : ""}
                                                        `}
                                                    >
                                                        {amendment.title}
                                                    </span>
                                                )}
                                            </h3>
                                           
                                            <div className='menu-wrapper'>
                                            {hasAmendmentPermission && (userInfo.role === 'ROLE_ADMIN' || amendment.createdBy === userInfo.username) && (
                                                <div className="menu-container" ref={(el) => (menuRefs.current[amendment.id] = el)}>
                                                    
                                                    {/* Menu Dots */}
                                                    <div
                                                        className={`menu-dots ${openMenus[amendment.id] ? 'open' : ''}`}
                                                        onClick={() => toggleMenu(amendment.id)}
                                                    >
                                                        <FontAwesomeIcon className="menu-dots-icon" icon={faEllipsisV} />
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    {openMenus[amendment.id] && (
                                                        <ul className="menu-list">

                                                            {/* Edit Amendment - for admin/president/editor/user */}
                                                            {['ROLE_ADMIN', 'ROLE_PRESIDENT', 'ROLE_EDITOR', 'ROLE_USER'].includes(userInfo.role) && (
                                                                <li>
                                                                    <Link
                                                                        to={`/municipalities/${municipalityId}/sessions/${id}/topics/amendments/${idt}/edit/${amendment.id}`}
                                                                        onClick={saveScrollPosition}
                                                                    >
                                                                        <span>
                                                                            {t("topicsPage.edit")}{" "}
                                                                            <FontAwesomeIcon icon={faPenToSquare} />
                                                                        </span>
                                                                    </Link>
                                                                </li>
                                                            )}

                                                            {/* Delete Amendment - for admin/president */}
                                                            {['ROLE_ADMIN', 'ROLE_PRESIDENT'].includes(userInfo.role) && (
                                                                <li className="topic-delete-button">
                                                                    <span
                                                                        onClick={() => {
                                                                            openDeleteAmendmentModal(amendment.id, amendment.title);
                                                                            toggleMenu(amendment.id);
                                                                        }}
                                                                    >
                                                                        {t("topicsPage.delete")} <FontAwesomeIcon icon={faTrash} />
                                                                    </span>
                                                                </li>
                                                            )}

                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        </div>

                                         {(amendment.createdByName || amendment.createdBySurname) && (
                                                <div className="amendment-created-by-container">
                                                    <span className="amendment-created-by">
                                                        {t("amendments.amendmentFrom")}: {amendment.createdByName} {amendment.createdBySurname}
                                                    </span>
                                                </div>
                                            )}


                                        {amendment.amount && (
                                            <div className="topic-pill-container">
                                                <div className="topic-amount-container">
                                                    {amendment.amount} {t("topicsPage.currency")}
                                                </div>
                                            </div>
                                        )}

                                        <div className='topic-item-body'>
                                            {(amendment.status === "ACTIVE" || amendment.status === "FINISHED") && (
                                                <div
                                                    className={`topic-item-body-detail ${
                                                        amendment.status === 'ACTIVE'
                                                            ? 'topic-item-body-detail-active'
                                                            : amendment.status === 'FINISHED'
                                                            ? 'topic-item-body-detail-finish'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* YES / NO */}
                                                    <div className="topic-item-body-detail-group">
                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.yes")}</span>
                                                            </div>
                                                            <div
                                                                onClick={canVote && amendment.status === 'ACTIVE'
                                                                    ? () => handleAmendmentVote(amendment.id, 'YES')
                                                                    : undefined}
                                                                className={[
                                                                    'topic-button-vote',
                                                                    'vote-yes',
                                                                    currentVotes[amendment.id] === 'YES' && canVote ? 'active-vote' : '',
                                                                    amendment.status === 'ACTIVE' &&
                                                                    currentVotes[amendment.id] !== 'YES' &&
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-scale'
                                                                        : '',
                                                                    amendment.status === 'ACTIVE' && canVote ? 'vote-activated' : '',
                                                                    amendment.status === 'FINISHED' ? 'vote-yes-finished' : '',
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-hover-enabled'
                                                                        : ''
                                                                ].join(' ')}
                                                            >
                                                                {amendment.yes}
                                                            </div>
                                                        </div>

                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.no")}</span>
                                                            </div>
                                                            <div
                                                                onClick={canVote && amendment.status === 'ACTIVE'
                                                                    ? () => handleAmendmentVote(amendment.id, 'NO')
                                                                    : undefined}
                                                                className={[
                                                                    'topic-button-vote',
                                                                    'vote-no',
                                                                    currentVotes[amendment.id] === 'NO' && canVote ? 'active-vote' : '',
                                                                    amendment.status === 'ACTIVE' &&
                                                                    currentVotes[amendment.id] !== 'NO' &&
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-scale'
                                                                        : '',
                                                                    amendment.status === 'ACTIVE' && canVote ? 'vote-activated' : '',
                                                                    amendment.status === 'FINISHED' ? 'vote-no-finished' : '',
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-hover-enabled'
                                                                        : ''
                                                                ].join(' ')}
                                                            >
                                                                {amendment.no}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ABSTAINED / CANNOT VOTE */}
                                                    <div className="topic-item-body-detail-group">
                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.abstained")}</span>
                                                            </div>
                                                            <div
                                                                onClick={canVote && amendment.status === 'ACTIVE'
                                                                    ? () => handleAmendmentVote(amendment.id, 'ABSTAINED')
                                                                    : undefined}
                                                                className={[
                                                                    'topic-button-vote',
                                                                    'vote-abstained',
                                                                    currentVotes[amendment.id] === 'ABSTAINED' && canVote ? 'active-vote' : '',
                                                                    amendment.status === 'ACTIVE' &&
                                                                    currentVotes[amendment.id] !== 'ABSTAINED' &&
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-scale'
                                                                        : '',
                                                                    amendment.status === 'ACTIVE' && canVote ? 'vote-activated' : '',
                                                                    amendment.status === 'FINISHED' ? 'vote-abstained-finished' : '',
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-hover-enabled'
                                                                        : ''
                                                                ].join(' ')}
                                                            >
                                                                {amendment.abstained}
                                                            </div>

                                                        </div>

                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.cantVote")}</span>
                                                            </div>
                                                            <div
                                                                onClick={canVote && amendment.status === 'ACTIVE'
                                                                    ? () => handleAmendmentVote(amendment.id, 'CANNOT_VOTE')
                                                                    : undefined}
                                                                className={[
                                                                    'topic-button-vote',
                                                                    'vote-cantvote',
                                                                    currentVotes[amendment.id] === 'CANNOT_VOTE' && canVote ? 'active-vote' : '',
                                                                    amendment.status === 'ACTIVE' &&
                                                                    currentVotes[amendment.id] !== 'CANNOT_VOTE' &&
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-scale'
                                                                        : '',
                                                                    amendment.status === 'ACTIVE' && canVote ? 'vote-activated' : '',
                                                                    amendment.status === 'FINISHED' ? 'vote-cantvote-finished' : '',
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-hover-enabled'
                                                                        : ''
                                                                ].join(' ')}
                                                            >
                                                                {amendment.cantVote}
                                                            </div>

                                                        </div>
                                                    </div>

                                                    {/* NOT VOTED / ABSENT */}
                                                    <div className="topic-item-body-detail-group">
                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.notVoted")}</span>
                                                            </div>
                                                           <div
                                                                onClick={canVote && amendment.status === 'ACTIVE'
                                                                    ? () => handleAmendmentVote(amendment.id, 'HAVE_NOT_VOTED')
                                                                    : undefined}
                                                                className={[
                                                                    'topic-button-vote',
                                                                    'vote-haventvote',
                                                                    currentVotes[amendment.id] === 'HAVE_NOT_VOTED' && canVote ? 'active-vote' : '',
                                                                    amendment.status === 'ACTIVE' &&
                                                                    currentVotes[amendment.id] !== 'HAVE_NOT_VOTED' &&
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-scale'
                                                                        : '',
                                                                    amendment.status === 'ACTIVE' && canVote ? 'vote-activated' : '',
                                                                    amendment.status === 'FINISHED' ? 'vote-haventvote-finished' : '',
                                                                    (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') &&
                                                                    userInfo.status === "ACTIVE" &&
                                                                    userInfo.municipalityId === municipalityId
                                                                        ? 'vote-hover-enabled'
                                                                        : ''
                                                                ].join(' ')}
                                                            >
                                                                {amendment.haveNotVoted}
                                                            </div>

                                                        </div>

                                                        <div className="topic-item-body-detail-group-chunk">
                                                            <div className="rez-container">
                                                                <span className="text-for-rez">{t("topicsPage.absent")}</span>
                                                            </div>
                                                            <div className="topic-button-vote vote-absent">
                                                                {amendment.absent}
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            )}
                                        </div>







                                        
                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">

                                                    <div className="command-buttons">
                                                        <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/amendments/${idt}/details/${amendment.id}`}
                                                            className={`gold-button ${selectedLang}`}
                                                            onClick={saveScrollPosition}
                                                        >
                                                            {amendment.status === "CREATED"
                                                                ? t("topicsPage.details")
                                                                : t("topicsPage.detailedResults")
                                                            }&nbsp;
                                                            <FontAwesomeIcon icon={faSquarePollVertical} />
                                                        </Link>
                                                    </div>

                                                {hasAmendmentPermissionsStatus && (
                                                    <div className="command-buttons-group">

                                                        {amendment.status === "CREATED" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => startAmendmentVoting(amendment.id, idt)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.startVoting")}{" "}
                                                                    <FontAwesomeIcon icon={faCirclePlay} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {amendment.status === "ACTIVE" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => finishAmendmentVoting(amendment.id, idt)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.finishVoting")}{" "}
                                                                    <FontAwesomeIcon icon={faCircleStop} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {amendment.status === "FINISHED" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => openRestartAmendmentModal(amendment.id, amendment.title)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.restartVoting")}{" "}
                                                                    <FontAwesomeIcon icon={faRotateLeft} />
                                                                </button>
                                                            </div>
                                                        )}

                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ))
                    }
                </div>
                

            </main>

            {isRestartAmendmentModalOpen && (
                <RestartAmendmentStatusModal
                    isOpen={isRestartAmendmentModalOpen}
                    onClose={closeRestartAmendmentModal}
                    amendmentTitle={restartAmendmentTitle} // <-- should be here
                    onConfirm={handleRestartAmendmentConfirm}
                />
            )}

            {isDeleteAmendmentModalOpen && (
                <AmendmentConfirmModal
                    isOpen={isDeleteAmendmentModalOpen}
                    onClose={closeDeleteAmendmentModal}
                    amendmentTitle={deleteAmendmentTitle}
                    onConfirm={handleDeleteAmendmentConfirm}
                />
            )}


        </div>
    );
}

export default Amendments;
