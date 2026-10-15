import { ArrowDownRight, ArrowRight, Camera, Check, CircleHelp, FileImage, Leaf, LockKeyhole, Recycle, ScanLine, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategorySymbol } from '../components/CategorySymbol';
import { WASTE_CATEGORIES } from '../data/categories';

export function HomePage() {
  return (
    <div className="page home-page">
      <section className="hero-grid" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Waste, understood</p>
          <h1 id="home-title">Understand your waste.<br /><span>Make better choices.</span></h1>
          <p className="hero-description">A local image classifier can help you recognize common waste materials and find practical sorting guidance. Your photo stays on your device.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/classify"><Camera size={17} aria-hidden="true" /> Start classifying <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className="button button-secondary" to="/guide">Explore the guide</Link>
          </div>
          <div className="hero-meta">
            <span><LockKeyhole size={15} aria-hidden="true" /> Private by design</span>
            <span><ScanLine size={15} aria-hidden="true" /> Runs in your browser</span>
          </div>
        </div>
        <div className="workflow-panel">
          <div className="panel-topline"><span className="panel-index">01 / 03</span><span className="panel-status"><span className="status-dot" /> Local workflow</span></div>
          <div className="workflow-visual" aria-hidden="true">
            <div className="workflow-ring ring-one" /><div className="workflow-ring ring-two" />
            <div className="workflow-center"><FileImage size={33} strokeWidth={1.45} /><span>IMAGE</span></div>
            <div className="workflow-node node-one"><ScanLine size={16} /></div>
            <div className="workflow-node node-two"><Leaf size={16} /></div>
            <div className="workflow-line line-one" /><div className="workflow-line line-two" />
          </div>
          <div className="workflow-copy">
            <div><p className="micro-label">HOW IT WORKS</p><h2>A photo becomes a starting point.</h2></div>
            <p>The browser resizes your image, runs the local model, then pairs its best match with general sorting guidance.</p>
          </div>
          <div className="workflow-steps" aria-label="Classification steps">
            <span className="step-current"><b>01</b> Choose</span><span><b>02</b> Classify</span><span><b>03</b> Learn</span>
          </div>
        </div>
      </section>

      <div className="trust-strip" aria-label="Project principles">
        <span><ShieldCheck size={16} aria-hidden="true" /> Image stays on device</span>
        <span><Recycle size={16} aria-hidden="true" /> Six broad material groups</span>
        <span><CircleHelp size={16} aria-hidden="true" /> Guidance varies by location</span>
      </div>

      <section className="content-section" aria-labelledby="categories-title">
        <div className="section-heading-row">
          <div><p className="eyebrow">A useful first sort</p><h2 id="categories-title">Six broad categories</h2></div>
          <Link className="text-link" to="/guide">Read the sorting guide <ArrowDownRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="category-grid home-category-grid">
          {WASTE_CATEGORIES.map((category, index) => (
            <Link className="category-tile" to="/guide" key={category.id}>
              <span className={`category-symbol category-${category.id}`}><CategorySymbol category={category.id} size={18} /></span>
              <span className="category-tile-copy"><span className="category-number">0{index + 1}</span><strong>{category.label}</strong><span>{category.description.split('.')[0]}.</span></span>
              <ArrowRight className="tile-arrow" size={15} aria-hidden="true" />
            </Link>
          ))}
        </div>
        <p className="section-footnote"><Check size={14} aria-hidden="true" /> “Other” maps to the source model’s broad “trash” class. It does not identify hazardous contents.</p>
      </section>

      <section className="sdg-section" aria-labelledby="sdg-title">
        <div className="sdg-intro"><p className="eyebrow">Learning with context</p><h2 id="sdg-title">Built to support better understanding.</h2><p>EcoSort AI is an educational aid. It contributes information people can use while learning about consumption and waste; it does not measure environmental impact.</p></div>
        <div className="sdg-list">
          <div className="sdg-item"><span className="sdg-number">12</span><div><strong>Responsible consumption and production</strong><p>Encourages awareness of material types and reuse options.</p></div></div>
          <div className="sdg-item"><span className="sdg-number">11</span><div><strong>Sustainable cities and communities</strong><p>Offers a small learning resource for household sorting decisions.</p></div></div>
          <div className="sdg-item"><span className="sdg-number">13</span><div><strong>Climate action</strong><p>Connects waste education to a broader sustainability goal without claiming measured emissions reductions.</p></div></div>
        </div>
      </section>

      <section className="closing-callout">
        <div><p className="eyebrow">Ready when you are</p><h2>One clear photo. A little more context.</h2><p>Classification is a starting point. Check the label, material, and local collection rules before you sort.</p></div>
        <Link className="button button-primary" to="/classify">Try the classifier <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
