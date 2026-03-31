import os
import json
from typing import List

from pipeline.extract_images import run_extract_images
from pipeline.scene_generation import run_scene_generation
from pipeline.asset_registry import build_asset_registry, save_asset_registry
from pipeline.kling_video import run_kling_video
from pipeline.merge_video import merge_videos


OUTPUT_DIR = "output"


def _has_uploaded_models(output_dir: str = OUTPUT_DIR) -> bool:
    return any(
        f for f in os.listdir(output_dir)
        if f.startswith("model") and f.lower().endswith((".png", ".jpg", ".jpeg"))
    )


def run_full_pipeline(scenes: List[dict], script_json_str: str) -> str:
    """
    Run the full pipeline: extract images -> scene generation -> kling videos -> merge.

    Returns the absolute path to the merged final video.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Step 1: extract images where needed
    if not _has_uploaded_models(OUTPUT_DIR):
        print("🔎 No uploaded model images found — running extraction step...")
        run_extract_images(scenes, script_json_str)
    else:
        print("⏭️  Found uploaded model images, skipping extraction.")
        reg = build_asset_registry(OUTPUT_DIR, extract_result=None, clothing_items=None)
        save_asset_registry(reg, OUTPUT_DIR)

    # Step 2: generate scene images
    print("🖼 Generating scene images...")
    scene_paths = run_scene_generation(scenes)
    print(f"   → Generated {len(scene_paths)} scene image(s)")

    # Step 3: generate Kling video clips
    print("🎞 Generating Kling video clips...")
    video_paths = run_kling_video(scenes)
    if not video_paths:
        raise RuntimeError("No Kling video clips were generated.")

    print(f"   → Generated {len(video_paths)} video clip(s)")

    # Step 4: merge
    print("🔗 Merging clips into final video...")
    final_path = merge_videos(video_paths)

    return final_path


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Run full video generation pipeline from a script JSON file")
    p.add_argument("--script-file", help="Path to JSON file containing GeneratedScript", required=True)
    args = p.parse_args()

    with open(args.script_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    scenes = [s for s in data.get("scenes", [])]
    script_json_str = json.dumps(data)

    out = run_full_pipeline(scenes, script_json_str)
    print("Final video:", out)
