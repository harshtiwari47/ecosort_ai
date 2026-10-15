import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Search, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CategorySymbol } from '../components/CategorySymbol';
import { WASTE_CATEGORIES, searchWasteCategories } from '../data/categories';

export function GuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const selected = searchParams.get('category');
  const filtered = useMemo(() => {
    const matches = searchWasteCategories(query);
    return selected ? matches.filter((category) => category.id === selected) : matches;
  }, [query, selected]);

  function chooseCategory(value: string) {
    if (value && WASTE_CATEGORIES.some((category) => category.id === value)) setSearchParams({ category: value });
    else setSearchParams({});
  }

  return (
    <div className="page guide-page">
      <div className="page-heading"><div><p className="eyebrow">A practical reference</p><h1>Waste sorting guide</h1><p>General material guidance to help you ask the right questions. Local rules determine what your area accepts.</p></div></div>
      <section className="guide-toolbar" aria-label="Search and filter guide">
        <label className="search-field"><Search size={17} aria-hidden="true" /><span className="visually-hidden">Search the waste guide</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search materials or examples" /></label>
        <label className="select-field"><span className="visually-hidden">Filter by category</span><select value={selected ?? ''} onChange={(event) => chooseCategory(event.target.value)}><option value="">All categories</option>{WASTE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
      </section>

      {filtered.length ? <div className="guide-list">
        {filtered.map((category) => (
          <article className="guide-card" key={category.id}>
            <div className="guide-card-header"><span className={`category-symbol category-${category.id}`}><CategorySymbol category={category.id} size={20} /></span><div><p className="micro-label">MATERIAL GROUP</p><h2>{category.label}</h2></div><span className="guide-count">{category.examples.length} examples</span></div>
            <p className="guide-description">{category.description}</p>
            <div className="guide-columns">
              <div><h3><Check size={15} aria-hidden="true" /> Sorting basics</h3><ul>{category.sorting.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3><AlertTriangle size={15} aria-hidden="true" /> Common mistakes</h3><ul>{category.mistakes.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="examples-row"><span>Typical examples</span><div>{category.examples.map((example) => <span className="example-chip" key={example}>{example}</span>)}</div></div>
            <div className="reuse-block"><div><p className="micro-label">REUSE & RECOVERY</p><ul>{category.reuse.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
            <div className="safety-block"><ShieldAlert size={16} aria-hidden="true" /><p><strong>Safety note</strong> {category.safety}</p></div>
          </article>
        ))}
      </div> : <div className="empty-state"><Search size={24} aria-hidden="true" /><h2>No matching guidance</h2><p>Try a different material or search term.</p><button type="button" className="text-link" onClick={() => { setQuery(''); setSearchParams({}); }}>Clear search <ArrowRight size={14} aria-hidden="true" /></button></div>}

      <div className="guide-disclaimer"><ShieldAlert size={17} aria-hidden="true" /><p><strong>Local rules differ.</strong> This guide offers broad educational advice. Check your city or waste provider’s current instructions, especially for coated packaging, broken glass, batteries, electronics, chemicals, medicines, and medical waste.</p></div>
    </div>
  );
}
