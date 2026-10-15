import { useEffect, useState } from 'react';
import { AlertCircle, Check, Database, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHistory } from '../features/history/contextAccess';
import { getModelStatus, subscribeToModelStatus } from '../features/classifier/modelService';
import { useSettings } from '../features/settings/contextAccess';
import type { ModelStatus } from '../types/domain';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { entries, clearHistory } = useHistory();
  const [modelStatus, setModelStatus] = useState<ModelStatus>(getModelStatus());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => subscribeToModelStatus(setModelStatus), []);

  function reset() {
    resetSettings();
    setMessage('Preferences reset to their defaults.');
  }

  return (
    <div className="page settings-page">
      <div className="page-heading"><div><p className="eyebrow">Your browser, your choices</p><h1>Settings</h1><p>Preferences are stored locally in this browser. They are not sent to a server.</p></div></div>
      {message && <p className="inline-alert success-alert" role="status"><Check size={15} aria-hidden="true" /> {message}</p>}

      <div className="settings-layout">
        <div className="settings-main">
          <section className="section-card settings-section"><div className="settings-section-heading"><div><p className="micro-label">APPEARANCE</p><h2>Color theme</h2><p>Choose the surface that is easiest for you to read.</p></div></div><div className="theme-options" role="group" aria-label="Color theme"><button type="button" className={`theme-option${settings.theme === 'dark' ? ' is-selected' : ''}`} aria-pressed={settings.theme === 'dark'} onClick={() => updateSettings({ ...settings, theme: 'dark' })}><Moon size={17} aria-hidden="true" /><span>Dark</span>{settings.theme === 'dark' && <Check size={15} aria-hidden="true" />}</button><button type="button" className={`theme-option${settings.theme === 'light' ? ' is-selected' : ''}`} aria-pressed={settings.theme === 'light'} onClick={() => updateSettings({ ...settings, theme: 'light' })}><Sun size={17} aria-hidden="true" /><span>Light</span>{settings.theme === 'light' && <Check size={15} aria-hidden="true" />}</button></div></section>

          <section className="section-card settings-section"><div className="settings-section-heading"><div><p className="micro-label">CLASSIFIER</p><h2 id="confidence-heading">Minimum confidence score</h2><p>Results below this score are labeled uncertain. Raising it means more results will need another check.</p></div><output className="threshold-output" htmlFor="confidence-threshold">{Math.round(settings.minConfidence * 100)}%</output></div><label className="range-label" htmlFor="confidence-threshold"><span>More cautious</span><span>More results</span></label><input id="confidence-threshold" aria-labelledby="confidence-heading" className="confidence-range" type="range" min="0.3" max="0.85" step="0.05" value={settings.minConfidence} onChange={(event) => updateSettings({ ...settings, minConfidence: Number(event.currentTarget.value) })} /><div className="range-ticks" aria-hidden="true"><span>30%</span><span>55%</span><span>85%</span></div></section>

          <section className="section-card settings-section"><div className="settings-section-heading"><div><p className="micro-label">CLASSIFICATION HISTORY</p><h2>Saved on this device</h2><p>{entries.length} of 50 summaries. Images are never saved.</p></div><Database size={20} aria-hidden="true" /></div><div className="settings-row-actions"><Link className="button button-secondary" to="/history">View history <span aria-hidden="true">→</span></Link><button className="button button-danger-outline" type="button" onClick={() => setShowClearDialog(true)} disabled={!entries.length}><Trash2 size={15} aria-hidden="true" /> Clear history</button></div></section>
        </div>

        <aside className="settings-aside"><section className="section-card model-settings-card"><p className="micro-label">LOCAL MODEL</p><h2>Model status</h2><div className="status-detail"><span className={`model-state-dot state-${modelStatus.state}`} /><div><strong>{modelStatus.state === 'not-loaded' ? 'Loads on first use' : modelStatus.state === 'ready' ? 'Ready on this device' : modelStatus.state === 'loading' ? 'Loading' : modelStatus.state === 'unavailable' ? 'Unavailable' : 'Needs attention'}</strong><p>{modelStatus.message}</p></div></div><div className="model-version-row"><span>Version</span><strong>{modelStatus.version}</strong></div><p className="setup-hint"><AlertCircle size={14} aria-hidden="true" /> If assets are missing, follow the model setup section in the README.</p></section><section className="section-card privacy-settings"><p className="micro-label">PRIVACY</p><h2>What stays here</h2><ul><li>Theme and threshold preference</li><li>Recent category, score, and timestamp</li></ul><p>Original photographs remain in memory only during classification.</p></section><button className="button button-secondary reset-button" type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Reset preferences</button></aside>
      </div>

      {showClearDialog && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowClearDialog(false); }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="settings-clear-title" aria-describedby="settings-clear-description"><span className="dialog-icon"><Trash2 size={20} aria-hidden="true" /></span><h2 id="settings-clear-title">Clear saved history?</h2><p id="settings-clear-description">This removes the summaries stored in this browser. It does not affect your preferences.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setShowClearDialog(false)}>Cancel</button><button className="button button-danger" type="button" onClick={() => { clearHistory(); setShowClearDialog(false); setMessage('Classification history cleared.'); }}>Clear history</button></div></section></div>}
    </div>
  );
}
