import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faMicrophone,
  faReply,
  faBolt,
  faHourglassHalf,
  faTrashCan,
  faXmark,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import api from '../api/axios';
import '../styles/SpeakingTimeline.css';

const TYPE_CONFIG = {
  SPEECH:        { labelKey: 'speakingPanel.types.speech',       color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', icon: faMicrophone },
  REPLY:         { labelKey: 'speakingPanel.types.reply',        color: '#ea580c', bg: '#ffedd5', border: '#fdba74', icon: faReply },
  COUNTER_REPLY: { labelKey: 'speakingPanel.types.counterFull',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: faBolt },
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatDuration = (totalSeconds) => {
  if (totalSeconds == null || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
};

const formatClock = (ms) => {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const groupByTopic = (entries) => {
  const map = new Map();
  entries.forEach((e) => {
    const key = e.topicId != null ? `id:${e.topicId}` : 'none';
    if (!map.has(key)) {
      map.set(key, { topicId: e.topicId ?? null, subGroups: new Map() });
    }
    const g = map.get(key);
    const subKey = e.amendmentId != null ? `a:${e.amendmentId}` : 'topic';
    if (!g.subGroups.has(subKey)) {
      g.subGroups.set(subKey, { amendmentId: e.amendmentId ?? null, items: [] });
    }
    g.subGroups.get(subKey).items.push(e);
  });
  return Array.from(map.entries())
    .map(([key, g]) => {
      const topicSubGroup = g.subGroups.get('topic') || null;
      const amendmentSubGroups = Array.from(g.subGroups.entries())
        .filter(([k]) => k !== 'topic')
        .map(([, sg]) => sg)
        .sort((a, b) => (a.items[0]?.startedAt || 0) - (b.items[0]?.startedAt || 0));
      const subGroups = [...(topicSubGroup ? [topicSubGroup] : []), ...amendmentSubGroups];
      const firstAt = subGroups[0]?.items[0]?.startedAt || 0;
      const topicItemCount = topicSubGroup ? topicSubGroup.items.length : 0;
      return { key, topicId: g.topicId, subGroups, firstAt, topicItemCount };
    })
    .sort((a, b) => a.firstAt - b.firstAt);
};


function SpeakingTimeline() {
  const { municipalityId, sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [topicTitles, setTopicTitles] = useState({});
  const [topicAmounts, setTopicAmounts] = useState({});
  const [amendmentTitles, setAmendmentTitles] = useState({});
  const [amendmentAmounts, setAmendmentAmounts] = useState({});
  const [amendmentCreatedBy, setAmendmentCreatedBy] = useState({});

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo')) || {}; }
    catch { return {}; }
  }, []);

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(`sessions_${municipalityId}`) || '[]');
    const cachedSession = cached.find((s) => String(s.id) === String(sessionId));
    if (cachedSession?.name) setSessionName(cachedSession.name);

    api.get(`/api/sessions/${sessionId}`)
      .then((res) => { if (res?.data?.name) setSessionName(res.data.name); })
      .catch((err) => console.error('Failed to load session info', err));

    api.get(`/api/speaking/session/${sessionId}/history`)
      .then(async (res) => {
        const data = res.data || [];
        setEntries(data);
        // Fetch amendment titles for any amendment speeches
        const amendmentsByTopic = new Map();
        data.forEach((e) => {
          if (e.amendmentId != null && e.topicId != null) {
            if (!amendmentsByTopic.has(e.topicId)) amendmentsByTopic.set(e.topicId, new Set());
            amendmentsByTopic.get(e.topicId).add(e.amendmentId);
          }
        });
        if (amendmentsByTopic.size > 0) {
          const titleMap = {};
          const amountMap = {};
          const createdByMap = {};
          await Promise.all(Array.from(amendmentsByTopic.entries()).map(async ([topicId]) => {
            try {
              const r = await api.get(`/api/topics/${topicId}/amendments`);
              (r.data?.amendments || []).forEach((a) => {
                titleMap[a.id] = a.title;
                if (a.amount) amountMap[a.id] = a.amount;
                const fullName = [a.createdByName, a.createdBySurname].filter(Boolean).join(' ');
                createdByMap[a.id] = fullName || a.createdBy || '';
              });
            } catch {}
          }));
          setAmendmentTitles(titleMap);
          setAmendmentAmounts(amountMap);
          setAmendmentCreatedBy(createdByMap);
        }
      })
      .catch((err) => console.error('Failed to load speech history', err))
      .finally(() => setLoading(false));

    api.get(`/api/sessions/${sessionId}/topics`)
      .then((res) => {
        const titleMap = {};
        const amountMap = {};
        (res.data?.topics || []).forEach((t) => {
          titleMap[t.id] = t.title;
          if (t.amount) amountMap[t.id] = t.amount;
        });
        setTopicTitles(titleMap);
        setTopicAmounts(amountMap);
      })
      .catch((err) => console.error('Failed to load topic titles', err));
  }, [municipalityId, sessionId]);

  const canDelete = useMemo(() => userInfo?.role === 'ROLE_ADMIN', [userInfo]);

  const handleDelete = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/speaking/session/${sessionId}/history/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setPendingDeleteId(null);
    } catch (err) {
      console.error('Failed to delete speech history entry', err);
    } finally {
      setDeletingId(null);
    }
  }, [sessionId]);

  const groups = useMemo(() => groupByTopic(entries), [entries]);

  const totals = useMemo(() => {
    const totalSeconds = entries.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);
    const counts = { SPEECH: 0, REPLY: 0, COUNTER_REPLY: 0 };
    entries.forEach((e) => { if (counts[e.type] != null) counts[e.type] += 1; });
    return { totalSeconds, counts, total: entries.length };
  }, [entries]);

  return (
    <div className="st-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('speakingPanel.timeline')}</title>
        </Helmet>
      </HelmetProvider>

      <Header />

      <main className="st-main">
        <div className="st-header-row">
          <button className="back-button" onClick={() => navigate(-1)}>
            <span className="back-icon">
              <FontAwesomeIcon icon={faChevronLeft} />
            </span>
            <span className="back-text">{t('common.back')}</span>
          </button>
          <div className="st-title-block">
            <h1 className="st-title">
              {t('speakingPanel.timeline')}
            </h1>
            <h6 className="st-session-title">{sessionName}</h6>
          </div>
        </div>

        {!loading && entries.length > 0 && (
          <div className="st-summary">
            <div className="st-summary-plain-group">
              <div className="st-summary-item">
                <span className="st-summary-label">{t('speakingPanel.timelineTotal')}</span>
                <span className="st-summary-value">{totals.total}</span>
              </div>
              <div className="st-summary-item">
                <span className="st-summary-label">
                  <FontAwesomeIcon icon={faHourglassHalf} /> {t('speakingPanel.timelineTotalTime')}
                </span>
                <span className="st-summary-value">{formatDuration(totals.totalSeconds)}</span>
              </div>
            </div>
            <div className="st-summary-typed-group">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const count = totals.counts[type] ?? 0;
                return (
                  <div key={type} className="st-summary-item st-summary-item-typed" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                    <span className="st-summary-label">{t(cfg.labelKey)}</span>
                    <span className="st-summary-value">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="st-empty">{t('speakingPanel.timelineLoading')}</div>
        ) : entries.length === 0 ? (
          <div className="st-empty">{t('speakingPanel.timelineEmpty')}</div>
        ) : (
          <div className="st-groups">
            {groups.map((g) => (
              <section key={g.key} className="st-group">
                <div className="st-group-header st-group-header-topic">
                  <span className="st-group-header-label">{t('speakingPanel.timelineTopic')}</span>
                  <span className="st-group-header-title">
                    {(g.topicId != null ? topicTitles[g.topicId] : null) || t('speakingPanel.timelineNoTopic')}
                  </span>
                  {g.topicId != null && topicAmounts[g.topicId] && (
                    <span className="st-group-header-creator">
                      {topicAmounts[g.topicId]} {t('topicsPage.currency')}
                    </span>
                  )}
                  <span className="st-group-header-count">{g.topicItemCount}</span>
                </div>
                {g.subGroups.map((sg) => (
                  <div key={sg.amendmentId ?? 'topic'}>
                    {sg.amendmentId != null && (
                      <div className="st-group-header st-group-header-amendment">
                        <span className="st-group-header-label">{t('speakingPanel.timelineAmendment')}</span>
                        <span className="st-group-header-title">
                          {amendmentTitles[sg.amendmentId] || `#${sg.amendmentId}`}
                        </span>
                        {amendmentAmounts[sg.amendmentId] && (
                          <span className="st-group-header-creator">
                            {amendmentAmounts[sg.amendmentId]} {t('topicsPage.currency')}
                          </span>
                        )}
                        {amendmentCreatedBy[sg.amendmentId] && (
                          <span className="st-group-header-creator">
                            {amendmentCreatedBy[sg.amendmentId]}
                          </span>
                        )}
                        <span className="st-group-header-count">{sg.items.length}</span>
                      </div>
                    )}
                    <ol className="st-timeline">
                      {sg.items.map((e, idx) => {
                    const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.SPEECH;
                    const fullName = e.fullName || e.username;
                    return (
                      <li
                        key={e.id}
                        className={`st-item st-item-type-${e.type}${pendingDeleteId === e.id ? ' st-item-confirming' : ''}`}
                        style={{ '--accent': cfg.color, '--accent-bg': cfg.bg, '--accent-border': cfg.border }}
                      >
                        <div className="st-item-rail">
                          <span className="st-item-index">{idx + 1}</span>
                          <span className="st-item-dot" />
                        </div>
                        <div className="st-item-card">
                          {canDelete && pendingDeleteId !== e.id && (
                            <button
                              type="button"
                              className="st-item-delete-btn"
                              onClick={() => setPendingDeleteId(e.id)}
                              title={t('speakingPanel.timelineDelete')}
                              aria-label={t('speakingPanel.timelineDelete')}
                              disabled={deletingId === e.id}
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          )}
                          {pendingDeleteId === e.id && (
                            <div className="st-item-confirm">
                              <span className="st-item-confirm-text">
                                {t('speakingPanel.timelineDeleteConfirm')}
                              </span>
                              <div className="st-item-confirm-actions">
                                <button
                                  type="button"
                                  className="st-confirm-btn st-confirm-btn-yes"
                                  onClick={() => handleDelete(e.id)}
                                  disabled={deletingId === e.id}
                                  title={t('speakingPanel.timelineDelete')}
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                  <span>{t('speakingPanel.timelineDelete')}</span>
                                </button>
                                <button
                                  type="button"
                                  className="st-confirm-btn st-confirm-btn-no"
                                  onClick={() => setPendingDeleteId(null)}
                                  disabled={deletingId === e.id}
                                  title={t('common.back')}
                                >
                                  <FontAwesomeIcon icon={faXmark} />
                                  <span>{t('speakingPanel.actions.cancel')}</span>
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="st-item-top">
                            <UserAvatar
                              username={e.username}
                              name={fullName.split(' ')[0]}
                              surname={fullName.split(' ').slice(1).join(' ')}
                              className="st-item-avatar"
                            />
                            <div className="st-item-identity">
                              <div className="st-item-name">{fullName}</div>
                              <div className="st-item-meta">
                                <span className="st-type-badge">
                                  <FontAwesomeIcon icon={cfg.icon} />
                                  {t(cfg.labelKey)}
                                </span>
                                {e.replyToUsername && (
                                  <span className="st-item-reply">
                                    <FontAwesomeIcon icon={faReply} />
                                    {e.replyToFullName || e.replyToUsername}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="st-item-times">
                            <div className="st-item-times-segment">
                              <strong>{t('speakingPanel.timelineStart')}</strong>
                              <span>{formatClock(e.startedAt)}</span>
                            </div>
                            <span className="st-item-times-arrow">→</span>
                            <div className="st-item-times-segment">
                              <strong>{t('speakingPanel.timelineEnd')}</strong>
                              <span>{formatClock(e.endedAt)}</span>
                            </div>
                            <div className="st-item-duration" title={t('speakingPanel.timelineDuration')}>
                              <strong>{t('speakingPanel.timelineDuration')}</strong>
                              <span>
                                <FontAwesomeIcon icon={faHourglassHalf} />
                                {formatDuration(e.durationSeconds)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                    </ol>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default SpeakingTimeline;
