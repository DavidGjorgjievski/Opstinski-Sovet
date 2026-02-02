import React, { useCallback, useEffect, useState, useMemo,useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../styles/Topics.css';
import Header from '../components/Header';
import RestartTopicStatusModal from '../components/RestartTopicStatusModal'
import TopicConfirmModal from '../components/TopicConfirmModal';
import LiveUsersModal from '../components/LiveUsersModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faDesktop, faPenToSquare, faTrash, faArrowUp, faArrowDown, faPlus,faChevronLeft, faCirclePlay, faCircleStop, faRotateLeft, faUsers, faSquarePollVertical, faEllipsisV, faToggleOn, faToggleOff, faBookmark } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import useVoteWebSocket from "../hooks/useVoteWebSocket";
import usePresenterWebSocket from "../hooks/usePresenterWebSocket";
import useNewTopicWebSocket from "../hooks/useNewTopicWebSocket";
import { useTranslation } from "react-i18next";
import api from '../api/axios'; 

function Topics() { 
    const [topics, setTopics] = useState([]);
    const [presentedTopicId, setPresentedTopicId] = useState(null);
    const { id } = useParams();
    const { municipalityId } = useParams();
    const [userRole, setUserRole] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [selectedTopicTitle, setSelectedTopicTitle] = useState(null);
    const [openMenus, setOpenMenus] = useState({}); // Object to track open menus
    const menuRefs = useRef({});
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const { t } = useTranslation();
    const selectedLang = localStorage.getItem("selectedLanguage") || "mk";
    const [sessionMunicipalityTermId, setSessionMunicipalityTermId] = useState(null);
    const [showFixDiv, setshowFixDiv] = useState(false); 
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')), []);
    const token = localStorage.getItem('jwtToken');
    const navigate = useNavigate();
    const [currentVotes, setCurrentVotes] = useState({});
    const [onlineUsersNumber, setOnlineUsersNumber] = useState(0);
    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [restartTopicId, setRestartTopicId] = useState(null);
    const [restartTopicTitle, setRestartTopicTitle] = useState('');
    const [topicsLoaded, setTopicsLoaded] = useState(false);
    const [showNumber, setShowNumber] = useState(false);
    const [isVoteAction, setIsVoteAction] = useState(false);
    const isVoteActionRef = useRef(isVoteAction);
    // WEB SOCKETS
    const { messages: voteMessages, sendVote } = useVoteWebSocket(id);
    const { messages: presenterMessages, sendPresenterUpdate } = usePresenterWebSocket(id);
    const { messages: newTopicMessages, sendNewTopic } = useNewTopicWebSocket(id);

    useEffect(() => {

        if (userInfo.role === "ROLE_GUEST") return;

        if (!sessionMunicipalityTermId || !municipalityId) return;

        const mandates = JSON.parse(localStorage.getItem(`municipalityMandates_${municipalityId}`)) || [];

        if (mandates.length === 0) return;

        const newestMandateId = Math.max(...mandates.map(m => m.id));

        setshowFixDiv(sessionMunicipalityTermId === newestMandateId);

    }, [sessionMunicipalityTermId, municipalityId, userInfo.role]);

    const [isOn, setIsOn] = useState(() => {
        const saved = localStorage.getItem(`toggle_state_session_${id}`);
        return saved === 'true'; // convert to boolean
    });

    const handleToggle = () => {
        const newValue = !isOn;
        setIsOn(newValue);
        localStorage.setItem(`toggle_state_session_${id}`, newValue);
    };

   const openRestartModal = (topicId, topicTitle) => {
        setRestartTopicId(topicId);
        setRestartTopicTitle(topicTitle);
        setIsRestartModalOpen(true);
    };

    const closeRestartModal = () => {
        setIsRestartModalOpen(false);
        setRestartTopicId(null);
    };

    const handleRestartConfirm = () => {
    if (restartTopicId) {
        restartVoting(restartTopicId, token);
    }
    closeRestartModal();
    };

    const toggleMenu = (id) => {
        setOpenMenus((prevMenus) => ({
        ...prevMenus,
        [id]: !prevMenus[id], // Toggle the specific menu's visibility
        }));
    };

    const toggleVisibility = () => {
        setShowNumber(!showNumber); // Toggle the visibility
        fetchOnlineUsers();
    };

    const handleClickOutside = useCallback(
        (event) => {
            Object.keys(menuRefs.current).forEach((id) => {
            if (
                openMenus[id] &&
                menuRefs.current[id] &&
                !menuRefs.current[id].contains(event.target)
            ) {
                setOpenMenus((prevMenus) => ({
                ...prevMenus,
                [id]: false,
                }));
            }
            });
        },
        [openMenus]
    );

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [handleClickOutside]);

    const openModal = (topicId, topicTitle) => {
        setSelectedTopicId(topicId);
        setSelectedTopicTitle(topicTitle);
        setIsModalOpen(true); // Open the modal
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTopicId(null); // Clear the topic ID when closing
        setSelectedTopicTitle(null); // Clear the title as well
    };

    const fetchTopics = useCallback(async () => {
    try {
        const response = await api.get(`/api/sessions/${id}/topics`);
        setTopics(response.data.topics);
        setPresentedTopicId(response.data.presentedTopicId);
        setTopicsLoaded(true);
        return response.data.topics; // return the topics
    } catch (error) {
        console.error("Error fetching topics:", error);
        return []; // return empty array on error
    }
}, [id]);

    useEffect(() => {
        const cachedSessions = localStorage.getItem(`sessions_${municipalityId}`);
        if (cachedSessions) {
            const sessions = JSON.parse(cachedSessions);
            const session = sessions.find(s => s.id === parseInt(id));
            if (session) {
                setSessionTitle(session.name);
                setSessionMunicipalityTermId(session.municipalityMandateId);
            }
        }
    }, [municipalityId, id]);

    const fetchUserVotes = useCallback(async () => {
        try {
            const response = await api.get(
            `/api/sessions/${id}/topics-user-votes`
            );

            const votesMap = {};
            response.data.forEach(([topicId, voteStatus]) => {
            votesMap[topicId] = voteStatus;
            });

            setCurrentVotes(votesMap);
        } catch (error) {
            console.error("Error fetching user votes:", error);
        }
    }, [id]);

    const fetchOnlineUsers = useCallback(async () => {
        if (!municipalityId) return;

        try {
            const response = await api.get(
            `/api/municipalities/${municipalityId}/online-users`
            );

            setOnlineUsersNumber(response.data);
        } catch (error) {
            console.error("Error fetching online users:", error);
        }
    }, [municipalityId]);

    useEffect(() => {
        if (showFixDiv) {
            fetchOnlineUsers();
        }
    }, [fetchOnlineUsers, showFixDiv]);

    useEffect(() => {
        if (userInfo && userInfo.role) {
            setUserRole(userInfo.role);
        }
        fetchTopics();
        if (
        showFixDiv &&
        (userInfo.role === "ROLE_USER" || userInfo.role === "ROLE_PRESIDENT")
        ) {
            fetchUserVotes();
        }
    }, [token, userInfo, fetchTopics, id, fetchUserVotes, showFixDiv]);

    const handleDelete = async () => {
        try {
            await api.delete(`/api/topics/${selectedTopicId}`);

            // Close modal and refresh topics
            closeModal();
            await fetchTopics();

            // Send WebSocket update
            sendNewTopic("NEW_TOPIC");
        } catch (error) {
            console.error("Error deleting the topic:", error);
        }
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1)); // Remove the '#' from the hash
            if (element) {
                // Timeout to allow the DOM to finish rendering
                const timeoutId = setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Clear the hash from the URL after scrolling
                    window.history.replaceState(null, null, ' ');
                },1); 

                return () => clearTimeout(timeoutId); 
            }
        }
    }, [topics]);

   const canVote = 
    (userRole === 'ROLE_PRESIDENT' || userRole === 'ROLE_USER') &&
    userInfo.municipalityId === municipalityId 
    &&
    userInfo.status === 'ACTIVE';

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await api.get(`/api/topics/pdf/${pdfId}`, {
                responseType: "blob", 
                headers: { Accept: "application/pdf" },
            });

            const url = URL.createObjectURL(response.data); 
            window.open(url, "_blank"); 

            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error("Error fetching PDF:", error);
        }
    };

    const startVoting = async (topicId) => {
        try {
            await api.get(`/api/sessions/${id}/topics/active/${topicId}`);

            // Update local state
            setIsVoteAction(true);
            console.log('Voting started successfully');

            // Refresh topics
            await fetchTopics();

            // Update current votes state
           if (userInfo.role !== "ROLE_ADMIN") {
            setCurrentVotes((prevVotes) => ({
                ...prevVotes,
                [String(topicId)]: 'HAVE_NOT_VOTED', 
            }));
            }

            // Send WebSocket updates
            sendVote(topicId);
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error starting voting:', error);
        }
    };

    const finishVoting = async (topicId) => {
        try {
            await api.get(`/api/sessions/${id}/topics/finish/${topicId}`);

            // Update local state
            setIsVoteAction(true);

            // Refresh topics
            await fetchTopics();

            console.log('Voting finished successfully');

            // Send WebSocket updates
            sendVote(topicId);
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error finishing voting:', error);
        }
    };

    const restartVoting = async (topicId) => {
        try {
            // Axios GET request using your api instance
            await api.get(`/api/topics/create/${topicId}`);

            // Update local state
            setIsVoteAction(true);

            setCurrentVotes((prevVotes) => {
            const updatedVotes = { ...prevVotes };
            delete updatedVotes[topicId]; // Remove votes for this topic
            return updatedVotes;
            });

            console.log('Voting restarted successfully');

            // Refresh topics
            await fetchTopics();

            // Send WebSocket updates
            sendVote(topicId);
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error restarting voting:', error);
        }
    };

    const handleVote = async (topicId, voteType) => {

        // Prevent sending request if vote is already the same
        if (currentVotes[topicId] === voteType) {
            console.log("Vote unchanged, request skipped");
            return;
        }

        try {
            await api.post(`/api/topics/vote/${topicId}/${voteType}`);

            console.log(`${voteType} vote submitted successfully`);

            // Mark this as a vote action
            setIsVoteAction(true);

            // Update local vote state immediately (optimistic UI)
            setCurrentVotes((prevVotes) => ({
                ...prevVotes,
                [topicId]: voteType,
            }));

            // Notify others via WebSocket
            sendVote(topicId);

        } catch (error) {
            console.error("Error submitting vote:", error);

            // Optional: revert UI on conflict
            if (error.response?.status === 409) {
                console.warn("Vote conflict, retrying not allowed");
            }
        }
    };

    useEffect(() => {
        // Save scroll position on refresh
        const handleBeforeUnload = () => {
            sessionStorage.setItem('scrollPosition', window.scrollY);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const saveScrollPosition = () => {
        const scrollPosition = window.scrollY;
        sessionStorage.setItem('scrollPosition', scrollPosition);
    };

    useEffect(() => {
        isVoteActionRef.current = isVoteAction;
    }, [isVoteAction]);

    useEffect(() => {
        if (!topicsLoaded) return; // Wait until first load is complete

        // Skip if action was from logo or from a voting WebSocket update
        if (isVoteActionRef.current) {
            isVoteActionRef.current = false;
            return;
        }

        const scrollPosition = sessionStorage.getItem('scrollPosition');
        if (scrollPosition) {
            const timeoutId = setTimeout(() => {
            window.scrollTo({ top: parseInt(scrollPosition, 10), behavior: 'smooth' });
            }, 200); // small delay to ensure layout is rendered

            return () => clearTimeout(timeoutId);
        }
    }, [topicsLoaded]);

    useEffect(() => {
        if (!presenterMessages.length) return;

        const lastTopicId = Number(presenterMessages[presenterMessages.length - 1]);

        // Optionally update local state if needed
        setPresentedTopicId(lastTopicId); // just update locally
    }, [presenterMessages]);


useEffect(() => {
  if (newTopicMessages.length > 0) {
    (async () => {
      const updatedTopics = await fetchTopics(); // now it returns topics

      setCurrentVotes(prevVotes => {
        const newVotes = { ...prevVotes };
        updatedTopics.forEach(topic => {
          if (!(topic.id in newVotes)) {
            newVotes[topic.id] = "HAVE_NOT_VOTED"; 
          }
        });
        localStorage.setItem(`currentVotes_session_${id}`, JSON.stringify(newVotes));
        return newVotes;
      });
    })();
  }
}, [newTopicMessages, fetchTopics, id]);




    const handlePresentClick = async (topicId) => {
        try {
            // Using Axios GET
            await api.get(`/api/topics/present/${topicId}`);

            // Send WebSocket update
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error("Failed to present topic:", error);
        }
    };

    useEffect(() => {
        if (voteMessages.length === 0) return;

        const lastResult = voteMessages.at(-1);
        const updatedTopicId = lastResult.topicId;

        // Update topic vote counts and status
        setTopics((prevTopics) =>
            prevTopics.map((topic) =>
                topic.id === updatedTopicId
                    ? {
                        ...topic,
                        yes: lastResult.yes,
                        no: lastResult.no,
                        abstained: lastResult.abstained,
                        cantVote: lastResult.cantVote,
                        haveNotVoted: lastResult.haveNotVoted,
                        absent: lastResult.absent,
                        topicStatus: lastResult.status,
                    }
                    : topic
            )
        );

        // Reset currentVotes if topic is restarted
        if (lastResult.status === 'CREATED') {
            setCurrentVotes((prevVotes) => ({
                ...prevVotes,
                [updatedTopicId]: 'HAVE_NOT_VOTED',
            }));
        }
    }, [voteMessages]);



    const currentSession = (JSON.parse(localStorage.getItem(`sessions_${municipalityId}`)) || [])
        .find(s => s.id === parseInt(id));

    const hasTopicPermissions  = (
        ((userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_EDITOR') &&
        userInfo.status === "ACTIVE" &&
        Number(municipalityId) === Number(userInfo.municipalityId) &&
        Array.isArray(userInfo.municipalityTermIds) &&
        currentSession &&
        userInfo.municipalityTermIds.includes(Number(currentSession.municipalityMandateId))
        ) || userInfo.role === 'ROLE_ADMIN'
    );

    const hasTopicPermissionsStatus  = (
        (userInfo.role === 'ROLE_PRESIDENT' &&
        userInfo.status === "ACTIVE" &&
        Number(municipalityId) === Number(userInfo.municipalityId) &&
        Array.isArray(userInfo.municipalityTermIds) &&
        currentSession &&
        userInfo.municipalityTermIds.includes(Number(currentSession.municipalityMandateId))
        ) || userInfo.role === 'ROLE_ADMIN'
    );

    function calculateProgress(topics) {
        if (topics.length === 0) return 0; // Avoid division by zero

        // Count FINISHED, INFORMATION, and WITHDRAWN topics
        const finishedCount = topics.filter(
            (topic) =>
                topic.topicStatus === "FINISHED" ||
                topic.topicStatus === "INFORMATION" ||
                topic.topicStatus === "WITHDRAWN"
        ).length;

        // Calculate percentage based on all topics
        return Math.min((finishedCount / topics.length) * 100, 100);
    }

    return (
        <div className="topics-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("topicsPage.pageTitle")}</title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className="topcis-container-body">
                <div className='d-flex justify-content-center'>
                     <div className="topic-header">
                        <div className='topic-header-title-div'>
                            <button
                                className="back-button-topic"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions#session-${id}`)}>
                                <FontAwesomeIcon icon={faChevronLeft} /> {t("topicsPage.backButton")}
                            </button>
                            <h1 className="topic-header-title">{t("topicsPage.headerTitle")}</h1>

                        {["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_USER", "ROLE_MAYOR", "ROLE_EDITOR"].includes(userInfo.role) && topics.length > 0 && (
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${calculateProgress(topics)}%` }}
                                ></div>
                                <span className="progress-text">{Math.round(calculateProgress(topics))}%</span>
                            </div>
                        )}

                        <div>
                            {sessionTitle && <h6 className='session-title'>{sessionTitle}</h6>}
                        </div>
                        </div>
                        <div className="session-button-container">
                             <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-form`}>
                                {hasTopicPermissions  && (
                                    <button className="topic-add-button" onClick={saveScrollPosition}>
                                        {t("topicsPage.addTopicButton")} <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
                

                <div className="topic-body">
                    {(isOn
                        ? topics.filter(topic => topic.id === presentedTopicId) // show only presented topic when toggle is on
                        : topics
                    )
                    .sort((a, b) => a.order_id - b.order_id)
                    .map(topic => (
                        <div key={topic.id} className='topic-div-rel'>
                           {topic.id === presentedTopicId && userInfo?.role !== "ROLE_GUEST" && !isOn && (
                                <FontAwesomeIcon 
                                    icon={faBookmark} 
                                    className="topic-bookmark-icon" 
                                    title={t("topicsPage.presentBadge")} 
                                />
                            )}
                            <span id={`topic-${topic.id}`} className="topic-span-id"></span>
                          <div className={`topic-item 
                            ${(topic.topicStatus === 'FINISHED' || topic.topicStatus === 'WITHDRAWN' || topic.topicStatus === 'INFORMATION') ? 'finished-topic' : ''} 
                            topic-item-size`}>
                                <div className="topic-header-div">
                                   <h3 className="text-center">
                                        {topic.pdfFileId ? (
                                            <span
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePdfFetch(topic.pdfFileId);
                                                }}
                                                className={`topic-header-text topic-header-pdf
                                                    ${
                                                        ["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_PRESIDENT"].includes(userInfo?.role)
                                                            ? "ape-width"
                                                            : ""
                                                    }
                                                    ${
                                                        ["ROLE_USER", "ROLE_MAYOR", "ROLE_SPECTATOR"].includes(userInfo?.role)
                                                            ? "user-width"
                                                            : ""
                                                    }
                                                    ${
                                                        userInfo?.role === "ROLE_GUEST"
                                                            ? "guest-width"
                                                            : ""
                                                    }
                                                `}
                                            >
                                                {topic.title}
                                            </span>
                                        ) : (
                                            <span
                                                className={`topic-header-text
                                                    ${
                                                        ["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_PRESIDENT"].includes(userInfo?.role)
                                                            ? "ape-width"
                                                            : ""
                                                    }
                                                    ${
                                                        ["ROLE_USER", "ROLE_MAYOR", "ROLE_SPECTATOR"].includes(userInfo?.role)
                                                            ? "user-width"
                                                            : ""
                                                    }
                                                    ${
                                                        userInfo?.role === "ROLE_GUEST"
                                                            ? "guset-width"
                                                            : ""
                                                    }
                                                `}
                                            >
                                                {topic.title}
                                            </span>
                                        )}
                                    </h3>
                                    <div className='menu-wrapper'>
                                    {hasTopicPermissions  && (
                                        <div className="menu-container" ref={(el) => (menuRefs.current[topic.id] = el)}>
                                           <div
                                                className={`menu-dots ${openMenus[topic.id] ? 'open' : ''}`}
                                                onClick={() => toggleMenu(topic.id)}
                                                >
                                                <FontAwesomeIcon className="menu-dots-icon" icon={faEllipsisV} />
                                            </div>
                                            {openMenus[topic.id] && (
                                                <ul className="menu-list">
                                                    {userInfo.role !== 'ROLE_EDITOR' && (
                                                        <li>
                                                            <span
                                                                onClick={() => {
                                                                    handlePresentClick(topic.id);
                                                                    toggleMenu(topic.id);
                                                                }}
                                                            >
                                                                {t("topicsPage.present")} <FontAwesomeIcon icon={faDesktop} />
                                                            </span>
                                                        </li>
                                                    )}
                                                    <li>
                                                        <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-before/${topic.id}`}
                                                            onClick={saveScrollPosition}
                                                        >
                                                            <span>{t("topicsPage.newTopicBefore")} <FontAwesomeIcon icon={faArrowUp} /></span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-after/${topic.id}`}
                                                            onClick={saveScrollPosition}
                                                        >
                                                            <span>{t("topicsPage.newTopicAfter")} <FontAwesomeIcon icon={faArrowDown} /></span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/edit/${topic.id}`}
                                                            onClick={saveScrollPosition}
                                                        >
                                                            {t("topicsPage.edit")} <FontAwesomeIcon icon={faPenToSquare} />
                                                        </Link>
                                                    </li>
                                                    <li className="topic-delete-button">
                                                        <span onClick={() => { openModal(topic.id, topic.title); toggleMenu(topic.id); }}>
                                                            {t("topicsPage.delete")} <FontAwesomeIcon icon={faTrash} />
                                                        </span>
                                                    </li>
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    </div>                    
                                </div>
                                      
                                <div className='topic-item-body'>
                                    {(topic.topicStatus === "ACTIVE" || topic.topicStatus === "FINISHED") && (
                                   <div
                                        className={`topic-item-body-detail ${
                                            topic.topicStatus === 'ACTIVE'
                                            ? 'topic-item-body-detail-active'
                                            : topic.topicStatus === 'FINISHED'
                                            ? 'topic-item-body-detail-finish'
                                            : ''
                                        }`}
                                        >
                                        <div className="topic-item-body-detail-group">
                                           <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">{t("topicsPage.yes")}</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'YES') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-yes',
                                                            currentVotes[topic.id] === 'YES' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'YES' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-yes-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                    >
                                                        {topic.yes}
                                                    </div>
                                            </div>
                                           <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">{t("topicsPage.no")}</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'NO') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-no',
                                                            currentVotes[topic.id] === 'NO' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'NO' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-no-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.no}
                                                    </div>
                                            </div>
                                        </div>
                                        <div className="topic-item-body-detail-group">
                                           <div className="topic-item-body-detail-group-chunk">
                                                 <div className="rez-container">
                                                     <span className="text-for-rez">{t("topicsPage.abstained")}</span>
                                                </div>
                                                <div
                                                    onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'ABSTAINED') : undefined}
                                                    className={[
                                                        'topic-button-vote',
                                                        'vote-abstained',
                                                        currentVotes[topic.id] === 'ABSTAINED' ? 'active-vote' : '',
                                                        topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'ABSTAINED' &&
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-scale' : '',
                                                        topic.topicStatus === 'ACTIVE' &&
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                        topic.topicStatus === 'FINISHED' ? 'vote-abstained-finished' : '',
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-hover-enabled' : ''
                                                    ].join(' ')}
                                                    >
                                                    {topic.abstained}
                                                </div>
                                            </div>
                                            <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">{t("topicsPage.cantVote")}</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'CANNOT_VOTE') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-cantvote',
                                                            currentVotes[topic.id] === 'CANNOT_VOTE' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'CANNOT_VOTE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-cantvote-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.cantVote}
                                                    </div>
                                            </div>
                                        </div>
                                        <div className="topic-item-body-detail-group">
                                           <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                       <span className="text-for-rez">{t("topicsPage.notVoted")}</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'HAVE_NOT_VOTED') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-haventvote',
                                                            currentVotes[topic.id] === 'HAVE_NOT_VOTED' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'HAVE_NOT_VOTED' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-haventvote-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') && userInfo.status === "ACTIVE" && userInfo.municipalityId === municipalityId ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.haveNotVoted}
                                                    </div>
                                                </div>
                                            <div className="topic-item-body-detail-group-chunk">
                                                <div className="rez-container">
                                                    <span className="text-for-rez">{t("topicsPage.absent")}</span>
                                                </div>
                                                <div className="topic-button-vote vote-absent">{topic.absent}</div>
                                            </div>
                                        </div>
                                </div>
                             )}

                        <div>
                            {topic.topicStatus === "INFORMATION" && (
                                <h4 className='topic-status-text'>{t("topicsPage.information")}</h4>
                            )}
                            {topic.topicStatus === "WITHDRAWN" && (
                                <h4 className='topic-status-text'>{t("topicsPage.withdrawn")}</h4>
                            )}
                        </div>


                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">
                                              {topic.topicStatus !== 'WITHDRAWN' && topic.topicStatus !== 'INFORMATION' && (
                                                    <div className="command-buttons">
                                                       <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/details/${topic.id}`}
                                                            className={`gold-button ${selectedLang}`}
                                                            onClick={saveScrollPosition}
                                                            >
                                                            {topic.topicStatus === "CREATED"
                                                            ? t("topicsPage.details")
                                                            : t("topicsPage.detailedResults")}&nbsp;
                                                        <FontAwesomeIcon icon={faSquarePollVertical} />
                                                        </Link>
                                                    </div>
                                                )}


                                            {hasTopicPermissionsStatus && (
                                                    <div className="command-buttons-group">
                                                        {topic.topicStatus === "CREATED" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => startVoting(topic.id, token)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.startVoting")} <FontAwesomeIcon icon={faCirclePlay} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {topic.topicStatus === "ACTIVE" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => finishVoting(topic.id, token)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.finishVoting")} <FontAwesomeIcon icon={faCircleStop} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {topic.topicStatus === "FINISHED" && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => openRestartModal(topic.id, topic.title)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.restartVoting")} <FontAwesomeIcon icon={faRotateLeft} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) }
                    <div className="mt-4">
                        {topics.length > 2 && hasTopicPermissions && !isOn && (
                            <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-form`}>
                                <button
                                    className="topic-add-button"
                                    onClick={saveScrollPosition}
                                >
                                    {t("topicsPage.addTopicButton")} <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
            {topics.length > 0 && <Footer />}


            {showFixDiv && (
                <div
                className={`fixed-position-div ${showNumber ? 'show-number' : 'div-bigger'}`}
                onClick={toggleVisibility}
                >
                    <div className="arrow">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>

                    {showNumber && (
                        <>
                            <div className="tooltip-container" onClick={(e) => e.stopPropagation()}>
                                <div onClick={handleToggle} className="toggle-topics">
                                    <FontAwesomeIcon icon={isOn ? faToggleOn : faToggleOff} />
                                </div>
                                <span className="tooltip-text">{t("tooltip.easyMode")}</span>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                                <div className="number" onClick={() => setIsLiveModalOpen(true)}>
                                    <p className="number-content">
                                        <span className="number-content-span">{onlineUsersNumber}</span>
                                        <FontAwesomeIcon icon={faUsers} />
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
            </div>
            )}

          {isModalOpen && (
                <TopicConfirmModal
                    isOpen={isModalOpen}  
                    onClose={closeModal}  
                    onConfirm={handleDelete}
                    topicTitle={selectedTopicTitle ? `${selectedTopicTitle}` : ''}
                />
            )}


           {isRestartModalOpen && (
                <RestartTopicStatusModal
                    isOpen={isRestartModalOpen}
                    onClose={closeRestartModal}
                    topicTitle={restartTopicTitle}
                    onConfirm={handleRestartConfirm}
                />
            )}



       <LiveUsersModal
            isOpen={isLiveModalOpen}
            onClose={() => setIsLiveModalOpen(false)}
            municipalityId={municipalityId}
            canSeeAction={hasTopicPermissionsStatus}
        />
        </div>
    );
}

export default Topics;
