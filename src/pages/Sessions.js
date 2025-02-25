import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Sessions.css'; 
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { initializeMobileMenu } from '../components/mobileMenu';
import SessionConfirmModal from '../components/SessionConfirmModal';

function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const { municipalityId } = useParams();
    const [sessionImage, setSessionImage] = useState(null);

    // Retrieve userInfo from local storage
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};


    useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    const fetchSessionImage = async () => {
        setLoading(true); // Start loading

        // Check if the session image is already cached
        const cachedImage = localStorage.getItem(`sessionImage_${municipalityId}`);
        if (cachedImage) {
            setSessionImage(cachedImage); // Use the cached image
            setLoading(false); // Stop loading
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/session-image`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch the session image');
            }

            const data = await response.text(); // Since Base64 is a string
            setSessionImage(data || null); // Set the image, or null if no image exists

            // Cache the image in localStorage
            if (data) {
                localStorage.setItem(`sessionImage_${municipalityId}`, data);
            }
        } catch (error) {
            console.error('Error fetching session image:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    fetchSessionImage();
}, [municipalityId]);

    
   useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    // Fetch sessions from the API
    const fetchSessions = async () => {
        setLoading(true); // Start loading


        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/sessions`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
           
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    fetchSessions();

    const cleanupMobileMenu = initializeMobileMenu();

    sessionStorage.removeItem('scrollPosition');


    return () => {
        cleanupMobileMenu();
    };
}, [municipalityId]);


    // Scroll to the session based on the URL hash
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1)); // Remove the '#' from the hash
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to the element
            }
        }
    }, [sessions]); // Depend on sessions to ensure the DOM is updated before scrolling

    const handleDeleteClick = (session) => {
        setSelectedSession(session);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSession(null);
    };

    const handleConfirmDelete = async () => {
        if (selectedSession) {
            try {
                const token = localStorage.getItem('jwtToken');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/delete/${selectedSession.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete session');
                }

            const updatedSessions = sessions.filter((session) => session.id !== selectedSession.id);
            setSessions(updatedSessions);

                handleCloseModal();
            } catch (error) {
                console.error('Error deleting session:', error);
            }
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
            }, 100); // Adjust the delay if necessary

            return () => clearTimeout(timeoutId); // Clean up timeout
        }
    }
}, [sessions]);

       const handleExportClick = async (sessionId, sessionName) => {
        setExportLoading(true); // Start loading spinner for export

        try {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/export/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/pdf'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export session');
            }

            const blob = await response.blob();

            let filename = sessionName ? `${sessionName}.pdf` : 'session.pdf'; 
            const url = window.URL.createObjectURL(blob);

            const newTab = window.open(url, '_blank');
            if (newTab) {
                setTimeout(function () {
                    newTab.document.title = filename;
                }, 15);
            } else {
                console.error('Failed to open new tab. Please check your popup blocker settings.');
            }
        } catch (error) {
            console.error('Error exporting session:', error);
        } finally {
            setExportLoading(false); // Stop loading spinner after export
        }
    };  

    return (
        <div className="sessions-container">
            <HelmetProvider>
                <Helmet>
                    <title>Седници</title>
                </Helmet>
            </HelmetProvider>
            <HeadLinks />
            <Header userInfo={userInfo} /> 
            <main className="session-body-container">
                {userInfo.role === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId ? (
                    <div className="session-header">
                        <p className="session-header-title">Седници</p>
                        <div className="session-button-container">
                            <a href={`/municipalities/${municipalityId}/sessions/add-form`}>
                                <button className="session-add-button">Додади Седница</button>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="session-header">
                        <p className="session-header-title-user">Седници</p>
                    </div>
                )}

                <div className="session-body">
                    {loading ? ( 
                        <div className="loading-spinner">
                            <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                        </div>
                    ) : sessions.length > 0 ? (
                        sessions.map((session) => (
                            <div key={session.id} className="session-item">
                                <span id={`session-${session.id}`} className='id-selector-session'></span>
                                {sessionImage && (
                                    <img 
                                        src={`data:image/jpeg;base64,${sessionImage}`} 
                                        alt="session" 
                                        className="session-image" 
                                    />
                                )}
                                <div className="session-info">
                                    <div className="session-text">
                                        <h2>{session.name}</h2>
                                        <p>{new Date(session.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <div className="all-session-buttons">
                                        <div className="d-flex flex-row">
                                            <div>
                                                <div className="first-session-button">
                                                   <a href={`/municipalities/${municipalityId}/sessions/${session.id}/${userInfo.role === 'ROLE_PRESENTER' ? 'topics-presentation' : 'topics'}`} 
                                                        className="btn btn-sm btn-info session-button-size">
                                                        {userInfo.role === 'ROLE_PRESENTER' ? 'Презентирај' : 'Преглед на точки'}
                                                    </a>
                                                </div>
                                            </div>
                                            {userInfo.role !== 'ROLE_PRESENTER' && (
                                                <div>
                                                    <div className="export-button-div">
                                                        <button 
                                                            onClick={() => handleExportClick(session.id,session.name)}
                                                            className="btn btn-sm btn-primary session-button-size">
                                                            Експорт
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {userInfo.role === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId  && ( 
                                            <div>
                                                <div className="d-flex align-items-center session-buttons">
                                                    <div className="first-session-button">
                                                        <a href={`/municipalities/${municipalityId}/sessions/edit/${session.id}`} className="btn btn-sm btn-warning session-button-size">
                                                            Уреди
                                                        </a>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-danger session-button-size"
                                                        onClick={() => handleDeleteClick(session)}>
                                                        Избриши
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='mt-3'>
                            <h4>Нема достапни седници</h4>
                        </div>
                    )}
                </div>

                {exportLoading && (
                    <div className="modal-overlay">
                        <div className="export-loading-spinner">
                            <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Export Loading..." />
                        </div>
                    </div>
                )}


                <SessionConfirmModal
                    show={showModal}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmDelete}
                    sessionName={selectedSession ? selectedSession.name : ''} 
                />
            </main>
        </div>
    );
}

export default Sessions;
