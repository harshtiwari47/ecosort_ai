# EcoSort AI

**Understand your waste. Make better choices.**

EcoSort AI is a student project for learning about common household waste materials. It pairs an image classifier that runs in the browser with a practical guide to sorting, reuse, and safety. It is an educational aid; the model does not determine local recyclability or measure environmental impact.

## Problem and SDG alignment

Incorrect sorting can contaminate recyclable streams, while unclear disposal information makes everyday decisions harder. EcoSort offers a broad material suggestion and general follow-up guidance.

- **SDG 12 — Responsible Consumption and Production:** explains material groups and reuse considerations.
- **SDG 11 — Sustainable Cities and Communities:** provides a small, accessible household learning resource.
- **SDG 13 — Climate Action:** supports sustainability education as part of a wider climate goal.

These describe the project’s educational intent. EcoSort has not measured changes in waste diversion, emissions, or pollution.

## Features

- Image upload, drag and drop, preview, replacement, and camera capture.
- Browser-side TensorFlow.js inference using model files served from this project.
- Six broad labels: plastic, paper, cardboard, glass, metal, and other/non-recyclable.
- Minimum score threshold, uncertainty message, and ranked alternatives.
- Searchable, typed waste and disposal guide with safety and local-rule caveats.
- Classification history stored in local storage without image data.
- Persistent dark/light theme and confidence threshold settings.
- Responsive routes for Overview, Classify, Guide, History, About, and Settings.
- Vercel SPA rewrite for direct route refreshes.

## Architecture

```text
src/
  app and routes       React Router application
  components           Navigation and shared category visuals
  data                 Typed disposal guide content
  features/classifier  File checks, label mapping, TensorFlow.js service
  features/history     Summary-only local history
  features/settings    Preferences and storage validation
  pages                Overview, classifier, guide, history, about, settings
  styles               Dark/light responsive design system
training/
  common.py            Dataset and preprocessing helpers
  train.py             MobileNetV2 transfer-learning workflow
  evaluate.py          Held-out test metrics and confusion matrix
  convert.py           TensorFlow.js model export
public/models/waste/   Locally served inference model assets
```

The frontend has no application backend, authentication, database, analytics, or inference API. TensorFlow.js is loaded on first classification. The image is decoded and resized in browser memory, then passed to locally hosted weights. Local storage keeps preferences and a capped list of category/score/timestamp summaries; it never stores image bytes or filenames.

## Technology

- React 19, TypeScript strict mode, Vite, React Router, and Lucide React.
- TensorFlow.js 4.22 for browser inference.
- Python 3.12, TensorFlow/Keras 2.19, and Hugging Face Datasets for the training workflow.
- Vitest, jsdom, and Testing Library for automated checks.
- Static deployment on Vercel; no runtime secrets or environment variables are required.

Exact JavaScript dependency versions are locked in `package-lock.json`.

## Prerequisites

- Node.js 20.19+ (Node 24 is suitable) and npm.
- Python 3.11 or 3.12 only if retraining or converting the model.
- About 2.1 GB of free download/cache space for the full dataset, plus room for TensorFlow and training outputs.
- A modern browser with WebGL or CPU support for TensorFlow.js. Camera capture requires HTTPS or `localhost` and browser permission.

## Install and run locally

```powershell
npm ci
npm run dev
```

Open the local Vite address printed in the terminal. `npm run dev` is for development; use the production build and preview below to check deployable output.

## Machine-learning model

EcoSort is designed to use six dataset labels in this order: `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`. The app maps the source label `trash` to the readable category **Other / non-recyclable**. This is a broad label, not hazard detection.

Training uses the MIT-licensed [TrashBusters Waste Classification Harmonized Dataset](https://huggingface.co/datasets/TrashBusters/combined), pinned at revision `8c6e9226b01fc8a349750b69911b28d7d7c11443`. Its card lists 29,849 images and distinct train, validation, and test splits. The source card notes label harmonization across multiple datasets and warns about source/background bias, label noise, mixed items, and limited real-world generalization. Dataset images are downloaded to `training/cache/`, which is excluded from Git and the production bundle.

The training pipeline uses ImageNet-initialized Keras MobileNetV2 as a frozen feature extractor with a trainable six-class head. Inference preprocessing is embedded in the Keras model and exported as a TensorFlow.js layers model. See [`training/README.md`](training/README.md) for dataset acquisition, commands, licenses, and how to replace the model without changing the interface.

### Evaluation

The checked-in evaluation report uses only the dataset publisher’s held-out `test` split (4,478 images). This run trained for three epochs on a seeded, balanced cap of 500 training images per class (3,000 total), with 4,477 validation images. On the held-out test split it reached **75.06% accuracy** and **75.07% macro F1**. Per-class F1: cardboard 83.77%, glass 79.19%, metal 75.30%, paper 71.47%, plastic 63.08%, and trash 77.60%. The report and confusion matrix are in `training/reports/`.

This is a sample-limited project run, not a production benchmark. The dataset’s held-out split does not establish generalization to new sources, household conditions, or local recycling rules; the plastic class was weakest. Train on the full 20,894-image train split and evaluate on a separately sourced dataset before relying on the model beyond an educational demo. Do not substitute validation metrics for test results.

The score shown in the app is called a **Model confidence score**. It has not been calibrated as a probability. Below the user’s configured threshold the app labels the best match uncertain.

### Model files and license notes

The deployable assets are generated under `public/models/waste/` by `training/convert.py`. Those assets must include `model.json`, its weight shard(s), `config.json`, and `labels.json`. The converter writes app metadata; the model weights are not produced by frontend code. The MobileNetV2 ImageNet initialization is distributed under the Keras/TensorFlow Apache 2.0 license; the dataset card lists MIT. See [`training/README.md`](training/README.md) and the upstream cards before redistributing changed model assets.

If local model files are absent or incompatible, the classifier reports that condition and does not substitute a mock prediction.

## Model limitations

- The model assigns one of six broad classes to an image; it does not detect every object or material in mixed waste.
- “Other” is the dataset’s `trash` class and is not a hazardous-waste classifier.
- A confidence score is a model output, not a calibrated probability.
- Clean, centered dataset images can differ from real household conditions, backgrounds, lighting, and cameras.
- A material’s local recyclability depends on local collection rules, product design, and contamination. Check your local provider’s current instructions.
- Never use this classifier to assess batteries, electronics, medicines, chemicals, medical waste, leaking items, or other potentially hazardous materials.

## Privacy and data handling

- Image files are validated (JPEG, PNG, WebP, maximum 10 MB), decoded, and classified in the browser.
- The app makes no request to an image inference service and has no app backend.
- Temporary object URLs are revoked when the image is replaced or the view is left. Camera streams are stopped when the user stops capture or leaves the classifier.
- Preferences are stored under `ecosort.settings.v1`; up to 50 summaries are stored under `ecosort.history.v1`.
- History contains a UUID, timestamp, predicted category, model score, alternatives, and optional local feedback. It does not contain photographs or filenames.
- No personal information, analytics, or tracking scripts are collected.

## Tests and checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The tests cover category mapping, score threshold and invalid-output handling, file validation, disposal-guide lookups, storage recovery, route rendering, upload/error/loading/success states, history actions, and preference interactions. A mock classifier is used only by isolated tests.

## Production build and preview

```powershell
npm run build
npm run preview
```

Vite creates `dist/`. Public model assets are copied into the build and loaded using `import.meta.env.BASE_URL`; `vercel.json` rewrites page routes to the SPA entry while Vercel serves the generated assets.

## Deploy to Vercel

1. Create a GitHub repository and push this project, including `package-lock.json` and `public/models/waste/` model assets.
2. In Vercel, import that repository.
3. Use **Vite** (or set Build Command to `npm run build` and Output Directory to `dist`). Leave the Install Command at `npm install` or use `npm ci` if configured.
4. Do not add environment variables; none are required.
5. Deploy and inspect the build logs for a successful Vite build.
6. Open `/`, `/classify`, `/guide`, `/history`, `/about`, and `/settings` directly, then refresh each route.
7. In the browser Network panel, verify `models/waste/model.json` and its weight shards load from the deployed domain when classification starts. Confirm there is no application request containing the uploaded image.
8. After code changes, commit and push to GitHub; Vercel creates a new deployment. Check the new deployment’s logs and repeat route/model checks.

No live URL is included because this workspace has no authorized Vercel deployment attached.

## Troubleshooting

- **Model unavailable:** check that `public/models/waste/config.json`, `labels.json`, `model.json`, and every referenced weight shard are present. Re-run the model conversion command.
- **Weights 404 after deployment:** ensure the complete `public/models/waste/` directory is committed; Vite copies it into `dist/models/waste/`.
- **Direct page refresh returns 404:** confirm the Vercel project uses this repository’s `vercel.json` and redeploy.
- **Browser reports WebGL problems:** try an up-to-date browser or a supported CPU backend; verify TensorFlow.js assets are served from the same deployment.
- **Camera is unavailable:** camera permission requires HTTPS or localhost. File upload remains available.
- **No history appears:** browser storage may be disabled or full. Current classification still works; clear older entries or allow site storage.

## Future improvements

- Source-aware evaluation using images from a dataset source not seen during training.
- Model calibration and broader out-of-distribution testing.
- Optional PWA support only after verifying that model/runtime caching is reliable and version-safe.
- More classes only after licensing and label quality are established.
- Local export of history and accessible translations for additional communities.
