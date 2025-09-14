import React, { useState, useEffect, useCallback } from "react";
import "../styles/LiveUsersModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from "react-i18next";

const LiveUsersModal = ({ isOpen, onClose, municipalityId, token, role }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
  const { t } = useTranslation();

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const endpoint = `${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/online-users-list`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setOnlineUsers(data);
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  }, [municipalityId, token]);

  const fetchOfflineUsers = useCallback(async () => {
    try {
      const endpoint = `${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/offline-users-list`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setOfflineUsers(data);
    } catch (error) {
      console.error("Error fetching offline users:", error);
    }
  }, [municipalityId, token]);

  useEffect(() => {
    if (isOpen && municipalityId) {
      fetchOnlineUsers();
      fetchOfflineUsers();
    }
  }, [isOpen, municipalityId, fetchOnlineUsers, fetchOfflineUsers,role]);

  if (!isOpen) return null;


  const makeUserOffline = async (username) => {
  try {
    const endpoint = `${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/offline/${username}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      fetchOnlineUsers(); // Refresh data
      fetchOfflineUsers();
    } else {
      console.error("Failed to make user offline");
    }
  } catch (error) {
    console.error("Error making user offline:", error);
  }
};

const makeUserOnline = async (username) => {
  try {
    const endpoint = `${process.env.REACT_APP_API_URL}/api/municipalities/${municipalityId}/online/${username}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      fetchOnlineUsers(); // Refresh data
      fetchOfflineUsers();
    } else {
      console.error("Failed to make user online");
    }
  } catch (error) {
    console.error("Error making user online:", error);
  }
};


  return (
      <div className="liv-modal-overlay" onClick={onClose}>
      <div className="liv-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="liv-close-btn" onClick={onClose}>
          ×
        </button>

        {/* Offline Users Table */}
       <h3 className="live-users-table-header">
        <FontAwesomeIcon icon={faCircle} className="red-dot" /> {t("liveUsers.offlineUsers")} ({offlineUsers.length})
      </h3>
        <table className="liv-user-table">
          <thead>
            <tr>
              <th>{t("liveUsers.image")}</th>
              <th>{t("liveUsers.name")}</th>
              <th>{t("liveUsers.surname")}</th>
              {role === "ROLE_PRESIDENT" &&<th>{t("liveUsers.action")}</th>}
            </tr>
          </thead>
         <tbody>
            {Array.isArray(offlineUsers) && offlineUsers.length > 0 ? (
              offlineUsers.map((user) => (
                <tr key={user.username} className="offline">
                  <td>
                    <img
                      src={user.image ? `data:image/png;base64,${user.image}` : "/images/default-avatar.png"}
                      alt={user.name}
                      className="liv-user-avatar"
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  {role === "ROLE_PRESIDENT" && (
                    <td>
                     <button className="liv-action-btn" onClick={() => makeUserOnline(user.username)}>{t("liveUsers.turnOn")}</button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={role === "ROLE_PRESIDENT" ? "4" : "3"}>{t("liveUsers.noOffline")}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Online Users Table */}
       <h3 className="live-users-table-header">
        <FontAwesomeIcon icon={faCircle} className="green-dot" /> {t("liveUsers.onlineUsers")} ({onlineUsers.length})
      </h3>
        <table className="liv-user-table">
          <thead>
            <tr>
              <th>{t("liveUsers.image")}</th>
              <th>{t("liveUsers.name")}</th>
              <th>{t("liveUsers.surname")}</th>
              {role === "ROLE_PRESIDENT" &&<th>{t("liveUsers.action")}</th>}
            </tr>
          </thead>
             <tbody>
              {Array.isArray(onlineUsers) && onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <tr key={user.username} className="online">
                    <td>
                      <img
                        src={user.image ? `data:image/png;base64,${user.image}` : "/images/default-avatar.png"}
                        alt={user.name}
                        className="liv-user-avatar"
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    {role === "ROLE_PRESIDENT" && (
                      <td>
                        <button className="liv-action-btn" onClick={() => makeUserOffline(user.username)}>{t("liveUsers.turnOff")}</button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={role === "ROLE_PRESIDENT" ? "4" : "3"}>{t("liveUsers.noOnline")}</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveUsersModal;