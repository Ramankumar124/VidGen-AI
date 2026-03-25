import subprocess
import uuid
def download_video(video_url: str):
    file_id = str(uuid.uuid4())

    try:
        result = subprocess.run([
            "yt-dlp",
            "-f", "bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "-o", f"{file_id}.%(ext)s",
            video_url
        ], capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        raise Exception(f"Failed to download video: {error_msg}")

    return f"{file_id}.mp4"