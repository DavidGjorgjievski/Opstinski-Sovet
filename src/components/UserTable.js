import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';

function UserTable({ users, title, bgColor, onDeleteClick, onEditClick }) {
    const { t } = useTranslation();

    const renderUserRow = (user) => (
        <tr className="ut-row" key={user.username}>
            <td className="ut-td ut-td-avatar">
                {user.image ? (
                    <img
                        src={`data:image/jpeg;base64,${user.image}`}
                        alt={`${user.name} ${user.surname}`}
                        className="ut-avatar"
                    />
                ) : (
                    <div className="ut-avatar-placeholder">
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                )}
            </td>
            <td className="ut-td ut-td-username">{user.username}</td>
            <td className="ut-td">{user.name}</td>
            <td className="ut-td">{user.surname}</td>
            <td className="ut-td ut-td-email">
                {user.email && user.email.trim() !== "" ? user.email : <span className="ut-empty">—</span>}
            </td>
            <td className="ut-td">
                <span className={user.status === "ACTIVE" ? "ut-badge ut-badge-active" : "ut-badge ut-badge-inactive"}>
                    {user.status}
                </span>
            </td>
            <td className="ut-td">
                {user.municipalityName && user.municipalityName.trim() !== ""
                    ? user.municipalityName
                    : <span className="ut-empty">—</span>
                }
            </td>
            <td className="ut-td ut-td-actions">
                <div className="ut-actions">
                    <button className="ut-btn ut-btn-edit" onClick={() => onEditClick(user)}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                        <span>{t("common.edit")}</span>
                    </button>
                    <button className="ut-btn ut-btn-delete" onClick={() => onDeleteClick(user)}>
                        <FontAwesomeIcon icon={faTrash} />
                        <span>{t("adminpanel.delete")}</span>
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className={`ut-card ${bgColor}`}>
            <div className="ut-card-header">
                <span className="ut-card-title">{title}</span>
                <span className="ut-card-count">{users.length}</span>
            </div>
            <div className="ut-table-wrap">
                <table className="ut-table">
                    <thead>
                        <tr className="ut-thead-row">
                            <th className="ut-th">{t("adminpanel.image")}</th>
                            <th className="ut-th">{t("adminpanel.username")}</th>
                            <th className="ut-th">{t("adminpanel.name")}</th>
                            <th className="ut-th">{t("adminpanel.surname")}</th>
                            <th className="ut-th">{t("adminpanel.email")}</th>
                            <th className="ut-th">{t("adminpanel.status")}</th>
                            <th className="ut-th">{t("adminpanel.municipality")}</th>
                            <th className="ut-th">{t("adminpanel.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(renderUserRow)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserTable;
