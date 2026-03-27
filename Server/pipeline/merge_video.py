"""
Merge a list of video clip files into one final MP4 using ffmpeg concat.
"""
import os
import subprocess


def merge_videos(video_paths: list[str], output_path: str = "output/final_merged.mp4") -> str:
    """
    Concatenate video_paths into output_path using ffmpeg.
    Returns the absolute path to the merged file.
    Raises RuntimeError if ffmpeg fails or no videos are provided.
    """
    if not video_paths:
        raise RuntimeError("No video paths provided to merge.")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    # Build ffmpeg concat list (use sorted order so scene numbering is preserved)
    sorted_paths = sorted(video_paths)
    concat_dir = os.path.dirname(os.path.abspath(output_path))
    concat_list_path = os.path.join(concat_dir, "concat_list.txt")

    with open(concat_list_path, "w") as f:
        for vp in sorted_paths:
            abs_path = os.path.abspath(vp)
            f.write(f"file '{abs_path}'\n")

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        os.path.abspath(output_path),
    ]

    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg merge failed:\n{result.stderr[-2000:]}")

    print(f"✅ Merged video saved: {output_path}")
    return os.path.abspath(output_path)
