"""
Scene generation pipeline step.
Takes the list of scenes and generates one photorealistic image per scene
using the Gemini image generation model, informed by model/product/clothing/background references.

Per scene, only the references needed for that scene are sent to the model:
  - Model images:      only the model(s) that appear in the scene  (reference_models field or inferred)
  - Product images:    only the products referenced (reference_products field or all by default)
  - Clothing images:   only the clothing items used in the scene   (by scene_numbers mapping)
  - Background image:  the matching background location for the scene (by scene_numbers mapping)
"""
import os
from typing import Any, Optional

from PIL import Image
from google import genai
from dotenv import load_dotenv

from pipeline.asset_registry import build_asset_registry, load_asset_registry, save_asset_registry

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SCENES_OUTPUT_DIR = "output/scenes"


# ── Scene helpers ─────────────────────────────────────────────────────────────

def _scene_needs_model(scene: dict) -> bool:
    clothes = scene.get("model_clothes") or []
    appearance = scene.get("model_appearance") or []
    return bool(clothes) or bool(appearance)


def _clothing_has_scene_mapping(registry: dict) -> bool:
    clothing = registry.get("clothing") or {}
    for _name, info in clothing.items():
        nums = (info or {}).get("scene_numbers") or []
        if nums:
            return True
    return False


def _backgrounds_have_scene_mapping(registry: dict) -> bool:
    backgrounds = registry.get("backgrounds") or {}
    for _key, info in backgrounds.items():
        nums = (info or {}).get("scene_numbers") or []
        if nums:
            return True
    return False


# ── Reference image selector ──────────────────────────────────────────────────

def select_scene_images(
    scene: dict,
    scene_index: int,
    registry: dict[str, Any],
) -> tuple[
    list[Image.Image],  # char_images
    list[Image.Image],  # product_images
    list[Image.Image],  # clothing_images
    list[Image.Image],  # background_images (0 or 1 elements)
    str, str, str, str  # char_labels, prod_labels, cloth_labels, bg_labels
]:
    """
    Choose reference images for one scene.

    Model selection rules (in priority order):
      1. If scene has explicit `reference_models` list → use exactly those.
      2. If scene does NOT need a model (no clothes / appearance) → no model images.
      3. If there is only one model in the registry → use it.
      4. Otherwise (multi-model, no explicit hint) → use model1 only as a safe default
         (the script should explicitly set reference_models for multi-model scripts).

    Returns:
        (char_imgs, prod_imgs, cloth_imgs, bg_imgs,
         char_labels, prod_labels, cloth_labels, bg_labels)
    """
    models = registry.get("models") or {}
    products = registry.get("products") or {}
    clothing_reg = registry.get("clothing") or {}
    backgrounds_reg = registry.get("backgrounds") or {}

    scene_num = scene.get("scene", scene_index + 1)
    scene_clothes = scene.get("model_clothes") or []

    ref_models = scene.get("reference_models")       # explicit list or None
    ref_products = scene.get("reference_products")   # explicit list or None
    ref_clothing = scene.get("reference_clothing")   # explicit list or None

    # ── Character / model images ──────────────────────────────────────────────
    char_images: list[Image.Image] = []
    char_label_parts: list[str] = []

    if ref_models is not None:
        # Explicit list from script (can be [] to force no character)
        for j, key in enumerate(ref_models):
            path = models.get(key)
            if path and os.path.isfile(path):
                char_images.append(Image.open(path))
                char_label_parts.append(f"image{j + 1} = Character {key}")
    elif not _scene_needs_model(scene):
        # No characters needed for this scene (product-only / artisan / text scene)
        pass
    else:
        # Infer which model(s) to use
        sorted_keys = sorted(models.keys(), key=lambda k: (len(k), k))
        if len(sorted_keys) == 1:
            # Single model → always use it
            key = sorted_keys[0]
            path = models[key]
            if os.path.isfile(path):
                char_images.append(Image.open(path))
                char_label_parts.append(f"image1 = Character {key}")
        elif len(sorted_keys) > 1:
            # Multi-model script without explicit reference_models → use model1 as safe default
            # The script generator should set reference_models for multi-model scenes.
            key = "model1" if "model1" in models else sorted_keys[0]
            path = models[key]
            if os.path.isfile(path):
                char_images.append(Image.open(path))
                char_label_parts.append(f"image1 = Character {key}")
            print(
                f"   ⚠️  Scene {scene_num}: multi-model registry but no explicit reference_models → "
                f"defaulting to '{key}'. Set reference_models in script for precise control."
            )

    # ── Product images ────────────────────────────────────────────────────────
    prod_images: list[Image.Image] = []
    prod_label_parts: list[str] = []

    if ref_products is not None:
        for j, idx in enumerate(ref_products):
            key = str(int(idx))
            path = products.get(key)
            if path and os.path.isfile(path):
                prod_images.append(Image.open(path))
                prod_label_parts.append(f"product image {j + 1} (file product{key})")
    else:
        for j, key in enumerate(sorted(products.keys(), key=int)):
            path = products[key]
            if os.path.isfile(path):
                prod_images.append(Image.open(path))
                prod_label_parts.append(f"product image {j + 1} (file product{key})")

    # ── Clothing images ───────────────────────────────────────────────────────
    cloth_images: list[Image.Image] = []
    cloth_label_parts: list[str] = []

    if ref_clothing is not None:
        for j, name in enumerate(ref_clothing):
            info = clothing_reg.get(name)
            path = (info or {}).get("path") if isinstance(info, dict) else None
            if path and os.path.isfile(path):
                cloth_images.append(Image.open(path))
                cloth_label_parts.append(f"clothing image {j + 1} = {name}")
    elif _scene_needs_model(scene) and scene_clothes:
        selected_names: list[str] = []
        for name, info in clothing_reg.items():
            if not isinstance(info, dict):
                continue
            nums = info.get("scene_numbers") or []
            path = info.get("path")
            if not path or not os.path.isfile(path):
                continue
            if nums and scene_num in nums:
                selected_names.append(name)
        if not selected_names and not _clothing_has_scene_mapping(registry):
            for name, info in clothing_reg.items():
                if isinstance(info, dict) and info.get("path") and os.path.isfile(info["path"]):
                    selected_names.append(name)
        for j, name in enumerate(selected_names):
            path = clothing_reg[name]["path"]
            cloth_images.append(Image.open(path))
            cloth_label_parts.append(f"clothing image {j + 1} = {name}")

    # ── Background images ─────────────────────────────────────────────────────
    bg_images: list[Image.Image] = []
    bg_label_parts: list[str] = []

    # Find the background matching this scene number
    matched_bg_key: str | None = None
    if _backgrounds_have_scene_mapping(registry):
        for key, info in backgrounds_reg.items():
            if not isinstance(info, dict):
                continue
            nums = info.get("scene_numbers") or []
            path = info.get("path")
            if path and os.path.isfile(path) and scene_num in nums:
                matched_bg_key = key
                break
    else:
        # No scene mapping → skip backgrounds (or pick first as fallback)
        pass

    if matched_bg_key:
        info = backgrounds_reg[matched_bg_key]
        path = info["path"]
        description = info.get("description", matched_bg_key)
        bg_images.append(Image.open(path))
        bg_label_parts.append(f"background environment = {matched_bg_key}")

    char_labels = ", ".join(char_label_parts)
    prod_labels = ", ".join(prod_label_parts)
    cloth_labels = ", ".join(cloth_label_parts)
    bg_labels = ", ".join(bg_label_parts)

    return char_images, prod_images, cloth_images, bg_images, char_labels, prod_labels, cloth_labels, bg_labels


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(
    i: int,
    timestamp: str,
    visual_desc: str,
    voiceover: str,
    scene_clothes: list,
    scene_appearance: list,
    char_labels: str,
    prod_labels: str,
    cloth_labels: str,
    bg_labels: str,
    camera_movement: str = "",
) -> str:
    extra_context = ""
    if voiceover:
        extra_context += f' Voiceover context: "{voiceover}".'

    clothes_desc = ""
    if scene_clothes:
        if cloth_labels:
            clothes_desc = (
                f"\n\nClothing for this scene (MUST follow exactly):\n"
                + "\n".join(f"  - {c}" for c in scene_clothes)
                + f"\n  Use the provided clothing reference images ({cloth_labels}) to match fabric, color, and style."
            )
        else:
            clothes_desc = (
                f"\n\nClothing for this scene:\n"
                + "\n".join(f"  - {c}" for c in scene_clothes)
            )

    appearance_desc = ""
    if scene_appearance:
        appearance_desc = (
            f"\n\nModel appearance for this scene (MUST match exactly):\n"
            + "\n".join(f"  - {a}" for a in scene_appearance)
        )

    camera_desc = ""
    if camera_movement and str(camera_movement).strip():
        camera_desc = (
            f"\n\nCamera / shot (compose this frame as the key moment of this take):\n"
            f"  {camera_movement.strip()}\n"
            f"  Match framing, perspective, and lens character implied above; this is a single still, not a sequence."
        )

    bg_desc = ""
    if bg_labels:
        bg_desc = (
            f"\n\nBackground environment reference:\n"
            f"  Use the provided background image ({bg_labels}) as the exact environment/setting for this scene.\n"
            f"  Preserve the lighting, atmosphere, colours, and spatial feel of the background reference.\n"
            f"  The background should be seamlessly integrated with the characters and products."
        )

    ref_lines: list[str] = []
    if char_labels:
        ref_lines.append(f"  Character references: {char_labels}")
    if prod_labels:
        ref_lines.append(f"  Product references:   {prod_labels}")
    if cloth_labels:
        ref_lines.append(f"  Clothing references:  {cloth_labels}")
    if bg_labels:
        ref_lines.append(f"  Background reference: {bg_labels}")

    if ref_lines:
        ref_block = (
            "STRICT REFERENCE USAGE RULES:\n"
            "You are given reference images (listed below). You MUST use them as the EXACT visual "
            "source for characters, clothing, and background. Do NOT re-imagine or invent any element "
            "that has a reference — reproduce it faithfully in the generated scene.\n\n"
            "Reference images provided:\n" + "\n".join(ref_lines)
        )
    else:
        ref_block = "No reference images are provided for this scene; rely on the description only."

    req_model = []
    if char_labels:
        req_model.append(
            "- Character face, skin tone, body type and physical features MUST exactly match the character reference image(s). Do not alter them."
        )
    if cloth_labels:
        req_model.append(
            "- Clothing fabric, color, pattern and style MUST exactly match the clothing reference image(s). Do not alter them."
        )
    elif scene_clothes:
        req_model.append("- Clothing MUST match the written description exactly.")
    if bg_labels:
        req_model.append(
            "- The background environment MUST be taken directly from the background reference image. "
            "Do not create a new background — use the reference as the actual scene environment."
        )

    req_lines = "\n".join(req_model) if req_model else "- Follow the visual description exactly."

    prompt = (
        f"{ref_block}\n\nGenerate a single photorealistic, cinematic advertisement scene image."
        f"\n\nScene {i + 1} [{timestamp}]:\n{visual_desc}{extra_context}"
        + clothes_desc
        + appearance_desc
        + camera_desc
        + bg_desc
        + f"\n\nRequirements:\n"
        f"- Extremely photorealistic with perfect cinematic lighting.\n"
        f"{req_lines}\n"
        f"- Product clearly visible and prominent where relevant.\n"
        f"- Vibrant, high-end fashion advertisement style.\n"
        f"- No watermarks, no borders, no text overlays."
        f"IMPORTANT COMPOSITION RULES: Strict 9:16 vertical aspect ratio — Portrait orientation"
    )
    return prompt


# ── Public API ────────────────────────────────────────────────────────────────

def run_scene_generation(
    scenes: list,
    asset_registry: Optional[dict[str, Any]] = None,
    output_dir: str = "output",
) -> list[str]:
    """
    For each scene in `scenes`, generate one photorealistic advertisement still image.

    Reference images sent per scene:
      - Model:      only the model(s) relevant to that scene
      - Product:    relevant products (all by default)
      - Clothing:   only the clothing used in that scene (matched by scene_numbers)
      - Background: the background environment for that scene (matched by scene_numbers)

    If ``asset_registry`` is None, loads ``output/asset_registry.json`` or builds it from disk.

    Returns a sorted list of paths to the generated scene PNGs.
    Raises FileNotFoundError if required reference images are missing globally.
    """
    os.makedirs(SCENES_OUTPUT_DIR, exist_ok=True)

    registry = asset_registry
    if registry is None:
        registry = load_asset_registry(output_dir)
    if registry is None:
        registry = build_asset_registry(output_dir, extract_result=None, clothing_items=None)
        save_asset_registry(registry, output_dir)

    models = registry.get("models") or {}
    products = registry.get("products") or {}
    backgrounds = registry.get("backgrounds") or {}

    if not products:
        raise FileNotFoundError(
            "No product images found in output/ (product1.png, product2.png, …)"
        )

    needs_any_model = any(_scene_needs_model(s) for s in scenes)
    if needs_any_model and not models:
        raise FileNotFoundError(
            "No character/model images found under output/models/ or output/model*.png"
        )

    print(
        f"\n✅ Asset registry: {len(models)} model(s), {len(products)} product(s), "
        f"{len(registry.get('clothing') or {})} clothing item(s), "
        f"{len(backgrounds)} background(s) — selective refs per scene"
    )

    scene_paths: list[str] = []

    for i, scene in enumerate(scenes):
        timestamp = scene.get("timestamp", f"scene_{i + 1}")
        visual_desc = scene.get("visual", "")
        voiceover = scene.get("voiceover") or ""
        scene_clothes = scene.get("model_clothes") or []
        scene_appearance = scene.get("model_appearance") or []
        camera_movement = scene.get("camera_movement") or ""

        safe_name = timestamp.replace(":", "_").replace(".", "_").replace("-", "_to_")
        output_path = os.path.join(SCENES_OUTPUT_DIR, f"scene_{i + 1:02d}_{safe_name}.png")

        if os.path.exists(output_path):
            print(f"\n⏭️  Scene {i + 1}: already exists, skipping.")
            scene_paths.append(output_path)
            continue

        (
            char_imgs, prod_imgs, cloth_imgs, bg_imgs,
            char_labels, prod_labels, cloth_labels, bg_labels,
        ) = select_scene_images(scene, i, registry)

        # Put reference images FIRST (before the text prompt) so Gemini attends to them properly.
        # Order: background → characters → clothing → products → prompt text
        all_input_images = bg_imgs + char_imgs + cloth_imgs + prod_imgs

        prompt = _build_prompt(
            i,
            timestamp,
            visual_desc,
            voiceover,
            scene_clothes,
            scene_appearance,
            char_labels,
            prod_labels,
            cloth_labels,
            bg_labels,
            camera_movement,
        )

        n_char = len(char_imgs)
        n_prod = len(prod_imgs)
        n_cloth = len(cloth_imgs)
        n_bg = len(bg_imgs)
        print(
            f"\n🎬 Generating scene {i + 1}/{len(scenes)}: [{timestamp}] {visual_desc[:70]}… "
            f"(refs: {n_char} char, {n_prod} product, {n_cloth} clothing, {n_bg} background)"
        )

        # Pass images first, then the text prompt
        contents = all_input_images + [prompt]
        response = _client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=contents,
        )

        saved = False
        for part in response.parts:
            if part.text is not None:
                print(f"   ℹ️  Model text: {part.text}")
            elif part.inline_data is not None:
                img = part.as_image()
                img.save(output_path)
                print(f"   ✅ Saved → {output_path}")
                scene_paths.append(output_path)
                saved = True
                break

        if not saved:
            print(f"   ⚠️  No image returned for scene {i + 1}")

    return sorted(scene_paths)
