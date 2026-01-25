import React, { useState, useEffect, useCallback } from "react";
import "../styles/LiveUsersModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from "react-i18next";
import api from '../api/axios';

const LiveUsersModal = ({ isOpen, onClose, municipalityId, token, role, status }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
  const { t } = useTranslation();

  const fetchOnlineUsers = useCallback(async () => {
      try {
        const response = await api.get(
          `/api/municipalities/${municipalityId}/online-users-list`
        );

        setOnlineUsers(response.data);
      } catch (error) {
        console.error("Error fetching online users:", error);
      }
  }, [municipalityId]);

  const fetchOfflineUsers = useCallback(async () => {
      try {
        const response = await api.get(
          `/api/municipalities/${municipalityId}/offline-users-list`
        );

        setOfflineUsers(response.data);
      } catch (error) {
        console.error("Error fetching offline users:", error);
      }
  }, [municipalityId]);

  useEffect(() => {
    if (isOpen && municipalityId) {
      fetchOnlineUsers();
      fetchOfflineUsers();
    }
  }, [isOpen, municipalityId, fetchOnlineUsers, fetchOfflineUsers,role]);

  if (!isOpen) return null;

  const makeUserOffline = async (username) => {
      try {
        await api.get(
          `/api/municipalities/${municipalityId}/offline/${username}`
        );
        // Refresh data after success
        fetchOnlineUsers();
        fetchOfflineUsers();
      } catch (error) {
        console.error("Error making user offline:", error);
      }
  };

  const makeUserOnline = async (username) => {
      try {
        await api.get(
          `/api/municipalities/${municipalityId}/online/${username}`
        );

        // Refresh data after success
        fetchOnlineUsers();
        fetchOfflineUsers();
      } catch (error) {
        console.error("Error making user online:", error);
      }
  };

  return (
      <div className="liv-modal-overlay" onClick={onClose}>
      <div className="liv-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="liv-close-btn" onClick={onClose}>
           <FontAwesomeIcon icon={faXmark} />
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
              {role === "ROLE_PRESIDENT" && status === "ACTIVE" &&<th>{t("liveUsers.action")}</th>}
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
                  {role === "ROLE_PRESIDENT" && status === "ACTIVE" && (
                    <td>
                     <button className="liv-action-btn" onClick={() => makeUserOnline(user.username)}>{t("liveUsers.turnOn")}</button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={role === "ROLE_PRESIDENT" && status === "ACTIVE" ? "4" : "3"}>{t("liveUsers.noOffline")}</td>
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
              {role === "ROLE_PRESIDENT" && status === "ACTIVE" &&<th>{t("liveUsers.action")}</th>}
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
                    {role === "ROLE_PRESIDENT" && status === "ACTIVE" && (
                      <td>
                        <button className="liv-action-btn" onClick={() => makeUserOffline(user.username)}>{t("liveUsers.turnOff")}</button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={role === "ROLE_PRESIDENT" && status === "ACTIVE" ? "4" : "3"}>{t("liveUsers.noOnline")}</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveUsersModal;