import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SnakeGame from './SnakeGame.jsx';
import BookmarksPanel from './BookmarksPanel.jsx';
import ExportDialog from './ExportDialog.jsx';
import WatchTogetherPanel from './WatchTogetherPanel.jsx';
import RatingDialog from './RatingDialog.jsx';
import SubtitlePanel from './SubtitlePanel.jsx';
import AudioPanel from './AudioPanel.jsx';
import FamilyPanel from './FamilyPanel.jsx';
import SummaryDialog from './SummaryDialog.jsx';
import { classifyFrames } from '../lib/familyScan.js';
import { createWatchSession } from '../lib/watchTogether.js';
import { cloud } from '../lib/cloud.js';
import { parseSubtitles, toVttUrl } from '../lib/subtitles.js';
import { createAudioGraph } from '../lib/audioTools.js';
import { fmtTime, pctOf } from '../lib/format.js';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export default function Player({
  file,
  state,
  refresh,
  auth,
  server,
  onClose,
  onCommands,
  onEnded,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) {
  const videoRef = useRef(null);
  const sampleRef = useRef(null);
  const hideTimer = useRef(null);
  const lastSaved = useRef(0);

  const [src, setSrc] = useState(null);
  const [meta, setMeta] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSnake, setShowSnake] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [clipStart, setClipStart] = useState(null);
  const [clipEnd, setClipEnd] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [toast, setToast] = useState(null);
  const [brightness, setBrightness] = useState(1);
  const [playError, setPlayError] = useState(null);
  const [compat, setCompat] = useState(null); // {progress} while converting
  const [bookmarks, setBookmarks] = useState(state.bookmarks?.[file.path] || []);
  const [showRating, setShowRating] = useState(false);
  const [subs, setSubs] = useState([]); // parsed subtitle entries
  const [subsUrl, setSubsUrl] = useState(null);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [showSubs, setShowSubs] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [audioFlags, setAudioFlags] = useState({ noiseReduction: false, karaoke: false });
  const audioGraph = useRef(null);
  const [showBreak, setShowBreak] = useState(false);
  const watchSecs = useRef(0);
  const [showFamily, setShowFamily] = useState(false);
  const [scanning, setScanning] = useState(null); // {phase, pct}
  const [showSummary, setShowSummary] = useState(false);
  const lastSkipAt = useRef(0);
  const [intro, setIntro] = useState(null); // {start, end} detected from sibling episode
  const introSkipped = useRef(false);
  const [wt, setWt] = useState(null); // watch-together room: {code, isHost, participants, chat}
  const [showWt, setShowWt] = useState(false);
  const wtSession = useRef(null);
  const applyingRemote = useRef(0);

  const settings = state.settings || {};
  const isAudio = file.type === 'audio';
  // Network streams and capture devices have no file on disk, so anything that
  // needs ffmpeg, resume positions or sidecar subtitles is skipped for them.
  const isLocal = !!file.path && file.kind !== 'network' && file.kind !== 'capture';

  const showToast = useCallback((msg, ms = 2600) => {
    setToast(msg);
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(null), ms);
  }, []);

  // --- load media + metadata -------------------------------------------------
  useEffect(() => {
    let alive = true;
    let stream = null;
    setPlayError(null);
    setMeta(null);
    setSubs([]);
    setSubsUrl(null);
    setIntro(null);
    introSkipped.current = false;

    (async () => {
      // Capture device: live MediaStream, no src URL involved.
      if (file.kind === 'capture') {
        setSrc(null);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: file.capture?.videoId ? { deviceId: { exact: file.capture.videoId } } : false,
            audio: file.capture?.audioId ? { deviceId: { exact: file.capture.audioId } } : false,
          });
          if (!alive) return;
          const v = videoRef.current;
          if (v) {
            v.srcObject = stream;
            v.play().catch(() => {});
          }
        } catch (e) {
          if (alive) setPlayError(`Capture device unavailable: ${e.message || e}`);
        }
        return;
      }

      if (file.kind === 'network') {
        setSrc(file.url);
        return;
      }

      const url = await window.api.mediaUrl(file.path);
      if (!alive) return;
      setSrc(url);
      const info = await window.api.probe(file.path);
      if (alive && !info.error) setMeta(info);
      if (!isAudio) {
        // Fingerprints shared audio against a sibling episode (background job).
        window.api.detectIntro(file.path).then((r) => {
          if (alive && r && r.end - r.start >= 8) setIntro(r);
        });
      }
      const sub = await window.api.findSubs(file.path);
      if (alive && sub) {
        const entries = parseSubtitles(sub.text);
        if (entries.length) {
          setSubs(entries);
          setSubsUrl(toVttUrl(entries));
          setSubtitlesOn(true);
          showToast(`💬 Subtitles loaded (${entries.length} lines)`);
        }
      }
    })();

    return () => {
      alive = false;
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v && v.srcObject) v.srcObject = null;
    };
  }, [file.path, file.url, file.kind]);

  // --- subtitles ------------------------------------------------------------
  const toggleSubtitles = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const on = !subtitlesOn;
    for (const track of v.textTracks) track.mode = on ? 'showing' : 'disabled';
    setSubtitlesOn(on);
    showToast(on ? '💬 Subtitles on' : '💬 Subtitles off');
  }, [subtitlesOn, showToast]);

  const addSubtitleFile = useCallback(async () => {
    const sub = await window.api.openSubtitle();
    if (!sub) return;
    if (sub.error) {
      showToast(`Could not read that file: ${sub.error}`);
      return;
    }
    const entries = parseSubtitles(sub.text);
    if (!entries.length) {
      showToast('No subtitle lines found in that file');
      return;
    }
    setSubs(entries);
    setSubsUrl(toVttUrl(entries));
    setSubtitlesOn(true);
    showToast(`💬 Subtitles loaded (${entries.length} lines)`);
  }, [showToast]);

  // --- audio tools (noise reduction / karaoke) ------------------------------
  const applyAudioFlags = (flags) => {
    setAudioFlags(flags);
    try {
      if (!audioGraph.current) {
        if (!flags.noiseReduction && !flags.karaoke) return;
        audioGraph.current = createAudioGraph(videoRef.current);
      }
      audioGraph.current.apply(flags);
    } catch {
      showToast('Audio tools are not available for this file');
    }
  };

  useEffect(() => () => audioGraph.current?.ctx.close().catch(() => {}), []);

  // --- family filter scan ---------------------------------------------------
  const runScan = async () => {
    if (scanning) return;
    const dur = videoRef.current?.duration || meta?.duration || 0;
    if (!dur) {
      showToast('Wait for the video to load first');
      return;
    }
    setScanning({ phase: 'extract', pct: 0 });
    const off = window.api.onScanProgress((p) => setScanning({ phase: p.phase, pct: p.pct }));
    try {
      const res = await window.api.scanExtractFrames({ path: file.path, duration: dur, interval: 2 });
      if (!res.ok) throw new Error(res.error);
      setScanning({ phase: 'analyze', pct: 0 });
      const ranges = await classifyFrames(res.urls, res.interval, (pct) => setScanning({ phase: 'analyze', pct }));
      await window.api.scanSaveRanges({ path: file.path, ranges, interval: res.interval });
      await refresh();
      showToast(ranges.length ? `🛡 Scan done — ${ranges.length} scene(s) flagged` : '🛡 Scan done — nothing flagged');
    } catch (e) {
      showToast(`Scan failed: ${e.message}`, 4000);
    } finally {
      off();
      window.api.scanCleanup();
      setScanning(null);
    }
  };

  // --- health break reminder ------------------------------------------------
  useEffect(() => {
    const minutes = settings.breakMinutes ?? 60;
    if (!minutes) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      watchSecs.current += 1;
      if (watchSecs.current >= minutes * 60) {
        watchSecs.current = 0;
        v.pause();
        setShowBreak(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.breakMinutes]);

  // --- resume ---------------------------------------------------------------
  const onLoadedMetadata = async () => {
    const v = videoRef.current;
    setDuration(v.duration);
    if (!isLocal) {
      v.play().catch(() => {});
      return; // streams and capture devices have nothing to resume
    }
    const saved = state.positions?.[file.path];
    if (saved && saved.pos > 15 && saved.pos < v.duration * 0.97) {
      v.currentTime = saved.pos;
      showToast(`▶ Resumed from ${fmtTime(saved.pos)} — press R to restart`, 4000);
    } else {
      // No local progress — check cloud data pulled from Magizhchi ID sync
      // (same file watched on another device, matched by name + duration).
      try {
        const cl = await window.api.cloudLookup({ name: file.name, duration: v.duration });
        if (cl.position && cl.position.position > 15 && cl.position.position < v.duration * 0.97) {
          v.currentTime = cl.position.position;
          showToast(`☁ Resumed from ${fmtTime(cl.position.position)} (synced) — press R to restart`, 4000);
        }
        if (cl.bookmarks?.length) {
          const have = new Set(bookmarks.map((b) => b.id));
          for (const rb of cl.bookmarks) {
            if (!have.has(rb.id)) {
              await window.api.addBookmark({ path: file.path, bookmark: rb });
              setBookmarks((prev) => [...prev, rb].sort((a, b) => a.t - b.t));
            }
          }
        }
      } catch {
        /* cloud lookup is best-effort */
      }
    }
    v.play().catch(() => {});
  };

  const saveProgress = useCallback(
    (pos, dur) => {
      if (!isLocal || !Number.isFinite(dur)) return;
      window.api.saveProgress({ path: file.path, name: file.name, pos, dur });
    },
    [file.path, file.name, isLocal]
  );

  const scanInfo = state.scans?.[file.path] || null;

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setTime(v.currentTime);
    if (Math.abs(v.currentTime - lastSaved.current) > 5) {
      lastSaved.current = v.currentTime;
      saveProgress(v.currentTime, v.duration || 0);
    }
    // Auto skip-intro (optional setting; otherwise the button shows instead).
    if (
      settings.autoSkipIntro && intro && !introSkipped.current &&
      v.currentTime >= intro.start + 0.5 && v.currentTime < intro.end - 2
    ) {
      introSkipped.current = true;
      v.currentTime = intro.end;
      showToast('⏭ Intro skipped');
    }
    // Family filter: jump over scanned sensitive ranges.
    if (settings.familyMode && scanInfo?.ranges?.length && Date.now() - lastSkipAt.current > 1500) {
      const hit = scanInfo.ranges.find(([s, e]) => v.currentTime >= s && v.currentTime < e - 0.05);
      if (hit) {
        lastSkipAt.current = Date.now();
        v.currentTime = hit[1] + 0.1;
        showToast('🛡 Sensitive scene skipped');
      }
    }
  };

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v && v.duration) saveProgress(v.currentTime, v.duration);
    };
  }, [saveProgress]);

  // --- basic controls -------------------------------------------------------
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const seekBy = useCallback((delta) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || Infinity);
  }, []);

  const seekTo = (t) => {
    const v = videoRef.current;
    if (v) v.currentTime = t;
  };

  const changeVolume = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.min(1, Math.max(0, v.volume + delta));
    setVolume(v.volume);
    if (v.volume > 0) {
      v.muted = false;
      setMuted(false);
    }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setSpeed(rate);
  }, []);

  const stepSpeed = useCallback(
    (dir) => {
      const i = SPEEDS.indexOf(speed);
      const next = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, (i === -1 ? 3 : i) + dir))];
      setPlaybackRate(next);
    },
    [speed, setPlaybackRate]
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.getElementById('player-root')?.requestFullscreen();
  }, []);

  // --- chapters (skip intro / skip songs) -----------------------------------
  const chapters = meta?.chapters || [];
  const jumpChapter = useCallback(
    (dir) => {
      const v = videoRef.current;
      if (!v || chapters.length === 0) {
        seekBy(dir * 90); // no chapter data: quick ±90s "skip intro/song" jump
        showToast(dir > 0 ? '⏭ +90s' : '⏮ −90s');
        return;
      }
      const t = v.currentTime;
      if (dir > 0) {
        const next = chapters.find((c) => c.start > t + 1);
        if (next) {
          seekTo(next.start);
          showToast(`⏭ ${next.title}`);
        }
      } else {
        const prev = [...chapters].reverse().find((c) => c.start < t - 2);
        seekTo(prev ? prev.start : 0);
        if (prev) showToast(`⏮ ${prev.title}`);
      }
    },
    [chapters, seekBy, showToast]
  );

  // --- bookmarks ------------------------------------------------------------
  const addBookmark = useCallback(
    async (label) => {
      const v = videoRef.current;
      if (!v) return;
      const bm = { id: `${Date.now()}`, t: v.currentTime, label: label || `Bookmark at ${fmtTime(v.currentTime)}` };
      await window.api.addBookmark({ path: file.path, bookmark: bm });
      setBookmarks((prev) => [...prev, bm].sort((a, b) => a.t - b.t));
      showToast(`🔖 ${bm.label}`);
    },
    [file.path, showToast]
  );

  const removeBookmark = async (id) => {
    await window.api.removeBookmark({ path: file.path, id });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // --- screenshot -----------------------------------------------------------
  const screenshot = useCallback(async () => {
    const v = videoRef.current;
    if (!v || isAudio) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await window.api.saveScreenshot({
        dataUrl,
        suggestedName: `${file.name.replace(/\.[^.]+$/, '')}-${fmtTime(v.currentTime).replace(/:/g, '.')}.png`,
      });
      if (res.ok) showToast('📸 Screenshot saved');
    } catch {
      showToast('Screenshot not available for this file');
    }
  }, [file.name, isAudio, showToast]);

  // --- clip selection -------------------------------------------------------
  const markClip = useCallback(
    (which) => {
      const v = videoRef.current;
      if (!v) return;
      if (which === 'start') {
        setClipStart(v.currentTime);
        showToast(`Clip start ${fmtTime(v.currentTime)} — press O to mark the end`);
      } else {
        if (clipStart == null || v.currentTime <= clipStart) {
          showToast('Set the clip start first (press I)');
          return;
        }
        setClipEnd(v.currentTime);
        setShowExport(true);
      }
    },
    [clipStart, showToast]
  );

  // --- watch together -------------------------------------------------------
  // Local play/pause/seek events triggered while applying a remote action must
  // not echo back to the room; a short timestamp window filters them out.
  const remoteApply = (fn) => {
    applyingRemote.current = Date.now();
    const v = videoRef.current;
    if (v) fn(v);
  };
  const isRemoteEcho = () => Date.now() - applyingRemote.current < 800;

  const handleWtEventRef = useRef(null);
  handleWtEventRef.current = (ev) => {
    const v = videoRef.current;
    switch (ev.type) {
      case 'created':
        setWt({ code: ev.code, isHost: true, participants: [], chat: [] });
        showToast(`Room ${ev.code} created — share the code`);
        break;
      case 'joined':
        setWt({ code: ev.code, isHost: false, participants: [], chat: [] });
        remoteApply((vid) => {
          vid.currentTime = ev.playback.position || 0;
          if (ev.playback.playing) vid.play().catch(() => {});
          else vid.pause();
        });
        showToast(`Joined room ${ev.code}`);
        break;
      case 'participants':
        setWt((w) => (w ? { ...w, participants: ev.list } : w));
        break;
      case 'action':
        remoteApply((vid) => {
          vid.currentTime = ev.position;
          if (ev.action === 'play') vid.play().catch(() => {});
          if (ev.action === 'pause') vid.pause();
        });
        showToast(
          ev.action === 'seek' ? `${ev.from} jumped to ${fmtTime(ev.position)}` : `${ev.from} ${ev.action === 'play' ? 'resumed' : 'paused'}`
        );
        break;
      case 'sync':
        if (v && Math.abs(v.currentTime - ev.position) > 2.5) {
          remoteApply((vid) => (vid.currentTime = ev.position));
        }
        if (v && ev.playing !== !v.paused) {
          remoteApply((vid) => (ev.playing ? vid.play().catch(() => {}) : vid.pause()));
        }
        break;
      case 'chat':
        setWt((w) => (w ? { ...w, chat: [...(w.chat || []), { from: ev.from, text: ev.text }] } : w));
        break;
      case 'info':
        showToast(ev.message);
        break;
      case 'promoted':
        setWt((w) => (w ? { ...w, isHost: true } : w));
        showToast('⭐ You are now the room host');
        break;
      case 'error':
        showToast(`⚠ ${ev.message}`, 4000);
        break;
      case 'disconnected':
        setWt(null);
        wtSession.current = null;
        showToast('Watch together disconnected', 4000);
        break;
      default:
        break;
    }
  };

  const wtStart = async (mode, { name, code, server }) => {
    window.api.saveSettings({ wtName: name, wtServer: server });
    const session = createWatchSession({ serverUrl: server, onEvent: (ev) => handleWtEventRef.current(ev) });
    await session.connect();
    wtSession.current = session;
    const info = { name: file.name, duration: videoRef.current?.duration || 0 };
    if (mode === 'create') session.createRoom(name, info, auth?.token);
    else session.joinRoom(code, name, info, auth?.token);
  };

  const saveRating = async ({ stars, review }) => {
    const fileKey = await window.api.fileKey({ name: file.name, duration: videoRef.current?.duration || duration });
    await cloud.rate(server, auth.token, { fileKey, fileName: file.name, stars, review });
    showToast(`⭐ Rated ${stars}/5 — your friends can see it`);
  };

  const wtLeave = useCallback(() => {
    wtSession.current?.close();
    wtSession.current = null;
    setWt(null);
  }, []);

  useEffect(() => () => wtSession.current?.close(), []);

  // Host heartbeat: keeps guests converged even without explicit actions.
  useEffect(() => {
    if (!wt?.isHost) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (v && v.duration) wtSession.current?.sendSync(!v.paused, v.currentTime);
    }, 10000);
    return () => clearInterval(interval);
  }, [wt?.isHost, wt?.code]);

  const wtBroadcast = (action) => {
    const v = videoRef.current;
    if (wtSession.current && wt?.code && v && !isRemoteEcho()) {
      wtSession.current.sendAction(action, v.currentTime);
    }
  };

  // --- auto brightness ------------------------------------------------------
  useEffect(() => {
    if (!settings.autoBrightness || isAudio) {
      setBrightness(1);
      return;
    }
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.videoWidth === 0) return;
      let canvas = sampleRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 18;
        sampleRef.current = canvas;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      try {
        ctx.drawImage(v, 0, 0, 32, 18);
        const data = ctx.getImageData(0, 0, 32, 18).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const avg = sum / (data.length / 4);
        setBrightness(avg < 60 ? Math.min(1.45, 1 + ((60 - avg) / 60) * 0.5) : 1);
      } catch {
        clearInterval(interval); // tainted canvas — disable sampling for this file
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [settings.autoBrightness, isAudio, src]);

  // --- keyboard shortcuts ---------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (showSnake || showExport) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return; // Ctrl+… belongs to the menu bar
      const k = e.key.toLowerCase();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') seekBy(e.shiftKey ? 30 : 10);
      else if (e.key === 'ArrowLeft') seekBy(e.shiftKey ? -30 : -10);
      else if (e.key === 'ArrowUp') { e.preventDefault(); changeVolume(0.05); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); changeVolume(-0.05); }
      else if (k === 'f') toggleFullscreen();
      else if (k === 'm') { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }
      else if (k === ']') stepSpeed(1);
      else if (k === '[') stepSpeed(-1);
      else if (k === 'b') addBookmark();
      else if (k === 'n') jumpChapter(1);
      else if (k === 'p') jumpChapter(-1);
      else if (k === 'i') markClip('start');
      else if (k === 'o') markClip('end');
      else if (k === 's') screenshot();
      else if (k === 'r') seekTo(0);
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seekBy, changeVolume, toggleFullscreen, stepSpeed, addBookmark, jumpChapter, markClip, screenshot, onClose, showSnake, showExport]);

  // --- controls auto-hide ---------------------------------------------------
  const poke = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3200);
  }, []);

  useEffect(() => {
    poke();
    return () => clearTimeout(hideTimer.current);
  }, [poke]);

  // --- unsupported format fallback ------------------------------------------
  const convert = async (mode) => {
    setPlayError(null);
    setCompat({ progress: 0 });
    const off = window.api.onCompatProgress((pct) => setCompat({ progress: pct }));
    const res = await window.api.makeCompatible({ input: file.path, mode, duration: meta?.duration || 0 });
    off();
    setCompat(null);
    if (res.ok) {
      setSrc(res.url);
      showToast('Converted — playing compatible copy');
    } else {
      setPlayError(`Conversion failed: ${res.error}`);
    }
  };

  // Silent video-decode failure: Chromium has no software HEVC/AV1 decoder,
  // so on machines without hardware decode it plays the audio track over a
  // black 0×0 video and never fires onError. If ffprobe says the file HAS a
  // video stream but the element renders nothing, fall back automatically.
  const autoCompatTried = useRef(false);
  useEffect(() => { autoCompatTried.current = false; }, [file]);
  useEffect(() => {
    if (!src || isAudio || !file?.path || !meta?.videoCodec) return;
    const t = setTimeout(() => {
      const v = videoRef.current;
      if (!v || autoCompatTried.current) return;
      if (v.readyState >= 1 && v.videoWidth === 0) {
        autoCompatTried.current = true;
        showToast(`This device can't decode ${String(meta.videoCodec).toUpperCase()} video — preparing a compatible copy`);
        convert('transcode');
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, meta, isAudio]);

  const clipRange = clipStart != null && clipEnd != null ? { start: clipStart, end: clipEnd } : null;

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const openSummary = useCallback(() => {
    if (!auth) showToast('Sign in with Magizhchi ID for AI recaps');
    else if (subs.length === 0) showToast('AI recap needs subtitles (.srt next to the video)');
    else setShowSummary(true);
  }, [auth, subs.length, showToast]);

  // --- menu bar command surface ---------------------------------------------
  // Rebuilt after every render (no dependency array) so the menu always sees
  // current playback state; App only stores it in a ref, so this can't loop.
  useEffect(() => {
    onCommands?.({
      isAudio,
      isLocal,
      playing,
      muted,
      speed,
      hasSubs: subs.length > 0,
      subtitlesOn,
      hasChapters: chapters.length > 0,
      audioFlags,
      familyMode: !!settings.familyMode,
      autoBrightness: settings.autoBrightness !== false,
      canSkipIntro: !!intro && time >= intro.start && time < intro.end - 2,
      hasNext,
      hasPrev,
      togglePlay,
      stop: onClose,
      next: onNext,
      previous: onPrev,
      seekBy,
      restart: () => seekTo(0),
      jumpChapter,
      stepSpeed,
      setSpeed: setPlaybackRate,
      speeds: SPEEDS,
      toggleFullscreen,
      screenshot,
      toggleMute,
      changeVolume,
      addBookmark: () => addBookmark(),
      showBookmarks: () => setShowBookmarks((s) => !s),
      markClip,
      toggleSubtitles,
      addSubtitleFile,
      searchDialogue: () => setShowSubs((s) => !s),
      audioTools: () => setShowAudio((s) => !s),
      setAudioFlag: (key, on) => applyAudioFlags({ ...audioFlags, [key]: on }),
      familyPanel: () => setShowFamily((s) => !s),
      summary: openSummary,
      rating: () => (auth ? setShowRating(true) : showToast('Sign in with Magizhchi ID to rate movies')),
      watchTogether: () => setShowWt((s) => !s),
      snake: () => {
        videoRef.current?.pause();
        setShowSnake(true);
      },
      skipIntro: () => intro && seekTo(intro.end),
    });
  });

  useEffect(() => () => onCommands?.(null), []);

  const seekbarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - rect.left) / rect.width) * duration);
  };

  const chapterMarks = useMemo(
    () => chapters.filter((c) => c.start > 1).map((c) => ({ left: pctOf(c.start, duration), title: c.title })),
    [chapters, duration]
  );

  return (
    <div
      id="player-root"
      className={`player ${controlsVisible ? '' : 'hide-cursor'} ${isAudio ? 'audio-mode' : ''}`}
      onMouseMove={poke}
      onWheel={(e) => {
        changeVolume(e.deltaY < 0 ? 0.05 : -0.05);
        poke();
      }}
    >
      <video
        ref={videoRef}
        src={src || undefined}
        crossOrigin="anonymous"
        style={{ filter: brightness !== 1 ? `brightness(${brightness.toFixed(2)})` : undefined }}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          setPlaying(true);
          wtBroadcast('play');
        }}
        onPause={() => {
          setPlaying(false);
          wtBroadcast('pause');
        }}
        onSeeked={() => wtBroadcast('seek')}
        onError={() => {
          if (src) setPlayError('This format can’t be played directly.');
        }}
        onEnded={() => {
          saveProgress(duration, duration);
          onEnded?.();
        }}
      >
        {subsUrl && <track kind="subtitles" label="Subtitles" src={subsUrl} default />}
      </video>

      {isAudio && (
        <div className="audio-art">
          <div className="audio-disc">♪</div>
          <h2>{meta?.title || file.name}</h2>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {intro && !settings.autoSkipIntro && time >= intro.start && time < intro.end - 2 && (
        <button
          className="btn skip-intro"
          onClick={() => {
            seekTo(intro.end);
            showToast('⏭ Intro skipped');
          }}
        >
          ⏭ Skip intro
        </button>
      )}

      {playError && !compat && (
        <div className="overlay">
          <div className="panel">
            <h3>{isLocal ? 'Can’t play this format directly' : 'This source can’t be played'}</h3>
            <p>{file.name}{meta?.videoCodec ? ` (video: ${meta.videoCodec}, audio: ${meta.audioCodec})` : ''}</p>
            {!isLocal && <p className="dialog-sub">{file.url || playError}</p>}
            <div className="export-options">
              {isLocal && (
                <>
                  <button className="btn" onClick={() => convert('remux')}>
                    Quick convert
                    <small>Keeps video as-is, fixes audio — fast</small>
                  </button>
                  <button className="btn" onClick={() => convert('transcode')}>
                    Full convert
                    <small>Re-encodes everything — slower, most compatible</small>
                  </button>
                </>
              )}
              <button className="btn ghost" onClick={onClose}>Back to library</button>
            </div>
          </div>
        </div>
      )}

      {compat && (
        <div className="overlay">
          <div className="panel">
            <h3>Preparing a compatible copy…</h3>
            <div className="progress big"><div style={{ width: `${compat.progress}%` }} /></div>
            <p>{compat.progress}% — the original file is untouched</p>
          </div>
        </div>
      )}

      <div className={`controls ${controlsVisible ? 'visible' : ''}`}>
        <div className="seek-row">
          <div className="seekbar" onClick={seekbarClick}>
            <div className="seek-fill" style={{ width: `${pctOf(time, duration)}%` }} />
            {chapterMarks.map((c, i) => (
              <div key={i} className="chapter-mark" style={{ left: `${c.left}%` }} title={c.title} />
            ))}
            {bookmarks.map((b) => (
              <div key={b.id} className="bm-mark" style={{ left: `${pctOf(b.t, duration)}%` }} title={b.label} />
            ))}
            {clipStart != null && (
              <div
                className="clip-mark"
                style={{
                  left: `${pctOf(clipStart, duration)}%`,
                  width: `${pctOf((clipEnd ?? time) - clipStart, duration)}%`,
                }}
              />
            )}
          </div>
        </div>
        <div className="btn-row">
          <button className="btn icon" title="Back to library (Esc)" onClick={onClose}>⌂</button>
          {hasPrev && <button className="btn icon" title="Previous in playlist" onClick={onPrev}>⏪</button>}
          <button className="btn icon" title="Previous chapter (P)" onClick={() => jumpChapter(-1)}>⏮</button>
          <button className="btn icon big" title="Play / pause (Space)" onClick={togglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="btn icon" title={chapters.length ? 'Next chapter — skip intro/song (N)' : 'Skip 90s (N)'} onClick={() => jumpChapter(1)}>⏭</button>
          {hasNext && <button className="btn icon" title="Next in playlist" onClick={onNext}>⏩</button>}
          <span className="time">{fmtTime(time)} / {fmtTime(duration)}</span>

          <span className="spacer" />

          <span className="title" title={file.path}>{file.name}</span>

          <span className="spacer" />

          <select className="speed" value={speed} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} title="Speed ( [ and ] )">
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>
          <button className="btn icon" title="Mute (M)" onClick={() => { const v = videoRef.current; v.muted = !v.muted; setMuted(v.muted); }}>
            {muted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            className="vol"
            type="range" min="0" max="1" step="0.02"
            value={muted ? 0 : volume}
            onChange={(e) => { const v = videoRef.current; v.volume = parseFloat(e.target.value); v.muted = false; setMuted(false); setVolume(v.volume); }}
          />
          <button className="btn icon" title="Bookmark (B)" onClick={() => addBookmark()}>🔖</button>
          <button className="btn icon" title="Bookmark list" onClick={() => setShowBookmarks((s) => !s)}>☰</button>
          {!isAudio && <button className="btn icon" title="Screenshot (S)" onClick={screenshot}>📸</button>}
          <button className="btn icon" title="Mark clip start (I) / end (O)" onClick={() => (clipStart == null || clipEnd != null ? markClip('start') : markClip('end'))}>✂</button>
          <button className="btn icon" title="Search dialogue (subtitles)" onClick={() => setShowSubs((s) => !s)}>💬</button>
          <button
            className="btn icon"
            title="AI recap / summary (needs subtitles + sign-in)"
            onClick={() => {
              if (!auth) showToast('Sign in with Magizhchi ID for AI recaps');
              else if (subs.length === 0) showToast('AI recap needs subtitles (.srt next to the video)');
              else setShowSummary(true);
            }}
          >📝</button>
          <button
            className={`btn icon ${settings.familyMode && scanInfo?.ranges?.length ? 'wt-live' : ''}`}
            title="Family filter — scan & skip sensitive scenes"
            onClick={() => setShowFamily((s) => !s)}
          >🛡</button>
          <button className={`btn icon ${audioFlags.noiseReduction || audioFlags.karaoke ? 'wt-live' : ''}`} title="Audio tools — noise reduction, karaoke" onClick={() => setShowAudio((s) => !s)}>🎚</button>
          <button className="btn icon" title="Bored? Snake break 🐍" onClick={() => { videoRef.current?.pause(); setShowSnake(true); }}>🎮</button>
          <button className={`btn icon ${wt?.code ? 'wt-live' : ''}`} title="Watch together" onClick={() => setShowWt((s) => !s)}>👥</button>
          <button
            className="btn icon"
            title={auth ? 'Rate & review for friends' : 'Sign in with Magizhchi ID to rate'}
            onClick={() => (auth ? setShowRating(true) : showToast('Sign in with Magizhchi ID to rate movies'))}
          >⭐</button>
          {!isAudio && <button className="btn icon" title="Fullscreen (F)" onClick={toggleFullscreen}>⛶</button>}
        </div>
      </div>

      {showRating && auth && (
        <RatingDialog file={file} onSave={saveRating} onClose={() => setShowRating(false)} />
      )}

      {showSubs && (
        <SubtitlePanel entries={subs} onJump={(t) => { seekTo(t); setShowSubs(false); }} onClose={() => setShowSubs(false)} />
      )}

      {showAudio && (
        <AudioPanel flags={audioFlags} onChange={applyAudioFlags} onClose={() => setShowAudio(false)} />
      )}

      {showFamily && (
        <FamilyPanel
          settings={settings}
          scanInfo={scanInfo}
          scanning={scanning}
          onToggle={async (on) => {
            await window.api.saveSettings({ familyMode: on });
            await refresh();
          }}
          onScan={runScan}
          onClose={() => setShowFamily(false)}
        />
      )}

      {showSummary && auth && (
        <SummaryDialog
          file={file}
          subs={subs}
          currentTime={time}
          clipRange={clipRange}
          auth={auth}
          server={server}
          onClose={() => setShowSummary(false)}
        />
      )}

      {showBreak && (
        <div className="overlay">
          <div className="panel break-panel">
            <h3>🧘 Time for a break</h3>
            <p>
              You've been watching for {settings.breakMinutes ?? 60} minutes. Look at something 6 metres away for 20
              seconds, stretch, drink some water.
            </p>
            <div className="wt-join">
              <button className="btn" onClick={() => { setShowBreak(false); videoRef.current?.play().catch(() => {}); }}>
                Continue watching
              </button>
              <button className="btn ghost" onClick={() => { videoRef.current?.pause(); setShowBreak(false); setShowSnake(true); }}>
                Snake break 🐍
              </button>
            </div>
          </div>
        </div>
      )}

      {showWt && (
        <WatchTogetherPanel
          wt={wt}
          settings={settings}
          authName={auth?.account?.name || auth?.account?.email || ''}
          localDuration={duration}
          onStart={wtStart}
          onChat={(text) => wtSession.current?.sendChat(text)}
          onLeave={wtLeave}
          onClose={() => setShowWt(false)}
        />
      )}

      {showBookmarks && (
        <BookmarksPanel
          bookmarks={bookmarks}
          currentTime={time}
          onAdd={(label) => addBookmark(label)}
          onJump={(t) => seekTo(t)}
          onRemove={removeBookmark}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {showSnake && (
        <SnakeGame
          onClose={() => {
            setShowSnake(false);
            videoRef.current?.play().catch(() => {});
          }}
        />
      )}

      {showExport && clipRange && (
        <ExportDialog
          file={file}
          range={clipRange}
          onClose={() => {
            setShowExport(false);
            setClipStart(null);
            setClipEnd(null);
          }}
        />
      )}
    </div>
  );
}
