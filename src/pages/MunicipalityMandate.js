import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import MunicipalityMandateConfirmModal from '../components/MunicipalityMandateConfirmModal';
import '../styles/MunicipalityMandate.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRight, faChevronDown, faChevronUp, faPenToSquare, faTrash, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '../api/axios';

function MunicipalityMandate() {
 const { t } = useTranslation();
const navigate = useNavigate();
const { municipalityId } = useParams();
const [municipalityTerms, setMunicipalityTerms] = useState([]);
const [openMenuId, setOpenMenuId] = useState(null);
const [loading, setLoading] = useState(true);

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

// Fetch municipality terms using Axios
useEffect(() => {
  const fetchMunicipalityTerms = async () => {
    setLoading(true);
    const cacheKey = `municipalityMandates_${municipalityId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setMunicipalityTerms(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/api/municipality-terms/municipality/${municipalityId}`);
      const data = response.data || [];
      setMunicipalityTerms(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching Municipality Terms:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchMunicipalityTerms();
}, [municipalityId]);

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

// Format date by language
function formatDateByLanguage(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const months = t('months', { returnObjects: true });
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

// Handle delete modal
const handleDeleteMandate = (mandate) => {
  setSelectedMandate(mandate);
  setModalVisible(true);
  setOpenMenuId(null);
};

// Confirm delete using Axios
const confirmDeleteMandate = async () => {
  try {
    await api.delete(`/api/municipality-terms/delete/${selectedMandate.id}`);
    const updatedTerms = municipalityTerms.filter((m) => m.id !== selectedMandate.id);
    setMunicipalityTerms(updatedTerms);

    // Update cache
    localStorage.setItem(`municipalityMandates_${municipalityId}`, JSON.stringify(updatedTerms));
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

      <Header isSticky={true} />

      <main className={`municipality-mandate-body-container ${municipalityTerms.length === 2 ? 'two-mandates' : ''}`}>
        <div className="municipality-mandate-header">
          <h1 className="municipality-mandate-header-title">
            {t('MunicipalityMandate.mandateTitle')}
          </h1>

          {userInfo.role === 'ROLE_ADMIN' && (
            <div className="municipality-mandate-add-wrapper">
              <button
                className="entity-add-button"
                onClick={() => navigate(`/municipalities/${municipalityId}/mandates/add-form`)}
              >
                {t('MunicipalityMandate.add')} <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          )}
        </div>



  {/* Spinner under header */}
  {loading && (
    <div className="municipalaty-mandate-spinner">
      <img
        src={`${process.env.PUBLIC_URL}/images/loading.svg`}
        alt="Loading..."
      />
    </div>
  )}

  {/* Mandates list */}
  {!loading && (
    <div className="mandates-list">
      {municipalityTerms.length > 0 ? (
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
                    onClick={() =>
                      navigate(`/municipalities/${municipalityId}/mandates/users/${item.id}`)
                    }
                  >
                    {t('MunicipalityMandate.view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>

                  {userData.role === 'ROLE_ADMIN' && (
                    <div
                      className="municipality-mandate-option-wrapper"
                      ref={(el) => (menuRefs.current[item.id] = el)}
                    >
                      <button
                        className={`municipality-mandate-button-option-content ${
                          openMenuId === item.id ? "active" : ""
                        }`}
                        onClick={() =>
                          setOpenMenuId(openMenuId === item.id ? null : item.id)
                        }
                      >
                        {t('MunicipalityMandate.options')}
                        <FontAwesomeIcon
                          icon={openMenuId === item.id ? faChevronUp : faChevronDown}
                        />
                      </button>

                      {openMenuId === item.id && (
                        <div className="municipality-mandate-option-menu">
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              navigate(`/municipalities/${municipalityId}/mandates/edit/${item.id}`)
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
  )}
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