import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import { initializeMobileMenu } from '../components/mobileMenu';
import "../styles/MunicipalityMandateUsersAddList.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserPlus, faUserMinus } from "@fortawesome/free-solid-svg-icons";

function MunicipalityMandateUsersAddList() {
  const { t } = useTranslation();
  const { id, mandateId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [termUsers, setTermUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termLoading, setTermLoading] = useState(true);

  const userData = JSON.parse(localStorage.getItem("userInfo")) || {};

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
  }, []);

  // Fetch all users without terms
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipalities/${id}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();

        // Sort alphabetically
        const locale = navigator.language || "en";
        data.sort((a, b) =>
          a.name.localeCompare(b.name, locale, { sensitivity: "base" })
        );

        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [id]);

  // Fetch users for a specific term under the HR
  useEffect(() => {
    const fetchTermUsers = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const municipalityTermId = mandateId;

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipality-terms/${municipalityTermId}/all-users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch term users");

        const data = await response.json();

        // Sort alphabetically
        const locale = navigator.language || "en";
        data.sort((a, b) =>
          a.name.localeCompare(b.name, locale, { sensitivity: "base" })
        );

        setTermUsers(data);
      } catch (err) {
        console.error("Error fetching term users:", err);
      } finally {
        setTermLoading(false);
      }
    };

    fetchTermUsers();
  }, [mandateId]);

  return (
   <div className="municipality-mandate-users-list-container">
      <HelmetProvider>
        <Helmet>
          <title>{t("MunicipalityMandateUsersList.title")}</title>
        </Helmet>
      </HelmetProvider>

      <Header userInfo={userData} isSticky={true} />

      <main className="municipality-mandate-users-list-content">
        {/* Header */}
        <div className="municipality-mandate-users-list-header">
          <div className="header-section">
            <button
              className="municipality-mandate-users-back-button"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> {t("MunicipalityMandateUsersList.back")}
            </button>
          </div>
 
          <div className="header-section-title title-section">
            <h1 className="municipality-mandate-users-list-title">
              {t("MunicipalityMandateUsersList.title")}
            </h1>
          </div>

          <div className="header-section"></div>
        </div>

{!loading && (
  <div className="municipality-mandate-users-list">
    {users.length === 0 ? (
      <p>{t("MunicipalityMandateUsersList.noUsers")}</p>
    ) : (
      <div className="municipality-mandate-users-list-grid">
        {users.map((user) => (
          <div key={user.username} className="municipality-mandate-users-list-card">
            
            {user.image ? (
              <img
                src={`data:image/jpeg;base64,${user.image}`}
                alt="User"
                className="municipality-mandate-users-list-avatar"
              />
            ) : (
              <div className="municipality-mandate-users-list-avatar placeholder">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <p className="municipality-mandate-users-list-name">
              {user.name} {user.surname}
            </p>

            <button
              className="municipality-mandate-users-list-add-button"
              onClick={() => console.log("Add user:", user.username)}
            >
              {t("MunicipalityMandateUsersList.add")} <FontAwesomeIcon icon={faUserPlus} /> 
            </button>

          </div>
        ))}
      </div>
    )}
  </div>
)}

<hr className="custom-hr" />

{/* Second list */}
<div className="municipality-mandate-users-list">
  {termLoading ? (
    <div className="municipality-mandate-users-list-spinner">
      <img
        src={`${process.env.PUBLIC_URL}/images/loading.svg`}
        alt={t("MunicipalityMandateUsersList.loading")}
      />
    </div>
  ) : termUsers.length === 0 ? (
    <p>{t("MunicipalityMandateUsersList.noTermUsers")}</p>
  ) : (
    <div className="municipality-mandate-users-list-grid">
      {termUsers.map((user) => (
        <div key={user.username} className="municipality-mandate-users-list-card">
          
          {user.image ? (
            <img
              src={`data:image/jpeg;base64,${user.image}`}
              alt="User"
              className="municipality-mandate-users-list-avatar"
            />
          ) : (
            <div className="municipality-mandate-users-list-avatar placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <p className="municipality-mandate-users-list-name">
            {user.name} {user.surname}
          </p>

          <button
            className="municipality-mandate-users-list-remove-button"
            onClick={() => console.log("Remove user:", user.username)}
          >
            {t("MunicipalityMandateUsersList.remove")} <FontAwesomeIcon icon={faUserMinus} />
          </button>

        </div>
      ))}
    </div>
  )}
</div>


      </main>
    </div>
  );
}

export default MunicipalityMandateUsersAddList;
