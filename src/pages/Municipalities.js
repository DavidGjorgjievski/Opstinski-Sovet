import React, { useEffect, useState, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link } from "react-router-dom";
import '../styles/Municipalities.css'; 
import Header from '../components/Header';
import MunicipalityConfirmModal from '../components/MunicipalityConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faChevronDown, faChevronUp, faMagnifyingGlass, faCalendar } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

function Municipalities() {
    const { t } = useTranslation();
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMunicipality, setSelectedMunicipality] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')) || {}, []);

    useEffect(() => {
        const fetchMunicipalities = async () => {
            setLoading(true);
            try {
                const cached = localStorage.getItem('municipalities');

                if (cached) {
                    setMunicipalities(JSON.parse(cached));
                    return;
                }

                // Axios automatically attaches JWT
                const { data } = await api.get('/api/municipalities');
                localStorage.setItem('municipalities', JSON.stringify(data));
                setMunicipalities(data);

            } catch (error) {
                console.error('Error fetching municipalities:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchMandates = async () => {
            const cachedMandates = localStorage.getItem('mandates');
            if (cachedMandates) return;

            try {
                const { data } = await api.get('/api/terms');
                localStorage.setItem('mandates', JSON.stringify(data));
            } catch (error) {
                console.error('Error fetching mandates:', error);
            }
        };

        fetchMunicipalities();
        fetchMandates();
        sessionStorage.removeItem('scrollPosition');
    }, [userInfo]);

    const handleDeleteClick = (municipality) => {
        setSelectedMunicipality(municipality);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMunicipality(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedMunicipality) return;

        try {
            await api.delete(`/api/municipalities/delete/${selectedMunicipality.id}`);
            const updatedMunicipalities = municipalities.filter(m => m.id !== selectedMunicipality.id);
            localStorage.setItem('municipalities', JSON.stringify(updatedMunicipalities));
            setMunicipalities(updatedMunicipalities);
        } catch (error) {
            console.error('Error deleting municipality:', error);
        } finally {
            handleCloseModal();
        }
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1));
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    }, [municipalities]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.admin-dropdown-wrapper')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get user municipality separately
    const userMunicipalityId = userInfo?.municipalityId;
    const userMunicipality = municipalities.find(m => String(m.id) === String(userMunicipalityId));
    const otherMunicipalities = municipalities.filter(m => String(m.id) !== String(userMunicipalityId));

    const renderMunicipalityItem = (municipality, isUser = false) => (
    <div
        key={municipality.id}
        className={`municipality-item ${isUser ? 'user-municipality' : ''}`}
    >
        <span
            id={`municipality-${municipality.id}`}
            className="id-selector-municipality"
        ></span>
        <div>
            <Link to={`/municipalities/${municipality.id}/sessions`}>
                <img
                    src={`data:image/jpeg;base64,${municipality.logoImage}`}
                    alt="municipality"
                    className="municipality-image"
                />
            </Link>
        </div>
        <div className="municipality-info">
            <div className="municipality-text">
                <h3>{municipality.name}</h3>
            </div>
            <div className="d-flex align-items-center municipality-buttons">
                <div className='me-2'>
                    <Link
                        to={`/municipalities/${municipality.id}/sessions`}
                        className="button-see-content municipality-button-size"
                    >
                        {t('Municipality.view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Link>
                </div>
                <div className="admin-dropdown-wrapper">
                    <button
                        className="button-option-content municipality-button-size"
                        onClick={() =>
                            setOpenMenuId(openMenuId === municipality.id ? null : municipality.id)
                        }
                    >
                        {t('Municipality.options')}{" "}
                        <FontAwesomeIcon icon={openMenuId === municipality.id ? faChevronUp : faChevronDown} />
                    </button>

                    {openMenuId === municipality.id && (
                        <div className="admin-dropdown">
                            <Link
                                className="dropdown-item"
                                to={`/municipalities/${municipality.id}/mandates`}
                            >
                                <FontAwesomeIcon icon={faCalendar} /> {t('Municipality.mandates')}
                            </Link>

                            {userInfo.role === 'ROLE_ADMIN' && (
                                <>
                                    <Link
                                        className="dropdown-item"
                                        to={`/municipalities/edit/${municipality.id}`}
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} /> {t('Municipality.edit')}
                                    </Link>

                                    <button
                                        className="dropdown-item delete"
                                        onClick={() => handleDeleteClick(municipality)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> {t('Municipality.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);


    return (
        <div className="municipalities-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('Municipality.municipalitiesTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className="municipality-body-container">
                <div className="municipality-header">
                    <p className="municipality-header-title">{t('Municipality.municipalitiesTitle')}</p>
                </div>

                {userInfo.role === 'ROLE_ADMIN' && (
                    <div className="municipality-button-container">
                        <a href="/municipalities/add-form">
                            <button className="municipality-add-button">
                                {t('Municipality.addMunicipalityButton')} <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </a>
                    </div>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/loading.svg`}
                            alt={t('Municipality.loading')}
                        />
                    </div>
                ) : (
                    <>
                        {/* User's municipality highlighted */}
                        {userMunicipality && (
                            <div className="grid-container size-1 highlight-grid-container"> {/* optional: make a grid row */}
                                {renderMunicipalityItem(userMunicipality, true)}
                            </div>
                        )}

                        {otherMunicipalities.length > 0 ? (
                            <div className={`grid-container ${
                                otherMunicipalities.length >= 4 ? "size-4up" :
                                otherMunicipalities.length === 3 ? "size-3" :
                                otherMunicipalities.length === 2 ? "size-2" :
                                otherMunicipalities.length === 1 ? "size-1" : "size-4up"
                            }`}>
                                {otherMunicipalities.map((municipality) => (
                                    <div
                                        key={municipality.id}
                                        className="municipality-item"
                                    >
                                        <span
                                            id={`municipality-${municipality.id}`}
                                            className="id-selector-municipality"
                                        ></span>
                                        <div>
                                            <Link to={`/municipalities/${municipality.id}/sessions`}>
                                                <img
                                                    src={`data:image/jpeg;base64,${municipality.logoImage}`}
                                                    alt="municipality"
                                                    className="municipality-image"
                                                />
                                            </Link>
                                        </div>
                                        <div className="municipality-info">
                                            <div className="municipality-text">
                                                <h3>{municipality.name}</h3>
                                            </div>
                                            <div className="d-flex align-items-center municipality-buttons">
                                                <div className='me-2'>
                                                    <Link
                                                        to={`/municipalities/${municipality.id}/sessions`}
                                                        className="button-see-content municipality-button-size"
                                                    >
                                                        {t('Municipality.view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                                                    </Link>
                                                </div>
                                                <div className="admin-dropdown-wrapper">
                                                    <button
                                                        className="button-option-content municipality-button-size"
                                                        onClick={() =>
                                                            setOpenMenuId(openMenuId === municipality.id ? null : municipality.id)
                                                        }
                                                    >
                                                        {t('Municipality.options')}{" "}
                                                        <FontAwesomeIcon icon={openMenuId === municipality.id ? faChevronUp : faChevronDown} />
                                                    </button>

                                                    {openMenuId === municipality.id && (
                                                        <div className="admin-dropdown">
                                                            <Link
                                                                className="dropdown-item"
                                                                to={`/municipalities/${municipality.id}/mandates`}
                                                            >
                                                                <FontAwesomeIcon icon={faCalendar} /> {t('Municipality.mandates')}
                                                            </Link>

                                                            {userInfo.role === 'ROLE_ADMIN' && (
                                                                <>
                                                                    <Link
                                                                        className="dropdown-item"
                                                                        to={`/municipalities/edit/${municipality.id}`}
                                                                    >
                                                                        <FontAwesomeIcon icon={faPenToSquare} /> {t('Municipality.edit')}
                                                                    </Link>

                                                                    <button
                                                                        className="dropdown-item delete"
                                                                        onClick={() => {
                                                                            handleDeleteClick(municipality);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} /> {t('Municipality.delete')}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !userMunicipality ? (
                            <div className="no-municipalities-wrapper">
                                <h4 className="no-municipalities-message">{t('Municipality.noMunicipalities')}</h4>
                            </div>
                        ) : null}
                    </>
                )}
            </main>

            <MunicipalityConfirmModal
                show={showModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                municipalityName={selectedMunicipality ? selectedMunicipality.name : ''}
            />

            {!loading && <Footer />}
        </div>
    );    
}

export default Municipalities;
