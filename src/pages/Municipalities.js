import React, { useEffect, useState, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Municipalities.css'; 
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { initializeMobileMenu } from '../components/mobileMenu';
import MunicipalityConfirmModal from '../components/MunicipalityConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faChevronDown} from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';

function Municipalities() {
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false); // Modal visibility state
    const [selectedMunicipality, setSelectedMunicipality] = useState(null); // Selected municipality state
    const [openMenuId, setOpenMenuId] = useState(null); // Track which municipality's menu is open
    const adminMenuRef = useRef(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');

        const fetchMunicipalities = async () => {
            setLoading(true);
            try {
                // Check if municipalities are in localStorage
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

                // Cache the data in localStorage
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
        setSelectedMunicipality(municipality); // Set the municipality to be deleted
        setShowModal(true); // Show the confirmation modal
    };

    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
        setSelectedMunicipality(null); // Clear the selected municipality
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

        // Remove the deleted municipality from the list in localStorage
        const updatedMunicipalities = municipalities.filter(
            (m) => m.id !== selectedMunicipality.id
        );

        // Update localStorage with the new list of municipalities
        localStorage.setItem('municipalities', JSON.stringify(updatedMunicipalities));

        // Update the state with the new list
        setMunicipalities(updatedMunicipalities);
        
    } catch (error) {
        console.error('Error deleting municipality:', error);
    } finally {
        setShowModal(false); // Hide the modal
        setSelectedMunicipality(null); // Reset the selected municipality
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
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
                setOpenMenuId(null); // Close all menus when clicking outside
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="municipalities-container">
            <HelmetProvider>
                <Helmet>
                    <title>Општини</title>
                </Helmet>
            </HelmetProvider>
            <HeadLinks />
            <Header userInfo={userInfo} />
            <main className="municipality-body-container">
                <div className="municipality-header">
                    <p className="municipality-header-title">Општини</p>
                </div>
                {userInfo.role === 'ROLE_ADMIN' && (
                    <div className="municipality-button-container">
                        <a href="/municipalities/add-form">
                            <button className="municipality-add-button">Додади Општина <FontAwesomeIcon icon={faPlus} /></button>
                        </a>
                    </div>
                )}

                <div className="municipality-body">
                    {loading ? (
                        <div className="loading-spinner">
                            <img
                                src={`${process.env.PUBLIC_URL}/images/loading.svg`}
                                alt="Loading..."
                            />
                        </div>
                    ) : municipalities.length > 0 ? (
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
                                        <h2>{municipality.name}</h2>
                                    </div>
                                    <div>
                                        <div>
                                            <div className="d-flex align-items-center municipality-buttons">
                                                <div className='me-2'>
                                                    <a href={`/municipalities/${municipality.id}/sessions`} className='button-see-content municipality-button-size'>
                                                        Преглед
                                                    </a>
                                                </div>

                                                {userInfo.role === 'ROLE_ADMIN' && (
                                                    <div className="admin-dropdown-wrapper" ref={adminMenuRef}>
                                                        <button
                                                            className="button-option-content municipality-button-size"
                                                            onClick={() =>
                                                                setOpenMenuId(openMenuId === municipality.id ? null : municipality.id)
                                                            }
                                                        >
                                                            Опции <FontAwesomeIcon icon={faChevronDown} />
                                                        </button>
                                                        {openMenuId === municipality.id && (
                                                            <div className="admin-dropdown">
                                                                <a className="dropdown-item" href={`/municipalities/edit/${municipality.id}`}>
                                                                   <FontAwesomeIcon icon={faPenToSquare} /> Уреди
                                                                </a>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleDeleteClick(municipality);
                                                                        setOpenMenuId(null); // Close the menu after delete
                                                                    }}
                                                                >
                                                                   <FontAwesomeIcon icon={faTrash} /> Избриши
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
                        ))
                    ) : (
                        <div className="mt-3">
                            <h4>Нема достапни општини</h4>
                        </div>
                    )}
                </div>
            </main>

            <MunicipalityConfirmModal
                show={showModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                municipalityName={selectedMunicipality ? selectedMunicipality.name : ''}
            />

            <Footer />
        </div>
    );
}

export default Municipalities;
