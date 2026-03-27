import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import '../styles/SpeakingPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faHandPaper,
  faReply,
  faBolt,
  faCheck,
  faXmark,
  faStop,
  faPause,
  faPlay,
  faAngleUp,
  faAngleDown,
  faTrashCan,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import useSpeakingWebSocket from '../hooks/useSpeakingWebSocket';
import api from '../api/axios';
import UserAvatar from './UserAvatar';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_DURATIONS = {
  SPEECH: 300,        // 5 minutes
  REPLY: 180,         // 3 minutes
  COUNTER_REPLY: 60,  // 1 minute
};

const TYPE_CONFIG = {
  SPEECH: {
    label: 'Speech',
    color: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
    darkBg: '#1d4ed8',
  },
  REPLY: {
    label: 'Reply',
    color: '#ea580c',
    bg: '#ffedd5',
    border: '#fdba74',
    darkBg: '#c2410c',
  },
  COUNTER_REPLY: {
    label: 'Counter',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    darkBg: '#b91c1c',
  },
};

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  SPEAKING: '#3b82f6',
  DONE: '#9ca3af',
  REJECTED: '#ef4444',
};

// ─── Utilities ──────────────────────────────────────────────────────────────

const formatTime = (secs) => {
  if (secs <= 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getFullName = (userInfo) => {
  const first = userInfo?.firstName || userInfo?.name || '';
  const last = userInfo?.lastName || userInfo?.surname || '';
  const full = `${first} ${last}`.trim();
  return full || userInfo?.username || 'Unknown';
};

const mapDtoToEntry = (dto) => ({
  id: dto.id,
  username: dto.username,
  fullName: dto.fullName,
  type: dto.type,
  status: dto.status,
  replyToUsername: dto.replyToUsername || null,
  replyToFullName: dto.replyToFullName || null,
  speakerStartTime: dto.speakerStartTime || null,
  requestedAt: dto.createdAt,
});

// ─── Sub-components ─────────────────────────────────────────────────────────

const TYPE_LABEL_KEYS = {
  SPEECH: 'speakingPanel.types.speech',
  REPLY: 'speakingPanel.types.reply',
  COUNTER_REPLY: 'speakingPanel.types.counterFull',
};

function TypeBadge({ type, size = 'sm' }) {
  const { t } = useTranslation();
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.SPEECH;
  return (
    <span
      className={`sp-badge sp-badge-${size}`}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {t(TYPE_LABEL_KEYS[type] || 'speakingPanel.types.speech')}
    </span>
  );
}

function SoundWave({ color, paused }) {
  return (
    <div className={`sp-soundwave${paused ? ' sp-soundwave-paused' : ''}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`sp-wave-bar sp-wave-bar-${i}`} style={{ background: color }} />
      ))}
    </div>
  );
}

function CountdownBar({ timeLeft, duration, type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.SPEECH;
  const pct = duration > 0 ? Math.max(0, (timeLeft / duration) * 100) : 0;
  const isCritical = pct < 20;
  const isLow = pct < 40;

  return (
    <div className="sp-timer-wrap">
      <span className={`sp-timer-digits ${isCritical ? 'sp-critical' : isLow ? 'sp-low' : ''}`}>
        {formatTime(timeLeft)}
      </span>
      <div className="sp-timer-track">
        <div
          className="sp-timer-fill"
          style={{
            width: `${pct}%`,
            background: isCritical ? '#ef4444' : isLow ? '#f97316' : cfg.darkBg,
            transition: 'width 1s linear, background 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

function CurrentSpeakerCard({
  speaker,
  timeLeft,
  durations,
  canEnd,
  onEnd,
  canPause,
  isPaused,
  onPause,
  canReply,
  canCounter,
  onRequestReply,
  onRequestCounter,
  allEntries,
  isMeSpeaking,
}) {
  const { t } = useTranslation();

  const relatedEntry = useMemo(() => {
    if (!speaker?.replyToUsername || !allEntries) return null;
    return allEntries.find((e) => e.username === speaker.replyToUsername) || null;
  }, [speaker, allEntries]);

  if (!speaker) {
    return (
      <div className="sp-no-speaker">
        <FontAwesomeIcon icon={faMicrophone} className="sp-mic-idle" />
        <span>{t('speakingPanel.noActiveSpeaker')}</span>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[speaker.type] || TYPE_CONFIG.SPEECH;
  const duration = durations[speaker.type];

  return (
    <div className="sp-current-card" style={{ borderLeftColor: cfg.color, backgroundColor: cfg.bg }}>
      <div className="sp-current-row">
        <div className="sp-current-avatar-wrap">
          <UserAvatar
            username={speaker.username}
            name={speaker.fullName.split(' ')[0]}
            surname={speaker.fullName.split(' ').slice(1).join(' ')}
            className="sp-current-avatar"
          />
          <SoundWave color={cfg.color} paused={isPaused} />
        </div>
        <div className="sp-current-meta">
          <div className="sp-current-name">{speaker.fullName}</div>
          <div className="sp-current-type-row">
            <TypeBadge type={speaker.type} />
          </div>
          {(relatedEntry || speaker.replyToUsername) && (
            <span className="sp-current-related">
              {relatedEntry ? relatedEntry.fullName : (speaker.replyToFullName || speaker.replyToUsername)} <FontAwesomeIcon icon={faReply} />
            </span>
          )}
        </div>
      </div>
      <div className="sp-timer-row">
        <CountdownBar timeLeft={timeLeft} duration={duration} type={speaker.type} />
        {(canPause || canEnd) && (
          <div className="sp-current-ctrl-btns">
            {canPause && (
              <button
                className={`sp-pause-btn${isPaused ? ' sp-pause-btn-active' : ''}`}
                onClick={onPause}
                title={isPaused ? t('speakingPanel.actions.resumeSpeaking') : t('speakingPanel.actions.pauseSpeaking')}
              >
                <FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
              </button>
            )}
            {canEnd && (
              <button className="sp-end-btn" onClick={onEnd} title={t('speakingPanel.actions.endSpeaking')}>
                <FontAwesomeIcon icon={faStop} />
              </button>
            )}
          </div>
        )}
      </div>

      {isMeSpeaking ? (
        <div className="sp-speaker-actions">
          <span className="sp-you-are-speaking-label">
            <FontAwesomeIcon icon={faMicrophone} />
            {t('speakingPanel.status.youAreSpeaking')}
          </span>
        </div>
      ) : (canReply !== undefined || canCounter !== undefined) && (
        <div className="sp-speaker-actions">
          {canReply !== undefined && (
            <button
              className="sp-speaker-action-btn sp-sa-reply"
              onClick={onRequestReply}
              disabled={!canReply}
              title={canReply ? t('speakingPanel.tooltips.requestReply') : t('speakingPanel.tooltips.alreadyReplied')}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>{t('speakingPanel.types.reply')}</span>
              <span className="sp-sa-duration">{Math.floor(durations.REPLY / 60)}m</span>
            </button>
          )}
          {canCounter !== undefined && (
            <button
              className="sp-speaker-action-btn sp-sa-counter"
              onClick={onRequestCounter}
              disabled={!canCounter}
              title={canCounter ? t('speakingPanel.tooltips.requestCounter') : t('speakingPanel.tooltips.alreadyReplied')}
            >
              <FontAwesomeIcon icon={faBolt} />
              <span>{t('speakingPanel.types.counter')}</span>
              <span className="sp-sa-duration">{durations.COUNTER_REPLY}s</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QueueItem({
  entry,
  displayIndex,
  isPresidentOrAdmin,
  myUsername,
  onApprove,
  onReject,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  allEntries,
}) {
  const { t } = useTranslation();
  const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.SPEECH;
  const statusColor = STATUS_COLORS[entry.status] || '#9ca3af';
  const isOwner = entry.username === myUsername;

  const relatedEntry = useMemo(() => {
    if (!entry.replyToUsername || !allEntries) return null;
    return allEntries.find((e) => e.username === entry.replyToUsername) || null;
  }, [entry, allEntries]);

  return (
    <div
      className={`sp-queue-item sp-queue-${entry.status.toLowerCase()}`}
      style={{ borderLeftColor: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <div className="sp-queue-rank" style={{ color: cfg.color }}>
        {displayIndex + 1}
      </div>

      <UserAvatar
        username={entry.username}
        name={entry.fullName.split(' ')[0]}
        surname={entry.fullName.split(' ').slice(1).join(' ')}
        className="sp-queue-avatar"
      />

      <div className="sp-queue-info">
        <div className="sp-queue-name">{entry.fullName}</div>
        <TypeBadge type={entry.type} size="xs" />
        {(relatedEntry || entry.replyToUsername) && (
          <div className="sp-queue-related">
            {relatedEntry ? relatedEntry.fullName : (entry.replyToFullName || entry.replyToUsername)} <FontAwesomeIcon icon={faReply} />
          </div>
        )}
      </div>

      <div className="sp-queue-right">
        {!['PENDING', 'APPROVED'].includes(entry.status) && (
          <span
            className="sp-status-dot"
            style={{ background: statusColor }}
            title={entry.status}
          />
        )}

        {isOwner && !isPresidentOrAdmin && ['PENDING', 'APPROVED'].includes(entry.status) && (
          <div className="sp-queue-btns">
            <button
              className="sp-ib sp-ib-reject"
              onClick={() => onReject(entry.id)}
              title={t('speakingPanel.actions.cancel')}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        {isPresidentOrAdmin && (
          <div className="sp-queue-btns">
            {entry.status === 'PENDING' && (
              <>
                <button
                  className="sp-ib sp-ib-approve"
                  onClick={() => onApprove(entry.id)}
                  title={t('speakingPanel.actions.approve')}
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
                <button
                  className="sp-ib sp-ib-reject"
                  onClick={() => onReject(entry.id)}
                  title={t('speakingPanel.actions.reject')}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            )}
            {entry.status === 'APPROVED' && (
              <button
                className="sp-ib sp-ib-reject"
                onClick={() => onReject(entry.id)}
                title={t('speakingPanel.actions.cancel')}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
            {!isFirst && (
              <button
                className="sp-ib sp-ib-move"
                onClick={() => onMoveUp(entry.id)}
                title={t('speakingPanel.actions.moveUp')}
              >
                <FontAwesomeIcon icon={faAngleUp} />
              </button>
            )}
            {!isLast && (
              <button
                className="sp-ib sp-ib-move"
                onClick={() => onMoveDown(entry.id)}
                title={t('speakingPanel.actions.moveDown')}
              >
                <FontAwesomeIcon icon={faAngleDown} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpeakingPanel({
  presentedTopicId,
  userInfo,
  isPresidentOrAdmin,
  canParticipate,
  municipalityId,
  sessionId, // eslint-disable-line no-unused-vars
}) {
  const { t } = useTranslation();

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const { messages: speakingMessages, durationMessages, pauseMessages } = useSpeakingWebSocket(municipalityId);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);

  // ── Draggable popup ───────────────────────────────────────────────────────
  const HEADER_HEIGHT = 80;
  const [popupPos, setPopupPos] = useState({ x: 4, y: 200 });
  const popupElRef = useRef(null);
  const hasDraggedRef = useRef(false);

  const onPopupPointerDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX - popupPos.x;
    const startY = e.clientY - popupPos.y;
    hasDraggedRef.current = false;

    const onMove = (me) => {
      const el = popupElRef.current;
      const w = el ? el.offsetWidth : 80;
      const h = el ? el.offsetHeight : 110;
      const nx = Math.min(Math.max(me.clientX - startX, 0), window.innerWidth - w);
      const ny = Math.min(Math.max(me.clientY - startY, HEADER_HEIGHT), window.innerHeight - h);
      hasDraggedRef.current = true;
      setPopupPos({ x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [popupPos]);

  // ── Queue State ───────────────────────────────────────────────────────────
  const [queue, setQueue] = useState([]);

  // ── Timer State ───────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const timerRef = useRef(null);
  const lastSpeakerIdRef = useRef(null);
  const skipTimerRemoveRef = useRef(false);
  const currentSpeakerRef = useRef(null);

  // ── Load durations from backend ────────────────────────────────────────────
  useEffect(() => {
    api.get(`/api/speaking/municipality/${municipalityId}/durations`)
      .then(res => {
        const d = res.data;
        setDurations({
          SPEECH: d.speechSeconds,
          REPLY: d.replySeconds,
          COUNTER_REPLY: d.counterReplySeconds,
        });
      })
      .catch(() => {});
  }, [municipalityId]);

  // ── React to live duration broadcasts ─────────────────────────────────────
  useEffect(() => {
    if (!durationMessages.length) return;
    const d = durationMessages[durationMessages.length - 1];
    setDurations({
      SPEECH: d.speechSeconds,
      REPLY: d.replySeconds,
      COUNTER_REPLY: d.counterReplySeconds,
    });
  }, [durationMessages]);

  // ── Save durations to backend (debounced 600ms) ────────────────────────────
  const saveDurationsRef = useRef(null);
  const persistDurations = useCallback((next) => {
    clearTimeout(saveDurationsRef.current);
    saveDurationsRef.current = setTimeout(() => {
      api.put(`/api/speaking/municipality/${municipalityId}/durations`, {
        speechSeconds: next.SPEECH,
        replySeconds: next.REPLY,
        counterReplySeconds: next.COUNTER_REPLY,
      }).catch(() => {});
    }, 600);
  }, [municipalityId]);

  // ── Derived State ─────────────────────────────────────────────────────────
  const currentSpeaker = useMemo(
    () => queue.find((e) => e.status === 'SPEAKING') || null,
    [queue]
  );

  useEffect(() => { currentSpeakerRef.current = currentSpeaker; }, [currentSpeaker]);

  const visibleQueue = useMemo(
    () => queue.filter((e) => ['PENDING', 'APPROVED'].includes(e.status)),
    [queue]
  );


  const myUsername = userInfo?.username;
  const isCurrentlySpeaking = currentSpeaker?.username === myUsername;

  const myActiveEntries = useMemo(
    () =>
      queue.filter(
        (e) =>
          e.username === myUsername &&
          ['PENDING', 'APPROVED'].includes(e.status)
      ),
    [queue, myUsername]
  );


  const myActiveSpeechEntry = useMemo(
    () =>
      queue.find(
        (e) =>
          e.username === myUsername &&
          e.type === 'SPEECH' &&
          ['PENDING', 'APPROVED'].includes(e.status)
      ),
    [queue, myUsername]
  );

  const canRequestSpeech = useMemo(
    () =>
      canParticipate &&
      !!presentedTopicId &&
      !myActiveSpeechEntry &&
      !isCurrentlySpeaking,
    [canParticipate, presentedTopicId, myActiveSpeechEntry, isCurrentlySpeaking]
  );

  const canRequestReply = useMemo(() => {
    if (!canParticipate || !presentedTopicId || !currentSpeaker) return false;
    if (currentSpeaker.type !== 'SPEECH') return false;
    if (currentSpeaker.username === myUsername) return false;
    const alreadyReplying = queue.find(
      (e) =>
        e.username === myUsername &&
        e.type === 'REPLY' &&
        e.replyToUsername === currentSpeaker.username &&
        ['PENDING', 'APPROVED'].includes(e.status)
    );
    return !alreadyReplying;
  }, [canParticipate, presentedTopicId, currentSpeaker, myUsername, queue]);

  const canRequestCounterReply = useMemo(() => {
    if (!canParticipate || !presentedTopicId || !currentSpeaker) return false;
    if (!['REPLY', 'COUNTER_REPLY'].includes(currentSpeaker.type)) return false;
    if (currentSpeaker.username === myUsername) return false;
    const alreadyCountering = queue.find(
      (e) =>
        e.username === myUsername &&
        e.type === 'COUNTER_REPLY' &&
        e.replyToUsername === currentSpeaker.username &&
        ['PENDING', 'APPROVED'].includes(e.status)
    );
    return !alreadyCountering;
  }, [canParticipate, presentedTopicId, currentSpeaker, myUsername, queue]);

  // ── Timer Management ──────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimerAt = useCallback(
    (seconds) => {
      stopTimer();
      setIsPaused(false);
      isPausedRef.current = false;
      skipTimerRemoveRef.current = false;
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
    },
    [stopTimer]
  );

  const togglePause = useCallback(async () => {
    const next = !isPausedRef.current;
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/pause`, { paused: next });
    } catch (e) {
      console.error('Failed to toggle pause', e);
    }
  }, [municipalityId]);

  // React to pause broadcasts from any client
  useEffect(() => {
    if (!pauseMessages.length) return;
    const last = pauseMessages[pauseMessages.length - 1];
    const paused = !!last.paused;
    isPausedRef.current = paused;
    setIsPaused(paused);
  }, [pauseMessages]);

  const startTimerFor = useCallback(
    (speaker) => {
      const duration = durations[speaker.type] || durations.SPEECH;
      if (speaker.speakerStartTime) {
        const elapsed = Math.floor((Date.now() - speaker.speakerStartTime) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        startTimerAt(remaining);
      } else {
        startTimerAt(duration);
      }
    },
    [durations, startTimerAt]
  );

  // Start/reset timer when the current speaker changes
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
    startTimerFor(currentSpeaker);
  }, [currentSpeaker, startTimerFor, stopTimer]);

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Auto-end when timer hits 0 ─────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft === 0 && currentSpeakerRef.current) {
      if (skipTimerRemoveRef.current) {
        skipTimerRemoveRef.current = false;
        return;
      }
      skipTimerRemoveRef.current = true;
      const id = currentSpeakerRef.current.id;
      api
        .post(`/api/speaking/municipality/${municipalityId}/items/${id}/end`)
        .catch(() => { skipTimerRemoveRef.current = false; });
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset when presented topic CHANGES ────────────────────────────────────
  const prevTopicIdRef = useRef(undefined);
  useEffect(() => {
    const prev = prevTopicIdRef.current;
    prevTopicIdRef.current = presentedTopicId;

    if (prev === undefined) return;
    if (prev === null || prev === undefined) return;
    if (prev === presentedTopicId) return;

    stopTimer();
    setQueue([]);
    setTimeLeft(0);
    lastSpeakerIdRef.current = null;
    if (municipalityId) {
      api.delete(`/api/speaking/municipality/${municipalityId}/items`).catch(() => {});
    }
  }, [presentedTopicId, stopTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch from server on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!municipalityId) return;
    api
      .get(`/api/speaking/municipality/${municipalityId}/items`)
      .then((res) => {
        const items = res.data.map(mapDtoToEntry);
        setQueue(items);
        const speaker = items.find((e) => e.status === 'SPEAKING');
        if (speaker) {
          lastSpeakerIdRef.current = speaker.id;
          startTimerFor(speaker);
        }
      })
      .catch(() => {});
  }, [municipalityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Receive WS broadcasts from backend ───────────────────────────────────
  useEffect(() => {
    if (!speakingMessages.length) return;
    const last = speakingMessages[speakingMessages.length - 1];
    if (!Array.isArray(last)) return;

    const items = last.map(mapDtoToEntry);
    setQueue(items);

    const speaker = items.find((e) => e.status === 'SPEAKING');
    if (speaker && speaker.id !== lastSpeakerIdRef.current) {
      lastSpeakerIdRef.current = speaker.id;
      startTimerFor(speaker);
    } else if (!speaker) {
      stopTimer();
      setTimeLeft(0);
      setIsPaused(false);
      isPausedRef.current = false;
      lastSpeakerIdRef.current = null;
    }
  }, [speakingMessages, startTimerFor, stopTimer]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const requestSpeech = useCallback(async () => {
    if (!canRequestSpeech) return;
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/items`, {
        username: myUsername,
        fullName: getFullName(userInfo),
        type: 'SPEECH',
        replyToUsername: null,
      });
    } catch (e) {
      console.error('Failed to request speech', e);
    }
  }, [canRequestSpeech, myUsername, userInfo, municipalityId]);

  const requestReply = useCallback(async () => {
    if (!canRequestReply || !currentSpeaker) return;
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/items`, {
        username: myUsername,
        fullName: getFullName(userInfo),
        type: 'REPLY',
        replyToUsername: currentSpeaker.username,
        replyToFullName: currentSpeaker.fullName,
      });
    } catch (e) {
      console.error('Failed to request reply', e);
    }
  }, [canRequestReply, currentSpeaker, myUsername, userInfo, municipalityId]);

  const requestCounterReply = useCallback(async () => {
    if (!canRequestCounterReply || !currentSpeaker) return;
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/items`, {
        username: myUsername,
        fullName: getFullName(userInfo),
        type: 'COUNTER_REPLY',
        replyToUsername: currentSpeaker.username,
        replyToFullName: currentSpeaker.fullName,
      });
    } catch (e) {
      console.error('Failed to request counter reply', e);
    }
  }, [canRequestCounterReply, currentSpeaker, myUsername, userInfo, municipalityId]);

  const approveRequest = useCallback(async (entryId) => {
    const hasCurrent = currentSpeakerRef.current !== null;
    const body = hasCurrent
      ? { status: 'APPROVED' }
      : { status: 'SPEAKING', speakerStartTime: Date.now() };
    try {
      await api.patch(
        `/api/speaking/municipality/${municipalityId}/items/${entryId}/status`,
        body
      );
    } catch (e) {
      console.error('Failed to approve', e);
    }
  }, [municipalityId]);

  const rejectRequest = useCallback(async (entryId) => {
    try {
      await api.delete(`/api/speaking/municipality/${municipalityId}/items/${entryId}`);
    } catch (e) {
      console.error('Failed to reject/cancel', e);
    }
  }, [municipalityId]);

  const endCurrentSpeaker = useCallback(async () => {
    if (!currentSpeakerRef.current) return;
    stopTimer();
    skipTimerRemoveRef.current = true;
    setTimeLeft(0);
    setIsPaused(false);
    isPausedRef.current = false;
    const id = currentSpeakerRef.current.id;
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/items/${id}/end`);
    } catch (e) {
      console.error('Failed to end speaker', e);
      skipTimerRemoveRef.current = false;
    }
  }, [stopTimer, municipalityId]);

  const skipSpeaker = useCallback(async () => {
    stopTimer();
    skipTimerRemoveRef.current = true;
    setTimeLeft(0);
    lastSpeakerIdRef.current = null;
    try {
      await api.delete(`/api/speaking/municipality/${municipalityId}/items`);
    } catch (e) {
      console.error('Failed to clear queue', e);
      skipTimerRemoveRef.current = false;
    }
  }, [stopTimer, municipalityId]);

  const reorderQueue = useCallback(async (reordered) => {
    const ids = reordered.map((e) => e.id);
    try {
      await api.post(`/api/speaking/municipality/${municipalityId}/items/reorder`, ids);
    } catch (e) {
      console.error('Failed to reorder queue', e);
    }
  }, [municipalityId]);

  const moveEntryUp = useCallback((entryId) => {
    setQueue((prev) => {
      const visible = prev.filter((e) => ['PENDING', 'APPROVED'].includes(e.status));
      const rest = prev.filter((e) => !['PENDING', 'APPROVED'].includes(e.status));
      const idx = visible.findIndex((e) => e.id === entryId);
      if (idx <= 0) return prev;
      const reordered = [...visible];
      [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
      reorderQueue(reordered);
      return [...rest, ...reordered];
    });
  }, [reorderQueue]);

  const moveEntryDown = useCallback((entryId) => {
    setQueue((prev) => {
      const visible = prev.filter((e) => ['PENDING', 'APPROVED'].includes(e.status));
      const rest = prev.filter((e) => !['PENDING', 'APPROVED'].includes(e.status));
      const idx = visible.findIndex((e) => e.id === entryId);
      if (idx < 0 || idx >= visible.length - 1) return prev;
      const reordered = [...visible];
      [reordered[idx + 1], reordered[idx]] = [reordered[idx], reordered[idx + 1]];
      reorderQueue(reordered);
      return [...rest, ...reordered];
    });
  }, [reorderQueue]);

  // ── Render ────────────────────────────────────────────────────────────────

  const showPanel = isPresidentOrAdmin || canParticipate;
  if (!showPanel) return null;

  return (
    <>
    {isOpen && (
      <div className="sp-backdrop" onClick={() => setIsOpen(false)} />
    )}

    {/* Messenger-style popup: visible only when panel is closed and someone is speaking */}
    {!isOpen && currentSpeaker && (
      <div
        ref={popupElRef}
        className="sp-floating-popup"
        style={{ left: popupPos.x, top: popupPos.y }}
        onPointerDown={onPopupPointerDown}
        onClick={() => { if (!hasDraggedRef.current) setIsOpen(true); }}
        title={currentSpeaker.fullName}
        role="button"
        aria-label={currentSpeaker.fullName}
      >
        <div
          className="sp-floating-avatar-wrap"
          style={{
            borderColor: (TYPE_CONFIG[currentSpeaker.type] || TYPE_CONFIG.SPEECH).color,
            '--glow': (TYPE_CONFIG[currentSpeaker.type] || TYPE_CONFIG.SPEECH).color,
          }}
        >
          <UserAvatar
            username={currentSpeaker.username}
            name={currentSpeaker.fullName.split(' ')[0]}
            surname={currentSpeaker.fullName.split(' ').slice(1).join(' ')}
            className="sp-floating-avatar"
          />
        </div>
        <span
          className="sp-floating-time"
          style={{ color: (TYPE_CONFIG[currentSpeaker.type] || TYPE_CONFIG.SPEECH).color }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    )}

    <div className={`sp-wrapper ${isOpen ? 'sp-wrapper-open' : ''}`}>

      <div
        className="sp-trigger"
        onClick={() => setIsOpen((v) => !v)}
        title={t('speakingPanel.title')}
        role="button"
        aria-label={t('speakingPanel.ariaToggle')}
      >
        <FontAwesomeIcon
          icon={faMicrophone}
          className={`sp-trigger-arrow ${isOpen ? 'sp-arrow-open' : ''}`}
        />

        {!isOpen && queue.length > 0 && (
          <span className="sp-trigger-badge">{queue.length}</span>
        )}
      </div>

      <div
        className="sp-panel"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="sp-panel-header">
          <FontAwesomeIcon icon={faMicrophone} className="sp-header-icon" />
          <span>{t('speakingPanel.title')}</span>
          {!presentedTopicId && (
            <span className="sp-no-topic-hint">{t('speakingPanel.noActiveTopic')}</span>
          )}
        </div>

        <div className="sp-panel-body">
          {/* ── Current Speaker ──────────────────────────────── */}
          <section className="sp-section">
            <div className="sp-section-label">
              <span className="sp-section-dot sp-dot-live" />
              {t('speakingPanel.currentSpeaker')}
              {currentSpeaker && isPresidentOrAdmin && (
                <button
                  className="sp-skip-btn"
                  onClick={skipSpeaker}
                  title={t('speakingPanel.actions.skipSpeaker')}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              )}
            </div>

            <CurrentSpeakerCard
              speaker={currentSpeaker}
              timeLeft={timeLeft}
              durations={durations}
              canEnd={(isPresidentOrAdmin || isCurrentlySpeaking) && !!currentSpeaker}
              onEnd={endCurrentSpeaker}
              canPause={isPresidentOrAdmin && !!currentSpeaker}
              isPaused={isPaused}
              onPause={togglePause}
              canReply={canParticipate && !isCurrentlySpeaking && currentSpeaker?.type === 'SPEECH' ? canRequestReply : undefined}
              canCounter={canParticipate && !isCurrentlySpeaking && ['REPLY', 'COUNTER_REPLY'].includes(currentSpeaker?.type) ? canRequestCounterReply : undefined}
              onRequestReply={requestReply}
              onRequestCounter={requestCounterReply}
              allEntries={queue}
              isMeSpeaking={isCurrentlySpeaking}
            />
          </section>

          {/* ── Quick Speech Request ─────────────────────────── */}
          {canParticipate && presentedTopicId && (
            <div className="sp-quick-speech-wrap">
              <button
                className="sp-quick-speech-btn"
                onClick={requestSpeech}
                disabled={!canRequestSpeech}
                title={
                  !canRequestSpeech
                    ? myActiveSpeechEntry
                      ? t('speakingPanel.tooltips.alreadyRequested')
                      : isCurrentlySpeaking
                      ? t('speakingPanel.tooltips.currentlySpeaking')
                      : t('speakingPanel.tooltips.cannotRequest')
                    : t('speakingPanel.tooltips.requestSpeech')
                }
              >
                <FontAwesomeIcon icon={faHandPaper} />
                <span>{t('speakingPanel.types.speech')}</span>
                <span className="sp-quick-speech-duration">{Math.floor(durations.SPEECH / 60)}m</span>
              </button>
            </div>
          )}

          {/* ── Queue ────────────────────────────────────────── */}
          <section className="sp-section">
            <div className="sp-section-label">
              {t('speakingPanel.queue')}
              {visibleQueue.length > 0 && (
                <span className="sp-queue-pill">{visibleQueue.length}</span>
              )}
            </div>

            {visibleQueue.length === 0 ? (
              <div className="sp-empty">{t('speakingPanel.noRequests')}</div>
            ) : (
              <div className="sp-queue-list">
                {visibleQueue.map((entry, idx) => (
                  <QueueItem
                    key={entry.id}
                    entry={entry}
                    displayIndex={idx}
                    isPresidentOrAdmin={isPresidentOrAdmin}
                    myUsername={myUsername}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    onMoveUp={moveEntryUp}
                    onMoveDown={moveEntryDown}
                    isFirst={idx === 0}
                    isLast={idx === visibleQueue.length - 1}
                    allEntries={queue}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── User Request Status ───────────────────────────── */}
          {canParticipate && myActiveEntries.length > 0 && (
            <section className="sp-section">
              {myActiveEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="sp-my-status"
                  style={{
                    borderColor: TYPE_CONFIG[entry.type]?.border,
                    color: TYPE_CONFIG[entry.type]?.color,
                    background: TYPE_CONFIG[entry.type]?.bg,
                  }}
                >
                  {t('speakingPanel.status.yourRequest')}{' '}
                  <strong>{t(TYPE_LABEL_KEYS[entry.type] || 'speakingPanel.types.speech')}</strong>{' '}
                  — {entry.status === 'APPROVED'
                    ? t('speakingPanel.status.approvedStandby')
                    : t('speakingPanel.status.pendingApproval')}
                </div>
              ))}
            </section>
          )}

          {/* ── Duration Settings (president only) ──────────── */}
          {isPresidentOrAdmin && (
            <section className="sp-section">
              <div
                className="sp-section-label sp-settings-toggle"
                onClick={() => setSettingsOpen((v) => !v)}
                role="button"
              >
                <FontAwesomeIcon icon={faGear} />
                {t('speakingPanel.settings.title')}
                <span className="sp-settings-arrow">{settingsOpen ? '▲' : '▼'}</span>
              </div>

              {settingsOpen && (
                <div className="sp-settings-grid">
                  {[
                    { key: 'SPEECH',        unit: 'min', labelKey: 'speakingPanel.settings.speech',       min: 1,  max: 60,  step: 1,   toDisplay: (v) => Math.round(v / 60),  toSeconds: (v) => v * 60 },
                    { key: 'REPLY',         unit: 'min', labelKey: 'speakingPanel.settings.reply',        min: 1,  max: 30,  step: 1,   toDisplay: (v) => Math.round(v / 60),  toSeconds: (v) => v * 60 },
                    { key: 'COUNTER_REPLY', unit: 'sec', labelKey: 'speakingPanel.settings.counterReply', min: 15, max: 300, step: 15,  toDisplay: (v) => v,                   toSeconds: (v) => v },
                  ].map(({ key, unit, labelKey, min, max, step, toDisplay, toSeconds }) => {
                    const cfg = TYPE_CONFIG[key];
                    return (
                      <div key={key} className="sp-settings-row">
                        <span
                          className="sp-settings-label"
                          style={{ color: cfg.color }}
                        >
                          {t(labelKey)}
                        </span>
                        <div className="sp-settings-input-wrap">
                          <input
                            type="number"
                            className="sp-settings-input"
                            min={min}
                            max={max}
                            step={step}
                            value={toDisplay(durations[key])}
                            onChange={(e) => {
                              const val = Math.min(max, Math.max(min, Number(e.target.value)));
                              const next = { ...durations, [key]: toSeconds(val) };
                              setDurations(next);
                              persistDurations(next);
                            }}
                          />
                          <span className="sp-settings-unit">
                            {unit === 'min' ? t('speakingPanel.settings.minutes') : t('speakingPanel.settings.seconds')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Legend ───────────────────────────────────────── */}
          <section className="sp-section sp-legend-section">
            <div className="sp-legend">
              {Object.keys(TYPE_CONFIG).map((key) => {
                const cfg = TYPE_CONFIG[key];
                return (
                  <div key={key} className="sp-legend-item">
                    <span
                      className="sp-legend-dot"
                      style={{ background: cfg.color }}
                    />
                    <span style={{ color: cfg.color }}>
                      {t(TYPE_LABEL_KEYS[key] || 'speakingPanel.types.speech')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
