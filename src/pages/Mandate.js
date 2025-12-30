import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRight, faEllipsisV, faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import MandateConfirmModal from '../components/MandateConfirmModal'; 
import '../styles/Mandate.css'; 
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import api from '../api/axios';

function Mandate() {
const [mandates, setMandates] = useState([]);
const [loading, setLoading] = useState(true);
const [openMenuId, setOpenMenuId] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedMandate, setSelectedMandate] = useState(null);

const { t } = useTranslation();
const navigate = useNavigate();
const menuRefs = useRef({});

// Fetch mandates using Axios
useEffect(() => {
    const fetchMandates = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await api.get('/api/terms', {
                headers: { Authorization: `Bearer ${token}` }
            });

            let mandatesData = response.data || [];

            // Sort mandates by startDate first, then endDate, newest first
            mandatesData.sort((a, b) => {
                const startDiff = new Date(b.startDate) - new Date(a.startDate);
                if (startDiff !== 0) return startDiff;
                return new Date(b.endDate) - new Date(a.endDate);
            });

            setMandates(mandatesData);
            localStorage.setItem('mandates', JSON.stringify(mandatesData));
        } catch (error) {
            console.error('Failed to fetch mandates:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchMandates();

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
        await api.delete(`/api/terms/delete/${selectedMandate.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedMandates = mandates.filter(m => m.id !== selectedMandate.id);
        setMandates(updatedMandates);
        localStorage.setItem('mandates', JSON.stringify(updatedMandates));
    } catch (error) {
        console.error('Failed to delete mandate:', error);
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

            <Header isSticky={true} />

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
