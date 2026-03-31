"""
Persisted asset registry for selective scene reference images.
Maps models, products, clothing, and backgrounds file paths;
clothing includes scene_numbers from extraction.
"""
from __future__ import annotations

import json
import os
import glob
from typing import Any, Optional

REGISTRY_FILENAME = "asset_registry.json"


def discover_products(output_dir: str = "output") -> dict[str, str]:
    """Map product index string '1','2' -> relative path."""
    products: dict[str, str] = {}
    pattern = os.path.join(output_dir, "product*.*")
    for path in sorted(glob.glob(pattern)):
        base = os.path.basename(path)
        if not base.lower().startswith("product"):
            continue
        stem = base[len("product") :].rsplit(".", 1)[0]
        if stem.isdigit():
            products[stem] = path.replace("\\", "/")
    return products


def discover_models(output_dir: str = "output") -> dict[str, str]:
    """
    Map model key (e.g. model1) -> path.
    Scans output/models/* then output/model*.* in the output root (upload path).
    """
    candidates: list[str] = []
    models_dir = os.path.join(output_dir, "models")
    if os.path.isdir(models_dir):
        for f in sorted(glob.glob(os.path.join(models_dir, "*.*"))):
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                candidates.append(f)
    for f in sorted(glob.glob(os.path.join(output_dir, "model*.*"))):
        if os.path.isfile(f) and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            candidates.append(f)

    seen: set[str] = set()
    uniq: list[str] = []
    for p in candidates:
        ap = os.path.abspath(p)
        if ap not in seen:
            seen.add(ap)
            uniq.append(p)

    explicit: dict[str, str] = {}
    others: list[str] = []
    for path in sorted(uniq):
        stem = os.path.splitext(os.path.basename(path))[0]
        if stem.startswith("model") and len(stem) > 5 and stem[5:].isdigit():
            explicit[stem] = path.replace("\\", "/")
        else:
            others.append(path)

    result = dict(explicit)
    auto_i = 1
    for path in others:
        while f"model{auto_i}" in result:
            auto_i += 1
        key = f"model{auto_i}"
        auto_i += 1
        result[key] = path.replace("\\", "/")
    return result


def discover_backgrounds(output_dir: str = "output") -> dict[str, Any]:
    """
    Scan output/backgrounds/ and map filename stem -> { path, scene_numbers }.
    scene_numbers will be empty (filled properly when built from extract_result).
    """
    backgrounds: dict[str, Any] = {}
    bg_dir = os.path.join(output_dir, "backgrounds")
    if not os.path.isdir(bg_dir):
        return backgrounds
    for path in sorted(glob.glob(os.path.join(bg_dir, "*.*"))):
        if path.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            key = os.path.splitext(os.path.basename(path))[0]
            backgrounds[key] = {
                "path": path.replace("\\", "/"),
                "scene_numbers": [],
                "description": "",
            }
    return backgrounds


def build_asset_registry(
    output_dir: str = "output",
    *,
    extract_result: dict | None = None,
    clothing_items: list | None = None,
) -> dict[str, Any]:
    """
    Build registry dict: models, products, clothing, backgrounds.

    - clothing: name -> { path, scene_numbers }
    - backgrounds: key -> { path, scene_numbers, description }

    If extract_result is set, models/clothing/backgrounds come from extraction output.
    Otherwise paths are discovered on disk; clothing/background entries have empty scene_numbers.
    """
    clothing_items = clothing_items or []
    products = discover_products(output_dir)

    if extract_result:
        models = {k: v.replace("\\", "/") for k, v in extract_result.get("model_images", {}).items()}

        by_name = {item.name: item for item in clothing_items}
        clothing: dict[str, Any] = {}
        for name, path in extract_result.get("clothing_images", {}).items():
            item = by_name.get(name)
            scene_nums = list(item.scene_numbers) if item else []
            clothing[name] = {"path": path.replace("\\", "/"), "scene_numbers": scene_nums}

        # Backgrounds from extract_result (already { key: { path, scene_numbers, description } })
        backgrounds: dict[str, Any] = {}
        for key, info in extract_result.get("background_images", {}).items():
            if isinstance(info, dict) and info.get("path"):
                backgrounds[key] = {
                    "path": info["path"].replace("\\", "/"),
                    "scene_numbers": info.get("scene_numbers", []),
                    "description": info.get("description", ""),
                }
    else:
        models = discover_models(output_dir)
        clothing = {}
        cloth_dir = os.path.join(output_dir, "clothing")
        if os.path.isdir(cloth_dir):
            for path in sorted(glob.glob(os.path.join(cloth_dir, "*.*"))):
                if path.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                    name = os.path.splitext(os.path.basename(path))[0]
                    clothing[name] = {"path": path.replace("\\", "/"), "scene_numbers": []}
        backgrounds = discover_backgrounds(output_dir)

    return {
        "models": models,
        "products": products,
        "clothing": clothing,
        "backgrounds": backgrounds,
    }


def save_asset_registry(registry: dict[str, Any], output_dir: str = "output") -> str:
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, REGISTRY_FILENAME)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
    print(f"   📦 Saved asset registry → {path}")
    return path


def load_asset_registry(output_dir: str = "output") -> Optional[dict[str, Any]]:
    path = os.path.join(output_dir, REGISTRY_FILENAME)
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
