import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import MunicipalityMandateConfirmModal from '../components/MunicipalityMandateConfirmModal';
import '../styles/MunicipalityMandate.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRight, faChevronDown, faChevronUp, faPenToSquare, faTrash, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';

function MunicipalityMandate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [municipalityTerms, setMunicipalityTerms] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [userData] = useState(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    return storedUserInfo ? JSON.parse(storedUserInfo) : {};
  });

  const userInfo = React.useMemo(() => {
      return JSON.parse(localStorage.getItem('userInfo')) || {};
  }, []);

  const menuRefs = useRef({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState(null);

  // Initialize mobile menu
  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
  }, []);

  // Fetch municipality terms or use cache
  useEffect(() => {
    const fetchMunicipalityTerms = async () => {
      const cacheKey = `municipalityMandates_${id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setMunicipalityTerms(JSON.parse(cachedData));
        return;
      }

      try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipality-terms/municipality/${id}`,
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
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );
      if (isOutside) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function formatDateByLanguage(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const months = t('months', { returnObjects: true });
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  }

  const handleDeleteMandate = (mandate) => {
    setSelectedMandate(mandate);
    setModalVisible(true);
    setOpenMenuId(null);
  };

  const confirmDeleteMandate = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      await fetch(`${process.env.REACT_APP_API_URL}/api/municipality-terms/delete/${selectedMandate.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedTerms = municipalityTerms.filter((m) => m.id !== selectedMandate.id);
      setMunicipalityTerms(updatedTerms);

      // Update cache
      localStorage.setItem(`municipalityMandates_${id}`, JSON.stringify(updatedTerms));
    } catch (error) {
      console.error('Error deleting mandate:', error);
    } finally {
      setModalVisible(false);
      setSelectedMandate(null);
    }
  };

  return (
    <div className="municipality-mandate-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('MunicipalityMandate.mandateTitle')}</title>
        </Helmet>
      </HelmetProvider>

      <Header userInfo={userData} isSticky={true} />

      <main className="municipality-mandate-body-container">
        <div className="municipality-mandate-header">
          <h1 className="municipality-mandate-header-title">
            {t('MunicipalityMandate.mandateTitle')}
          </h1>
          {userInfo.role === 'ROLE_ADMIN' && (
            <button
              className="municipality-mandate-add-button"
              onClick={() => navigate(`/municipalities/${id}/mandates/add-form`)}
            >
              {t('MunicipalityMandate.add')} <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </div>

        <div className="mandates-list">
          {municipalityTerms.length > 0 ? (
            // Newest first
            [...municipalityTerms].reverse().map((item) => {
              const [startDate, endDate] = item.termPeriod.split(' - ');
              const formattedStart = formatDateByLanguage(startDate);
              const formattedEnd = formatDateByLanguage(endDate);

              return (
                <div key={item.id} className="mandate-card">
                  {item.termImage && (
                    <img
                      src={`data:image/jpeg;base64,${item.termImage}`}
                      alt="Mandate"
                      className="mandate-image"
                    />
                  )}

                  <div className="mandate-info">
                    <p className="mandate-date">
                      {formattedStart} <FontAwesomeIcon icon={faArrowRight} /> {formattedEnd}
                    </p>

                    <div className="mandate-actions">
                      <button
                        className="mandate-view-button"
                        onClick={() => navigate(`/municipalities/${id}/mandates/users/${item.id}`)}
                      >
                        {t('MunicipalityMandate.view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                      </button>

                      {userData.role === 'ROLE_ADMIN' && (
                        <div
                          className="municipality-mandate-option-wrapper"
                          ref={(el) => (menuRefs.current[item.id] = el)}
                        >
                          <button
                            className="municipality-mandate-button-option-content"
                            onClick={() =>
                              setOpenMenuId(openMenuId === item.id ? null : item.id)
                            }
                          >
                            {t('MunicipalityMandate.options')}{' '}
                            <FontAwesomeIcon
                              icon={openMenuId === item.id ? faChevronUp : faChevronDown}
                            />
                          </button>

                          {openMenuId === item.id && (
                            <div className="municipality-mandate-option-menu">
                              <button
                                className="dropdown-item"
                                onClick={() =>
                                  navigate(`/municipalities/${id}/mandates/edit/${item.id}`)
                                }
                              >
                                <FontAwesomeIcon icon={faPenToSquare} /> {t('MunicipalityMandate.edit')}
                              </button>

                              <button
                                className="dropdown-item delete"
                                onClick={() => handleDeleteMandate(item)}
                              >
                                <FontAwesomeIcon icon={faTrash} /> {t('MunicipalityMandate.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>{t('MunicipalityMandate.noMandates')}</p>
          )}
        </div>
      </main>

      <MunicipalityMandateConfirmModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={confirmDeleteMandate}
        mandateName={selectedMandate?.termPeriod || ""}
      />

      <Footer />
    </div>
  );
}

export default MunicipalityMandate;
