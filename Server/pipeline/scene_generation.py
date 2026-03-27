"""
Scene generation pipeline step.
Takes the list of scenes and generates one photorealistic image per scene
using the Gemini image generation model, informed by model/product/clothing references.
"""
import os
import glob
from io import BytesIO

from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SCENES_OUTPUT_DIR = "output/scenes"


def _load_images_by_prefix(prefix: str, folder: str) -> list[Image.Image]:
    """Load all images matching <folder>/<prefix>*.png, sorted by filename."""
    pattern = os.path.join(folder, f"{prefix}*.png")
    paths = sorted(glob.glob(pattern))
    images = []
    for path in paths:
        try:
            images.append(Image.open(path))
            print(f"   📷 Loaded {path}")
        except Exception as e:
            print(f"   ⚠️  Could not load {path}: {e}")
    return images


def run_scene_generation(scenes: list) -> list[str]:
    """
    For each scene in `scenes`, generate one photorealistic advertisement still image
    using character, product, and clothing reference images from output/.

    Returns a sorted list of paths to the generated scene PNGs.
    Raises FileNotFoundError if required reference images are missing.
    """
    os.makedirs(SCENES_OUTPUT_DIR, exist_ok=True)

    # Load reference images
    character_images = _load_images_by_prefix("model", "output")
    product_images   = _load_images_by_prefix("product", "output")
    clothing_images  = _load_images_by_prefix("clothing", "output/clothing")

    print(f"\n✅ References: {len(character_images)} model(s), "
          f"{len(product_images)} product(s), {len(clothing_images)} clothing item(s)")

    if not character_images:
        raise FileNotFoundError("No character images found in output/ (model1.png, model2.png, …)")
    if not product_images:
        raise FileNotFoundError("No product images found in output/ (product1.png, product2.png, …)")

    char_labels    = ", ".join([f"image{i+1} = Character {i+1}" for i in range(len(character_images))])
    prod_labels    = ", ".join([f"product image {i+1}" for i in range(len(product_images))])
    cloth_labels   = ", ".join([f"clothing image {i+1} = Cloth Reference {i+1}" for i in range(len(clothing_images))])

    all_input_images = character_images + product_images + clothing_images
    scene_paths = []

    for i, scene in enumerate(scenes):
        timestamp      = scene.get("timestamp", f"scene_{i+1}")
        visual_desc    = scene.get("visual", "")
        dialogue       = scene.get("dialogue") or ""
        voiceover      = scene.get("voiceover") or ""
        scene_clothes  = scene.get("model_clothes") or []
        scene_appearance = scene.get("model_appearance") or []

        # Build safe output filename
        safe_name = timestamp.replace(":", "_").replace(".", "_").replace("-", "_to_")
        output_path = os.path.join(SCENES_OUTPUT_DIR, f"scene_{i+1:02d}_{safe_name}.png")

        if os.path.exists(output_path):
            print(f"\n⏭️  Scene {i+1}: already exists, skipping.")
            scene_paths.append(output_path)
            continue

        # Build extra context
        extra_context = ""
        if dialogue:
            extra_context += f" Dialogue: \"{dialogue}\"."
        if voiceover:
            extra_context += f" Voiceover context: \"{voiceover}\"."

        clothes_desc = ""
        if scene_clothes:
            clothes_desc = (
                f"\n\nClothing for this scene (MUST follow exactly):\n"
                + "\n".join(f"  - {c}" for c in scene_clothes)
                + f"\n  Use the provided clothing reference images ({cloth_labels}) to match fabric, color, and style."
            ) if cloth_labels else (
                f"\n\nClothing for this scene:\n"
                + "\n".join(f"  - {c}" for c in scene_clothes)
            )

        appearance_desc = ""
        if scene_appearance:
            appearance_desc = (
                f"\n\nModel appearance for this scene (MUST match exactly):\n"
                + "\n".join(f"  - {a}" for a in scene_appearance)
            )

        prompt = (
            f"You are given the following reference images:\n"
            f"  Character references: {char_labels}\n"
            f"  Product references:   {prod_labels}\n"
            + (f"  Clothing references:  {cloth_labels}\n" if cloth_labels else "")
            + f"\nGenerate a single photorealistic, cinematic advertisement scene image."
            f"\n\nScene {i+1} [{timestamp}]:\n{visual_desc}{extra_context}"
            + clothes_desc
            + appearance_desc
            + f"\n\nRequirements:\n"
            f"- Extremely photorealistic with perfect cinematic lighting.\n"
            f"- Preserve each character's face, skin tone, and exact physical appearance.\n"
            f"- Clothing MUST match the description and reference images exactly.\n"
            f"- Product clearly visible and prominent where relevant.\n"
            f"- Vibrant, high-end fashion advertisement style.\n"
            f"- No watermarks, no borders, no text overlays."
        )

        print(f"\n🎬 Generating scene {i+1}/{len(scenes)}: [{timestamp}] {visual_desc[:70]}…")

        contents = [prompt] + all_input_images
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
            print(f"   ⚠️  No image returned for scene {i+1}")

    return sorted(scene_paths)
