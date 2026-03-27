import time
import os
import glob
import requests
import subprocess
from google import genai
from google.genai import types

# ==============================
# 🔧 CONFIG
# ==============================
PROJECT_ID = "automationtexttospeech"
LOCATION = "us-central1"
SCENES_IMAGE_DIR = "output/scenes"
VIDEOS_OUTPUT_DIR = "output/videos"
FINAL_OUTPUT_FILE = "output/final_merged.mp4"

os.makedirs(VIDEOS_OUTPUT_DIR, exist_ok=True)

# ==============================
# 📋 SCENE ARRAY
# ==============================
script = [
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
        "model_clothes": ["White, delicate, strapless top, suggesting a sundress or elegant casual wear."],
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
    # {
    #     "scene": 4,
    #     "timestamp": "00:24-00:32",
    #     "duration_seconds": 8,
    #     "cuts": [
    #         "0s-2s: Delicate gold chain links being meticulously connected with small pliers.",
    #         "2s-4s: A tiny, intricately sculpted gold rose element being carefully fused into the main structure.",
    #         "4s-6s: Small, sparkling cubic zirconia being precisely added to the longer shoulder-grazer length of the earring.",
    #         "6s-8s: The partially assembled earring structure laid out on a soft, dark velvet pad, beginning to take its elegant, flowing shape."
    #     ],
    #     "visual": "A series of precise, micro-cuts showing the various components of the earring coming together: delicate chains being linked, a tiny gold rose being fused, and small, sparkling cubic zirconia being added to create the desired shoulder-grazer length. The complexity and inherent elegance of the final form gradually emerge as each element is carefully integrated by the artisan's hands.",
    #     "voiceover": "From individual elements, a masterpiece takes form, designed to grace your every move.",
    #     "dialogue": "",
    #     "editing": "Seamless transitions between micro-details, emphasizing the complex assembly process and skilled labor.",
    #     "text_overlay": "",
    #     "model_clothes": [],
    #     "model_appearance": []
    # },
    # {
    #     "scene": 5,
    #     "timestamp": "00:32-00:40",
    #     "duration_seconds": 8,
    #     "cuts": "",
    #     "visual": "A medium shot of the same radiant woman from Scene 1, now softly laughing while enjoying an outdoor brunch at a chic cafe or a vibrant garden party. She is wearing a light, flowing sundress, and the Rose Gemstone Shoulder Grazers sway gently with her subtle movements, reflecting the bright sunlight. The setting is bright, airy, and inviting, perfectly showcasing the earrings as ideal casual-chic accessories for a trend-conscious woman.",
    #     "voiceover": "Perfect for sun-drenched days and effortless evenings.",
    #     "dialogue": "",
    #     "editing": "Smooth, gentle pan following the model's subtle head turn and movements, highlighting the earrings' dynamism.",
    #     "text_overlay": "",
    #     "model_clothes": ["Light, flowing sundress in a pastel shade, such as a soft peach or mint green, simple yet elegant cut."],
    #     "model_appearance": [
    #         "Long, dark hair styled in soft waves, cascading over her shoulders.",
    #         "Natural, glowing makeup enhancing her radiant smile and warm complexion."
    #     ]
    # },
    # {
    #     "scene": 6,
    #     "timestamp": "00:40-00:48",
    #     "duration_seconds": 8,
    #     "cuts": "",
    #     "visual": "The woman from previous scenes is seen walking confidently along a pristine beach at golden hour, or by a luxurious resort pool, with the shimmering ocean or tranquil water gently blurred in the background. Her hair catches a soft breeze, revealing the Rose Gemstone Shoulder Grazers shining beautifully against her sun-kissed skin. The scene evokes a sense of relaxed luxury and effortless vacation style, reinforcing their versatile 'casual wear' appeal for trend-followers.",
    #     "voiceover": "Let them speak volumes about your unique style, wherever you wander.",
    #     "dialogue": "",
    #     "editing": "Steady tracking shot, following the model gracefully as she walks, emphasizing her confident movement and the earrings' elegance.",
    #     "text_overlay": "",
    #     "model_clothes": ["Light, elegant beach cover-up or a flowy top in a vibrant summer color like coral or turquoise, paired with tailored shorts."],
    #     "model_appearance": [
    #         "Relaxed yet confident posture.",
    #         "Glowing, healthy skin.",
    #         "Stylish oversized sunglasses perched casually on her head."
    #     ]
    # },
    # {
    #     "scene": 7,
    #     "timestamp": "00:48-00:56",
    #     "duration_seconds": 8,
    #     "cuts": "",
    #     "visual": "An elegant close-up shot, expertly framed to showcase the Rose Gemstone Shoulder Grazers as they beautifully frame the model's radiant face. Her eyes are now open, looking directly at the camera with a confident, gentle gaze, engaging the viewer. The ambient light plays exquisitely on the different gemstones—the rich reds, deep greens, and luminous pearls—highlighting their varied textures, sparkle, and the meticulous craftsmanship.",
    #     "voiceover": "A touch of timeless elegance, vibrant and distinctly you.",
    #     "dialogue": "",
    #     "editing": "Slow, graceful reveal from a slightly blurred background to sharp focus on the earrings and the model's expressive face.",
    #     "text_overlay": "",
    #     "model_clothes": ["A sophisticated, lightweight linen dress or a silk blouse in an earthy tone, complementing the gemstone colors."],
    #     "model_appearance": [
    #         "Engaging smile with a confident yet approachable demeanor.",
    #         "Perfectly styled hair framing her face, showcasing the earrings."
    #     ]
    # },
    # {
    #     "scene": 8,
    #     "timestamp": "00:56-01:04",
    #     "duration_seconds": 8,
    #     "cuts": "",
    #     "visual": "The Rose Gemstone Shoulder Grazers are presented in a perfect, symmetrical product shot against a clean, soft white to pastel pink gradient background, sparkling brilliantly under studio lighting. The camera slowly zooms out to reveal the Ritu Kumar brand logo appearing elegantly above the earrings, followed by the product name 'Rose Gemstone Shoulder Grazers' and the price 'INR 5850'. A subtle call to action appears below.",
    #     "voiceover": "Discover your next statement piece. The Rose Gemstone Shoulder Grazers, exclusively from Ritu Kumar.",
    #     "dialogue": "",
    #     "editing": "Clean product reveal with elegant text overlay animation and a subtle glow effect on the earrings.",
    #     "text_overlay": "Ritu Kumar Rose Gemstone Shoulder Grazers INR 5850 Shop Now at RituKumar.com",
    #     "model_clothes": [],
    #     "model_appearance": []
    # }
]

# ==============================
# 🚀 INIT CLIENT (VERTEX AI)
# ==============================
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
)


# ==============================
# 🔧 HELPER: find scene image
# ==============================
def get_scene_image_path(scene_index: int, timestamp: str) -> str:
    """
    Finds the PNG for a given scene index in output/scenes/.
    First tries the exact name pattern, then falls back to glob.
    """
    safe_ts = timestamp.replace(":", "_").replace(".", "_").replace("-", "_to_")
    exact = os.path.join(SCENES_IMAGE_DIR, f"scene_{scene_index:02d}_{safe_ts}.png")
    if os.path.exists(exact):
        return exact
    # Fallback: glob by scene number prefix
    pattern = os.path.join(SCENES_IMAGE_DIR, f"scene_{scene_index:02d}_*.png")
    matches = sorted(glob.glob(pattern))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"No scene image found for scene {scene_index} (tried: {exact})")


# ==============================
# 🔧 HELPER: save video bytes
# ==============================
def save_video(response, output_path: str) -> bool:
    video_bytes = None

    # ✅ Format 1: generated_videos with bytes or URI
    if hasattr(response, "generated_videos") and len(response.generated_videos) > 0:
        video_obj = response.generated_videos[0].video
        if hasattr(video_obj, "video_bytes") and video_obj.video_bytes:
            print("   📦 Using direct video bytes...")
            video_bytes = video_obj.video_bytes
        elif hasattr(video_obj, "uri") and video_obj.uri:
            print(f"   🌐 Downloading from URI: {video_obj.uri}")
            r = requests.get(video_obj.uri)
            video_bytes = r.content

    # ✅ Format 2: older videos list with URI
    elif hasattr(response, "videos") and len(response.videos) > 0:
        video_obj = response.videos[0]
        if hasattr(video_obj, "uri") and video_obj.uri:
            print(f"   🌐 Downloading from URI: {video_obj.uri}")
            r = requests.get(video_obj.uri)
            video_bytes = r.content

    if not video_bytes:
        return False

    with open(output_path, "wb") as f:
        f.write(video_bytes)
    return True


# ==============================
# 🎬 MAIN LOOP: generate a video per scene
# ==============================
generated_video_paths = []

for i, scene in enumerate(script):
    scene_num = scene["scene"]
    timestamp = scene["timestamp"]
    visual = scene["visual"]
    voiceover = scene.get("voiceover", "")
    editing = scene.get("editing", "")
    cuts = scene.get("cuts", "")

    print(f"\n{'='*60}")
    print(f"🎬 Scene {scene_num}/{len(script)} [{timestamp}]")
    print(f"{'='*60}")

    # Build prompt for this scene
    prompt_parts = [f"Scene {scene_num} [{timestamp}]:", f"Visual: {visual}"]
    if voiceover:
        prompt_parts.append(f"Voiceover: {voiceover}")
    if editing:
        prompt_parts.append(f"Editing direction: {editing}")
    if cuts:
        if isinstance(cuts, list):
            prompt_parts.append("Cuts:\n" + "\n".join(f"  - {c}" for c in cuts))
        elif cuts:
            prompt_parts.append(f"Cuts: {cuts}")

    prompt = "\n".join(prompt_parts)

    # Locate the reference image for this scene
    try:
        image_path = get_scene_image_path(scene_num, timestamp)
        print(f"   🖼️  Reference image: {image_path}")
    except FileNotFoundError as e:
        print(f"   ❌ {e} — skipping scene {scene_num}")
        continue

    # Output video path for this scene
    video_path = os.path.join(VIDEOS_OUTPUT_DIR, f"scene_{scene_num:02d}.mp4")

    # Skip if already generated
    if os.path.exists(video_path):
        print(f"   ⏭️  Already exists, skipping: {video_path}")
        generated_video_paths.append(video_path)
        continue

    # Load reference image
    ref_image = types.Image.from_file(location=image_path, mime_type="image/png")

    # Request video generation
    print(f"   ⏳ Requesting Veo generation for scene {scene_num}...")
    try:
        operation = client.models.generate_videos(
            model="veo-3.1-fast-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                reference_images=[
                    types.VideoGenerationReferenceImage(
                        image=ref_image,
                        reference_type="asset"
                    )
                ],
                aspect_ratio="16:9",
                duration_seconds=scene["duration_seconds"],
            )
        )
    except Exception as e:
        print(f"   ❌ Failed to start generation for scene {scene_num}: {e}")
        continue

    # Wait for completion
    while not operation.done:
        print(f"   ⏳ Processing scene {scene_num}...")
        time.sleep(10)
        operation = client.operations.get(operation)

    print(f"   ✅ Generation done for scene {scene_num}!")

    # Save the video
    response = operation.response
    success = save_video(response, video_path)

    if success:
        print(f"   � Saved: {video_path}")
        generated_video_paths.append(video_path)
    else:
        print(f"   ⚠️  No video data returned for scene {scene_num}, skipping merge.")

print(f"\n\n{'='*60}")
print(f"✅ Generated {len(generated_video_paths)}/{len(script)} scene videos")
print(f"{'='*60}")

# ==============================
# � MERGE ALL VIDEOS WITH FFMPEG
# ==============================
if len(generated_video_paths) == 0:
    print("❌ No videos to merge.")
else:
    print(f"\n🔗 Merging {len(generated_video_paths)} videos with ffmpeg...")

    # Write concat list file
    concat_list_path = os.path.join(VIDEOS_OUTPUT_DIR, "concat_list.txt")
    with open(concat_list_path, "w") as f:
        for vp in sorted(generated_video_paths):  # ensure correct order
            abs_path = os.path.abspath(vp)
            f.write(f"file '{abs_path}'\n")

    print(f"   📝 Concat list written: {concat_list_path}")

    # Run ffmpeg concat
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",                         # overwrite output if exists
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",                 # stream copy (no re-encode, fast)
        FINAL_OUTPUT_FILE
    ]

    print(f"   🚀 Running: {' '.join(ffmpeg_cmd)}")
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"\n🎉 Final video saved: {FINAL_OUTPUT_FILE}")
    else:
        print(f"\n❌ ffmpeg failed (exit code {result.returncode})")
        print("STDERR:", result.stderr[-2000:])  # last 2000 chars of error