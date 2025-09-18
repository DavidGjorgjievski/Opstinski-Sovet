import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Municipalities.css'; 
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import MunicipalityConfirmModal from '../components/MunicipalityConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faChevronDown, faChevronUp, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';

function Municipalities() {
    const { t } = useTranslation();
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMunicipality, setSelectedMunicipality] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');

        const fetchMunicipalities = async () => {
            setLoading(true);
            try {
                const cachedMunicipalities = localStorage.getItem('municipalities');
                if (cachedMunicipalities) {
                    setMunicipalities(JSON.parse(cachedMunicipalities));
                    setLoading(false);
                    return;
                }

                const response = await fetch(process.env.REACT_APP_API_URL + '/api/municipalities', {
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

                localStorage.setItem('municipalities', JSON.stringify(data));
                setMunicipalities(data);
            } catch (error) {
                console.error('Error fetching municipalities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMunicipalities();

        const cleanupMobileMenu = initializeMobileMenu();
        sessionStorage.removeItem('scrollPosition');

        return () => {
            cleanupMobileMenu();
        };
    }, []);

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

        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/municipalities/delete/${selectedMunicipality.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json', 
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete municipality');
            }

            const updatedMunicipalities = municipalities.filter(
                (m) => m.id !== selectedMunicipality.id
            );

            localStorage.setItem('municipalities', JSON.stringify(updatedMunicipalities));
            setMunicipalities(updatedMunicipalities);
            
        } catch (error) {
            console.error('Error deleting municipality:', error);
        } finally {
            setShowModal(false);
            setSelectedMunicipality(null);
        }
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [municipalities]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideDropdown = event.target.closest('.admin-dropdown-wrapper');
            if (!clickedInsideDropdown) {
                setOpenMenuId(null);
            }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="municipalities-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('municipalitiesTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userInfo} />
            <main className="municipality-body-container">
                <div className="municipality-header">
                    <p className="municipality-header-title">{t('municipalitiesTitle')}</p>
                </div>
    
                {userInfo.role === 'ROLE_ADMIN' && (
                    <div className="municipality-button-container">
                        <a href="/municipalities/add-form">
                            <button className="municipality-add-button">
                                {t('addMunicipalityButton')} <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </a>
                    </div>
                )}
    
                {loading ? (
                    <div className="loading-spinner">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/loading.svg`}
                            alt={t('loading')}
                        />
                    </div>
                ) : (
                    <div className={`grid-container ${
                        municipalities.length >= 4 ? "size-4up" :
                        municipalities.length === 3 ? "size-3" :
                        municipalities.length === 2 ? "size-2" :
                        municipalities.length === 1 ? "size-1" : "size-4up"
                    }`}>
                        {municipalities.length > 0 ? (
                            municipalities.map((municipality) => (
                                <div key={municipality.id} className="municipality-item">
                                    <span
                                        id={`municipality-${municipality.id}`}
                                        className="id-selector-municipality"
                                    ></span>
                                    <img
                                        src={`data:image/jpeg;base64,${municipality.logoImage}`}
                                        alt="municipality"
                                        className="municipality-image"
                                    />
                                    <div className="municipality-info">
                                        <div className="municipality-text">
                                            <h3>{municipality.name}</h3>
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center municipality-buttons">
                                                <div className='me-2'>
                                                    <a href={`/municipalities/${municipality.id}/sessions`} className='button-see-content municipality-button-size'>
                                                        {t('view')} <FontAwesomeIcon icon={faMagnifyingGlass} />
                                                    </a>
                                                </div>
    
                                                {userInfo.role === 'ROLE_ADMIN' && (
                                                    <div className="admin-dropdown-wrapper">
                                                        <button
                                                            className="button-option-content municipality-button-size"
                                                            onClick={() =>
                                                                setOpenMenuId(openMenuId === municipality.id ? null : municipality.id)
                                                            }
                                                        >
                                                            {t('options')} <FontAwesomeIcon icon={openMenuId === municipality.id ? faChevronUp : faChevronDown} />
                                                        </button>
                                                        {openMenuId === municipality.id && (
                                                            <div className="admin-dropdown">
                                                                <a className="dropdown-item" href={`/municipalities/edit/${municipality.id}`}>
                                                                   <FontAwesomeIcon icon={faPenToSquare} /> {t('edit')}
                                                                </a>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleDeleteClick(municipality);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                >
                                                                   <FontAwesomeIcon icon={faTrash} /> {t('delete')}
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
                        ) : (
                            <div className="mt-3">
                                <h4>{t('noMunicipalities')}</h4>
                            </div>
                        )}
                    </div>
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
