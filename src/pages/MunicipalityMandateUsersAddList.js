import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import "../styles/MunicipalityMandateUsersAddList.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserPlus, faUserMinus } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';

function MunicipalityMandateUsersAddList() {
  const { t } = useTranslation();
  const { id, mandateId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [termUsers, setTermUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termLoading, setTermLoading] = useState(true);

  const fetchMunicipalityUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/municipalities/${id}/users`);
      let data = response.data || [];
      const locale = navigator.language || "en";
      data.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

// Fetch term users using Axios
const fetchTermUsers = useCallback(async () => {
  setTermLoading(true);
  try {
    const response = await api.get(`/api/municipality-terms/${mandateId}/all-users`);
    let data = response.data || [];
    const locale = navigator.language || "en";
    data.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
    setTermUsers(data);
  } catch (err) {
    console.error("Error fetching term users:", err);
  } finally {
    setTermLoading(false);
  }
}, [mandateId]);

// Initial fetch
useEffect(() => {
  fetchMunicipalityUsers();
  fetchTermUsers();
}, [fetchMunicipalityUsers, fetchTermUsers]);

// Add user
const handleAddUser = async (username) => {
  try {
    await api.post(`/api/municipality-terms/${mandateId}/add-user/${username}`);
    const addedUser = users.find(u => u.username === username);
    if (addedUser) {
      setUsers(prev => prev.filter(u => u.username !== username));
      setTermUsers(prev => [...prev, addedUser]);
    }
  } catch (err) {
    console.error("Add user error:", err);
  }
};

// Remove user
const handleRemoveUser = async (username) => {
  try {
    await api.post(`/api/municipality-terms/${mandateId}/remove-user/${username}`);
    const removedUser = termUsers.find(u => u.username === username);
    if (removedUser) {
      setTermUsers(prev => prev.filter(u => u.username !== username));
      setUsers(prev => [...prev, removedUser]);
    }
  } catch (err) {
    console.error("Remove user error:", err);
  }
};

  return (
    <div className="municipality-mandate-users-list-container">
      <HelmetProvider>
        <Helmet>
          <title>{t("MunicipalityMandateUsersList.title")}</title>
        </Helmet>
      </HelmetProvider>

      <Header isSticky={true} />

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

        {/* Municipality users list */}
        {!loading && (
          <div className="municipality-mandate-users-list">
            {users.length === 0 ? (
              <p>{t("MunicipalityMandateUsersList.noUsers")}</p>
            ) : (
              <div className="municipality-mandate-users-list-grid">
                {users.map(user => (
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
                      onClick={() => handleAddUser(user.username)}
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

        {/* Term users list */}
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
              {termUsers.map(user => (
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
                    onClick={() => handleRemoveUser(user.username)}
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
