import React, { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import "../styles/MunicipalityMandateUsers.css";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faUserPen } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';
import { storeTermImages, isTermPopulated } from '../cache/imageCache';
import UserAvatar from '../components/UserAvatar';

function MunicipalityMandateUsers() {
const { t } = useTranslation();
const { municipalityId, mandateId } = useParams();
const navigate = useNavigate();
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

const president = users.find(u => u.role === "ROLE_PRESIDENT");
const regularUsers = users.filter(u => u.role !== "ROLE_PRESIDENT");

const [userData] = useState(() => {
  const storedUserInfo = localStorage.getItem("userInfo");
  return storedUserInfo ? JSON.parse(storedUserInfo) : {};
});
const [imagesReady, setImagesReady] = useState(false);

// Fetch votable users using Axios
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/municipality-terms/${mandateId}/votable-users`);
      let data = response.data || [];

      // Sort users alphabetically by name using locale
      const locale = navigator.language || "en";
      data.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));

      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, [mandateId]);

useEffect(() => {
  if (!mandateId) return;
  if (isTermPopulated(mandateId)) { setImagesReady(true); return; }
  api.get(`/api/municipality-terms/${mandateId}/user-images`)
    .then(res => { storeTermImages(mandateId, res.data); setImagesReady(true); })
    .catch(() => setImagesReady(true));
}, [mandateId]);


  return (
    <div className="municipality-mandate-users-container">
      <HelmetProvider>
        <Helmet>
          <title>{t("MunicipalityMandateUsers.title")}</title>
        </Helmet>
      </HelmetProvider>

      <Header isSticky={true} />

      <main className="municipality-mandate-users-content">

        {/* Header */}
        <div className="municipality-mandate-users-header">
          <div className="header-section">
            <button className="back-button" onClick={() => navigate(-1)}>
                <span className="back-icon">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </span>
                <span className="back-text">
                    {t("common.back")}
                </span>
            </button>
          </div>

          <div className="header-section title-section">
            <h1 className="municipality-mandate-users-title">
              {t("MunicipalityMandateUsers.title")}
            </h1>
          </div>

          <div className="header-section">
             {userData.role === 'ROLE_ADMIN' && (
                  <button
                    className="municipalaty-mandate-users-view-button"
                    onClick={() => navigate(`/municipalities/${municipalityId}/mandates/users/${mandateId}/add-list`)}
                  >
                    {t('common.edit')} <FontAwesomeIcon icon={faUserPen} />
                  </button> 
                )}
          </div>
        </div>

        {/* Spinner */}
        {loading && (
          <div className="municipalaty-mandate-user-spinner">
            <img
              src={`${process.env.PUBLIC_URL}/images/loading.svg`}
              alt={t("MunicipalityMandateUsers.loading")}
            />
          </div>
        )}

        {!loading && president && (
  <div className="municipality-mandate-president-section">
    <div className="municipality-mandate-president-card"
    onClick={() => navigate(`/profile-view/${president.username}`)}>
      <UserAvatar username={president.username} name={president.name} surname={president.surname} className="municipality-mandate-users-avatar" termId={mandateId} />

      <p className="municipality-mandate-users-name">
        {president.name} {president.surname}
      </p>
      <span className="municipality-mandate-president-label">
        {t("MunicipalityMandateUsers.president")}
      </span>
    </div>
  </div>
)}

        {/* Users grid */}
       {!loading && regularUsers.length > 0 && (
  <div className="municipality-mandate-users-grid">
    {regularUsers.map((user) => (
      <div 
          key={user.username} 
          className="municipality-mandate-users-card" 
          onClick={() => navigate(`/profile-view/${user.username}`)}
      >
        <UserAvatar username={user.username} name={user.name} surname={user.surname} className="municipality-mandate-users-avatar" termId={mandateId} />
        <p className="municipality-mandate-users-name">
          {user.name} {user.surname}
        </p>
      </div>
    ))}
  </div>
)}

      </main>
    </div>
  );
}

export default MunicipalityMandateUsers;
