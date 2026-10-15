"""Shared dataset and image helpers for the EcoSort training workflow."""
from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

import numpy as np
import requests
from datasets import Dataset, DatasetDict, load_dataset
from PIL import Image, ImageOps

DATASET_ID = "TrashBusters/combined"
DATASET_REVISION = "8c6e9226b01fc8a349750b69911b28d7d7c11443"
CLASS_NAMES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]
IMAGE_SIZE = 160
SEED = 42
DATASET_FILES = {
    "train": [
        "data/train-00000-of-00003.parquet",
        "data/train-00001-of-00003.parquet",
        "data/train-00002-of-00003.parquet",
    ],
    "validation": ["data/validation-00000-of-00001.parquet"],
    "test": ["data/test-00000-of-00001.parquet"],
}


def download_dataset_files(cache_dir: str | None = None) -> dict[str, list[str]]:
    """Download the publisher's parquet files and publish each file atomically."""
    root = Path(cache_dir) if cache_dir else Path("training/cache")
    parquet_dir = root / "parquet"
    parquet_dir.mkdir(parents=True, exist_ok=True)
    local_files: dict[str, list[str]] = {split: [] for split in DATASET_FILES}

    for split, filenames in DATASET_FILES.items():
        for filename in filenames:
            destination = parquet_dir / Path(filename).name
            if not destination.exists():
                url = f"https://huggingface.co/datasets/{DATASET_ID}/resolve/{DATASET_REVISION}/{quote(filename)}"
                temporary = destination.with_suffix(destination.suffix + ".part")
                temporary.unlink(missing_ok=True)
                print(f"Downloading {filename}…", flush=True)
                downloaded = 0
                with requests.get(url, stream=True, timeout=(20, 120)) as response:
                    response.raise_for_status()
                    expected = int(response.headers.get("content-length", 0))
                    with temporary.open("wb") as output:
                        for chunk in response.iter_content(chunk_size=1024 * 1024):
                            if chunk:
                                output.write(chunk)
                                downloaded += len(chunk)
                                if downloaded // (64 * 1024 * 1024) != (downloaded - len(chunk)) // (64 * 1024 * 1024):
                                    if expected:
                                        print(f"  {downloaded / expected:.0%} ({downloaded / 1024**2:.0f} MiB)", flush=True)
                if expected and downloaded != expected:
                    temporary.unlink(missing_ok=True)
                    raise IOError(f"Incomplete download for {filename}: expected {expected}, received {downloaded} bytes.")
                temporary.replace(destination)
                print(f"  Saved {downloaded / 1024**2:.0f} MiB.", flush=True)
            local_files[split].append(str(destination))
    return local_files


def load_splits(cache_dir: str | None = None) -> DatasetDict:
    """Load the dataset's published, separate train/validation/test splits."""
    parquet_files = download_dataset_files(cache_dir)
    dataset = load_dataset("parquet", data_files=parquet_files, cache_dir=cache_dir)
    if not isinstance(dataset, DatasetDict):
        raise TypeError("Expected the dataset repository to provide named splits.")
    missing = {"train", "validation", "test"} - set(dataset.keys())
    if missing:
        raise ValueError(f"Dataset is missing required splits: {', '.join(sorted(missing))}")
    return dataset


def get_label(row: dict[str, Any]) -> int:
    """Resolve a label defensively from the harmonized name or label id."""
    name = row.get("label_name")
    if isinstance(name, str) and name.lower() in CLASS_NAMES:
        return CLASS_NAMES.index(name.lower())
    label_id = row.get("label_id", row.get("label"))
    if isinstance(label_id, (int, np.integer)) and 0 <= int(label_id) < len(CLASS_NAMES):
        return int(label_id)
    raise ValueError(f"Unsupported dataset label: name={name!r}, id={label_id!r}")


def label_column(dataset: Dataset) -> str:
    """Return the label column so sampling/counts can skip image decoding."""
    for column in ("label_name", "label_id", "label"):
        if column in dataset.column_names:
            return column
    raise ValueError(f"Dataset has no supported label column: {dataset.column_names}")


def image_to_array(image_value: Any, size: int = IMAGE_SIZE) -> np.ndarray:
    """Decode an HF image, honor orientation, and resize to RGB uint8."""
    if isinstance(image_value, Image.Image):
        image = image_value
    elif isinstance(image_value, dict) and image_value.get("bytes"):
        import io
        image = Image.open(io.BytesIO(image_value["bytes"]))
    elif isinstance(image_value, dict) and image_value.get("path"):
        image = Image.open(image_value["path"])
    else:
        raise ValueError("Dataset row does not contain a decodable image.")
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = image.resize((size, size), resample=Image.Resampling.BILINEAR)
    return np.asarray(image, dtype=np.uint8)


def balanced_subset(dataset: Dataset, per_class: int, seed: int = SEED) -> Dataset:
    """Pick at most N examples from each class with a reproducible shuffle."""
    if per_class <= 0:
        return dataset.shuffle(seed=seed)
    indices_by_class: dict[int, list[int]] = {index: [] for index in range(len(CLASS_NAMES))}
    shuffled = dataset.shuffle(seed=seed)
    field = label_column(shuffled)
    for index, raw_label in enumerate(shuffled[field]):
        label = get_label({field: raw_label})
        if len(indices_by_class[label]) < per_class:
            indices_by_class[label].append(index)
    counts = {CLASS_NAMES[label]: len(indices) for label, indices in indices_by_class.items()}
    if any(count == 0 for count in counts.values()):
        raise ValueError(f"At least one class had no training examples: {counts}")
    selected = [index for indices in indices_by_class.values() for index in indices]
    return shuffled.select(selected).shuffle(seed=seed)


def class_counts(dataset: Iterable[dict[str, Any]]) -> dict[str, int]:
    if isinstance(dataset, Dataset):
        field = label_column(dataset)
        values = ({field: value} for value in dataset[field])
    else:
        values = iter(dataset)
    counts: Counter[str] = Counter()
    for row in values:
        counts[CLASS_NAMES[get_label(row)]] += 1
    return {name: counts.get(name, 0) for name in CLASS_NAMES}


def iter_examples(dataset: Iterable[dict[str, Any]], image_size: int = IMAGE_SIZE):
    for row in dataset:
        yield image_to_array(row["image"], image_size), np.int32(get_label(row))


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
