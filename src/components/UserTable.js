import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

function UserTable({ users, title, bgColor, onDeleteClick, onEditClick }) {
    const { t } = useTranslation();

    const renderUserRow = (user) => (
        <tr className={bgColor} key={user.username}>
            <td>
                {user.image && (
                    <img
                        src={`data:image/jpeg;base64,${user.image}`}
                        alt={`${user.name} ${user.surname}`}
                        className="user-admin-img"
                    />
                )}
            </td>
            <td>{user.username}</td>
            <td>{user.name}</td>
            <td>{user.surname}</td>
            <td>
                {user.email && user.email.trim() !== "" 
                    ? user.email 
                    : <span className="not-available-text">{t("adminpanel.notAvailable")}</span>
                }
            </td>
            <td>
               <span className={user.status === "ACTIVE" ? "admin-panel-status-active" : "admin-panel-status-inactive"}>{user.status}</span> 
            </td>
            <td>
                {user.municipalityName && user.municipalityName.trim() !== ""
                    ? user.municipalityName
                    : <span className="not-available-text">{t("adminpanel.notAvailable")}</span>
                }
            </td>
            <td>
                <div className="action-buttons-vertical">
                    <button className="btn-edit" onClick={() => onEditClick(user)}>
                        {t("adminpanel.edit")} <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                     <button className="btn-delete" onClick={() => onDeleteClick(user)}>
                        {t("adminpanel.delete")} <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <>
            <h2 className="text-center mt-4">{title}</h2>
            <hr className="fancy-hr" />
            <div className="custom-table-responsive">
                <table className="table table-bordered text-center">
                    <thead>
                        <tr className={bgColor}>
                            <th>{t("adminpanel.image")}</th>
                            <th>{t("adminpanel.username")}</th>
                            <th>{t("adminpanel.name")}</th>
                            <th>{t("adminpanel.surname")}</th>
                            <th>{t("adminpanel.email")}</th>
                            <th>{t("adminpanel.status")}</th>
                            <th>{t("adminpanel.municipality")}</th>
                            <th>{t("adminpanel.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(renderUserRow)}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default UserTable;
