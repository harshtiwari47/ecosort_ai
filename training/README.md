# EcoSort AI training and model assets

This directory contains the reproducible six-class transfer-learning pipeline. Dataset images and intermediate Keras models stay outside `public/`; only the converted inference assets are copied into `public/models/waste/`.

## Dataset and labels

Use the [TrashBusters Waste Classification Harmonized Dataset](https://huggingface.co/datasets/TrashBusters/combined). Its dataset card reports an MIT license, 29,849 images, and distinct train (20,894), validation (4,477), and test (4,478) splits. It defines `cardboard`, `glass`, `metal`, `paper`, `plastic`, and `trash`. The application displays `trash` as **Other / non-recyclable**. This mapping follows the dataset's broad trash class and does not mean that the model can recognize hazardous or special waste.

The dataset card lists source datasets and their stated licenses. Review that card and the source terms again before redistributing a dataset copy. The code downloads the published splits into `training/cache/`; it does not copy raw images into the app bundle.

## Software and model attribution

- TensorFlow/Keras and TensorFlow.js: Apache 2.0.
- MobileNetV2 ImageNet initialization: Keras Applications pretrained weights, Apache 2.0; [Keras MobileNetV2 API](https://keras.io/api/applications/mobilenet/).
- Waste images: TrashBusters dataset card, MIT.

Keep these attributions with redistributed model files. This student model is for education and should not be used for industrial sorting, safety decisions, or local recycling eligibility decisions.

## Python setup

Use Python 3.11 or 3.12. The dataset, TensorFlow runtime, and TensorFlow.js converter packages have different dependency constraints on Windows. The Keras converter does not need TensorFlow Decision Forests or JAX, but TensorFlow.js 4.22 eagerly imports their converter modules. Its TFDF extra pins an older TensorFlow release, so install the converter without dependencies after the runtime packages. The conversion script supplies no-op imports for those unused converter paths and exports only the Keras model. TensorFlow Hub 0.16.1 also expects `pkg_resources`, so setuptools is pinned below version 81.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r training/requirements.txt
.\.venv\Scripts\python.exe -m pip install --no-deps tensorflowjs==4.22.0
```

The `.venv`, Hugging Face cache, and intermediate model files are ignored by Git.

## Train

```powershell
.\.venv\Scripts\python.exe training/train.py
```

The script downloads the publisher’s official Parquet shards at dataset revision `8c6e9226b01fc8a349750b69911b28d7d7c11443` into `training/cache/parquet/`, verifies complete transfers, and loads the named `train`, `validation`, and `test` splits with Hugging Face Datasets. It uses only the publisher’s `train` and `validation` splits during fitting, seeds the random operations, initializes MobileNetV2 from ImageNet weights, and trains a six-output classification head. By default it uses the complete train split. A smaller balanced run can be used for a quick smoke check:

```powershell
.\.venv\Scripts\python.exe training/train.py --max-train-per-class 500 --epochs 3
```

The cap is selected per class with a fixed seed. This is a smoke/iteration option; use the full split for the final candidate. The saved Keras models and best checkpoint go to ignored `training/output/`. The exact run configuration and validation history are written to the tracked `training/reports/training-config.json`.

## Evaluate on held-out test data

```powershell
.\.venv\Scripts\python.exe training/evaluate.py
```

This loads the **test** split, which is not used by training or model selection. The command writes `training/reports/evaluation.json` and `training/reports/confusion-matrix.csv`, reporting accuracy, macro precision/recall/F1, support and precision/recall/F1 per class, and the confusion matrix. Preserve the generated reports with the model version they describe. Do not copy validation or training scores into the test report.

## Convert for the browser

```powershell
.\.venv\Scripts\python.exe training/convert.py
```

The converter runs TensorFlow.js's Keras converter and writes `model.json`, weight shards, `config.json`, and `labels.json` under `public/models/waste/`. The manifest says that the input is raw RGB 0–255 because Keras embeds MobileNetV2 normalization. Keep the six model labels in the exact output-layer order. Then run `npm run build` and open `/classify`; the frontend validates the input/output shape and label count before it enables a result.

## Replace a model without changing the frontend

Train or obtain a model with the same six ordered outputs, RGB input, and embedded normalization. Convert it to a TensorFlow.js **layers model**, then replace the contents of `public/models/waste/` and update `config.json`'s version, input size, input scale, labels, and source. Keep `labels.json`, training configuration, evaluation report, license, and attribution aligned. The frontend contract is `predictImage(image) -> ranked predictions`; model loading and preprocessing remain in `src/features/classifier/modelService.ts`.

If an operation in a replacement model is unsupported by the TensorFlow.js converter, conversion fails. Do not switch the production UI to mock results; leave the classifier unavailable until a compatible model is produced.
