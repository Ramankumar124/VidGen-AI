"""
Extract images pipeline step.
Analyzes a script to extract model, product, clothing, and background info,
then generates reference images for each.
"""
import os
import re
from io import BytesIO
from typing import List

from PIL import Image
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
 
from pipeline.asset_registry import build_asset_registry, save_asset_registry
from models.extractImages import ModelInfo, ScriptAnalysisOutput,ClothingExtractionOutput,ClothingItem,BackgroundExtractionOutput,BackgroundLocation
load_dotenv()

# ── Gemini client ────────────────────────────────────────────────────────────
_gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── LLM for structured extraction ───────────────────────────────────────────
_llm = ChatOpenAI(model="gpt-5.4-mini", temperature=0.5)


# ── Pydantic models ──────────────────────────────────────────────────────────

# ── Image generation helpers ─────────────────────────────────────────────────

def _generate_model_images(models_list: List[ModelInfo]) -> dict:
    os.makedirs("output/models", exist_ok=True)
    results = {}

    for i, model in enumerate(models_list):
        md = model.model_dump()
        key = f"model{i+1}"
        prompt = f"""
Raw unedited DSLR photo, authentic passport-style portrait.
Subject: A {md.get('type')}, age {md.get('age_range')}, {md.get('ethnicity_region')} heritage.

Skin & Realism:
- Non-idealized skin texture: visible micro-pores, natural skin oiliness, fine downy hair.
- Subsurface scattering for a lifelike glow.
- Subtle epidermal irregularities.
- No airbrushing, no digital smoothing.

Persona & Expression:
- Expression: {', '.join(md.get('persona', []))}.

Physical Details:
- Hair: {md.get('appearance', {}).get('hair')}, realistic stray strands.
- Outfit: {md.get('appearance', {}).get('outfit')}, realistic fabric.
- Makeup: {md.get('appearance', {}).get('makeup')}, visible pigment texture.

Technical Photography:
- 85mm prime lens, f/2.2 depth of field.
- 35mm full-frame sensor, subtle ISO grain.
- Single-source window light, Rembrandt shadow.

Composition:
- Frontal passport framing, neutral white studio background.
"""
        response = _gemini_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )

        file_path = None
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                file_path = os.path.join("output/models", f"{key}.png")
                Image.open(BytesIO(part.inline_data.data)).save(file_path)
                print(f"   ✅ Model image saved: {file_path}")
                break

        results[key] = file_path

    return results


def _extract_repeating_clothes(script_scenes: list) -> ClothingExtractionOutput:
    scene_clothes_summary = []
    for scene in script_scenes:
        scene_num = scene.get("scene", "?")
        for cloth in scene.get("model_clothes", []):
            scene_clothes_summary.append(f"Scene {scene_num}: {cloth}")

    clothes_text = "\n".join(scene_clothes_summary)
    if not clothes_text.strip():
        return ClothingExtractionOutput(repeated_clothing=[])

    clothing_prompt = ChatPromptTemplate.from_template("""
You are a fashion analyst. Identify clothing items/types that appear in MORE THAN ONE scene.
Group visually similar items (e.g. the same white robe in scenes 3 and 4).

Scene Clothing Data:
{clothes_text}

For each repeated clothing item provide:
- A short name/label
- A detailed visual description suitable for photorealistic image generation
- Which scene numbers it appears in
- How many scenes it appears in (count)

Order results by count descending. Only include items appearing in 2+ scenes.
""")
    structured_llm = _llm.with_structured_output(ClothingExtractionOutput)
    chain = clothing_prompt | structured_llm
    return chain.invoke({"clothes_text": clothes_text})


def _generate_clothing_images(clothing_items: List[ClothingItem]) -> dict:
    os.makedirs("output/clothing", exist_ok=True)
    results = {}

    for i, item in enumerate(clothing_items):
        safe_name = item.name.lower().replace(" ", "_").replace("/", "_")[:50]
        file_key = f"clothing_{i+1}_{safe_name}"

        image_prompt = f"""
Professional fashion product photograph of a clothing item.
Item: {item.name}
Description: {item.description}

Style: clean flat-lay on white marble or ghost mannequin shot.
Studio lighting, soft diffused, subtle shadows.
High resolution, commercial fashion quality.
Full garment, no model face visible.
"""
        response = _gemini_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=image_prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )

        file_path = None
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                file_path = os.path.join("output", "clothing", f"{file_key}.png")
                Image.open(BytesIO(part.inline_data.data)).save(file_path)
                print(f"   ✅ Clothing image saved: {file_path}")
                break

        results[item.name] = file_path

    return results


def _extract_unique_backgrounds(script_scenes: list) -> BackgroundExtractionOutput:
    """
    Use LLM to group scene_background_location values into unique background plates.
    Reads the 'scene_background_location' field from each raw scene dict.
    Also enriches descriptions using 'location' field if present.
    """
    scene_bg_summary = []
    for scene in script_scenes:
        scene_num = scene.get("scene", "?")
        # Accept both field names used across different script formats
        bg = (
            scene.get("scene_background_location")
            or scene.get("location")
            or ""
        )
        if bg.strip():
            scene_bg_summary.append(f"Scene {scene_num}: {bg}")

    if not scene_bg_summary:
        return BackgroundExtractionOutput(backgrounds=[])

    bg_text = "\n".join(scene_bg_summary)

    bg_prompt = ChatPromptTemplate.from_template("""
You are a film location scout. Group the following scene background descriptions into unique distinct locations.
Scenes that share the same physical environment (even if described slightly differently) should be grouped together.

Scene Background Data:
{bg_text}

For each unique background location provide:
- A short safe key (lowercase, underscores only, suitable as a filename, e.g. 'beach_golden_hour')
- A detailed visual description suitable for generating a wide cinematic background plate image
  (no people, no models, just the environment: lighting, atmosphere, textures, perspective)
- Which scene numbers use this background (MUST be exact scene numbers from the data above)

Return ALL unique background locations found. Every scene number must appear in exactly one background.
""")
    structured_llm = _llm.with_structured_output(BackgroundExtractionOutput)
    chain = bg_prompt | structured_llm
    return chain.invoke({"bg_text": bg_text})


def _generate_background_images(backgrounds: List[BackgroundLocation]) -> dict:
    """
    Generate a wide cinematic background plate image for each unique location.
    Returns: { key: file_path }
    """
    os.makedirs("output/backgrounds", exist_ok=True)
    results = {}

    for i, bg in enumerate(backgrounds):
        # Sanitize the key for use as a filename
        safe_key = re.sub(r"[^a-z0-9_]", "_", bg.key.lower())[:60]
        file_name = f"bg_{i+1:02d}_{safe_key}.png"
        file_path = os.path.join("output", "backgrounds", file_name)

        image_prompt = f"""
Wide-angle cinematic background environment photograph. NO people, NO models, NO faces.
Location: {bg.description}

Photography requirements:
- Ultra-wide cinematic aspect ratio feel (16:9 composition framing)
- Photorealistic, high dynamic range
- Professional location photography / cinematic still
- Rich atmospheric depth, strong sense of place
- Beautiful natural or studio lighting as described
- No text, no watermarks, no borders
- Empty environment ready for models to be composited in
"""
        response = _gemini_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=image_prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )

        saved_path = None
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                Image.open(BytesIO(part.inline_data.data)).save(file_path)
                print(f"   ✅ Background image saved: {file_path}  (scenes: {bg.scene_numbers})")
                saved_path = file_path
                break

        results[bg.key] = {
            "path": saved_path,
            "scene_numbers": bg.scene_numbers,
            "description": bg.description,
        }

    return results


# ── Public API ────────────────────────────────────────────────────────────────

_analysis_prompt = ChatPromptTemplate.from_template("""
Analyze the provided video script and extract structured information about models, product, and environment.

Script:
{script}

Identify:
1. Models: name (model1, model2…), demographics, appearance, persona, role.
2. Product: category, target audience, key attributes, presentation strategy, brand messaging.
3. Environment: locations, settings, lighting, visual elements, camera styles, mood.
""")


def run_extract_images(script_scenes: list, script_json_str: str) -> dict:
    """
    Analyzes the script to extract model/product/environment info,
    then generates model portrait images, clothing reference images,
    and background environment images.

    Returns:
        {
          "model_images":      { "model1": "output/models/model1.png", ... },
          "clothing_images":   { "White Dress": "output/clothing/...", ... },
          "background_images": { "beach_golden_hour": { "path": ..., "scene_numbers": [...] }, ... }
        }
    """
    print("\n📋 Extracting models, product and environment from script…")

    structured_llm = _llm.with_structured_output(ScriptAnalysisOutput)
    chain = _analysis_prompt | structured_llm
    analysis: ScriptAnalysisOutput = chain.invoke({"script": script_json_str})

    print(f"Found {len(analysis.models)} model(s)")

    # Generate model portraits
    print("\n🖼  Generating model portrait images…")
    model_images = _generate_model_images(analysis.models)

    # Extract repeating clothing and generate images
    print("\n👗 Extracting repeating clothing items…")
    clothing_analysis = _extract_repeating_clothes(script_scenes)
    print(f"   Found {len(clothing_analysis.repeated_clothing)} repeated clothing item(s)")

    print("\n🎨 Generating clothing reference images…")
    clothing_images = _generate_clothing_images(clothing_analysis.repeated_clothing)

    # Extract unique backgrounds and generate images
    # NOTE: We pass script_scenes (raw scene dicts) so we can read scene_background_location
    # and correctly populate scene_numbers for each background plate.
    print("\n🏞  Extracting unique background locations…")
    bg_analysis = _extract_unique_backgrounds(script_scenes)
    print(f"   Found {len(bg_analysis.backgrounds)} unique background location(s)")

    print("\n🌄 Generating background environment images…")
    background_images = _generate_background_images(bg_analysis.backgrounds)

    result = {
        "model_images": model_images,
        "clothing_images": clothing_images,
        "background_images": background_images,
    }

    registry = build_asset_registry(
        "output",
        extract_result=result,
        clothing_items=clothing_analysis.repeated_clothing,
    )
    save_asset_registry(registry, "output")
    return result
