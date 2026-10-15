"""Train EcoSort's six-class classifier with MobileNetV2 transfer learning."""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import tensorflow as tf
import tf_keras as keras

from common import CLASS_NAMES, DATASET_REVISION, IMAGE_SIZE, SEED, balanced_subset, class_counts, ensure_dir, iter_examples, load_splits

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "training" / "output"
REPORTS = ROOT / "training" / "reports"


def as_tf_dataset(dataset, batch_size: int, image_size: int, shuffle: bool):
    signature = (
        tf.TensorSpec(shape=(image_size, image_size, 3), dtype=tf.uint8),
        tf.TensorSpec(shape=(), dtype=tf.int32),
    )
    result = tf.data.Dataset.from_generator(lambda: iter_examples(dataset, image_size), output_signature=signature)
    if shuffle:
        result = result.shuffle(2048, seed=SEED, reshuffle_each_iteration=True)
    return result.batch(batch_size).prefetch(tf.data.AUTOTUNE)


def build_model(image_size: int, num_classes: int) -> keras.Model:
    inputs = keras.Input(shape=(image_size, image_size, 3), name="rgb_0_255")
    scaled = keras.layers.Rescaling(1.0 / 127.5, offset=-1, name="mobilenet_normalize")(inputs)
    backbone = keras.applications.MobileNetV2(
        input_shape=(image_size, image_size, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False
    features = backbone(scaled, training=False)
    pooled = keras.layers.GlobalAveragePooling2D(name="global_average_pooling")(features)
    dropped = keras.layers.Dropout(0.25, name="classifier_dropout")(pooled)
    outputs = keras.layers.Dense(num_classes, activation="softmax", name="waste_class_scores")(dropped)
    model = keras.Model(inputs, outputs, name="ecosort_mobilenetv2")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", type=Path, default=ROOT / "training" / "cache", help="Hugging Face dataset cache (excluded from Git).")
    parser.add_argument("--max-train-per-class", type=int, default=0, help="Optional balanced cap per class; 0 uses the complete published train split.")
    parser.add_argument("--epochs", type=int, default=6)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--image-size", type=int, default=IMAGE_SIZE)
    parser.add_argument("--seed", type=int, default=SEED)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.epochs < 1 or args.batch_size < 1 or args.image_size < 96:
        raise ValueError("epochs and batch size must be positive; image size must be at least 96.")
    keras.utils.set_random_seed(args.seed)
    print(f"Loading {CLASS_NAMES} from the published dataset splits…", flush=True)
    splits = load_splits(str(args.cache_dir))
    train_data = balanced_subset(splits["train"], args.max_train_per_class, args.seed)
    validation_data = splits["validation"]
    counts = class_counts(train_data)
    print(f"Training examples: {len(train_data)} ({counts})", flush=True)
    print(f"Validation examples: {len(validation_data)}", flush=True)

    train_tf = as_tf_dataset(train_data, args.batch_size, args.image_size, shuffle=True)
    validation_tf = as_tf_dataset(validation_data, args.batch_size, args.image_size, shuffle=False)
    model = build_model(args.image_size, len(CLASS_NAMES))
    ensure_dir(OUTPUT)
    ensure_dir(REPORTS)
    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=2, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=1, min_lr=1e-5),
        keras.callbacks.ModelCheckpoint(OUTPUT / "best.weights.h5", monitor="val_loss", save_best_only=True, save_weights_only=True),
    ]
    history = model.fit(
        train_tf,
        validation_data=validation_tf,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=2,
    )
    model.load_weights(OUTPUT / "best.weights.h5")
    model.save(OUTPUT / "waste-classifier.keras")
    model.save(OUTPUT / "waste-classifier.h5", include_optimizer=False)

    training_record = {
        "dataset": "TrashBusters/combined",
        "dataset_revision": DATASET_REVISION,
        "dataset_license": "MIT (as listed by the dataset card)",
        "class_order": CLASS_NAMES,
        "image_size": args.image_size,
        "seed": args.seed,
        "batch_size": args.batch_size,
        "requested_epochs": args.epochs,
        "epochs_completed": len(history.history.get("loss", [])),
        "max_train_per_class": args.max_train_per_class or None,
        "train_examples": len(train_data),
        "train_class_counts": counts,
        "validation_examples": len(validation_data),
        "backbone": "MobileNetV2 ImageNet weights, frozen feature extractor",
        "optimizer": "Adam",
        "learning_rate": 0.001,
        "loss": "sparse_categorical_crossentropy",
        "tensorflow_version": tf.__version__,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "validation_accuracy_per_epoch": [float(value) for value in history.history.get("val_accuracy", [])],
    }
    (REPORTS / "training-config.json").write_text(json.dumps(training_record, indent=2) + "\n", encoding="utf-8")
    print(f"Saved Keras model to {OUTPUT / 'waste-classifier.keras'}", flush=True)


if __name__ == "__main__":
    main()
