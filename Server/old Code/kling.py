import fal_client
import requests

# 1. Upload your starting image
image_url = fal_client.upload_file("output/scenes/image.png")

# 2. Generate video using the Kling O3 Standard model
# Endpoint updated to: "fal-ai/kling-video/o3/standard/image-to-video"
args = {
    "visual": (
        "The woman from previous scenes is seen walking confidently along a pristine beach at golden hour, or by a luxurious resort pool, with the shimmering ocean or tranquil water gently blurred in the background. Her hair catches a soft breeze, revealing the Rose Gemstone Shoulder Grazers shining beautifully against her sun-kissed skin. The scene evokes a sense of relaxed luxury and effortless vacation style, reinforcing their versatile 'casual wear' appeal for ."
    ),
    "start_image_url": image_url,
    "image_url": image_url,
    "duration": 3,  # Set to 3 seconds as requested
    "generate_audio": False,  # Optional: Adds the "sparkle" atmosphere/sounds
    "aspect_ratio": "9:16",  # Optional: "16:9", "9:16", or "1:1"
}


# Ensure string-only fields are strings (the API rejects lists/tuples for these)
def _coerce_to_string(value):
    if isinstance(value, (list, tuple)):
        return " ".join(str(x) for x in value)
    return value

for key in ("visual", "start_image_url", "image_url"):
    if key in args:
        args[key] = _coerce_to_string(args[key])

# The Kling API requires either `prompt` or `multi_prompt`.
# If the caller provided `visual` but not `prompt`, copy `visual` -> `prompt`.
if "prompt" not in args and "multi_prompt" not in args:
    if "visual" in args and args["visual"]:
        args["prompt"] = _coerce_to_string(args["visual"])
    else:
        args["prompt"] = ""

result = fal_client.subscribe(
    "fal-ai/kling-video/v3/pro/image-to-video",
    arguments=args,
)

# 3. Get video URL and download
video_url = result.get("video", {}).get("url")
if not video_url:
    raise RuntimeError("No video URL returned by fal_client")

print("Video URL:", video_url)

# 4. Save the file locally
response = requests.get(video_url)
response.raise_for_status()

with open("output.mp4", "wb") as f:
    f.write(response.content)

print("✅ Downloaded 3-second Kling O3 video!")
