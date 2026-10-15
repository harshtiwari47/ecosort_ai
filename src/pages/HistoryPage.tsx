import { useMemo, useState } from 'react';
import { AlertCircle, Clock3, Filter, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategorySymbol } from '../components/CategorySymbol';
import { getWasteCategory, WASTE_CATEGORIES } from '../data/categories';
import { useHistory } from '../features/history/contextAccess';
import type { CategoryId } from '../types/domain';

export function HistoryPage() {
  const { entries, removeEntry, clearHistory, storageAvailable } = useHistory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CategoryId | ''>('');
  const [confirmClear, setConfirmClear] = useState(false);
  const filtered = useMemo(() => entries.filter((entry) => {
    const category = getWasteCategory(entry.prediction.category);
    const matchesQuery = `${category.label} ${category.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery && (!filter || entry.prediction.category === filter);
  }), [entries, filter, query]);

  return (
    <div className="page history-page">
      <div className="page-heading history-heading"><div><p className="eyebrow">Stored on this device</p><h1>Classification history</h1><p>Only category summaries and scores are saved. Uploaded photographs are never added to history.</p></div><div className="history-total"><strong>{entries.length.toString().padStart(2, '0')}</strong><span>of 50 saved</span></div></div>
      {!storageAvailable && <p className="inline-alert error-alert" role="status"><AlertCircle size={16} aria-hidden="true" /> Browser storage is unavailable. New results will still classify but may not be saved.</p>}
      <div className="history-toolbar"><label className="search-field"><Search size={17} aria-hidden="true" /><span className="visually-hidden">Search history</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history" /></label><label className="select-field"><Filter size={15} aria-hidden="true" /><span className="visually-hidden">Filter by material</span><select value={filter} onChange={(event) => setFilter(event.target.value as CategoryId | '')}><option value="">All materials</option>{WASTE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label><button className="button button-danger-outline" type="button" onClick={() => setConfirmClear(true)} disabled={entries.length === 0}><Trash2 size={15} aria-hidden="true" /> Clear history</button></div>

      {filtered.length ? <div className="history-list" aria-live="polite">{filtered.map((entry) => {
        const category = getWasteCategory(entry.prediction.category);
        const date = new Date(entry.timestamp);
        return <article className="history-row" key={entry.id}><span className={`category-symbol category-${category.id}`}><CategorySymbol category={category.id} size={18} /></span><div className="history-row-main"><strong>{category.label}</strong><span><Clock3 size={13} aria-hidden="true" /> <time dateTime={entry.timestamp}>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></span></div><div className="history-score"><strong>{Math.round(entry.prediction.score * 100)}%</strong><span>score</span></div><div className="history-alternatives">{entry.alternatives.slice(0, 2).map((alt) => <span key={alt.category}>{getWasteCategory(alt.category).shortLabel} {Math.round(alt.score * 100)}%</span>)}</div><span className="history-feedback">{entry.feedback === 'helpful' ? 'Helpful' : entry.feedback === 'not-helpful' ? 'Not quite' : '—'}</span><button className="icon-button history-delete" type="button" aria-label={`Delete ${category.label} result`} onClick={() => removeEntry(entry.id)}><Trash2 size={16} aria-hidden="true" /></button></article>;
      })}</div> : <div className="empty-state"><Clock3 size={25} aria-hidden="true" /><h2>{entries.length ? 'No results match' : 'No classifications yet'}</h2><p>{entries.length ? 'Adjust your search or filter.' : 'Your recent category summaries will appear here after classification.'}</p>{!entries.length && <Link className="button button-primary" to="/classify">Classify an item</Link>}</div>}

      {confirmClear && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmClear(false); }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-title" aria-describedby="clear-description"><span className="dialog-icon"><Trash2 size={20} aria-hidden="true" /></span><h2 id="clear-title">Clear all history?</h2><p id="clear-description">This removes all saved classification summaries from this browser. Photos are not part of this history.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setConfirmClear(false)}>Keep history</button><button className="button button-danger" type="button" onClick={() => { clearHistory(); setConfirmClear(false); }}>Clear history</button></div><button className="dialog-close icon-button" type="button" aria-label="Close confirmation" onClick={() => setConfirmClear(false)}><X size={16} aria-hidden="true" /></button></section></div>}
    </div>
  );
}
