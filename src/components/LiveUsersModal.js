import React, { useState, useEffect, useCallback } from "react";
import "../styles/LiveUsersModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const LiveUsersModal = ({ isOpen, onClose, municipalityId, canSeeAction }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
  const { t } = useTranslation();

  /* =========================
     LocalStorage keys
  ========================= */
  const ONLINE_KEY = (id) => `onlineUsers_${id}`;
  const OFFLINE_KEY = (id) => `offlineUsers_${id}`;

  /* =========================
     Fetch online users
  ========================= */
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await api.get(
        `/api/municipalities/${municipalityId}/online-users-list`
      );

      setOnlineUsers(response.data);
      localStorage.setItem(
        ONLINE_KEY(municipalityId),
        JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  }, [municipalityId]);

  /* =========================
     Fetch offline users
  ========================= */
  const fetchOfflineUsers = useCallback(async () => {
    try {
      const response = await api.get(
        `/api/municipalities/${municipalityId}/offline-users-list`
      );

      setOfflineUsers(response.data);
      localStorage.setItem(
        OFFLINE_KEY(municipalityId),
        JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Error fetching offline users:", error);
    }
  }, [municipalityId]);

  /* =========================
     Load cache → fetch fresh
  ========================= */
  useEffect(() => {
    if (isOpen && municipalityId) {
      // Load cached users instantly
      const cachedOnline = localStorage.getItem(ONLINE_KEY(municipalityId));
      const cachedOffline = localStorage.getItem(OFFLINE_KEY(municipalityId));

      if (cachedOnline) setOnlineUsers(JSON.parse(cachedOnline));
      if (cachedOffline) setOfflineUsers(JSON.parse(cachedOffline));

      // Fetch fresh data
      fetchOnlineUsers();
      fetchOfflineUsers();
    }
  }, [isOpen, municipalityId, fetchOnlineUsers, fetchOfflineUsers]);

  /* =========================
     User actions
  ========================= */
  const makeUserOffline = async (username) => {
    try {
      await api.get(
        `/api/municipalities/${municipalityId}/offline/${username}`
      );
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
      fetchOnlineUsers();
      fetchOfflineUsers();
    } catch (error) {
      console.error("Error making user online:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="liv-modal-overlay" onClick={onClose}>
      <div
        className="liv-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="liv-close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {/* ================= OFFLINE USERS ================= */}
        <h3 className="live-users-table-header">
          <FontAwesomeIcon icon={faCircle} className="red-dot" />{" "}
          {t("liveUsers.offlineUsers")} ({offlineUsers.length})
        </h3>

        <table className="liv-user-table">
          <thead>
            <tr>
              <th>{t("liveUsers.image")}</th>
              <th>{t("liveUsers.name")}</th>
              <th>{t("liveUsers.surname")}</th>
              {canSeeAction && <th>{t("liveUsers.action")}</th>}
            </tr>
          </thead>
          <tbody>
            {offlineUsers.length > 0 ? (
              offlineUsers.map((user) => (
                <tr key={user.username} className="offline">
                  <td>
                    <img
                      src={
                        user.image
                          ? `data:image/png;base64,${user.image}`
                          : "/images/default-avatar.png"
                      }
                      alt={user.name}
                      className="liv-user-avatar"
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  {canSeeAction && (
                    <td>
                      <button
                        className="liv-action-btn"
                        onClick={() => makeUserOnline(user.username)}
                      >
                        {t("liveUsers.turnOn")}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canSeeAction ? 4 : 3}>
                  {t("liveUsers.noOffline")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ================= ONLINE USERS ================= */}
        <h3 className="live-users-table-header">
          <FontAwesomeIcon icon={faCircle} className="green-dot" />{" "}
          {t("liveUsers.onlineUsers")} ({onlineUsers.length})
        </h3>

        <table className="liv-user-table">
          <thead>
            <tr>
              <th>{t("liveUsers.image")}</th>
              <th>{t("liveUsers.name")}</th>
              <th>{t("liveUsers.surname")}</th>
              {canSeeAction && <th>{t("liveUsers.action")}</th>}
            </tr>
          </thead>
          <tbody>
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <tr key={user.username} className="online">
                  <td>
                    <img
                      src={
                        user.image
                          ? `data:image/png;base64,${user.image}`
                          : "/images/default-avatar.png"
                      }
                      alt={user.name}
                      className="liv-user-avatar"
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  {canSeeAction && (
                    <td>
                      <button
                        className="liv-action-btn"
                        onClick={() => makeUserOffline(user.username)}
                      >
                        {t("liveUsers.turnOff")}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canSeeAction ? 4 : 3}>
                  {t("liveUsers.noOnline")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveUsersModal;
