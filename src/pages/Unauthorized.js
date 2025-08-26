import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Unauthorized.css';

const Unauthorized = () => {
    return (
       <div>
            <h1>Непозволено</h1>
            <p>Немате дозвола да пристапите на оваа страница.</p>
            <Link to="/" className="unauthorized-back-button">Одете на почетната страница</Link>
        </div>
    );
};

export default Unauthorized;