import React, { useState, useEffect, useCallback } from "react";
import "../styles/LiveUsersModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';




const LiveUsersModal = ({ isOpen, onClose, municipalityId, token }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);

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

       // Disable background scroll
    document.body.style.overflow = 'hidden';

    return () => {
     document.body.style.overflow = 'auto';
    };
  

    }
  }, [isOpen, municipalityId, fetchOnlineUsers, fetchOfflineUsers]);

  if (!isOpen) return null;

  return (
    <div className="liv-modal-overlay" onClick={onClose}>
      <div className="liv-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="liv-close-btn" onClick={onClose}>
          ×
        </button>

        {/* Offline Users Table */}
        <h3>
          <FontAwesomeIcon icon={faCircle} className="red-dot" /> Офлајн корисници
        </h3>
        <table className="liv-user-table">
          <thead>
            <tr>
              <th>Слика</th>
              <th>Име</th>
              <th>Презиме</th>
              <th>Акција</th>
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
                  <td>
                    <button className="liv-action-btn">вклучи</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Нема офлајн корисници</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Online Users Table */}
        <h3>
          <FontAwesomeIcon icon={faCircle} className="green-dot" /> Онлајн корисници
        </h3>
        <table className="liv-user-table">
          <thead>
            <tr>
              <th>Слика</th>
              <th>Име</th>
              <th>Презиме</th>
              <th>Акција</th>
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
                  <td>
                    <button className="liv-action-btn">исклучи</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Нема онлајн корисници</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveUsersModal;