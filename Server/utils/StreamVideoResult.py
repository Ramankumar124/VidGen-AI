import json
import os


def process_video_safely(video_url):
    """Process a single video with error handling. Returns result or error message."""
    try:
        result = chain.invoke(video_url)
        return {"status": "success", "url": video_url, "result": result}
    except Exception as e:
        print(f"Skipping video {video_url}: {str(e)}")
        return {"status": "failed", "url": video_url, "error": str(e)}
    
def stream_video_results(urls: List[str]):
    """Generator that yields video processing results as they complete."""
    for url in urls:
        try:
            result = process_video_safely(url)
            yield json.dumps(result) + "\n"
        except Exception as e:
            error_result = {"status": "error", "url": url, "error": str(e)}
            yield json.dumps(error_result) + "\n"