import { ArrowUpRight, BookOpenCheck, Cpu, Database, Eye, GitBranch, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getModelStatus, subscribeToModelStatus } from '../features/classifier/modelService';
import type { ModelStatus } from '../types/domain';

export function AboutPage() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>(getModelStatus());
  useEffect(() => subscribeToModelStatus(setModelStatus), []);

  return (
    <div className="page about-page">
      <div className="page-heading"><div><p className="eyebrow">About EcoSort AI</p><h1>How the classifier works</h1><p>A learning tool that uses a local image model to suggest one broad waste category.</p></div></div>

      <section className="about-feature-grid">
        <article className="section-card about-feature"><span className="feature-icon"><Eye size={19} aria-hidden="true" /></span><p className="micro-label">01 · THE INPUT</p><h2>Image classification</h2><p>The model looks at an image and assigns scores to categories it learned during training. It does not read a product label, test the material, or inspect hidden contents.</p></article>
        <article className="section-card about-feature"><span className="feature-icon"><Cpu size={19} aria-hidden="true" /></span><p className="micro-label">02 · THE MODEL</p><h2>MobileNetV2 transfer learning</h2><p>A pre-trained vision backbone is fine-tuned on labeled waste images. TensorFlow.js loads the converted model from this site and runs it in the browser.</p></article>
        <article className="section-card about-feature"><span className="feature-icon"><LockKeyhole size={19} aria-hidden="true" /></span><p className="micro-label">03 · YOUR DATA</p><h2>Processed on this device</h2><p>Images are decoded and resized in memory, then passed to the local model. EcoSort does not upload them or save them in local storage.</p></article>
      </section>

      <section className="section-card taxonomy-section"><div className="card-heading"><div><p className="micro-label">SUPPORTED LABELS</p><h2>Six broad classes</h2></div><span className={`result-status${modelStatus.state === 'ready' ? '' : ' status-uncertain'}`}>{modelStatus.state === 'ready' ? 'Model ready' : modelStatus.state === 'not-loaded' ? 'Loads on first use' : modelStatus.state}</span></div><div className="taxonomy-list"><div><span>cardboard</span><strong>Cardboard</strong></div><div><span>glass</span><strong>Glass</strong></div><div><span>metal</span><strong>Metal</strong></div><div><span>paper</span><strong>Paper</strong></div><div><span>plastic</span><strong>Plastic</strong></div><div><span>trash</span><strong>Other / non-recyclable</strong></div></div><p className="taxonomy-note"><ShieldAlert size={15} aria-hidden="true" /> “Trash” is mapped to “Other.” This broad category does not identify batteries, chemicals, electronics, medical waste, or other hazards.</p></section>

      <div className="about-columns">
        <section className="section-card methodology-card"><p className="micro-label">DATA & METHOD</p><h2>Reproducible training</h2><p>The training workflow uses the <a href="https://huggingface.co/datasets/TrashBusters/combined" target="_blank" rel="noreferrer">TrashBusters Waste Classification Harmonized Dataset</a>, which documents six classes and separate train, validation, and test splits under an MIT license. Training images remain outside the production bundle.</p><p>Configuration, evaluation, and conversion scripts live in the <code>training/</code> directory. The test report is generated from the held-out test split; it is not a guarantee of real-world or local recycling accuracy.</p><div className="source-link"><Database size={16} aria-hidden="true" /><span>Dataset: 29,849 images · six labels · MIT</span><a href="https://huggingface.co/datasets/TrashBusters/combined" target="_blank" rel="noreferrer" aria-label="Open dataset card"><ArrowUpRight size={15} aria-hidden="true" /></a></div></section>
        <section className="section-card score-card"><p className="micro-label">MODEL CONFIDENCE SCORE</p><h2>A score is a ranking signal.</h2><p>The displayed number is the model’s output score. Unless a calibration procedure has been completed and evaluated, it must not be read as a calibrated probability that the answer is correct.</p><div className="threshold-example"><span className="threshold-line" /><div><strong>Below your threshold</strong><p>EcoSort flags the result as uncertain and asks you to check the item another way.</p></div></div></section>
      </div>

      <section className="section-card limitations-section"><div><p className="micro-label">LIMITATIONS & RESPONSIBLE USE</p><h2>A useful hint, with important boundaries.</h2></div><ul><li><ShieldAlert size={15} aria-hidden="true" /><span>One image may not reveal every material in a mixed object, contamination, or composition.</span></li><li><ShieldAlert size={15} aria-hidden="true" /><span>Training images cannot represent every camera, lighting condition, background, or waste stream.</span></li><li><ShieldAlert size={15} aria-hidden="true" /><span>Local recycling rules vary. The model cannot determine whether a material is accepted where you live.</span></li><li><ShieldAlert size={15} aria-hidden="true" /><span>Never use this classifier to assess or handle hazardous, medical, electronic, or chemically dangerous waste.</span></li></ul></section>

      <section className="sdg-about"><p className="micro-label">SUSTAINABLE DEVELOPMENT GOALS</p><h2>Learning support, not impact measurement.</h2><p>The project connects to SDG 12 by explaining material groups and reuse considerations; SDG 11 by offering an accessible household learning aid; and SDG 13 by supporting sustainability education. These links describe intent, not measured outcomes. EcoSort has not measured waste diversion, emissions, or pollution reductions.</p></section>
      <div className="about-bottom-links"><a href="https://www.tensorflow.org/js/guide/conversion" target="_blank" rel="noreferrer"><BookOpenCheck size={15} aria-hidden="true" /> TensorFlow.js conversion guide <ArrowUpRight size={14} aria-hidden="true" /></a><a href="https://github.com/TrashBusters" target="_blank" rel="noreferrer"><GitBranch size={15} aria-hidden="true" /> Dataset source organization <ArrowUpRight size={14} aria-hidden="true" /></a></div>
    </div>
  );
}
