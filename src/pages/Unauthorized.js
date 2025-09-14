import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import '../styles/Unauthorized.css';

const Unauthorized = () => {
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t("unauthorized.title")}</h1>
            <p>{t("unauthorized.message")}</p>
            <Link to="/" className="unauthorized-back-button">
                {t("unauthorized.backButton")}
            </Link>
        </div>
    );
};

export default Unauthorized;
