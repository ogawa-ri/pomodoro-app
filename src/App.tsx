import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Plus, Trash2, BarChart2 } from 'lucide-react';
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
    todayFocusTime,
    dailyHistory,
    settings,
    updateSettings,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  } = useTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const formatFocusTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes === 0) return '0分';
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}時間`;
    }
    return `${hours}時間${mins}分`;
  };

  const getLast7Days = () => {
    const result = [];
    const daysJapanese = ['日', '月', '火', '水', '木', '金', '土'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('sv-SE');
      const dayName = daysJapanese[d.getDay()];
      const data = dailyHistory[dateStr] || { count: 0, seconds: 0 };
      const seconds = data.seconds || 0;
      const minutes = Math.round(seconds / 60);
      result.push({
        dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()} (${dayName})`,
        shortLabel: dayName,
        seconds,
        minutes,
      });
    }
    return result;
  };

  const last7Days = getLast7Days();
  const maxMinutes = Math.max(...last7Days.map(d => d.minutes), 60);

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
          <div className={styles.sessions} translate="no">
            完了数: {sessionsCompleted}
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.settingsBtn} 
              onClick={() => { setIsStatsOpen(!isStatsOpen); setIsSettingsOpen(false); }}
              title="統計・学習記録"
            >
              {isStatsOpen ? <X size={20} /> : <BarChart2 size={20} />}
            </button>
            <button 
              className={styles.settingsBtn} 
              onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsStatsOpen(false); }}
              title="タイマー設定"
            >
              {isSettingsOpen ? <X size={20} /> : <Settings size={20} />}
            </button>
          </div>
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
        ) : isStatsOpen ? (
          <div className={styles.statsPanel}>
            <h3>学習記録・統計</h3>
            
            <div className={styles.statsOverview}>
              <div className={styles.statCard}>
                <span className={styles.statVal} style={{ fontSize: '1.4rem' }}>{formatFocusTime(todayFocusTime)}</span>
                <span className={styles.statLabel}>今日の集中時間</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal} style={{ fontSize: '1.4rem' }}>
                  {formatFocusTime(Object.values(dailyHistory).reduce((acc, curr) => acc + (curr?.seconds || 0), 0))}
                </span>
                <span className={styles.statLabel}>累計集中時間</span>
              </div>
            </div>

            <div className={styles.chartSection}>
              <h4>直近1週間の記録 (分)</h4>
              <div className={styles.barChart}>
                {last7Days.map((day) => {
                  const percent = (day.minutes / maxMinutes) * 100;
                  return (
                    <div key={day.dateStr} className={styles.chartColumn} title={`${day.label}: ${day.minutes}分`}>
                      <div className={styles.chartBarWrapper}>
                        <div 
                          className={styles.chartBar} 
                          style={{ height: `${percent}%` }}
                        >
                          {day.minutes > 0 && <span className={styles.barVal}>{day.minutes}m</span>}
                        </div>
                      </div>
                      <span className={styles.chartLabel}>{day.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className={styles.closeBtn} onClick={() => setIsStatsOpen(false)}>
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
              <div className={styles.time} translate="no">{formatTime(timeLeft)}</div>
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
