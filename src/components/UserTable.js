import React from 'react';

function UserTable({ users, title, bgColor, onDeleteClick, onEditClick }) {
    const renderUserRow = (user) => (
        <tr key={user.username}>
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
            <td>{user.role}</td>
            <td>{user.status}</td>
            <td>{user.municipalityName || 'N/A'}</td>  
            <td>
                <button
                    className="btn btn-sm btn-danger me-2"
                    onClick={() => onDeleteClick(user)}
                >
                    Избриши
                </button>
                <button
                    className="btn btn-sm btn-warning"
                    onClick={() => onEditClick(user)}
                >
                    Уреди
                </button>
            </td>
        </tr>
    );

    return (
        <>
            <h2 className="text-center mt-4">{title}</h2>
            <div className="custom-table-responsive">
                <table className="table table-bordered table-striped text-center">
                    <thead className="thead-light">
                        <tr>
                            <th className={`bg-${bgColor}`}>Слика</th>
                            <th className={`bg-${bgColor}`}>Корисничко име</th>
                            <th className={`bg-${bgColor}`}>Име</th>
                            <th className={`bg-${bgColor}`}>Презиме</th>
                            <th className={`bg-${bgColor}`}>Роља</th>
                            <th className={`bg-${bgColor}`}>Статус</th>
                            <th className={`bg-${bgColor}`}>Општина</th> 
                            <th className={`bg-${bgColor}`}>Акции</th>
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
