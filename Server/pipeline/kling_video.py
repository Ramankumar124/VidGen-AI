"""
Kling video generation pipeline step.
Generates one video clip per scene using the fal-ai Kling model and downloads the result.
"""
import os
import glob
import requests
import fal_client
from dotenv import load_dotenv


load_dotenv()


VIDEOS_OUTPUT_DIR = "output/videos"


def _ensure_kling_api_key() -> str:
    """
    Ensure fal_client can authenticate using .env values.
    Supports either:
      - FAL_KEY (native fal_client env var)
      - KLING_API_KEY (mapped to FAL_KEY for convenience)
    """
    fal_key = os.getenv("FAL_KEY")
    if fal_key:
        return fal_key

    kling_key = os.getenv("KLING_API_KEY")
    if kling_key:
        os.environ["FAL_KEY"] = kling_key
        return kling_key

    raise RuntimeError(
        "Missing Kling API key. Set FAL_KEY or KLING_API_KEY in your Server/.env file."
    )


def _get_scene_image_path(scene_index: int, timestamp: str, scenes_dir: str) -> str:
    """Locate the PNG for a given scene in the scenes directory."""
    safe_ts = timestamp.replace(":", "_").replace(".", "_").replace("-", "_to_")
    exact = os.path.join(scenes_dir, f"scene_{scene_index:02d}_{safe_ts}.png")
    if os.path.exists(exact):
        return exact
    # Fallback: glob by scene number prefix
    pattern = os.path.join(scenes_dir, f"scene_{scene_index:02d}_*.png")
    matches = sorted(glob.glob(pattern))
    if matches:
        return matches[0]
    raise FileNotFoundError(
        f"No scene image found for scene {scene_index} (tried: {exact})"
    )


def _coerce_str(value):
    if isinstance(value, (list, tuple)):
        return " ".join(str(x) for x in value)
    return str(value) if value else ""


def _clamp_duration(duration: int) -> int:
    """Kling accepts 3–15 seconds. Clamp to that range."""
    return max(3, min(15, int(duration)))


def run_kling_video(
    scenes: list,
    scenes_output_dir: str = "output/scenes",
) -> list[str]:
    """
    For each scene:
      1. Upload its reference image via fal_client.upload_file
      2. Call fal-ai/kling-video/v3/pro/image-to-video
      3. Download the returned MP4 to output/videos/scene_NN.mp4

    Returns a sorted list of paths to the generated video clips.
    Scenes whose image is missing are skipped (a warning is printed).
    """
    _ensure_kling_api_key()
    os.makedirs(VIDEOS_OUTPUT_DIR, exist_ok=True)
    generated_paths: list[str] = []

    for scene in scenes:
        scene_num = scene.get("scene", 0)
        timestamp  = scene.get("timestamp", "")
        visual     = scene.get("visual", "")
        voiceover  = scene.get("voiceover", "") or ""
        editing    = scene.get("editing", "") or ""
        camera_movement = scene.get("camera_movement", "") or ""
        cuts       = scene.get("cuts", "") or ""
        duration   = _clamp_duration(scene.get("duration_seconds", 8))

        video_path = os.path.join(VIDEOS_OUTPUT_DIR, f"scene_{scene_num:02d}.mp4")
         
        # Skip if already generated
        if os.path.exists(video_path):
            print(f"⏭️  Scene {scene_num}: already exists, skipping.")
            generated_paths.append(video_path)
            continue

        # Find reference image
        try:
            image_path = _get_scene_image_path(scene_num, timestamp, scenes_output_dir)
            print(f"\n{'='*60}")
            print(f"🎬 Scene {scene_num} [{timestamp}]  duration={duration}s")
            print(f"   🖼️  Image: {image_path}")
        except FileNotFoundError as e:
            print(f"   ❌ {e} — skipping scene {scene_num}")
            continue

        # Build rich prompt
        prompt_parts = [f"Scene {scene_num} [{timestamp}]:", f"Visual: {visual}"]
        if voiceover:
            prompt_parts.append(f"Voiceover: {voiceover}")
        if camera_movement:
            prompt_parts.append(
                f"Camera / motion (primary — animate the clip to match this camera work): {camera_movement}"
            )
        if editing:
            prompt_parts.append(f"Editing direction: {editing}")
        if cuts:
            if isinstance(cuts, list):
                prompt_parts.append("Cuts:\n" + "\n".join(f"  - {c}" for c in cuts))
            else:
                prompt_parts.append(f"Cuts: {cuts}")
        prompt_text = "\n".join(prompt_parts)

        # Upload image and generate
        print(f"   ⬆️  Uploading image to fal…")


        def on_queue_update(update):
           if isinstance(update, fal_client.InProgress):
               for log in update.logs:
                print(log["message"])
        try:
            image_url = fal_client.upload_file(image_path)
        except Exception as e:
            print(f"   ❌ Upload failed for scene {scene_num}: {e}")
            continue

        args = {
            "prompt": _coerce_str(prompt_text),
            "start_image_url": _coerce_str(image_url),
            "image_url": _coerce_str(image_url),
            "duration": duration,
            "generate_audio": False,
            "aspect_ratio": "9:16",
        }

        print(f"   ⏳ Requesting Kling generation (duration={duration}s)…")
        try:
            result = fal_client.subscribe(
                "fal-ai/sora-2/image-to-video",
                with_logs=True,
                arguments=args,
                on_queue_update=on_queue_update,
            )
        except Exception as e:
            print(f"   ❌ Kling generation failed for scene {scene_num}: {e}")
            continue

        # Download video
        video_url = result.get("video", {}).get("url") if isinstance(result, dict) else None
        if not video_url:
            # Try alternate response shapes
            try:
                video_url = result["video"]["url"]
            except Exception:
                print(f"   ⚠️  No video URL returned for scene {scene_num}, skipping.")
                continue

        print(f"   ⬇️  Downloading from: {video_url}")
        try:
            r = requests.get(video_url, timeout=120)
            r.raise_for_status()
            with open(video_path, "wb") as f:
                f.write(r.content)
            print(f"   ✅ Saved: {video_path}")
            generated_paths.append(video_path)
        except Exception as e:
            print(f"   ❌ Download failed for scene {scene_num}: {e}")

    return sorted(generated_paths)
