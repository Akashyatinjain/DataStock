import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Maximize2,
  Gauge,
  Music,
  Video,
  RotateCcw,
  RotateCw,
  Sparkles
} from 'lucide-react';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MediaPlayer({
  src,
  title,
  mimeType = '',
  isAudio = false,
  isVideo = false,
}) {
  const mediaRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Web Audio API References
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animFrameRef = useRef(null);
  const [hasAudioContext, setHasAudioContext] = useState(false);

  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sync playback speed to media element
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Audio Equalizer Canvas Rendering
  useEffect(() => {
    if (!isAudio) return;

    const setupWebAudio = () => {
      if (audioCtxRef.current || !mediaRef.current) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // 32 frequency bins

        const source = ctx.createMediaElementSource(mediaRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
        setHasAudioContext(true);
      } catch (err) {
        console.warn('Web Audio API initialized with simulated visualizer:', err);
      }
    };

    const drawVisualizer = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        animFrameRef.current = requestAnimationFrame(render);
        ctx.clearRect(0, 0, width, height);

        if (analyserRef.current && isPlaying) {
          analyserRef.current.getByteFrequencyData(dataArray);
        } else if (isPlaying) {
          // Dynamic simulated frequency data if CORS or WebAudio fallback
          for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = Math.floor(Math.random() * 180) + 40;
          }
        } else {
          dataArray.fill(10);
        }

        const barWidth = (width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          // Gradient color from cyan-500 to purple-600
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#3B82F6');
          gradient.addColorStop(0.5, '#8B5CF6');
          gradient.addColorStop(1, '#EC4899');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 3, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      };

      render();
    };

    if (isPlaying && mediaRef.current) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setupWebAudio();
      drawVisualizer();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isAudio]);

  const handlePlayPause = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      setDuration(mediaRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (mediaRef.current) {
      mediaRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    if (isMuted) {
      mediaRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      mediaRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(
        0,
        Math.min(mediaRef.current.duration || 0, mediaRef.current.currentTime + seconds)
      );
    }
  };

  const togglePictureInPicture = async () => {
    if (!mediaRef.current || !isVideo) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await mediaRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Picture in Picture failed:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-between bg-slate-950 text-white rounded-2xl overflow-hidden select-none shadow-2xl border border-slate-800"
    >
      {/* Media Viewport Container */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center bg-black overflow-hidden">
        {isVideo ? (
          <video
            ref={mediaRef}
            src={src}
            className="w-full h-full object-contain cursor-pointer max-h-full max-w-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />
        ) : (
          <audio
            ref={mediaRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Audio Visualizer & Banner for Audio Files */}
        {isAudio && (
          <div className="flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-lg">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 p-1 shadow-2xl mb-4 sm:mb-6 flex items-center justify-center animate-pulse">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Music className={`w-8 h-8 sm:w-12 sm:h-12 ${isPlaying ? 'text-blue-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '8s' }} />
              </div>
            </div>

            <h4 className="text-sm sm:text-lg font-extrabold text-white text-center truncate max-w-full mb-1 px-4">
              {title || 'Audio Stream'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mb-4 sm:mb-6 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Web Audio Frequency Equalizer
            </p>

            {/* Equalizer Canvas */}
            <div className="w-full h-20 sm:h-24 bg-slate-900/80 backdrop-blur-md rounded-2xl p-2 border border-slate-800 flex items-center justify-center mb-2">
              <canvas ref={canvasRef} width={380} height={80} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="w-full shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 p-2.5 sm:p-3.5 flex flex-col gap-2 z-30">
        {/* Seek Bar */}
        <div className="flex items-center gap-2.5 w-full text-[11px] font-mono text-slate-300">
          <span className="w-10 text-right font-bold shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-[#3B82F6] hover:bg-slate-600 transition"
          />
          <span className="w-10 font-bold shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between w-full pt-0.5">
          {/* Left Controls: Play/Pause, Skip & Volume */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3B82F6] hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95 shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1 ml-1 group">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-300" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#3B82F6] hidden xs:block"
              />
            </div>
          </div>

          {/* Right Controls: Speed Selector & Fullscreen / PiP */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Speed Control Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                title="Playback Speed"
              >
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-fade-in">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                    Speed
                  </div>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-2.5 py-1 text-left text-xs font-semibold rounded-lg transition flex items-center justify-between ${
                        playbackSpeed === speed
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                      {playbackSpeed === speed && <Sparkles className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture for Video */}
            {isVideo && (
              <button
                onClick={togglePictureInPicture}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Picture-in-Picture"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
