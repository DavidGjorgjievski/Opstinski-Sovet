import React, { useCallback, useEffect, useState, useMemo,useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../styles/Topics.css';
import Header from '../components/Header';
import RestartTopicStatusModal from '../components/RestartTopicStatusModal'
import { initializeMobileMenu } from '../components/mobileMenu';
import TopicConfirmModal from '../components/TopicConfirmModal';
import LiveUsersModal from '../components/LiveUsersModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faDesktop, faPenToSquare, faTrash, faArrowUp, faArrowDown, faPlus,faChevronLeft, faCirclePlay, faCircleStop, faRotateLeft, faUsers, faSquarePollVertical, faEllipsisV, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import useWebSocket from "../hooks/useWebSocket";

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

    const [onlineUsers, setOnlineUsers] = useState(0);

    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [restartTopicId, setRestartTopicId] = useState(null);
    const [restartTopicTitle, setRestartTopicTitle] = useState('');

    // WEB SOCKETS
    const { messages, sendVote } = useWebSocket(id); // for voting
    const { messages: presenterMessages, sendPresenterUpdate } = useWebSocket(id, "presenter"); // for presenter updates
    const { messages: newTopics } = useWebSocket(id, "newTopic");   

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



   const [showNumber, setShowNumber] = useState(false); // State to control visibility of number

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
  [openMenus] // Dependencies
);


   useEffect(() => {
  document.addEventListener("click", handleClickOutside);
  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, [handleClickOutside]);


    const [isFromLogo, setIsFromLogo] = useState(false);
    const [isVoteAction, setIsVoteAction] = useState(false);

    const isFromLogoRef = useRef(isFromLogo);
    const isVoteActionRef = useRef(isVoteAction);

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

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')), []);
    const token = localStorage.getItem('jwtToken');
    const navigate = useNavigate();


    // new IMPL
      const [currentVotes, setCurrentVotes] = useState({});

      const fetchTopics = useCallback(async () => {
        try {
          const endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics`;
      
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
      
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          const data = await response.json();
      
          setTopics(data.topics); 
          setPresentedTopicId(data.presentedTopicId); 
        } catch (error) {
          console.error('Error fetching topics:', error);
        }
    }, [id, token]);

 useEffect(() => {
        const cachedSessions = localStorage.getItem(`sessions_${municipalityId}`);
        if (cachedSessions) {
            const sessions = JSON.parse(cachedSessions);
            const session = sessions.find(s => s.id === parseInt(id));
            if (session) {
                setSessionTitle(session.name);
            }
        }
    }, [municipalityId, id]);


    const fetchUserVotes = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics-user-votes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user votes');
            }

            const userVotes = await response.json();

            // Map the fetched votes to currentVotes state
            const votesMap = {};
            userVotes.forEach(([topicId, voteStatus]) => {
                votesMap[topicId] = voteStatus;
            });

            setCurrentVotes(votesMap);
        } catch (error) {
            console.error('Error fetching user votes:', error);
        }
    }, [id, token]);

   const fetchOnlineUsers = useCallback(async () => {
    if (!municipalityId || !token) return;

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/online-users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            setOnlineUsers(data);
        } else {
            console.error("Failed to fetch online users:", response.status);
        }
    } catch (error) {
        console.error("Error fetching online users:", error);
    }
}, [municipalityId, token]);  // Ensure token is included as a dependency
useEffect(() => {
    fetchOnlineUsers();
}, [fetchOnlineUsers]);


    useEffect(() => {
        if (userInfo && userInfo.role) {
            setUserRole(userInfo.role);
        }
        fetchTopics();
        if (userInfo.role === 'ROLE_USER' || userInfo.role === 'ROLE_PRESIDENT') {
            fetchUserVotes();
        }
        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, [token, userInfo, fetchTopics, id, fetchUserVotes]);


    const handleDelete = async () => {
        const jwtToken = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/${selectedTopicId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                closeModal();
                await fetchTopics(); // Re-fetch topics immediately after deletion
            } else {
                console.error('Failed to delete the topic');
            }
        } catch (error) {
            console.error('Error:', error);
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

    // Determine if the user can vote
   const canVote = 
    (userRole === 'ROLE_PRESIDENT' || userRole === 'ROLE_USER') && 
    userInfo.municipalityId === municipalityId;

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/pdf/${pdfId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
            });

            if (response.ok) {
                // Create a blob from the response
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                // Open the PDF in a new tab
                window.open(url, '_blank');
            } else {
                console.error('PDF not found or could not be retrieved.');
            }
        } catch (error) {
            console.error('Error fetching PDF:', error);
        }
    };

    const startVoting = async (topicId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/active/${topicId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to start voting.');
            }
            setIsVoteAction(true);
            console.log('Voting started successfully');
            // You can refresh data or trigger other effects here if needed
            await fetchTopics();
            setCurrentVotes((prevVotes) => ({
            ...prevVotes,
            [String(topicId)]: 'HAVE_NOT_VOTED' // Ensure topicId is treated as string
        }));

        sendVote(topicId);
        sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const finishVoting = async (topicId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/finish/${topicId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to finish voting.');
            }
             setIsVoteAction(true);

            await fetchTopics();
            console.log('Voting finished successfully');
            // Trigger additional effects here if needed
            sendVote(topicId);
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const restartVoting = async (topicId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/create/${topicId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to restart voting.');
            }
            setIsVoteAction(true);

            setCurrentVotes((prevVotes) => {
            const updatedVotes = { ...prevVotes };
            delete updatedVotes[topicId];
            return updatedVotes;
        });

            console.log('Voting restarted successfully');

            // Trigger additional effects here if needed
            await fetchTopics();
            sendVote(topicId);
            sendPresenterUpdate(topicId);
        } catch (error) {
            console.error('Error:', error);
        }
    };

const handleVote = async (topicId, voteType) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/vote/${topicId}/${voteType}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to vote: ${voteType}`);
        }
        console.log(`${voteType} vote submitted successfully`);

        // Set vote action flag to true to skip scroll restoration
        setIsVoteAction(true);

        // Update the current vote for the topic
        setCurrentVotes((prevVotes) => ({
            ...prevVotes,
            [topicId]: voteType,
        }));

        // await fetchTopics();

        sendVote(topicId);
    } catch (error) {
        console.error('Error:', error);
    }
};

    
    // for scrool

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
    isFromLogoRef.current = isFromLogo; // Sync state with ref value
    isVoteActionRef.current = isVoteAction;
}, [isFromLogo,isVoteAction]);

useEffect(() => {
    if (isFromLogoRef.current) {
        setIsFromLogo(false); // Reset the flag after handling
        return; // Skip restoring scroll position if action was from the logo
    }

     if (isVoteActionRef.current) {
        setIsVoteAction(false);  // Reset flag after handling
        return; // Exit early to skip scroll restoration
    }

    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
        const timeoutId = setTimeout(() => {
            window.scrollTo(0, parseInt(scrollPosition, 10));
        }, 100); // Delay to ensure topics are rendered

        return () => clearTimeout(timeoutId);
    }
}, []);



useEffect(() => {
    if (!presenterMessages.length) return;

    const lastTopicId = Number(presenterMessages[presenterMessages.length - 1]);

    // Optionally update local state if needed
    setPresentedTopicId(lastTopicId); // just update locally
}, [presenterMessages]);


    useEffect(() => {
    if (newTopics.length > 0) {
        // fetch new topics from API
        fetchTopics();
    }
}, [newTopics,fetchTopics]);

const handlePresentClick = async (topicId) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/present/${topicId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        // Notify all presenters via WebSocket — only the topic ID
        sendPresenterUpdate(topicId);

    } catch (error) {
        console.error("Failed to present topic:", error);
        alert("Failed to present topic.");
    }
};



//   
const fetchTopicResults = useCallback(async (topicId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/topics/results/${topicId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch topic results");

      const updatedTopic = await response.json();

      console.log(updatedTopic);

      setTopics((prevTopics) =>
        prevTopics.map((topic) =>
          topic.id === topicId
            ? {
                ...topic,
                yes: updatedTopic.yes,
                no: updatedTopic.no,
                abstained: updatedTopic.abstained,
                cantVote: updatedTopic.cantVote,
                haveNotVoted: updatedTopic.havenotVoted,
                absent: updatedTopic.absent,
                topicStatus: updatedTopic.status,
              }
            : topic
        )
      );
    } catch (error) {
      console.error("Error fetching topic results:", error);
    }
  }, [token]);

  // When WebSocket sends a topicId → fetch new results for that topic only
  useEffect(() => {
    if (messages.length > 0) {
      const changedTopicId = Number(messages[messages.length - 1]);
      fetchTopicResults(changedTopicId);
    }
  }, [messages, fetchTopicResults]);
 

// WebSocket effect to call fetchTopicResults when a topicId message arrives
useEffect(() => {
  if (messages.length > 0) {
    const changedTopicId = Number(messages[messages.length - 1]);
    fetchTopicResults(changedTopicId);
  }
}, [messages, fetchTopicResults]);



// 
    return (
        <div className="topics-container">
            <HelmetProvider>
                <Helmet>
                    <title>Точки</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userInfo} fetchTopics={fetchTopics} setIsFromLogo={setIsFromLogo} fetchOnlineUsers={fetchOnlineUsers}/>
            <main className="topcis-container-body">
                <div className='d-flex justify-content-center'>
                     <div className="topic-header">
                        <div className='topic-header-title-div'>
                            <button
                                className="back-button-topic"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions#session-${id}`)}>
                                <FontAwesomeIcon icon={faChevronLeft} /> Назад
                            </button>
                            <h1 className="topic-header-title">Точки</h1>
                             <div>
                                 {sessionTitle && <h6 className='session-title'>{sessionTitle}</h6>}
                            </div>
                        </div>
                        <div className="session-button-container">
                            <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-form`}>
                                {userRole === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId && (
                                    <button className="topic-add-button" onClick={saveScrollPosition}>Додади Точка <FontAwesomeIcon icon={faPlus} /></button>
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
                                            className="topic-header-pdf topic-header-text"
                                        >
                                            {topic.title}
                                        </span>
                                        ) : (
                                        <span className='topic-header-text'>{topic.title}</span>
                                        )}
                                    </h3>
                                    <div className='menu-wrapper'>
                                    {userInfo.role === "ROLE_PRESIDENT" && municipalityId === userInfo.municipalityId && (
                                       <div className="menu-container" ref={(el) => (menuRefs.current[topic.id] = el)}>
                                        <div className="menu-dots" onClick={() => toggleMenu(topic.id)}>
                                            <FontAwesomeIcon className="menu-dots-icon" icon={faEllipsisV} />
                                        </div>
                                        {openMenus[topic.id] && (
                                            <ul className="menu-list">
                                           <li>
                                                <span onClick={() => { handlePresentClick(topic.id); toggleMenu(topic.id); }}>
                                                    Презентирај <FontAwesomeIcon icon={faDesktop} />
                                                </span>
                                            </li>
                                            <li>
                                                <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-before/${topic.id}`}
                                                onClick={saveScrollPosition}>
                                                    <span>Нова точка <FontAwesomeIcon icon={faArrowUp} /></span>
                                                </Link>
                                            </li>
                                             <li>
                                                <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-after/${topic.id}`}
                                                onClick={saveScrollPosition}>
                                                     <span>Нова точка <FontAwesomeIcon icon={faArrowDown} /></span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                to={`/municipalities/${municipalityId}/sessions/${id}/topics/edit/${topic.id}`}
                                                onClick={saveScrollPosition} // Use the function here
                                                >
                                                Уреди <FontAwesomeIcon icon={faPenToSquare} />
                                                </Link>
                                            </li>
                                            <li>
                                                <span onClick={() => { openModal(topic.id, topic.title); toggleMenu(topic.id); }}>
                                                    Избриши <FontAwesomeIcon icon={faTrash} />
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
                                                        <span className="text-for-rez">За</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'YES') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-yes',
                                                            currentVotes[topic.id] === 'YES' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'YES' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-yes-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                    >
                                                        {topic.yes}
                                                    </div>
                                            </div>
                                           <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">
                                                             Против
                                                        </span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'NO') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-no',
                                                            currentVotes[topic.id] === 'NO' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'NO' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-no-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.no}
                                                    </div>
                                            </div>
                                        </div>
                                        <div className="topic-item-body-detail-group">
                                           <div className="topic-item-body-detail-group-chunk">
                                                 <div className="rez-container">
                                                     <span className="text-for-rez">
                                                        Воздржан
                                                    </span>
                                                </div>
                                                <div
                                                    onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'ABSTAINED') : undefined}
                                                    className={[
                                                        'topic-button-vote',
                                                        'vote-abstained',
                                                        currentVotes[topic.id] === 'ABSTAINED' ? 'active-vote' : '',
                                                        topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'ABSTAINED' &&
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-scale' : '',
                                                        topic.topicStatus === 'ACTIVE' &&
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                        topic.topicStatus === 'FINISHED' ? 'vote-abstained-finished' : '',
                                                        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-hover-enabled' : ''
                                                    ].join(' ')}
                                                    >
                                                    {topic.abstained}
                                                </div>
                                            </div>
                                            <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">Се иземува</span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'CANNOT_VOTE') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-cantvote',
                                                            currentVotes[topic.id] === 'CANNOT_VOTE' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'CANNOT_VOTE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-cantvote-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.cantVote}
                                                    </div>
                                            </div>
                                        </div>
                                        <div className="topic-item-body-detail-group">
                                           <div className="topic-item-body-detail-group-chunk">
                                                    <div className="rez-container">
                                                        <span className="text-for-rez">
                                                            Не гласале
                                                        </span>
                                                    </div>
                                                    <div
                                                        onClick={canVote && topic.topicStatus === 'ACTIVE' ? () => handleVote(topic.id, 'HAVE_NOT_VOTED') : undefined}
                                                        className={[
                                                            'topic-button-vote',
                                                            'vote-haventvote',
                                                            currentVotes[topic.id] === 'HAVE_NOT_VOTED' ? 'active-vote' : '',
                                                            topic.topicStatus === 'ACTIVE' && currentVotes[topic.id] !== 'HAVE_NOT_VOTED' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-scale' : '',
                                                            topic.topicStatus === 'ACTIVE' &&
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-activated' : '',
                                                            topic.topicStatus === 'FINISHED' ? 'vote-haventvote-finished' : '',
                                                            (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER') ? 'vote-hover-enabled' : ''
                                                        ].join(' ')}
                                                        >
                                                        {topic.haveNotVoted}
                                                    </div>
                                                </div>
                                            <div className="topic-item-body-detail-group-chunk">
                                                <div className="rez-container">
                                                    <span className="text-for-rez">Отсутен</span>
                                                </div>
                                                <div className="topic-button-vote vote-absent">{topic.absent}</div>
                                            </div>
                                        </div>
                                </div>
                             )}

                        <div>
                            {topic.topicStatus === "INFORMATION" && (
                                <h4 className='topic-status-text'>Информација</h4>
                            )}
                            {topic.topicStatus === "WITHDRAWN" && (
                                <h4 className='topic-status-text'>Повлечена</h4>
                            )}
                        </div>


                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">
                                              {topic.topicStatus !== 'WITHDRAWN' && topic.topicStatus !== 'INFORMATION' && (
                                                    <div className="command-buttons">
                                                        <Link
                                                            to={`/municipalities/${municipalityId}/sessions/${id}/topics/details/${topic.id}`}
                                                            className="gold-button"
                                                            onClick={saveScrollPosition} // Use the function here
                                                        >   
                                                            {topic.topicStatus === "CREATED" ? "Детали " : "Детални резултати "}
                                                            <FontAwesomeIcon icon={faSquarePollVertical} />
                                                        </Link>
                                                    </div>
                                                )}


                                            {userInfo.role === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId && (
                                               <div className="command-buttons-group">
                                                {topic.topicStatus === 'CREATED' && (
                                                    <div className="command-buttons">
                                                        <button
                                                            onClick={() => startVoting(topic.id, token)}
                                                            className="change-topic-status-button"
                                                        >
                                                            Започни гласање <FontAwesomeIcon icon={faCirclePlay} />
                                                        </button>   
                                                    </div>
                                                )}
                                                {topic.topicStatus === 'ACTIVE' && (
                                                    <div className="command-buttons">
                                                        <button
                                                            onClick={() => finishVoting(topic.id, token)}
                                                            className="change-topic-status-button"
                                                        >
                                                            Заврши гласање <FontAwesomeIcon icon={faCircleStop} />
                                                        </button>
                                                    </div>
                                                )}
                                               {topic.topicStatus === 'FINISHED' && (
                                                    <div className="command-buttons">
                                                        <button
                                                            onClick={() => openRestartModal(topic.id, topic.title)}
                                                            className="change-topic-status-button"
                                                        >
                                                            Повторно гласање <FontAwesomeIcon icon={faRotateLeft} />
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
                        {topics.length > 2 && userRole === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId && (
                            <Link to={`/municipalities/${municipalityId}/sessions/${id}/topics/add-form`}>
                                <button className="topic-add-button" onClick={saveScrollPosition}>Додади Точка <FontAwesomeIcon icon={faPlus} /></button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
            {topics.length > 0 && <Footer />}

            <div className={`fixed-position-div ${showNumber ? 'show-number' : 'div-bigger'}`}>
                <div className="arrow" onClick={toggleVisibility}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </div>

                {showNumber && (
                    <>
                        <div className="tooltip-container">
                            <div onClick={handleToggle} className='toggle-topics'>
                                <FontAwesomeIcon icon={isOn ? faToggleOn : faToggleOff} />
                            </div>
                            <span className="tooltip-text">Лесен режим</span>
                            </div>

                            <div>
                            <div className="number" onClick={() => setIsLiveModalOpen(true)}>
                                <p className='number-content'>
                                <span className='number-content-span'>{onlineUsers}</span>
                                <FontAwesomeIcon icon={faUsers} />
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>


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
            token={token}
            role={userInfo.role}
        />
        </div>
    );
}

export default Topics;
