import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ProfileView.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';

function ProfileView() {
    const { t } = useTranslation();
    const { username } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/api/admin/users-detail/${username}`);
                setUserData(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch user:", err);
                setUserData(null);
                if (err.response?.status === 404) {
                    setError(t("profile.notFound"));
                } else {
                    setError(t("profile.fetchError"));
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchMunicipalities = async () => {
            try {
                const cached = localStorage.getItem('municipalities');
                if (cached) {
                    setMunicipalities(JSON.parse(cached));
                } else {
                    const { data } = await api.get('/api/municipalities');
                    localStorage.setItem('municipalities', JSON.stringify(data));
                    setMunicipalities(data);
                }
            } catch (err) {
                console.error('Failed to fetch municipalities:', err);
            }
        };

        fetchUser();
        fetchMunicipalities();
    }, [username, t]);

    const getRoleDisplay = (role) => {
        switch (role) {
            case "ROLE_USER": return t("roles.user");
            case "ROLE_PRESIDENT": return t("roles.president");
            case "ROLE_SPECTATOR": return t("roles.spectator");
            case "ROLE_PRESENTER": return t("roles.presenter");
            case "ROLE_ADMIN": return t("roles.admin");
            case "ROLE_GUEST": return t("roles.guest");
            case "ROLE_EDITOR": return t("roles.editor");
            case "ROLE_MAYOR": return t("roles.mayor");
            default: return t("roles.unknown");
        }
    };

    const getMunicipalityName = (id) => {
        if (!id) return t("profile.notAvailable");
        const municipality = municipalities.find(m => Number(m.id) === Number(id));
        return municipality ? municipality.name : t("profile.notAvailable");
    };

    if (error) {
        return (
            <div className="profile-view-loading">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="profile-view-container">
            <HelmetProvider>
                <Helmet>
                    <title>{`${userData?.name || ''} ${userData?.surname || ''} - ${t("profile.title")}`}</title>
                </Helmet>
            </HelmetProvider>

            <Header isSticky={true} />

            <main>
                {loading && (
                    <div className="municipalaty-mandate-user-spinner">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/loading.svg`}
                            alt={t("profile.loading")}
                        />
                    </div>
                )}

                {!loading && userData && (
                    <div className="profile-view-card">
                        {/* Back button inside card */}
                        <button
                            className="profile-view-card-back-button"
                            onClick={() => navigate(-1)}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        <div className="profile-view-image-wrapper">
                            {userData.image && userData.image.trim() !== "" ? (
                                <img
                                    src={`data:image/jpeg;base64,${userData.image}`}
                                    alt="Profile"
                                    className="profile-view-image"
                                />
                            ) : (
                                <div className="profile-view-image placeholder">
                                    {userData.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>

                        <h2 className="profile-view-name">{userData.name} {userData.surname}</h2>
                        <p className="profile-view-username">@{userData.username}</p>

                        <div className="profile-view-details">
                            <div className="detail-row">
                                <span className="label">{t("profile.role")}: </span>
                                <span className="value">{getRoleDisplay(userData.role)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">{t("profile.municipality")}: </span>
                                <span className="value">{getMunicipalityName(userData.municipalityId)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default ProfileView;
