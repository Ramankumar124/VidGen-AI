# ==============================
# 1. Imports
# ==============================
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import json
from dotenv import load_dotenv
import os
from PIL import Image
from io import BytesIO
load_dotenv()
from google import genai
from google.genai import types
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
models = client.models.list()

for m in models:
    print(m.name)
# ==============================
# 2. API KEYS
# ==============================
# (No Gemini API needed for this task)

# ==============================
# 3. Pydantic Models for Structured Output
# ==============================

class ModelAppearance(BaseModel):
    build: str
    hair: str
    makeup: str
    outfit: str

class ModelInfo(BaseModel):
    name: str = Field(
        description="Name identifier for the model (e.g., model1, model2)",
        json_schema_extra={"example": "model1"}
    )
    type: str = Field(
        description="Type of model (e.g., male, female, female group)",
        json_schema_extra={"example": "female"}
    )
    age_range: str = Field(
        description="Age range of the model",
        json_schema_extra={"example": "18-35"}
    )
    ethnicity_region: str = Field(
        description="Ethnicity or regional representation of the model",
        json_schema_extra={"example": "urban western influenced with medium skin tone representing a global modern audience"}
    )
    persona: List[str] = Field(
        description="List of personality traits or characteristics",
        json_schema_extra={"example": ["confident", "stylish", "modern", "relatable", "trend-following"]}
    )
    appearance: ModelAppearance
    role: str = Field(
        description="Role of the model in the script",
        json_schema_extra={"example": "Primary protagonist representing aspirational lifestyle"}
    )
    
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

# ==============================
# 4. LLM Setup
# ==============================
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.5,
)

structured_llm = llm.with_structured_output(ScriptAnalysisOutput)

# ==============================
# 5. Prompt Template
# ==============================
prompt = ChatPromptTemplate.from_template("""
Analyze the provided video script and extract structured information about the models, product, and environment.

Script:
{script}

Based on the script, identify:
1. Models: Describe the characters/models used as a list of objects, each with a 'name' (e.g., 'model1', 'model2'), their demographics, appearance, persona, and roles.
2. Product: Extract details about the product being advertised, its category, target audience, key attributes, presentation strategy, and brand messaging.
3. Environment: Describe the locations/scenes, their settings, lighting, visual elements, camera styles, and mood.

Output the information in the exact JSON structure specified, with models as a list of named objects.
""")


prompt2=ChatPromptTemplate.from_template("""
Take the following model information as input and generate a photorealistic image of the model.

The image must be studio quality, front-facing, with the model looking directly at the camera.
Use a plain, solid background (white or light grey) and soft, even professional lighting.

The framing should be passport size, showing only the head and upper shoulders.

Ensure accurate representation of the model’s facial features, skin tone, ethnicity/region, hairstyle, and natural expression based on the input.

The output must be a single high-quality image generation prompt optimized for photorealistic results.
""")



def generate_images_from_models(models_list):
    os.makedirs("output", exist_ok=True)

    results = {}

    for i, model in enumerate(models_list):
        model_data = model.model_dump()   # 🔥 FIX HERE

        key = model_data.get("name", f"model{i+1}")

        prompt = f"""
    Raw unedited DSLR photo, authentic passport-style portrait.
    Subject: A {model_data.get('type')}, age {model_data.get('age_range')}, {model_data.get('ethnicity_region')} heritage.
    
    Skin & Realism:
    - Non-idealized skin texture: visible micro-pores, natural skin oiliness, and fine downy hair (peach fuzz).
    - Subsurface scattering (light passing through skin) for a lifelike glow.
    - Subtle epidermal irregularities: faint moles, slight redness around the nose, or tiny freckles.
    - Absolutely no airbrushing, no digital smoothing, no "beauty filter" effect.

    Persona & Expression:
    - Expression: {', '.join(model_data.get('persona', []))}.
    - Micro-expressions: slight tension in the brow or a natural, non-symmetrical mouth set.

    Physical Details:
    - Hair: {model_data.get('appearance', {}).get('hair')}, with realistic stray strands and natural scalp parting.
    - Outfit: {model_data.get('appearance', {}).get('outfit')}, focused on fabric weave and realistic seams.
    - Makeup: {model_data.get('appearance', {}).get('makeup')}, visible pigment texture, not a digital overlay.

    Technical Photography:
    - 85mm prime lens, f/2.2 for a natural (not extreme) depth of field.
    - Sharp focus on the iris; realistic corneal reflections and wetness in the eyes.
    - Shot on 35mm full-frame sensor, subtle ISO grain for filmic texture.
    - Lighting: Single-source window light or large softbox, creating a subtle Rembrandt shadow.

    Composition:
    - Frontal passport framing, neutral white studio background with soft ambient occlusion shadows behind the head.
    - True-to-life color science (neutral white balance).
         """

        response = client.models.generate_images(
            model="imagen-4.0-ultra-generate-001",
            # model="gemini-3-pro-preview",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
            ),
        )

        image_bytes = response.generated_images[0].image.image_bytes
        image = Image.open(BytesIO(image_bytes))

        file_path = f"output/{key}.png"
        image.save(file_path)

        results[key] = file_path

    return {"images": results}

# ==============================
# 7. INPUT SCRIPT
# ==============================
script = {
  "title": "Ritu Kumar: Rose Gemstone Shoulder Grazers",
  "product": "Exquisite Rose Gemstone Shoulder Grazers by Ritu Kumar, designed for the modern, trend-conscious woman seeking elegant casual wear accessories. Each piece crafted to capture effortless style.",
  "style": {
    "tone": "Elegant, aspirational, sophisticated, authentic",
    "pacing": "Starts calm and luxurious, shifts to dynamic and detailed during craftsmanship, returns to serene and appreciative",
    "color_palette": "Warm, inviting tones for final product/lifestyle, slightly cooler/focused for close-ups of gemstones/metalwork",
    "music_mood": "Serene and elegant, building to a slightly more focused, rhythmic flow during craftsmanship, then back to uplifting and graceful",
    "notes": "Visual-driven storytelling with minimal, impactful voiceover. Emphasize craftsmanship and the feeling of wearing the earrings."
  },
  "scenes": [
    {
      "scene": 1,
      "timestamp": "00:00-00:08",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "A close-up shot of a woman with long, dark, flowing hair, eyes gently closed, smiling serenely. Her right hand delicately touches her cheek, emphasizing the elegance and grace. The Rose Gemstone Shoulder Grazers dangle beautifully, catching soft, diffused light, highlighting their intricate design and various colorful gemstones. The background is a soft, dreamlike white to light blue gradient, suggesting a peaceful, elevated atmosphere.",
      "voiceover": "Some moments simply sparkle, effortlessly capturing the light within you.",
      "dialogue": "",
      "editing": "Slow, graceful zoom in on the model's face, focusing on the earrings as they gently sway.",
      "text_overlay": "",
      "model_clothes": [
        "White, delicate, strapless top, suggesting a sundress or elegant casual wear."
      ],
      "model_appearance": [
        "Long, dark, shiny hair cascading over shoulders.",
        "Soft, natural makeup with a radiant complexion.",
        "Serene and blissful expression."
      ]
    },
    {
      "scene": 2,
      "timestamp": "00:08-00:16",
      "duration_seconds": 8,
      "cuts": [
        "0s-2s: Close-up on a raw, faceted ruby gemstone, gleaming on a dark velvet cloth.",
        "2s-4s: Close-up on a deep emerald green gemstone, shimmering with natural inclusions.",
        "4s-6s: Close-up on a lustrous, creamy white baroque pearl, smooth and irregular.",
        "6s-8s: Artisan's steady hand, with clean fingernails, carefully picking up a delicate gold filigree element using fine tweezers."
      ],
      "visual": "A series of rapid, focused close-up cuts showcasing an array of raw, vibrant gemstones – a ruby-red oval, a deep emerald green, creamy white pearls, and intricate gold filigree components. These materials are presented on a light, textured workbench under focused, clean lighting, emphasizing their natural beauty and the precision required for selection.",
      "voiceover": "But true brilliance isn't found, it's meticulously crafted.",
      "dialogue": "",
      "editing": "Fast, precise cuts between raw materials, creating a dynamic introduction to the craftsmanship.",
      "text_overlay": "2 DAYS AGO",
      "model_clothes": [],
      "model_appearance": []
    },
    {
      "scene": 3,
      "timestamp": "00:16-00:24",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "Close-up shots of an artisan's steady, experienced hands using specialized fine tools to carefully set a faceted ruby-red gemstone into a delicate, intricately detailed gold bezel. This is followed by hands meticulously attaching a lustrous creamy pearl to a golden spiral component, showcasing traditional techniques and unwavering precision. The background is subtly blurred, keeping the focus entirely on the intricate, detailed work of the artisan.",
      "voiceover": "Each rose, each gem, a testament to artistry and patience.",
      "dialogue": "",
      "editing": "Smooth, focused cuts, almost like a time-lapse, highlighting the detailed setting work and the artisan's skill.",
      "text_overlay": "",
      "model_clothes": [],
      "model_appearance": []
    },
    {
      "scene": 4,
      "timestamp": "00:24-00:32",
      "duration_seconds": 8,
      "cuts": [
        "0s-2s: Delicate gold chain links being meticulously connected with small pliers.",
        "2s-4s: A tiny, intricately sculpted gold rose element being carefully fused into the main structure.",
        "4s-6s: Small, sparkling cubic zirconia being precisely added to the longer shoulder-grazer length of the earring.",
        "6s-8s: The partially assembled earring structure laid out on a soft, dark velvet pad, beginning to take its elegant, flowing shape."
      ],
      "visual": "A series of precise, micro-cuts showing the various components of the earring coming together: delicate chains being linked, a tiny gold rose being fused, and small, sparkling cubic zirconia being added to create the desired shoulder-grazer length. The complexity and inherent elegance of the final form gradually emerge as each element is carefully integrated by the artisan's hands.",
      "voiceover": "From individual elements, a masterpiece takes form, designed to grace your every move.",
      "dialogue": "",
      "editing": "Seamless transitions between micro-details, emphasizing the complex assembly process and skilled labor.",
      "text_overlay": "",
      "model_clothes": [],
      "model_appearance": []
    },
    {
      "scene": 5,
      "timestamp": "00:32-00:40",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "A medium shot of the same radiant woman from Scene 1, now softly laughing while enjoying an outdoor brunch at a chic cafe or a vibrant garden party. She is wearing a light, flowing sundress, and the Rose Gemstone Shoulder Grazers sway gently with her subtle movements, reflecting the bright sunlight. The setting is bright, airy, and inviting, perfectly showcasing the earrings as ideal casual-chic accessories for a trend-conscious woman.",
      "voiceover": "Perfect for sun-drenched days and effortless evenings.",
      "dialogue": "",
      "editing": "Smooth, gentle pan following the model's subtle head turn and movements, highlighting the earrings' dynamism.",
      "text_overlay": "",
      "model_clothes": [
        "Light, flowing sundress in a pastel shade, such as a soft peach or mint green, simple yet elegant cut."
      ],
      "model_appearance": [
        "Long, dark hair styled in soft waves, cascading over her shoulders.",
        "Natural, glowing makeup enhancing her radiant smile and warm complexion."
      ]
    },
    {
      "scene": 6,
      "timestamp": "00:40-00:48",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "The woman from previous scenes is seen walking confidently along a pristine beach at golden hour, or by a luxurious resort pool, with the shimmering ocean or tranquil water gently blurred in the background. Her hair catches a soft breeze, revealing the Rose Gemstone Shoulder Grazers shining beautifully against her sun-kissed skin. The scene evokes a sense of relaxed luxury and effortless vacation style, reinforcing their versatile 'casual wear' appeal for trend-followers.",
      "voiceover": "Let them speak volumes about your unique style, wherever you wander.",
      "dialogue": "",
      "editing": "Steady tracking shot, following the model gracefully as she walks, emphasizing her confident movement and the earrings' elegance.",
      "text_overlay": "",
      "model_clothes": [
        "Light, elegant beach cover-up or a flowy top in a vibrant summer color like coral or turquoise, paired with tailored shorts."
      ],
      "model_appearance": [
        "Relaxed yet confident posture.",
        "Glowing, healthy skin.",
        "Stylish oversized sunglasses perched casually on her head."
      ]
    },
    {
      "scene": 7,
      "timestamp": "00:48-00:56",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "An elegant close-up shot, expertly framed to showcase the Rose Gemstone Shoulder Grazers as they beautifully frame the model's radiant face. Her eyes are now open, looking directly at the camera with a confident, gentle gaze, engaging the viewer. The ambient light plays exquisitely on the different gemstones—the rich reds, deep greens, and luminous pearls—highlighting their varied textures, sparkle, and the meticulous craftsmanship.",
      "voiceover": "A touch of timeless elegance, vibrant and distinctly you.",
      "dialogue": "",
      "editing": "Slow, graceful reveal from a slightly blurred background to sharp focus on the earrings and the model's expressive face.",
      "text_overlay": "",
      "model_clothes": [
        "A sophisticated, lightweight linen dress or a silk blouse in an earthy tone, complementing the gemstone colors."
      ],
      "model_appearance": [
        "Engaging smile with a confident yet approachable demeanor.",
        "Perfectly styled hair framing her face, showcasing the earrings."
      ]
    },
    {
      "scene": 8,
      "timestamp": "00:56-01:04",
      "duration_seconds": 8,
      "cuts": "",
      "visual": "The Rose Gemstone Shoulder Grazers are presented in a perfect, symmetrical product shot against a clean, soft white to pastel pink gradient background, sparkling brilliantly under studio lighting. The camera slowly zooms out to reveal the Ritu Kumar brand logo appearing elegantly above the earrings, followed by the product name 'Rose Gemstone Shoulder Grazers' and the price 'INR 5850'. A subtle call to action appears below.",
      "voiceover": "Discover your next statement piece. The Rose Gemstone Shoulder Grazers, exclusively from Ritu Kumar.",
      "dialogue": "",
      "editing": "Clean product reveal with elegant text overlay animation and a subtle glow effect on the earrings.",
      "text_overlay": "Ritu Kumar Rose Gemstone Shoulder Grazers INR 5850 Shop Now at RituKumar.com",
      "model_clothes": [],
      "model_appearance": []
    }
  ]
}
  


def debug_print(x):
    print("DEBUG OUTPUT:", x)
    return x  # IMPORTANT: return unchanged

# ==============================
# 6. Chain
# ==============================
chain = (
    prompt
    | structured_llm
    |RunnableLambda(debug_print)
    | RunnableLambda(lambda x: generate_images_from_models(x.models))
)
# ==============================
# 8. RUN
# ==============================
result = chain.invoke({
    "script": json.dumps(script)
})

print("\n🖼 Generated Images:\n")
print(json.dumps(result, indent=2))