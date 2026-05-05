import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, ListMusic, MonitorSpeaker } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuth } from '../context/AuthContext';
import { trackPlayStart, trackPlayEnd, getDeviceId, MUSIQ_CAMPAIGN_ID } from '../lib/nrtTracker';

const Player = () => {
  const { currentTrack, isPlaying, togglePlay, volume, setVolume } = usePlayerStore();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── NRT Tracking ─────────────────────────────────────────────────────────────
  // Track elapsed seconds since the current playback session started
  const playStartTimeRef = useRef<number | null>(null);

  /** Called whenever we begin streaming — opens an NRT session */
  const startTracking = () => {
    if (!user) return; // only track authenticated users
    playStartTimeRef.current = Date.now();
    trackPlayStart(user.id, getDeviceId(), MUSIQ_CAMPAIGN_ID);
  };

  /** Called whenever playback pauses/stops/changes — closes the NRT session */
  const endTracking = () => {
    if (playStartTimeRef.current === null) return;
    const elapsedSecs = (Date.now() - playStartTimeRef.current) / 1000;
    playStartTimeRef.current = null;
    trackPlayEnd(elapsedSecs);
  };

  // ── Playback control ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error('Playback error:', err));
        startTracking();
      } else {
        audioRef.current.pause();
        endTracking();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack]);

  // End tracking when track changes (before the new one starts)
  useEffect(() => {
    return () => {
      endTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  /** When the audio element fires 'ended', close the NRT session for the full track */
  const handleEnded = () => {
    endTracking();
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-bar">
      <audio
        ref={audioRef}
        src={currentTrack?.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="current-track" style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '30%' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: currentTrack ? `url(${currentTrack.cover_url})` : '#282828',
          backgroundSize: 'cover',
          borderRadius: '4px'
        }}></div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{currentTrack?.title || 'No track selected'}</div>
          <div style={{ fontSize: '11px', color: '#a7a7a7' }}>{currentTrack?.artist || 'Select a song to play'}</div>
        </div>
      </div>

      <div className="controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#a7a7a7' }}>
          <Shuffle size={16} />
          <SkipBack size={20} fill="currentColor" />
          <div
            onClick={togglePlay}
            style={{
              background: 'white',
              color: 'black',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" style={{ marginLeft: '2px' }} />}
          </div>
          <SkipForward size={20} fill="currentColor" />
          <Repeat size={16} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '600px' }}>
          <span style={{ fontSize: '11px', color: '#a7a7a7' }}>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <div
            style={{ flex: 1, height: '4px', background: '#4d4d4d', borderRadius: '2px', position: 'relative', cursor: 'pointer' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              if (audioRef.current) {
                audioRef.current.currentTime = percent * audioRef.current.duration;
              }
            }}
          >
            <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '2px' }}></div>
          </div>
          <span style={{ fontSize: '11px', color: '#a7a7a7' }}>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '30%', justifyContent: 'flex-end', color: '#a7a7a7' }}>
        <Mic2 size={16} />
        <ListMusic size={16} />
        <MonitorSpeaker size={16} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
          <Volume2 size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ flex: 1, height: '4px', appearance: 'none', background: '#4d4d4d', borderRadius: '2px', cursor: 'pointer' }}
          />
        </div>
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Player;
