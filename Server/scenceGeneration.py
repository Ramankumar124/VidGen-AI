from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
import os
import glob

client = genai.Client()

script =[
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


def load_images_by_prefix(prefix: str, folder: str = "output") -> list[Image.Image]:
    """
    Dynamically loads all images matching <prefix>1.png, <prefix>2.png, ...
    from the given folder. Works for any count (1, 2, 3, ...).
    Returns a list of PIL Image objects sorted by filename.
    """
    pattern = os.path.join(folder, f"{prefix}*.png")
    paths = sorted(glob.glob(pattern))
    images = []
    for path in paths:
        try:
            img = Image.open(path)
            images.append(img)
            print(f"   📷 Loaded {path}")
        except Exception as e:
            print(f"   ⚠️  Could not load {path}: {e}")
    return images


# ==============================
# Dynamically load character images: model1.png, model2.png, ...
# ==============================
character_images = load_images_by_prefix("model", folder="output")
print(f"\n✅ Found {len(character_images)} character image(s)")

# ==============================
# Dynamically load product images: product1.png, product2.png, ...
# ==============================
product_images = load_images_by_prefix("product", folder="output")
print(f"✅ Found {len(product_images)} product image(s)")

cloths_images = load_images_by_prefix("clothing", folder="output/clothing")
if not character_images:
    raise FileNotFoundError("No character images found in output/ (expected model1.png, model2.png, ...)")

if not product_images:
    raise FileNotFoundError("No product images found in output/ (expected product1.png, product2.png, ...)")

if not cloths_images:
    raise FileNotFoundError("No clothing images found in output/clothing/ (expected clothing1.png, clothing2.png, ...)")
# Build character label description for prompts
# ==============================
char_labels = ", ".join([f"image{i+1} = Character {i+1}" for i in range(len(character_images))])
prod_labels = ", ".join([f"product image {i+1}" for i in range(len(product_images))])
cloths_labels = ", ".join([f"clothing image {i+1} = Cloth Reference {i+1}" for i in range(len(cloths_images))])

# ==============================
# Output folder for scene images
# ==============================
scenes_output_dir = "output/scenes"
os.makedirs(scenes_output_dir, exist_ok=True)

# ==============================
# Iterate over scenes and generate an image for each
# ==============================
# script is a list of scene dicts directly
scenes = script

for i, scene in enumerate(scenes):
    timestamp = scene.get("timestamp", f"scene_{i+1}")
    visual_desc = scene.get("visual", "")
    dialogue = scene.get("dialogue", "")
    voiceover = scene.get("voiceover", "")
    scene_clothes = scene.get("model_clothes", [])
    scene_appearance = scene.get("model_appearance", [])

    # Build extra context from dialogue/voiceover
    extra_context = ""
    if dialogue:
        extra_context += f" Dialogue: \"{dialogue}\"."
    if voiceover:
        extra_context += f" Voiceover context: \"{voiceover}\"."

    # Build clothing instruction for this scene
    clothes_desc = ""
    if scene_clothes:
        clothes_desc = (
            f"\n\nClothing for this scene (MUST follow exactly):\n"
            + "\n".join(f"  - {c}" for c in scene_clothes)
            + f"\n  Use the provided clothing reference images ({cloths_labels}) to match fabric, "
              f"color, and style as accurately as possible."
        )

    # Build model appearance instruction for this scene
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
        + (f"  Clothing references:  {cloths_labels}\n" if cloths_images else "")
        + f"\nGenerate a single photorealistic, cinematic advertisement scene image."
        f"\n\nScene {i+1} [{timestamp}]:\n{visual_desc}{extra_context}"
        + clothes_desc
        + appearance_desc
        + f"\n\nRequirements:\n"
        f"- The scene must look extremely photorealistic with perfect cinematic lighting.\n"
        f"- Preserve each character's face, skin tone, and exact physical appearance as shown in the character reference images.\n"
        f"- The model's clothing MUST exactly match the clothing description above AND the provided clothing reference images in terms of color, fabric, silhouette, and style.\n"
        f"- If the same clothing item appears in multiple scenes, it must look identical across all those scenes.\n"
        f"- Make the product clearly visible and prominent in the scene where relevant.\n"
        f"- Vibrant summer color palette, high-end fashion advertisement style.\n"
        f"- No watermarks, no borders, no text overlays."
    )

    print(f"\n🎬 Generating scene {i+1}/{len(scenes)}: [{timestamp}] {visual_desc[:70]}...")
    if scene_clothes:
        print(f"   👗 Clothes: {', '.join(scene_clothes)[:80]}...")
    if scene_appearance:
        print(f"   👤 Appearance: {', '.join(scene_appearance)[:80]}...")

    # Combine all input images: characters first, then products, then clothing refs
    all_input_images = character_images + product_images + cloths_images
    contents = [prompt] + all_input_images

    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents=contents,
    )

    # Save the generated image
    saved = False
    for part in response.parts:
        if part.text is not None:
            print(f"   ℹ️  Model text: {part.text}")
        elif part.inline_data is not None:
            safe_name = timestamp.replace(":", "_").replace(".", "_").replace("-", "_to_")
            output_path = os.path.join(scenes_output_dir, f"scene_{i+1:02d}_{safe_name}.png")
            img = part.as_image()
            img.save(output_path)
            print(f"   ✅ Saved -> {output_path}")
            saved = True
            break  # One image per scene

    if not saved:
        print(f"   ⚠️  No image was returned for scene {i+1}.")

print("\n🏁 All scenes processed!")