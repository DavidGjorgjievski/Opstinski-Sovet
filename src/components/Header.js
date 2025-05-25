import React, { useState, useEffect, useRef  } from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faRightFromBracket, faBars   } from '@fortawesome/free-solid-svg-icons';
import { useParams  } from "react-router-dom";


function Header({ userInfo, fetchTopics = null, setIsFromLogo = null, fetchOnlineUsers=null }) {
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileRef = useRef(null);
    const { municipalityId } = useParams();
    let municipalityImage = null;

    if (municipalityId) {
        const municipalities = JSON.parse(localStorage.getItem("municipalities") || "[]");
        const municipality = municipalities.find(
          (m) => m.id === Number(municipalityId)
        );
    
        if (municipality) {
          municipalityImage = municipality.logoImage;
        }
      }


    const toggleMobileMenu = () => {
        setMobileNavOpen(!isMobileNavOpen);
    };

    const getActiveClass = (path) => {
        return window.location.pathname === path ? 'active' : '';
    };

useEffect(() => {
  const logoImg = document.getElementById('logo-img');
  const handleClick = () => {
    if (typeof setIsFromLogo === 'function') {
      setIsFromLogo(true);
    }
    if (fetchTopics) {
      fetchTopics();
      fetchOnlineUsers();
    } else {
      window.location.reload();
    }
  };
  logoImg.addEventListener('click', handleClick);
  return () => logoImg.removeEventListener('click', handleClick);
}, [fetchTopics, setIsFromLogo, fetchOnlineUsers]);


 useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [profileRef]);

    return (
        <header>
            <nav>
                <div className="d-flex flex-row">
                    <div>
                    <img
                        id="logo-img"
                        src={
                        municipalityImage
                            ? `data:image/png;base64,${municipalityImage}`
                            : `${process.env.PUBLIC_URL}/images/grb.png`
                        }
                        className="logo-img"
                        alt="Logo"
                        />
                    </div>


                     {/* Mobile Navigation */}
                    <div id="mobile-menu-toggle" className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                       <FontAwesomeIcon icon={faBars} className="hamburger-icon" />
                    </div>
                    <ul className={`nav-item-mobile ${isMobileNavOpen ? 'open' : ''}`} id="mobile-nav">
                        <li><Link to="/">Почетна</Link></li>
                        <li><Link to="/municipalities">Општини</Link></li>
                         {userInfo.municipalityId && userInfo.municipalityId !== "Not Assigned" && (
                            <li className={getActiveClass(`/municipalities/${userInfo.municipalityId}/sessions`)}>
                                <Link to={`/municipalities/${userInfo.municipalityId}/sessions`}>Мои седници</Link>
                            </li>
                        )}
                        <li style={{ display: userInfo.role === 'ROLE_ADMIN' ? 'block' : 'none' }}>
                            <Link to="/admin-panel">Админ панел</Link>
                        </li>
                    </ul>

                </div>


                    {/* Desktop Navigation */}
                    <ul className="nav-item" id="desktop-nav">
                        <li className={getActiveClass('/')}><Link to="/">Почетна</Link></li>
                        <li className={getActiveClass('/municipalities')}><Link to="/municipalities">Општини</Link></li>
                        {userInfo.municipalityId && userInfo.municipalityId !== "Not Assigned" && (
                            <li className={getActiveClass(`/municipalities/${userInfo.municipalityId}/sessions`)}>
                                <Link to={`/municipalities/${userInfo.municipalityId}/sessions`}>Мои седници</Link>
                            </li>
                        )}
                        <li className={getActiveClass('/admin-panel')} style={{ display: userInfo.role === 'ROLE_ADMIN' ? 'block' : 'none' }}>
                            <Link to="/admin-panel">Админ панел</Link>
                        </li>
                    </ul>

                {/* User Profile and Logout Links */}
                    <div ref={profileRef} className="profile-menu-wrapper">
                        <img
                            src={`data:image/jpeg;base64,${userInfo.image}`}
                            className="header-image"
                            alt="User Profile"
                            onClick={() => setProfileMenuOpen((open) => !open)}
                        />
                        {isProfileMenuOpen && (
                            <div className="profile-dropdown">
                            <p className="fw-bold">{userInfo.name} {userInfo.surname}</p>
                            <Link to="/profile"> <FontAwesomeIcon icon={faGear} /> Поставки </Link>
                            <Link to="/logout"> <FontAwesomeIcon icon={faRightFromBracket} /> Одјави се</Link>
                            </div>
                        )}
                        </div>
            </nav>
        </header>
    );
}

export default Header;
