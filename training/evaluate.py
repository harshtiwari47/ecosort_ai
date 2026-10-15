"""Evaluate a saved model on the dataset's held-out test split."""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
import tf_keras as keras

from common import CLASS_NAMES, DATASET_REVISION, IMAGE_SIZE, ensure_dir, iter_examples, load_splits

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "training" / "output" / "waste-classifier.keras"
REPORTS = ROOT / "training" / "reports"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=OUTPUT)
    parser.add_argument("--cache-dir", type=Path, default=ROOT / "training" / "cache")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--image-size", type=int, default=IMAGE_SIZE)
    return parser.parse_args()


def metrics_from_confusion(matrix: np.ndarray) -> dict:
    per_class = {}
    for index, name in enumerate(CLASS_NAMES):
        true_positive = int(matrix[index, index])
        predicted = int(matrix[:, index].sum())
        actual = int(matrix[index, :].sum())
        precision = true_positive / predicted if predicted else 0.0
        recall = true_positive / actual if actual else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[name] = {
            "support": actual,
            "precision": round(precision, 6),
            "recall": round(recall, 6),
            "f1": round(f1, 6),
        }
    total = int(matrix.sum())
    accuracy = float(np.trace(matrix) / total) if total else 0.0
    return {
        "accuracy": round(accuracy, 6),
        "macro_precision": round(float(np.mean([item["precision"] for item in per_class.values()])), 6),
        "macro_recall": round(float(np.mean([item["recall"] for item in per_class.values()])), 6),
        "macro_f1": round(float(np.mean([item["f1"] for item in per_class.values()])), 6),
        "per_class": per_class,
    }


def main() -> None:
    args = parse_args()
    if not args.model.exists():
        raise FileNotFoundError(f"Model not found: {args.model}. Run training/train.py first.")
    dataset = load_splits(str(args.cache_dir))["test"]
    signature = (
        tf.TensorSpec(shape=(args.image_size, args.image_size, 3), dtype=tf.uint8),
        tf.TensorSpec(shape=(), dtype=tf.int32),
    )
    test = tf.data.Dataset.from_generator(lambda: iter_examples(dataset, args.image_size), output_signature=signature).batch(args.batch_size).prefetch(tf.data.AUTOTUNE)
    model = keras.models.load_model(args.model, compile=False)
    matrix = np.zeros((len(CLASS_NAMES), len(CLASS_NAMES)), dtype=np.int64)
    seen = 0
    for images, labels in test:
        scores = model(images, training=False).numpy()
        truth = labels.numpy().astype(np.int64)
        predictions = np.argmax(scores, axis=1)
        for actual, predicted in zip(truth, predictions, strict=True):
            matrix[actual, predicted] += 1
        seen += len(truth)
    report = {
        "evaluation_split": "test (held out by the dataset publisher)",
        "dataset": "TrashBusters/combined",
        "dataset_revision": DATASET_REVISION,
        "dataset_license": "MIT (as listed by the dataset card)",
        "test_examples": seen,
        "class_order": CLASS_NAMES,
        "model": str(args.model.relative_to(ROOT)) if args.model.is_relative_to(ROOT) else args.model.name,
        "tensorflow_version": tf.__version__,
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        **metrics_from_confusion(matrix),
        "confusion_matrix": matrix.tolist(),
    }
    ensure_dir(REPORTS)
    (REPORTS / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    csv = "true/predicted," + ",".join(CLASS_NAMES) + "\n"
    csv += "\n".join(f"{name}," + ",".join(str(value) for value in row) for name, row in zip(CLASS_NAMES, matrix, strict=True)) + "\n"
    (REPORTS / "confusion-matrix.csv").write_text(csv, encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("accuracy", "macro_precision", "macro_recall", "macro_f1", "test_examples", "per_class")}, indent=2))


if __name__ == "__main__":
    main()
