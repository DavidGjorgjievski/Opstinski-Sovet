import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/NotFound.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1>
          {t("notFound.title")} <FontAwesomeIcon icon={faBan} className="notfound-icon" />
        </h1>
        <p>{t("notFound.message")}</p>
        <Link to="/" className="wide-back-button">
          {t("notFound.backButton")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
