import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/TopicPresentation.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import useVoteWebSocket from "../hooks/useVoteWebSocket";
import usePresenterWebSocket from "../hooks/usePresenterWebSocket";
import useNewTopicWebSocket from "../hooks/useNewTopicWebSocket";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOn, faToggleOff, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';
import useSpeakingWebSocket from '../hooks/useSpeakingWebSocket';
import UserAvatar from '../components/UserAvatar';
import { storeTermImages, isTermPopulated } from '../cache/imageCache';

const TopicPresentation = () => {
  const [topic, setTopic] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [, setDurations] = useState({ SPEECH: 300, REPLY: 180, COUNTER_REPLY: 60 });
  const durationsRef = useRef({ SPEECH: 300, REPLY: 180, COUNTER_REPLY: 60 });
  const timerRef = useRef(null);
  const clockOffsetRef = useRef(0);
  const lastSpeakerIdRef = useRef(null);
  const isPausedRef = useRef(false);
  const { id, municipalityId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { messages: voteMessages } = useVoteWebSocket(id);
  const { messages: presenterMessages } = usePresenterWebSocket(id);
  const { messages: newTopicMessages } = useNewTopicWebSocket(id);
  const { messages: speakingMessages, durationMessages, pauseMessages } = useSpeakingWebSocket(municipalityId);

  let municipalityImage = null;
  let sessionMunicipalityTermId = null;
  if (municipalityId) {
    const municipalities = JSON.parse(localStorage.getItem("municipalities") || "[]");
    const municipality = municipalities.find((m) => m.id === Number(municipalityId));
    if (municipality) {
      municipalityImage = municipality.logoImage;
    }
    const cachedSessions = JSON.parse(localStorage.getItem(`sessions_${municipalityId}`) || "[]");
    const session = cachedSessions.find(s => s.id === parseInt(id));
    if (session) sessionMunicipalityTermId = session.municipalityMandateId;
  }

  // Populate image cache once per mandate term
  useEffect(() => {
    if (!sessionMunicipalityTermId) return;
    if (isTermPopulated(sessionMunicipalityTermId)) return;
    api.get(`/api/municipality-terms/${sessionMunicipalityTermId}/user-images`)
      .then(res => storeTermImages(sessionMunicipalityTermId, res.data))
      .catch(() => {});
  }, [sessionMunicipalityTermId]);

  // Fetch the current topic
  const fetchPresenterTopic = useCallback(async () => {
    if (fetchPresenterTopic.isFetching) return; // skip if already fetching
    fetchPresenterTopic.isFetching = true;

    try {
      const response = await api.get(`/api/sessions/${id}/topics/presenter`);
      setTopic(response.data);
    } catch (error) {
      if (error.response) {
        console.error(`Failed to fetch topic. Status: ${error.response.status}`);
      } else {
        console.error("Error fetching topic:", error);
      }
    } finally {
      fetchPresenterTopic.isFetching = false;
    }
  }, [id]);

  fetchPresenterTopic.isFetching = false;

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

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimerAt = useCallback((seconds) => {
    stopTimer();
    setTimeLeft(seconds);
    if (seconds <= 0) return;
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const applyDurations = useCallback((d) => {
    const mapped = { SPEECH: d.speechSeconds, REPLY: d.replySeconds, COUNTER_REPLY: d.counterReplySeconds };
    durationsRef.current = mapped;
    setDurations(mapped);
  }, []);

  const startTimerForSpeaker = useCallback((speaker) => {
    const duration = durationsRef.current[speaker.type] || 300;
    if (speaker.speakerStartTime) {
      const correctedNow = Date.now() - clockOffsetRef.current;
      const elapsed = Math.floor((correctedNow - speaker.speakerStartTime) / 1000);
      startTimerAt(Math.max(0, duration - elapsed));
    } else {
      startTimerAt(duration);
    }
  }, [startTimerAt]);

  // Fetch durations + items together so timer starts with correct durations
  useEffect(() => {
    if (!municipalityId) return;
    Promise.all([
      api.get(`/api/speaking/municipality/${municipalityId}/durations`),
      api.get(`/api/speaking/municipality/${municipalityId}/items`),
    ]).then(([durRes, itemsRes]) => {
      applyDurations(durRes.data);
      clockOffsetRef.current = Date.now() - (itemsRes.data.serverNow || Date.now());
      const speaking = (itemsRes.data.items || []).find(i => i.status === 'SPEAKING') || null;
      setCurrentSpeaker(speaking);
      if (speaking) {
        lastSpeakerIdRef.current = speaking.id;
        const duration = durationsRef.current[speaking.type] || 300;
        const correctedNow = Date.now() - clockOffsetRef.current;
        const elapsed = speaking.speakerStartTime
          ? Math.floor((correctedNow - speaking.speakerStartTime) / 1000)
          : 0;
        startTimerAt(Math.max(0, duration - elapsed));
      }
    }).catch(() => {});
  }, [municipalityId, applyDurations, startTimerAt]);

  // Live updates for current speaker via WebSocket
  useEffect(() => {
    if (!speakingMessages.length) return;
    const last = speakingMessages.at(-1);
    clockOffsetRef.current = Date.now() - (last.serverNow || Date.now());
    const speaking = (last.items || []).find(i => i.status === 'SPEAKING') || null;
    setCurrentSpeaker(speaking);
  }, [speakingMessages]);

  // Sync durations from WebSocket
  useEffect(() => {
    if (!durationMessages.length) return;
    applyDurations(durationMessages.at(-1));
  }, [durationMessages, applyDurations]);

  // Sync pause from WebSocket
  useEffect(() => {
    if (!pauseMessages.length) return;
    isPausedRef.current = !!pauseMessages.at(-1).paused;
  }, [pauseMessages]);

  // Start/reset timer when speaker changes via WebSocket
  useEffect(() => {
    if (!currentSpeaker) {
      if (lastSpeakerIdRef.current !== null) {
        stopTimer();
        setTimeLeft(0);
        lastSpeakerIdRef.current = null;
      }
      return;
    }
    if (currentSpeaker.id === lastSpeakerIdRef.current) return;
    lastSpeakerIdRef.current = currentSpeaker.id;
    startTimerForSpeaker(currentSpeaker);
  }, [currentSpeaker, startTimerForSpeaker, stopTimer]);

  // Cleanup timer on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  const getTitleFontSize = (title) => {
    const len = title?.length || 0;
    if (len > 450) return '25px';
    if (len > 400) return '27px';
    if (len > 250) return '30px';
    if (len > 150) return '35px';
    if (len > 80)  return '45px';
    return null; // use CSS default (55px)
  };

  const formatTime = (secs) => {
    if (secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const SPEAKER_TYPE_COLORS = {
    SPEECH: { color: '#2563eb', bg: '#dbeafe' },
    REPLY: { color: '#ea580c', bg: '#ffedd5' },
    COUNTER_REPLY: { color: '#dc2626', bg: '#fee2e2' },
  };

  const SPEAKER_TYPE_KEYS = {
    SPEECH: 'speakingPanel.types.speech',
    REPLY: 'speakingPanel.types.reply',
    COUNTER_REPLY: 'speakingPanel.types.counterFull',
  };

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
          className="back-button"
          onClick={() =>
            navigate(`/municipalities/${municipalityId}/sessions#session-${id}`)
          }
        >
          <span className="back-icon">
            <FontAwesomeIcon icon={faChevronLeft} />
          </span>
          <span className="back-text">
            {t("common.back")}
          </span>
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
          <h1
            className="presented-topic-header"
            style={getTitleFontSize(topic.title) ? { fontSize: getTitleFontSize(topic.title) } : undefined}
          >
            {topic.title}
          </h1>
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
      {currentSpeaker && (() => {
        const cfg = SPEAKER_TYPE_COLORS[currentSpeaker.type] || SPEAKER_TYPE_COLORS.SPEECH;
        return (
          <div className="presenter-speaker-card" style={{ borderLeftColor: cfg.color, backgroundColor: cfg.bg }}>
            <UserAvatar
              username={currentSpeaker.username}
              name={currentSpeaker.fullName.split(' ')[0]}
              surname={currentSpeaker.fullName.split(' ').slice(1).join(' ')}
              className="presenter-speaker-avatar"
              termId={sessionMunicipalityTermId}
            />
            <div className="presenter-speaker-card-body">
              <div className="presenter-speaker-card-name">{currentSpeaker.fullName}</div>
              <div className="presenter-speaker-card-type" style={{ color: cfg.color }}>
                {t(SPEAKER_TYPE_KEYS[currentSpeaker.type] || SPEAKER_TYPE_KEYS.SPEECH)}
              </div>
              <div className={`presenter-speaker-card-time ${timeLeft < (durationsRef.current[currentSpeaker.type] || 300) * 0.2 ? 'presenter-speaker-time-critical' : timeLeft < (durationsRef.current[currentSpeaker.type] || 300) * 0.4 ? 'presenter-speaker-time-low' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TopicPresentation;
