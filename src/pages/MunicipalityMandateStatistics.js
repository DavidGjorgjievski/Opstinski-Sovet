import React, { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import "../styles/MunicipalityMandateUsers.css";
import "../styles/MunicipalityMandateStatistics.css";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faCalendarDays,
  faListCheck,
  faFileLines,
  faMicrophone,
  faReply,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';

function MunicipalityMandateStatistics() {
  const { t } = useTranslation();
  const { municipalityId, mandateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [municipalityImages, setMunicipalityImages] = useState({ logo: null, flag: null, name: null });

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem('municipalities') || '[]');
    const found = cached.find(m => String(m.id) === String(municipalityId));
    if (found) {
      setMunicipalityImages({
        logo: found.logoImage ? `data:image/png;base64,${found.logoImage}` : null,
        flag: found.flagImage ? `data:image/png;base64,${found.flagImage}` : null,
        name: found.name || null,
      });
      return;
    }
    api.get(`/api/municipalities/${municipalityId}`)
      .then(res => {
        const d = res.data;
        setMunicipalityImages({
          logo: d.logoImage ? `data:image/png;base64,${d.logoImage}` : null,
          flag: d.flagImage ? `data:image/png;base64,${d.flagImage}` : null,
          name: d.name || null,
        });
      })
      .catch(() => {});
  }, [municipalityId]);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/municipality-terms/${mandateId}/statistics`)
      .then(res => setStatistics(res.data))
      .catch(() => setStatistics(null))
      .finally(() => setLoading(false));
  }, [mandateId]);

  const renderCount = (icon, labelKey, value) => (
    <div className="mms-stat-card">
      <div className="mms-stat-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="mms-stat-body">
        <span className="mms-stat-label">{t(labelKey)}</span>
        <span className="mms-stat-value">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="municipality-mandate-statistics-container">
      <HelmetProvider>
        <Helmet>
          <title>{t("MunicipalityMandateUsers.statisticsTitle")}</title>
        </Helmet>
      </HelmetProvider>

      <Header isSticky={true} />

      <main className="municipality-mandate-statistics-content">

        <div className="municipality-mandate-statistics-header">
          <div className="header-section">
            <button className="back-button" onClick={() => navigate(-1)}>
              <span className="back-icon">
                <FontAwesomeIcon icon={faChevronLeft} />
              </span>
              <span className="back-text">
                {t("common.back")}
              </span>
            </button>
          </div>

          <div className="header-section title-section">
            <h1 className="municipality-mandate-statistics-title">
              {t("MunicipalityMandateUsers.statisticsTitle")}
            </h1>
          </div>

          <div className="header-section" />
        </div>

        {(municipalityImages.flag || municipalityImages.logo || municipalityImages.name) && (
          <div className="mmu-emblem-banner">
            {municipalityImages.flag && (
              <img src={municipalityImages.flag} alt="flag" className="mmu-flag-img" />
            )}
            {municipalityImages.name && (
              <span className="mmu-municipality-name">{municipalityImages.name}</span>
            )}
            {municipalityImages.logo && (
              <img src={municipalityImages.logo} alt="coat of arms" className="mmu-logo-img" />
            )}
          </div>
        )}

        {loading && (
          <div className="municipalaty-mandate-user-spinner">
            <img
              src={`${process.env.PUBLIC_URL}/images/loading.svg`}
              alt={t("MunicipalityMandateUsers.loadingStatistics")}
            />
          </div>
        )}

        {!loading && statistics && (
          <div className="mms-stats-grid">
            <div className="mms-stat-card">
              <div className="mms-stat-icon">
                <FontAwesomeIcon icon={faCalendarDays} />
              </div>
              <div className="mms-stat-body">
                <span className="mms-stat-label">{t("MunicipalityMandateUsers.totalSessions")}</span>
                <span className="mms-stat-value">{statistics.totalSessions}</span>
              </div>
            </div>

            <div className="mms-stat-card">
              <div className="mms-stat-icon">
                <FontAwesomeIcon icon={faListCheck} />
              </div>
              <div className="mms-stat-body">
                <span className="mms-stat-label">{t("MunicipalityMandateUsers.totalTopics")}</span>
                <span className="mms-stat-value">{statistics.totalTopics}</span>
              </div>
            </div>

            <div className="mms-stat-card">
              <div className="mms-stat-icon">
                <FontAwesomeIcon icon={faFileLines} />
              </div>
              <div className="mms-stat-body">
                <span className="mms-stat-label">{t("MunicipalityMandateUsers.totalAmendments")}</span>
                <span className="mms-stat-value">{statistics.totalAmendments}</span>
              </div>
            </div>

            {renderCount(faMicrophone, "MunicipalityMandateUsers.totalSpeeches", statistics.totalSpeeches)}
            {renderCount(faReply, "MunicipalityMandateUsers.totalReplies", statistics.totalReplies)}
            {renderCount(faRotateLeft, "MunicipalityMandateUsers.totalCounterReplies", statistics.totalCounterReplies)}
          </div>
        )}

        {!loading && statistics && (
          <div className="mms-rankings">
            <h2 className="mms-rankings-title">{t("MunicipalityMandateUsers.rankingsTitle")}</h2>

            {(!statistics.speakerRankings || statistics.speakerRankings.length === 0) ? (
              <div className="mms-rankings-empty">{t("MunicipalityMandateUsers.noRankings")}</div>
            ) : (
              <div className="mms-rankings-table-wrap">
                <table className="mms-rankings-table">
                  <thead>
                    <tr>
                      <th className="mms-rankings-rank">#</th>
                      <th>{t("MunicipalityMandateUsers.rankingsName")}</th>
                      <th className="mms-rankings-num">
                        <FontAwesomeIcon icon={faMicrophone} /> {t("MunicipalityMandateUsers.rankingsSpeeches")}
                      </th>
                      <th className="mms-rankings-num">
                        <FontAwesomeIcon icon={faReply} /> {t("MunicipalityMandateUsers.rankingsReplies")}
                      </th>
                      <th className="mms-rankings-num">
                        <FontAwesomeIcon icon={faRotateLeft} /> {t("MunicipalityMandateUsers.rankingsCounterReplies")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.speakerRankings.map((s, idx) => (
                      <tr key={s.username} className={idx === 0 && s.speeches > 0 ? "mms-rankings-leader" : ""}>
                        <td className="mms-rankings-rank">{idx + 1}</td>
                        <td className="mms-rankings-name">{s.fullName}</td>
                        <td className="mms-rankings-num">{s.speeches}</td>
                        <td className="mms-rankings-num">{s.replies}</td>
                        <td className="mms-rankings-num">{s.counterReplies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default MunicipalityMandateStatistics;
