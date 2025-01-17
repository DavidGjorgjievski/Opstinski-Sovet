import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Municipalities.css'; 
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { initializeMobileMenu } from '../components/mobileMenu';
import MunicipalityConfirmModal from '../components/MunicipalityConfirmModal';

function Municipalities() {
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false); // Modal visibility state
    const [selectedMunicipality, setSelectedMunicipality] = useState(null); // Selected municipality state

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

            // Remove the deleted municipality from the list
            setMunicipalities((prev) =>
                prev.filter((m) => m.id !== selectedMunicipality.id)
            );
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
                {userInfo.role === 'ROLE_ADMIN' ? (
                    <div className="municipality-header">
                        <p className="municipality-header-title">Општини</p>
                        <div className="municipality-button-container">
                            <a href="/municipalities/add-form">
                                <button className="municipality-add-button">Додади Општина</button>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="municipality-header">
                        <p className="municipality-header-title-user">Општини</p>
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
                                                    <a href={`/municipalities/${municipality.id}/sessions`} className='btn btn-sm btn-info municipality-button-size'>
                                                        Преглед на седници
                                                    </a>
                                                </div>

                                                {userInfo.role === 'ROLE_ADMIN' && (
                                                    <>
                                                        <div className="first-municipality-button">
                                                            <a
                                                                href={`/municipalities/edit/${municipality.id}`}
                                                                className="btn btn-sm btn-warning municipality-button-size"
                                                            >
                                                                Уреди
                                                            </a>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-danger municipality-button-size"
                                                            onClick={() => handleDeleteClick(municipality)}
                                                        >
                                                            Избриши
                                                        </button>
                                                    </>
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
        </div>
    );
}

export default Municipalities;
