"""Convert the trained Keras model into local TensorFlow.js assets."""
from __future__ import annotations

import argparse
import json
import sys
import types
from pathlib import Path

from common import CLASS_NAMES, DATASET_REVISION, IMAGE_SIZE

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "training" / "output" / "waste-classifier.h5"
DESTINATION = ROOT / "public" / "models" / "waste"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=MODEL)
    parser.add_argument("--image-size", type=int, default=IMAGE_SIZE)
    parser.add_argument("--version", default="ecosort-mobilenetv2-1.0.0")
    args = parser.parse_args()
    if not args.model.exists():
        raise FileNotFoundError(f"Keras model not found: {args.model}. Run training/train.py first.")
    DESTINATION.mkdir(parents=True, exist_ok=True)
    # TensorFlow.js 4.22 eagerly imports its TFDF and JAX converter modules,
    # even for Keras H5 conversion. TFDF pins an older TensorFlow release and
    # JAX is not needed here. Neither module is referenced by Keras conversion;
    # these no-op import shims keep that path compatible.
    sys.modules.setdefault("tensorflow_decision_forests", types.ModuleType("tensorflow_decision_forests"))
    jax_module = types.ModuleType("jax")
    jax_module.__path__ = []
    jax_module.monitoring = types.SimpleNamespace(record_scalar=lambda *args, **kwargs: None)
    jax_experimental = types.ModuleType("jax.experimental")
    jax_experimental.__path__ = []
    jax2tf_module = types.ModuleType("jax.experimental.jax2tf")
    jax_experimental.jax2tf = jax2tf_module
    sys.modules.setdefault("jax", jax_module)
    sys.modules.setdefault("jax.experimental", jax_experimental)
    sys.modules.setdefault("jax.experimental.jax2tf", jax2tf_module)
    from tensorflowjs.converters.converter import convert

    convert([
        "--input_format=keras",
        "--output_format=tfjs_layers_model",
        str(args.model),
        str(DESTINATION),
    ])
    config = {
        "version": args.version,
        "inputSize": args.image_size,
        "inputScale": 1.0,
        "labels": CLASS_NAMES,
        "source": f"TensorFlow/Keras MobileNetV2 fine-tuned on TrashBusters/combined@{DATASET_REVISION}",
    }
    labels = {
        "classes": CLASS_NAMES,
        "applicationCategories": {
            "cardboard": "cardboard",
            "glass": "glass",
            "metal": "metal",
            "paper": "paper",
            "plastic": "plastic",
            "trash": "other",
        },
        "note": "The source label trash is displayed as Other / non-recyclable.",
        "dataset": "TrashBusters/combined",
        "datasetRevision": DATASET_REVISION,
        "datasetLicense": "MIT",
        "modelLicense": "Apache-2.0 (MobileNetV2 ImageNet initialization) plus project fine-tuning",
    }
    (DESTINATION / "config.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    (DESTINATION / "labels.json").write_text(json.dumps(labels, indent=2) + "\n", encoding="utf-8")
    print(f"TensorFlow.js assets written to {DESTINATION}")


if __name__ == "__main__":
    main()
