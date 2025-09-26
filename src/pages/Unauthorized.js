import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import '../styles/Unauthorized.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

const Unauthorized = () => {
    const { t } = useTranslation();

    return (
        <div className="unauthorized-container">
            <div className="unauthorized-content">
                <h1>
                    {t("unauthorized.title")}  
                    <FontAwesomeIcon icon={faTriangleExclamation} className="unauthorized-icon" />
                </h1>
                <p>{t("unauthorized.message")}</p>
                <Link to="/" className="unauthorized-back-button">
                    {t("unauthorized.backButton")}
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
