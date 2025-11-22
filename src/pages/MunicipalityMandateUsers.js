import React, { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import "../styles/MunicipalityMandateUsers.css";
import { initializeMobileMenu } from '../components/mobileMenu';
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserPen } from "@fortawesome/free-solid-svg-icons";


function MunicipalityMandateUsers() {
  const { t } = useTranslation();
  const { id, mandateId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userData] = useState(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    return storedUserInfo ? JSON.parse(storedUserInfo) : {};
  });

    useEffect(() => {
      const cleanupMobileMenu = initializeMobileMenu();
      return () => cleanupMobileMenu();
    }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipality-terms/${mandateId}/votable-users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();

        const locale = navigator.language || "en";

        // Sort by name (Cyrillic + Latin supported)
        data.sort((a, b) =>
          a.name.localeCompare(b.name, locale, { sensitivity: "base" })
        );
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [mandateId]);

  return (
    <div className="municipality-mandate-users-container">
      <HelmetProvider>
        <Helmet>
          <title>{t("MunicipalityMandateUsers.title")}</title>
        </Helmet>
      </HelmetProvider>

      <Header userInfo={userData} isSticky={true} />

      <main className="municipality-mandate-users-content">

        {/* Header */}
        <div className="municipality-mandate-users-header">
          <div className="header-section">
            <button className="municipality-mandate-users-back-button" onClick={() => navigate(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} /> {t("MunicipalityMandateUsers.back")}
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
                    onClick={() => navigate(`/municipalities/${id}/mandates/users/${mandateId}/add-list`)}
                  >
                    {t('MunicipalityMandateUsers.edit')} <FontAwesomeIcon icon={faUserPen} />
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

        {/* Users grid */}
        {!loading && (
          <>
            {users.length === 0 ? (
              <p>{t("MunicipalityMandateUsers.noUsers")}</p>
            ) : (
              <div className="municipality-mandate-users-grid">
                {users.map((user) => (
                  <div key={user.username} className="municipality-mandate-users-card">
                    {user.image ? (
                      <img
                        src={`data:image/jpeg;base64,${user.image}`}
                        alt="User"
                        className="municipality-mandate-users-avatar"
                      />
                    ) : (
                      <div className="municipality-mandate-users-avatar placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="municipality-mandate-users-name">
                      {user.name} {user.surname}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MunicipalityMandateUsers;
