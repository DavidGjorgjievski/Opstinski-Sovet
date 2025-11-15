import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRight, faEllipsisV, faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import MandateConfirmModal from '../components/MandateConfirmModal'; 
import '../styles/Mandate.css'; 
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

function Mandate() {
    const [userData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });

    const [mandates, setMandates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMandate, setSelectedMandate] = useState(null);

    const { t } = useTranslation();
    const navigate = useNavigate(); 
    const menuRefs = useRef({});

   useEffect(() => {
    // const imageData = localStorage.getItem('image');
    // if (imageData) {
    //     setUserData(prevData => ({ ...prevData, image: imageData }));
    // }

    const cleanupMobileMenu = initializeMobileMenu();

    const fetchMandates = async () => {
        const storedMandates = localStorage.getItem('mandates');
        let mandatesData = [];
        if (storedMandates) {
            mandatesData = JSON.parse(storedMandates);
        } else {
            try {
                const token = localStorage.getItem('jwtToken');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/terms`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    mandatesData = await response.json();
                    localStorage.setItem('mandates', JSON.stringify(mandatesData));
                } else {
                    console.error('Failed to fetch mandates');
                }
            } catch (error) {
                console.error(error);
            }
        }

        // Sort mandates by startDate first, then endDate, newest first
        mandatesData.sort((a, b) => {
            const startDiff = new Date(b.startDate) - new Date(a.startDate);
            if (startDiff !== 0) return startDiff;
            return new Date(b.endDate) - new Date(a.endDate);
        });

        setMandates(mandatesData);
        setLoading(false);
    };

    fetchMandates();

    return () => cleanupMobileMenu();
}, []);


    function formatDateByLanguage(dateString, t) {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const months = t('months', { returnObjects: true });
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${year}`;
    }

    const toggleMenu = (id) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

   useEffect(() => {
    const handleClickOutside = (event) => {
        if (openMenuId) {
            const currentMenuRef = menuRefs.current[openMenuId];
            if (currentMenuRef && !currentMenuRef.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [openMenuId]);

    const handleDeleteConfirm = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/terms/delete/${selectedMandate.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedMandates = mandates.filter(m => m.id !== selectedMandate.id);
                setMandates(updatedMandates);
                localStorage.setItem('mandates', JSON.stringify(updatedMandates)); // ажурирај localStorage
            } else {
                console.error('Failed to delete mandate');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setShowDeleteModal(false);
            setSelectedMandate(null);
        }
    };

    return (
        <div className="mandate-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('mandate.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header userInfo={userData} isSticky={true} />

            <main>
                <div className="mandate-container-body">
                    <div className="mandate-header">
                        <h1 className="mandate-header-title">{t('mandate.title')}</h1>
                        <button 
                            className="mandate-add-button" 
                            onClick={() => navigate('/mandate/add-form')}
                        >
                            {t('mandate.addButton')} <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>

                    <div className="mandate-list">
                        {loading ? (
                            <div className="mandate-spinner">
                                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                            </div>
                        ) : mandates.length === 0 ? (
                            <p style={{ textAlign: 'center', marginTop: '30px' }}>{t('mandate.noMandates')}</p>
                        ) : (
                            <ul className="mandate-list-ul">
                                {mandates.map((mandate) => {
                                    const start = formatDateByLanguage(mandate.startDate, t);
                                    const end = formatDateByLanguage(mandate.endDate, t);

                                    return (
                                        <li 
                                            key={mandate.id} 
                                            className="mandate-item" 
                                            ref={el => menuRefs.current[mandate.id] = el} 
                                            >
                                            <div className="mandate-dates">
                                                <div className="mandate-date">
                                                    <span className="mandate-date-value"> {start}</span>
                                                </div>

                                                <span className="mandate-separator">
                                                    <FontAwesomeIcon icon={faArrowRight} />
                                                </span>

                                                <div className="mandate-date">
                                                    <span className="mandate-date-value"> {end}</span>
                                                </div>
                                            </div>

                                            <div className="mandate-options">
                                                <button className="options-btn" onClick={() => toggleMenu(mandate.id)}>
                                                    <FontAwesomeIcon icon={faEllipsisV} />
                                                </button>

                                                {openMenuId === mandate.id && (
                                                    <div className="options-menu">
                                                        <button 
                                                            className="option-item" 
                                                            onClick={() => navigate(`/mandate/edit/${mandate.id}`)}
                                                        >
                                                            <FontAwesomeIcon icon={faPenToSquare} /> {t('mandate.edit')}
                                                        </button>
                                                        <button 
                                                            className="option-item delete"
                                                            onClick={() => {
                                                                setSelectedMandate(mandate);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} /> {t('mandate.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </main>

            <MandateConfirmModal
                show={showDeleteModal}
                mandateName={selectedMandate ? `${formatDateByLanguage(selectedMandate.startDate, t)} - ${formatDateByLanguage(selectedMandate.endDate, t)}` : ''}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
            />

            <Footer />
        </div>
    );
}

export default Mandate;
