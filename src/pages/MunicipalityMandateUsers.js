import React, { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import "../styles/MunicipalityMandateUsers.css";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

function MunicipalityMandateUsers() {
  const { t } = useTranslation();
  const { mandateId } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userData] = useState(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    return storedUserInfo ? JSON.parse(storedUserInfo) : {};
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/municipality-terms/${mandateId}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
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

        <div className="municipality-mandate-users-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} /> {t("MunicipalityMandateUsers.back")}
          </button>

          <h1 className="municipality-mandate-users-title">
            {t("MunicipalityMandateUsers.title")}
          </h1>
        </div>

        {loading ? (
          <p>{t("MunicipalityMandateUsers.loading")}</p>
        ) : users.length === 0 ? (
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
      </main>
    </div>
  );
}

export default MunicipalityMandateUsers;
