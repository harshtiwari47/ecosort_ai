import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertCircle, Camera, Check, FileImage, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, StopCircle, ThumbsDown, ThumbsUp, Trash2, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CategorySymbol } from '../components/CategorySymbol';
import { getWasteCategory } from '../data/categories';
import { useHistory } from '../features/history/contextAccess';
import { applyConfidenceThreshold } from '../features/classifier/categoryMapping';
import { validateImageFile } from '../features/classifier/fileValidation';
import { getModelStatus, predictImage, subscribeToModelStatus } from '../features/classifier/modelService';
import { useSettings } from '../features/settings/contextAccess';
import type { ClassificationResult, ModelStatus } from '../types/domain';

export function ClassifyPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addEntry, setFeedback, storageAvailable } = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [fileError, setFileError] = useState('');
  const [classifyError, setClassifyError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(getModelStatus());

  useEffect(() => subscribeToModelStatus(setModelStatus), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => setCameraError('The camera preview could not start. Choose an image file instead.'));
  }, [cameraOpen]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const validation = validateImageFile(nextFile);
    setClassifyError('');
    setResult(null);
    setResultId(null);
    if (!validation.valid) {
      setFileError(validation.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileError('');
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.currentTarget.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  async function startCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera capture is not available in this browser. You can still choose an image file.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      const reason = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Camera access was denied. Change your browser permission or choose an image file.'
        : 'The camera could not start. Check that it is connected and available, or choose an image file.';
      setCameraError(reason);
      stopCamera();
    }
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('The camera is still preparing. Wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('This browser could not capture a camera frame. Choose an image file instead.');
      return;
    }
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setCameraError('The camera frame could not be saved. Try again or choose an image file.');
      return;
    }
    acceptFile(new File([blob], `ecosort-capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    stopCamera();
  }

  async function classify() {
    if (!file || !imageRef.current) return;
    setProcessing(true);
    setClassifyError('');
    setResult(null);
    try {
      await imageRef.current.decode();
      const ranked = await predictImage(imageRef.current);
      const nextResult = applyConfidenceThreshold(ranked, settings.minConfidence);
      const id = crypto.randomUUID();
      const historyAdded = addEntry({
        id,
        timestamp: new Date().toISOString(),
        prediction: nextResult.top,
        alternatives: nextResult.alternatives,
      });
      setResult(nextResult);
      setResultId(id);
      if (!historyAdded || !storageAvailable) setClassifyError('This result is ready, but browser storage is unavailable, so it was not added to history.');
      document.getElementById('classification-result')?.focus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Classification failed. Try again with another image.';
      setClassifyError(message);
    } finally {
      setProcessing(false);
    }
  }

  function resetSelection() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setResultId(null);
    setFileError('');
    setClassifyError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const category = result ? getWasteCategory(result.top.category) : null;
  const scorePercent = result ? Math.round(result.top.score * 100) : 0;

  return (
    <div className="page classify-page">
      <div className="page-heading classify-heading">
        <div><p className="eyebrow">On-device image classification</p><h1>Classify an item</h1><p>Choose one clear item and let the model suggest a broad material group.</p></div>
        <span className="privacy-pill"><ShieldCheck size={15} aria-hidden="true" /> Photo stays on this device</span>
      </div>

      <div className="classify-layout">
        <section className="classify-workspace" aria-labelledby="upload-heading">
          <div className="section-card upload-card">
            <div className="card-heading"><div><p className="micro-label">STEP 01</p><h2 id="upload-heading">Add an image</h2></div><span className="step-badge">JPEG · PNG · WebP</span></div>
            {!file && !cameraOpen && (
              <>
                <label className={`drop-zone${dragging ? ' is-dragging' : ''}`} htmlFor="waste-image" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
                  <input ref={fileInputRef} id="waste-image" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose waste image" aria-describedby="upload-help file-error" onChange={handleInputChange} />
                  <span className="upload-icon"><Upload size={21} aria-hidden="true" /></span>
                  <strong>Drop an image here</strong>
                  <span>or <span className="inline-link">browse your device</span></span>
                  <span id="upload-help" className="drop-help">Maximum file size 10 MB. Your image is processed locally.</span>
                </label>
                <div className="upload-divider"><span>OR</span></div>
                <button className="button button-secondary camera-start" type="button" onClick={() => void startCamera()}><Camera size={16} aria-hidden="true" /> Use camera</button>
              </>
            )}

            {cameraOpen && (
              <div className="camera-panel">
                <video ref={videoRef} className="camera-video" autoPlay playsInline muted aria-label="Live camera preview" />
                <div className="camera-controls"><button className="button button-primary" type="button" onClick={() => void captureFrame()}><Camera size={16} aria-hidden="true" /> Capture image</button><button className="button button-secondary" type="button" onClick={stopCamera}><StopCircle size={16} aria-hidden="true" /> Stop camera</button></div>
              </div>
            )}

            {file && previewUrl && (
              <div className="image-preview-wrap">
                <img ref={imageRef} className="image-preview" src={previewUrl} alt={`Selected waste item: ${file.name}`} />
                <div className="preview-overlay"><span className="preview-file"><FileImage size={15} aria-hidden="true" /> <span>{file.name}</span></span><button className="icon-button remove-image" type="button" aria-label="Remove selected image" onClick={resetSelection}><X size={17} aria-hidden="true" /></button></div>
                <div className="preview-actions"><span className="preview-size"><Check size={14} aria-hidden="true" /> {Math.max(1, Math.round(file.size / 1024))} KB · ready</span><button className="text-button" type="button" onClick={() => fileInputRef.current?.click()}><ImagePlus size={15} aria-hidden="true" /> Replace image</button></div>
                <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Replace selected image" onChange={handleInputChange} />
              </div>
            )}

            {fileError && <p className="inline-alert error-alert" id="file-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {fileError}</p>}
            {cameraError && <p className="inline-alert error-alert" role="alert"><AlertCircle size={16} aria-hidden="true" /> {cameraError}</p>}
            {file && <div className="classify-action-row"><button className="button button-primary classify-button" type="button" disabled={processing} onClick={() => void classify()}>{processing ? <><LoaderCircle className="spinner" size={17} aria-hidden="true" /> Classifying on this device…</> : <><Sparkles size={17} aria-hidden="true" /> Classify item</>}</button>{processing && <span className="processing-hint" role="status">First use may take a little longer while the model loads.</span>}</div>}
          </div>

          {classifyError && <p className="inline-alert error-alert classify-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {classifyError}</p>}

          {result && category && (
            <section className="section-card result-card" id="classification-result" tabIndex={-1} aria-labelledby="result-title">
              <div className="card-heading result-heading"><div><p className="micro-label">STEP 02 · MODEL OUTPUT</p><h2 id="result-title">{result.uncertain ? 'Best match — uncertain' : 'Suggested material group'}</h2></div><span className={`result-status${result.uncertain ? ' status-uncertain' : ''}`}>{result.uncertain ? <AlertCircle size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{result.uncertain ? 'Low confidence' : 'Review guidance'}</span></div>
              {result.uncertain && <div className="uncertainty-alert" role="status"><AlertCircle size={17} aria-hidden="true" /><p>We could not classify this item reliably. Try a clearer photo with one item centered, or use the guide to check it yourself.</p></div>}
              <div className="prediction-main">
                <span className={`category-symbol category-${result.top.category} prediction-symbol`}><CategorySymbol category={result.top.category} size={24} /></span>
                <div className="prediction-name"><span>Best match</span><strong>{category.label}</strong></div>
                <div className="score-display"><strong>{scorePercent}%</strong><span>Model confidence score</span></div>
              </div>
              <div className="score-track" role="meter" aria-label="Model confidence score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scorePercent}><span style={{ width: `${scorePercent}%` }} /></div>
              <p className="score-note">This score describes how strongly the model matched its training categories. It is not a calibrated probability or a guarantee.</p>
              {result.alternatives.length > 0 && <div className="alternative-list"><p className="micro-label">OTHER MODEL MATCHES</p>{result.alternatives.slice(0, 3).map((prediction) => <div className="alternative-row" key={prediction.category}><span>{getWasteCategory(prediction.category).label}</span><span>{Math.round(prediction.score * 100)}%</span></div>)}</div>}
              <div className="guide-result"><div className="guide-result-heading"><span className={`category-symbol category-${result.top.category}`}><CategorySymbol category={result.top.category} size={17} /></span><div><p className="micro-label">GENERAL SORTING GUIDE</p><strong>{category.label}</strong></div></div><p>{category.sorting[0]}</p><p className="guide-caveat">Rules vary by location. Check your waste provider’s current accepted-items list before sorting.</p><button className="text-link result-guide-link" type="button" onClick={() => navigate(`/guide?category=${result.top.category}`)}>Read full {category.shortLabel.toLowerCase()} guide <RefreshCw size={14} aria-hidden="true" /></button></div>
              <div className="feedback-row"><span>Was this result useful?</span><button className="feedback-button" type="button" onClick={() => resultId && setFeedback(resultId, 'helpful')} aria-label="Mark result helpful"><ThumbsUp size={15} aria-hidden="true" /> Helpful</button><button className="feedback-button" type="button" onClick={() => resultId && setFeedback(resultId, 'not-helpful')} aria-label="Mark result not helpful"><ThumbsDown size={15} aria-hidden="true" /> Not quite</button></div>
              <button className="button button-secondary classify-again" type="button" onClick={resetSelection}><Trash2 size={15} aria-hidden="true" /> Classify another item</button>
            </section>
          )}
        </section>

        <aside className="classify-aside" aria-label="Classifier information">
          <section className="section-card model-status-card"><div className="card-heading"><div><p className="micro-label">LOCAL MODEL</p><h2>Model status</h2></div><span className={`model-state-dot state-${modelStatus.state}`} /></div><p className="model-status-copy">{modelStatus.message}</p><div className="model-version-row"><span>Model version</span><strong>{modelStatus.version}</strong></div></section>
          <section className="section-card quick-tips-card"><p className="micro-label">FOR A BETTER MATCH</p><h2>Make the item easy to see.</h2><ul><li><Check size={14} aria-hidden="true" /> Center one item in the frame</li><li><Check size={14} aria-hidden="true" /> Use even light and a clear background</li><li><Check size={14} aria-hidden="true" /> Avoid hands covering the material</li></ul></section>
          <div className="privacy-note"><ShieldCheck size={17} aria-hidden="true" /><p><strong>Private by design</strong><br />Images are read in memory for prediction and removed when you leave. They are not uploaded or saved to history.</p></div>
          <p className="limits-note"><AlertCircle size={15} aria-hidden="true" /> One image cannot establish all materials in a mixed item or whether it is recyclable in your area.</p>
        </aside>
      </div>
    </div>
  );
}
