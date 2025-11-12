import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/TopicPresentation.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import useVoteWebSocket from "../hooks/useVoteWebSocket";
import usePresenterWebSocket from "../hooks/usePresenterWebSocket";
import useNewTopicWebSocket from "../hooks/useNewTopicWebSocket";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOn, faToggleOff } from "@fortawesome/free-solid-svg-icons";

const TopicPresentation = () => {
  const [topic, setTopic] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { id, municipalityId } = useParams();
  const token = localStorage.getItem("jwtToken");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { messages: voteMessages } = useVoteWebSocket(id);
  const { messages: presenterMessages } = usePresenterWebSocket(id);
  const { messages: newTopicMessages } = useNewTopicWebSocket(id);

  let municipalityImage = null;
  if (municipalityId) {
    const municipalities = JSON.parse(localStorage.getItem("municipalities") || "[]");
    const municipality = municipalities.find((m) => m.id === Number(municipalityId));
    if (municipality) {
      municipalityImage = municipality.logoImage;
    }
  }

  // Fetch the current topic
  const fetchPresenterTopic = useCallback(async () => {
    try {
      const endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/presenter`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error(`Failed to fetch topic. Status: ${response.status}`);
        return;
      }
      const text = await response.text();
      if (!text) return;
      const data = JSON.parse(text);
      setTopic(data);
    } catch (error) {
      console.error("Error fetching topic:", error);
    }
  }, [id, token]);

  useEffect(() => {
    fetchPresenterTopic();
  }, [fetchPresenterTopic]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchPresenterTopic();
    }, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPresenterTopic]);

  // 🧠 WebSocket updates
  useEffect(() => {
    if (autoRefresh) return;
    fetchPresenterTopic();
  }, [voteMessages, presenterMessages, newTopicMessages, fetchPresenterTopic, autoRefresh]);

  useEffect(() => {
    if (autoRefresh || voteMessages.length === 0) return;
    const lastResult = voteMessages.at(-1);
    setTopic((prev) => {
      if (!prev) return lastResult;
      if (prev.id === lastResult.topicId) {
        return {
          ...prev,
          yes: lastResult.yes,
          no: lastResult.no,
          abstained: lastResult.abstained,
          cantVote: lastResult.cantVote,
          haveNotVoted: lastResult.haveNotVoted,
          absent: lastResult.absent,
          topicStatus: lastResult.status,
        };
      }
      return prev;
    });
  }, [voteMessages, autoRefresh]);

  return (
    <div
      className={`topic-presentar-container ${
        topic &&
        (topic.topicStatus === "FINISHED" ||
          topic.topicStatus === "WITHDRAWN" ||
          topic.topicStatus === "INFORMATION")
          ? "finished-topic"
          : ""
      }`}
    >
      <HelmetProvider>
        <Helmet>
          <title>Презентација</title>
        </Helmet>
      </HelmetProvider>

      <div className="presenter-header">
        <img
          id="logo-img"
          src={
            municipalityImage
              ? `data:image/png;base64,${municipalityImage}`
              : `${process.env.PUBLIC_URL}/images/grb.png`
          }
          className="logo-img-presenter"
          alt="Logo"
          onClick={() => window.location.reload()}
        />        

        <button
          className="back-button-presenter"
          onClick={() =>
            navigate(`/municipalities/${municipalityId}/sessions#session-${id}`)
          }
        >
          {t("topicsPage.backButton")}
        </button>

        <div className="toggle-container">
          <span
            className="toggle-label-refresh"
            onClick={() => setAutoRefresh((prev) => !prev)}
            title={autoRefresh ? "Switch to WebSocket Mode" : "Switch to Auto-Refresh"}
          >
            <FontAwesomeIcon
              icon={autoRefresh ? faToggleOn : faToggleOff}
              size="2x"
              color={autoRefresh ? "#4CAF50" : "#ddd"}
              className="toggle-refresh"
            />
           <span className="toggle-text">
              {autoRefresh ? t("topicsPage.autoRefreshOn") : t("topicsPage.webSocketMode")}
            </span>
          </span>
        </div>
      </div>

      {!topic ? (
        <h1 className="text-center">{t("topicsPage.noTopicsPresent")}</h1>
      ) : (
        <>
          <h1 className="presented-topic-header">{topic.title}</h1>
          <div className="presented-topic-body">
            {!(
              topic.topicStatus === "CREATED" ||
              topic.topicStatus === "INFORMATION" ||
              topic.topicStatus === "WITHDRAWN"
            ) && (
              <>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.yes")}</p>
                  <h1 className="presented-number yes">{topic.yes}</h1>
                </div>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.no")}</p>
                  <h1 className="presented-number no">{topic.no}</h1>
                </div>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.abstained")}</p>
                  <h1 className="presented-number abstained">{topic.abstained}</h1>
                </div>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.cantVote")}</p>
                  <h1 className="presented-number cant-vote">
                    {topic.cantVote}
                  </h1>
                </div>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.notVoted")}</p>
                  <h1 className="presented-number havent-vote">
                    {topic.haveNotVoted}
                  </h1>
                </div>
                <div className="presented-topic-body-div">
                  <p className="presented-text">{t("topicsPage.absent")}</p>
                  <h1 className="presented-number absent">{topic.absent}</h1>
                </div>
              </>
            )}
          </div>

          {topic.topicStatus === "INFORMATION" && (
            <div className="d-flex justify-content-center w-100">
              <h1 className="text-center fw-bold topic-status-info">
                {t("topicsPage.information")}
              </h1>
            </div>
          )}
          {topic.topicStatus === "WITHDRAWN" && (
            <div className="d-flex justify-content-center w-100">
              <h1 className="text-center fw-bold topic-status-info">
                {t("topicsPage.withdrawn")}
              </h1>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopicPresentation;
