import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Sessions.css'; 
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import SessionConfirmModal from '../components/SessionConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faPenToSquare, faTrash, faPlus, faChevronDown, faChevronUp, faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from "react-i18next";


function Sessions() {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const { municipalityId } = useParams();
    const [openMenuId, setOpenMenuId] = useState(null);
    const dropdownRefs = useRef({});
    const [municipalityTerms, setMunicipalityTerms] = useState([]);


// Fetch municipality terms or use cache
  useEffect(() => {
    const fetchMunicipalityTerms = async () => {
      const cacheKey = `municipalityMandates_${municipalityId}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setMunicipalityTerms(JSON.parse(cachedData));
        return;
      }

      try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipality-terms/municipality/${municipalityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch terms');

        const data = await response.json();
        setMunicipalityTerms(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching Municipality Terms:', error);
      }
    };

    fetchMunicipalityTerms();
  }, [municipalityId]);


    // Retrieve userInfo from local storage
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    
useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    // First, try to load from cache
    const cachedSessions = localStorage.getItem(`sessions_${municipalityId}`);
    if (cachedSessions) {
        setSessions(JSON.parse(cachedSessions));
        setLoading(false); // show immediately from cache
    }

    // Fetch sessions from the API and update cache
    const fetchSessions = async () => {
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
            localStorage.setItem(`sessions_${municipalityId}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
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
    setExportLoading(true);

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/export/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export session');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const cleanFilename = sessionName
            ? sessionName.replace(/[<>:"/\\|?*]+/g, '').replace(/\s+/g, '_') + '.pdf'
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



  useEffect(() => {
    const handleClickOutside = (event) => {
        // Check if the clicked target is inside any dropdown
        let insideDropdown = false;

        Object.values(dropdownRefs.current).forEach((ref) => {
            if (ref && ref.contains(event.target)) {
                insideDropdown = true;
            }
        });

        // Close the menu if clicking outside of all dropdowns
        if (!insideDropdown) {
            setOpenMenuId(null);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);


function formatDateByLanguage(dateString, t) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';

  const months = t('months', { returnObjects: true });
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

return (
    <div className="sessions-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('session.title')}</title>
        </Helmet>
      </HelmetProvider>

      <Header userInfo={userInfo} />

      <main className="session-body-container">
         <div className={`session-header ${sessions.length === 1 ? 'session-header-size1' : ''}`}>
          <div className='session-header-div'>
            <h1 className="session-header-title">{t('session.title')}</h1>
            <p>{t('session.subtitle')}</p>
          </div>
          <div className="session-button-container">
           {(
            (userInfo.role === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId) ||
            userInfo.role === 'ROLE_ADMIN'
          ) &&
            userInfo.status === 'ACTIVE' && (
              <a href={`/municipalities/${municipalityId}/sessions/add-form`}>
                <button className="session-add-button">
                  {t('session.add')} <FontAwesomeIcon icon={faPlus} />
                </button>
              </a>
          )}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
          </div>
        ) : (
          <div className={`session-grid-container ${
            sessions.length === 3 ? "size-3" :
            sessions.length === 2 ? "size-2" :
            sessions.length === 1 ? "size-1" : "size-3"
          }`}>
            {sessions.length > 0 && municipalityTerms.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <span id={`session-${session.id}`} className="id-selector-session"></span>

                  <img
                    src={
                      municipalityTerms.find(mt => mt.id === session.municipalityMandateId)?.termImage
                        ? `data:image/jpeg;base64,${
                            municipalityTerms.find(mt => mt.id === session.municipalityMandateId)?.termImage
                          }`
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
                          {userInfo.role === 'ROLE_PRESENTER' ? (
                            t('session.present')
                          ) : (
                            <>
                              {t('session.view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </>
                          )}
                        </a>
                      </div>

                      <div className="w-50">
                        <div
                          className="admin-dropdown-wrapper w-100"
                          ref={(el) => (dropdownRefs.current[session.id] = el)}
                        >
                          <button
                            className="button-option-content w-100"
                            onClick={() =>
                              setOpenMenuId(openMenuId === session.id ? null : session.id)
                            }
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

                              {(
                                (userInfo.role === 'ROLE_PRESIDENT' && municipalityId === userInfo.municipalityId) ||
                                userInfo.role === 'ROLE_ADMIN'
                              ) &&
                                userInfo.status === 'ACTIVE' && (
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
              ))
            ) : (
              <div className="mt-3">
                <h4>{t('session.noSessions')}</h4>
              </div>
            )}
          </div>
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
      </main>

      {!loading && <Footer />}
    </div>
  );
};

export default Sessions;
