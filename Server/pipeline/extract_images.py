"""
Extract images pipeline step.
Analyzes a script to extract model, product, and clothing info,
then generates reference images for each.
"""
import os
from io import BytesIO
from typing import List

from PIL import Image
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from dotenv import load_dotenv

load_dotenv()

# ── Gemini client ────────────────────────────────────────────────────────────
_gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── LLM for structured extraction ───────────────────────────────────────────
_llm = ChatOpenAI(model="gpt-4o", temperature=0.5)


# ── Pydantic models ──────────────────────────────────────────────────────────
class ModelAppearance(BaseModel):
    build: str
    hair: str
    makeup: str
    outfit: str

class ModelInfo(BaseModel):
    name: str = Field(description="Identifier e.g. model1")
    type: str = Field(description="male / female / group")
    age_range: str
    ethnicity_region: str
    persona: List[str]
    appearance: ModelAppearance
    role: str

class TargetAudience(BaseModel):
    age_range: str
    demographics: str
    interests: List[str]

class KeyAttributes(BaseModel):
    visual: List[str]
    emotional: List[str]
    functional: List[str]

class BrandMessage(BaseModel):
    core_theme: str
    positioning: List[str]

class ProductInfo(BaseModel):
    type: str
    category: str
    pricing_position: str
    target_audience: TargetAudience
    key_attributes: KeyAttributes
    presentation_strategy: List[str]
    brand_message: BrandMessage

class Lighting(BaseModel):
    type: str
    quality: str
    direction: str = None
    color_temperature: str = None
    focus: str = None

class Location(BaseModel):
    name: str
    region: str
    lighting: Lighting
    visual_elements: List[str]
    camera_style: List[str]
    mood: str

class EnvironmentInfo(BaseModel):
    locations: List[Location]

class ScriptAnalysisOutput(BaseModel):
    models: List[ModelInfo]
    product: ProductInfo
    environment: EnvironmentInfo


class ClothingItem(BaseModel):
    name: str = Field(description="Short label e.g. 'White Linen Maxi Dress'")
    description: str = Field(description="Detailed visual description suitable for image generation")
    scene_numbers: List[int]
    count: int

class ClothingExtractionOutput(BaseModel):
    repeated_clothing: List[ClothingItem] = Field(
        description="Clothing appearing in MORE THAN ONE scene, ordered by frequency"
    )


# ── Image generation helpers ─────────────────────────────────────────────────

def _generate_model_images(models_list: List[ModelInfo]) -> dict:
    os.makedirs("output", exist_ok=True)
    results = {}

    for i, model in enumerate(models_list):
        md = model.model_dump()
        key = md.get("name", f"model{i+1}")

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
                file_path = os.path.join("output", f"{key}.png")
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
    then generates model portrait images and clothing reference images.

    Returns:
        {
          "model_images": { "model1": "output/model1.png", ... },
          "clothing_images": { "White Dress": "output/clothing/...", ... }
        }
    """
    print("\n📋 Extracting models, product and environment from script…")

    structured_llm = _llm.with_structured_output(ScriptAnalysisOutput)
    chain = _analysis_prompt | structured_llm
    analysis: ScriptAnalysisOutput = chain.invoke({"script": script_json_str})

    print(f"   Found {len(analysis.models)} model(s)")

    # Generate model portraits
    print("\n🖼  Generating model portrait images…")
    model_images = _generate_model_images(analysis.models)

    # Extract repeating clothing and generate images
    print("\n👗 Extracting repeating clothing items…")
    clothing_analysis = _extract_repeating_clothes(script_scenes)
    print(f"   Found {len(clothing_analysis.repeated_clothing)} repeated clothing item(s)")

    print("\n🎨 Generating clothing reference images…")
    clothing_images = _generate_clothing_images(clothing_analysis.repeated_clothing)

    return {"model_images": model_images, "clothing_images": clothing_images}
