import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * LandingPage - Tiffany AI 欢迎页面
 * 
 * 浏览器限制：只有点击/触摸/按键才能解锁音频
 * 视频先静音播放，确保不会卡住
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const line1Ref = useRef<HTMLHeadingElement | null>(null);
  const line2Ref = useRef<HTMLHeadingElement | null>(null);
  const hasRunRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showBtn, setShowBtn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /**
   * 获取或创建 AudioContext
   */
  const getAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  /**
   * 创建键盘敲击音效
   */
  const playKeyboardSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state === 'closed') return;
      
      const currentTime = ctx.currentTime;
      
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.1));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 2000 + Math.random() * 1000;
      bandpass.Q.value = 1.5;
      
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 500;
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
      
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.value = 4000 + Math.random() * 1000;
      clickGain.gain.setValueAtTime(0.08, currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
      
      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.08);
      clickOsc.start(currentTime);
      clickOsc.stop(currentTime + 0.02);
      
    } catch {
      // 静默处理
    }
  }, [soundEnabled, getAudioContext]);

  /**
   * 启用声音（需要用户点击/触摸/按键）
   */
  const enableSound = useCallback(() => {
    if (soundEnabled) return;
    
    // 启用视频声音
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.3;
    }
    
    // 初始化 AudioContext
    getAudioContext();
    
    setSoundEnabled(true);
  }, [soundEnabled, getAudioContext]);

  // 打字机音效的 ref
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  useEffect(() => {
    // 监听用户交互事件（点击、触摸、按键）
    const handleUserGesture = () => {
      enableSound();
    };

    // 这些是浏览器认可的"用户手势"
    document.addEventListener('click', handleUserGesture);
    document.addEventListener('touchstart', handleUserGesture);
    document.addEventListener('keydown', handleUserGesture);

    // 打字机效果函数 - 速度 120ms
    const typeWriter = (el: HTMLElement, text: string, speed: number) =>
      new Promise<void>((resolve) => {
        let i = 0;
        el.innerHTML = "";
        const tick = () => {
          if (i < text.length) {
            el.innerHTML += text.charAt(i);
            if (soundEnabledRef.current && text.charAt(i) !== ' ') {
              playKeyboardSound();
            }
            i += 1;
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        };
        tick();
      });

    const run = async () => {
      await new Promise((r) => setTimeout(r, 800));
      
      if (line1Ref.current && line2Ref.current) {
        // 打字速度 100ms
        await typeWriter(line1Ref.current, "Welcome to Tiffany's AI-Powered", 100);
        await new Promise((r) => setTimeout(r, 400));
        await typeWriter(line2Ref.current, "KOS Content Assistant", 100);
        setTimeout(() => setShowBtn(true), 600);
      }
    };

    if (!hasRunRef.current) {
      hasRunRef.current = true;
      run();
    }

    return () => {
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('keydown', handleUserGesture);
    };
  }, [playKeyboardSound, enableSound]);

  const handleExplore = () => {
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 视频背景 - 始终静音自动播放，确保不会卡住 */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        src="/tiffany2.mp4"
      />

      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* 内容区域 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center flex-col gap-4 text-white text-center px-4">
        <h1
          ref={line1Ref}
          className="m-0 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider"
          style={{ 
            fontFamily: "'Courier New', monospace",
            textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
            minHeight: "1.2em"
          }}
        />
        
        <h2
          ref={line2Ref}
          className="m-0 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide"
          style={{ 
            fontFamily: "'Courier New', monospace",
            textShadow: "3px 3px 6px rgba(0,0,0,0.8)",
            minHeight: "1.2em"
          }}
        />

        <div
          className="mt-8"
          style={{
            transition: "opacity 0.8s ease",
            opacity: showBtn ? 1 : 0,
          }}
        >
          <button
            onClick={(e) => {
              enableSound();
              handleExplore();
            }}
            className="
              px-8 sm:px-10 py-3 sm:py-4 
              rounded-full 
              text-base sm:text-lg 
              font-semibold
              text-white
              cursor-pointer
              transition-all duration-300
            "
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
              border: "2px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(15px)",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              letterSpacing: "0.05em",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";
            }}
          >
            开始探索
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

