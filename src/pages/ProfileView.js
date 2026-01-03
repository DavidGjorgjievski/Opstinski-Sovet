import React, { useEffect, useState, useRef } from 'react';
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
    const [municipalityMandates, setMunicipalityMandates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cardRefs = useRef([]);

    /* ===============================
       FETCH USER + MUNICIPALITIES
    =============================== */
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/api/admin/users-detail/${username}`);
                setUserData(data);
                setError(null);
            } catch (err) {
                setError(t("profileView.fetchError"));
            } finally {
                setLoading(false);
            }
        };

        const fetchMunicipalities = async () => {
            const cached = localStorage.getItem('municipalities');
            if (cached) {
                setMunicipalities(JSON.parse(cached));
                return;
            }

            try {
                const { data } = await api.get('/api/municipalities');
                localStorage.setItem('municipalities', JSON.stringify(data));
                setMunicipalities(data);
            } catch (err) {
                console.error("Failed to fetch municipalities", err);
            }
        };

        fetchUser();
        fetchMunicipalities();
    }, [username, t]);

    /* ===============================
       FETCH MUNICIPALITY MANDATES
       (cache-first, fetch if missing)
    =============================== */
    useEffect(() => {
        if (!userData?.municipalityId) return;

        const loadMandates = async () => {
            const cacheKey = `municipalityMandates_${userData.municipalityId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                setMunicipalityMandates(JSON.parse(cached));
                return;
            }

            try {
                const { data } = await api.get(
                    `/api/municipality-terms/municipality/${userData.municipalityId}`
                );
                localStorage.setItem(cacheKey, JSON.stringify(data));
                setMunicipalityMandates(data);
            } catch (err) {
                console.error("Failed to fetch municipality mandates", err);
            }
        };

        loadMandates();
    }, [userData]);

    /* ===============================
       MATCH CARD HEIGHTS
    =============================== */
    useEffect(() => {
        if (!loading && userData) {
            const firstHeight = cardRefs.current[0]?.offsetHeight || 0;
            cardRefs.current.forEach(card => {
                if (card) card.style.height = `${firstHeight}px`;
            });
        }
    }, [loading, userData]);

    /* ===============================
       HELPERS
    =============================== */
    const getRoleDisplay = (role) => {
        switch (role) {
            case "ROLE_USER": return t("roles.user");
            case "ROLE_ADMIN": return t("roles.admin");
            case "ROLE_PRESIDENT": return t("roles.president");
            case "ROLE_EDITOR": return t("roles.editor");
            case "ROLE_GUEST": return t("roles.guest");
            default: return t("roles.unknown");
        }
    };

    const getMunicipalityName = (id) => {
        const municipality = municipalities.find(m => Number(m.id) === Number(id));
        return municipality ? municipality.name : t("profileView.notAvailable");
    };

    const getMunicipalityMandateDates = () => {
        if (!userData?.municipalityTermIds?.length) return [];

        const termIds = userData.municipalityTermIds.map(Number);

        return municipalityMandates
            .filter(m => termIds.includes(Number(m.id)))
            .map(m => {
                if (!m.termPeriod?.includes(' - ')) return null;
                const [start, end] = m.termPeriod.split(' - ');
                return { start: start.slice(0, 4), end: end.slice(0, 4) };
            })
            .filter(Boolean);
    };

    const mandateDates = getMunicipalityMandateDates();

    if (error) return <div className="profile-view-loading">{error}</div>;

    return (
        <div className="profile-view-container">
            <HelmetProvider>
                <Helmet>
                    <title>{`${userData?.name || ''} ${userData?.surname || ''}`}</title>
                </Helmet>
            </HelmetProvider>

            <Header isSticky={true} />

            <main>
                {loading && (
                    <div className="profile-view-loading">
                        {t("profileView.loading")}
                    </div>
                )}

                {!loading && userData && (
                    <div className="profile-view-grid">

                        {/* CARD 1 */}
                        <div className="profile-view-card" ref={el => (cardRefs.current[0] = el)}>
                            <button
                                className="profile-view-card-back-button"
                                onClick={() => navigate(-1)}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>

                            <h3 className="profile-view-card-title">
                                {t("profileView.title")}
                            </h3>

                            <div className="profile-view-image-wrapper">
                                {userData.image ? (
                                    <img
                                        src={`data:image/jpeg;base64,${userData.image}`}
                                        alt="Profile"
                                        className="profile-view-image"
                                    />
                                ) : (
                                    <div className="profile-view-image placeholder">
                                        {userData.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <h2 className="profile-view-name">
                                {userData.name} {userData.surname}
                            </h2>
                            <p className="profile-view-username">
                                @{userData.username}
                            </p>

                            <div className="detail-row">
                                <span className="label">{t("profileView.email")}:</span>
                                <span className="value">
                                    {userData.email || t("profileView.notAvailable")}
                                </span>
                            </div>
                        </div>

                        {/* CARD 2 */}
                        <div className="profile-view-card secondary" ref={el => (cardRefs.current[1] = el)}>
                            <h3 className="profile-view-card-title">
                                {t("profileView.details")}
                            </h3>

                            <div className="detail-row">
                                <span className="label">{t("profileView.municipality")}:</span>
                                <span className="value">
                                    {getMunicipalityName(userData.municipalityId)}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="label">{t("profileView.role")}:</span>
                                <span className="value">
                                    {getRoleDisplay(userData.role)}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="label">{t("profileView.municipalityTerm")}:</span>
                                <span className="value">
                                    {mandateDates.length > 0
                                        ? mandateDates.map((term, i) => (
                                            <div key={i} className="municipality-term">
                                                {term.start} - {term.end}
                                            </div>
                                        ))
                                        : t("profileView.notAvailable")}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="label">{t("profileView.status")}:</span>
                                <span className="value">
                                    {userData.status === "ACTIVE"
                                        ? t("profileView.statusActive")
                                        : userData.status === "INACTIVE"
                                            ? t("profileView.statusInactive")
                                            : t("profileView.notAvailable")}
                                </span>
                            </div>
                        </div>

                        {/* CARD 3 */}
                        <div className="profile-view-card secondary" ref={el => (cardRefs.current[2] = el)}>
                            <h3 className="profile-view-card-title">
                                {t("profileView.biography")}
                            </h3>
                            <p className="profile-view-bio">
                                {userData.bio || t("profileView.noBiography")}
                            </p>
                        </div>

                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default ProfileView;
