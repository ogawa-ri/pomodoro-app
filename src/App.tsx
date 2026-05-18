import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Plus, Trash2 } from 'lucide-react';
import { useTimer } from './hooks/useTimer';
import type { TimerMode, TimerPreset } from './hooks/useTimer';
import styles from './styles/Timer.module.css';

function App() {
  const {
    timeLeft,
    mode,
    isRunning,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
    totalTime,
    sessionsCompleted,
    settings,
    updateSettings,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  } = useTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const offset = circumference * (1 - progress);

  const modeLabels: Record<TimerMode, string> = {
    work: '集中',
    shortBreak: '小休憩',
    longBreak: '長休憩',
  };

  const handleSettingChange = (key: keyof typeof settings, part: 'm' | 's', value: string) => {
    const val = parseInt(value) || 0;
    const currentTotal = settings[key];
    const currentM = Math.floor(currentTotal / 60);
    const currentS = currentTotal % 60;

    let newTotal = currentTotal;
    if (part === 'm') {
      newTotal = val * 60 + currentS;
    } else {
      newTotal = currentM * 60 + val;
    }
    updateSettings({ [key]: newTotal });
  };

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim());
      setNewPresetName('');
    }
  };

  return (
    <div className={`${styles.container} ${styles[`mode-${mode}`]}`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.sessions}>
            完了数: {sessionsCompleted}
          </div>
          <button 
            className={styles.settingsBtn} 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            {isSettingsOpen ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>

        {isSettingsOpen ? (
          <div className={styles.settingsPanel}>
            <h3>タイマー設定</h3>
            <div className={styles.settingsSection}>
              <h4>時間の調整</h4>
              <div className={styles.settingRow}>
                <label>集中時間</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="number" 
                    value={Math.floor(settings.work / 60)} 
                    onChange={(e) => handleSettingChange('work', 'm', e.target.value)}
                    min="0"
                  />
                  <span>分</span>
                  <input 
                    type="number" 
                    value={settings.work % 60} 
                    onChange={(e) => handleSettingChange('work', 's', e.target.value)}
                    min="0"
                    max="59"
                  />
                  <span>秒</span>
                </div>
              </div>
              <div className={styles.settingRow}>
                <label>小休憩</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="number" 
                    value={Math.floor(settings.shortBreak / 60)} 
                    onChange={(e) => handleSettingChange('shortBreak', 'm', e.target.value)}
                    min="0"
                  />
                  <span>分</span>
                  <input 
                    type="number" 
                    value={settings.shortBreak % 60} 
                    onChange={(e) => handleSettingChange('shortBreak', 's', e.target.value)}
                    min="0"
                    max="59"
                  />
                  <span>秒</span>
                </div>
              </div>
              <div className={styles.settingRow}>
                <label>長休憩</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="number" 
                    value={Math.floor(settings.longBreak / 60)} 
                    onChange={(e) => handleSettingChange('longBreak', 'm', e.target.value)}
                    min="0"
                  />
                  <span>分</span>
                  <input 
                    type="number" 
                    value={settings.longBreak % 60} 
                    onChange={(e) => handleSettingChange('longBreak', 's', e.target.value)}
                    min="0"
                    max="59"
                  />
                  <span>秒</span>
                </div>
              </div>
              <div className={styles.settingRow}>
                <label>長休憩の間隔</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="number" 
                    value={settings.longBreakInterval} 
                    onChange={(e) => updateSettings({ longBreakInterval: parseInt(e.target.value) || 1 })}
                    min="1"
                    className={styles.singleInput}
                  />
                  <span>回</span>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4>お気に入り保存</h4>
              <div className={styles.savePresetRow}>
                <input 
                  type="text" 
                  placeholder="パターン名を入力..." 
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                  <Plus size={18} />
                </button>
              </div>
              <div className={styles.presetList}>
                {presets.map((preset: TimerPreset) => (
                  <div key={preset.id} className={styles.presetItem}>
                    <button 
                      className={styles.presetLoadBtn}
                      onClick={() => loadPreset(preset)}
                    >
                      {preset.name}
                    </button>
                    {preset.id !== 'default' && (
                      <button 
                        className={styles.presetDeleteBtn}
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button className={styles.closeBtn} onClick={() => setIsSettingsOpen(false)}>
              完了
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tabs}>
              {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
                <button
                  key={m}
                  className={`${styles.tab} ${mode === m ? styles.tabActive : ''}`}
                  onClick={() => changeMode(m)}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>

            <div className={styles.timerWrapper}>
              <svg className={styles.progressRing} viewBox="0 0 250 250">
                <circle
                  className={styles.progressRingCircle}
                  strokeWidth="8"
                  fill="transparent"
                  r={radius}
                  cx="125"
                  cy="125"
                />
                <circle
                  className={styles.progressRingValue}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  fill="transparent"
                  r={radius}
                  cx="125"
                  cy="125"
                />
              </svg>
              <div className={styles.time}>{formatTime(timeLeft)}</div>
            </div>

            <div className={styles.controls}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={resetTimer}
                title="リセット"
              >
                <RotateCcw size={28} />
              </button>
              <button className={styles.btn} onClick={toggleTimer} title={isRunning ? '一時停止' : '開始'}>
                {isRunning ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
              </button>
            </div>
            
            {isRunning && (
              <div className={styles.statusText}>
                {mode === 'work' ? '集中しています...' : '休憩中です...'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
