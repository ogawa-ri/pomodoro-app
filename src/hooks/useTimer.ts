import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  longBreakInterval: 4,
};

export interface TimerPreset {
  id: string;
  name: string;
  settings: TimerSettings;
}

const STORAGE_KEY = 'pomodoro_presets';

export const useTimer = () => {
  const [presets, setPresets] = useState<TimerPreset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: 'default', name: 'デフォルト', settings: DEFAULT_SETTINGS },
      { id: 'short', name: '集中ショート', settings: { work: 15 * 60, shortBreak: 3 * 60, longBreak: 10 * 60, longBreakInterval: 4 } }
    ];
  });
  
  const [dailyHistory, setDailyHistory] = useState<Record<string, { count: number; seconds: number }>>(() => {
    const saved = localStorage.getItem('pomodoro_daily_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, { count: number; seconds: number }> = {};
        for (const date in parsed) {
          if (typeof parsed[date] === 'number') {
            const val = parsed[date];
            if (val > 50) {
              // 50より大きい場合は秒数とみなす (74など)
              migrated[date] = { count: 1, seconds: val };
            } else {
              // 50以下の場合は回数とみなす
              migrated[date] = { count: val, seconds: val * 25 * 60 };
            }
          } else if (parsed[date] && typeof parsed[date] === 'object') {
            migrated[date] = {
              count: parsed[date].count || 0,
              seconds: parsed[date].seconds || 0
            };
          }
        }
        return migrated;
      } catch (e) {
        console.error('Failed to parse daily history', e);
        return {};
      }
    }
    return {};
  });

  const [settings, setSettings] = useState<TimerSettings>(presets[0].settings);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.work);
  const [isRunning, setIsRunning] = useState(false);
  
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const saved = localStorage.getItem('pomodoro_daily_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        const todayData = history[todayStr];
        if (todayData !== undefined) {
          if (typeof todayData === 'number') {
            return todayData > 50 ? 1 : todayData;
          }
          return todayData.count || 0;
        }
      } catch (e) {}
    }
    return 0;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('pomodoro_daily_history', JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!isRunning) {
      setTimeLeft(updated[mode]);
    }
  };

  const savePreset = (name: string) => {
    const newPreset: TimerPreset = {
      id: Date.now().toString(),
      name,
      settings: { ...settings }
    };
    setPresets([...presets, newPreset]);
  };

  const loadPreset = (preset: TimerPreset) => {
    setSettings(preset.settings);
    setIsRunning(false);
    setTimeLeft(preset.settings[mode]);
  };

  const deletePreset = (id: string) => {
    if (id === 'default') return;
    setPresets(presets.filter(p => p.id !== id));
  };

  const playSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, []);

  const getNextMode = (currentMode: TimerMode, completed: number): TimerMode => {
    if (currentMode === 'work') {
      const nextCompleted = completed + 1;
      return nextCompleted % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
    }
    return 'work';
  };

  useEffect(() => {
    let timer: number | undefined;

    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playSound();
      
      const nextMode = getNextMode(mode, sessionsCompleted);
      
      if (mode === 'work') {
        const todayStr = new Date().toLocaleDateString('sv-SE');
        setDailyHistory(prev => {
          const current = prev[todayStr] || { count: 0, seconds: 0 };
          return {
            ...prev,
            [todayStr]: {
              count: current.count + 1,
              seconds: current.seconds + settings.work
            }
          };
        });
        setSessionsCompleted(prev => prev + 1);
      }
      
      setMode(nextMode);
      setTimeLeft(settings[nextMode]);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, sessionsCompleted, playSound, settings]);

  const toggleTimer = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(settings[mode]);
  }, [mode, settings]);

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(settings[newMode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const todayFocusTime = dailyHistory[todayStr]?.seconds || 0;

  return {
    timeLeft,
    mode,
    isRunning,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
    totalTime: settings[mode],
    sessionsCompleted,
    todayFocusTime,
    dailyHistory,
    settings,
    updateSettings,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  };
};
