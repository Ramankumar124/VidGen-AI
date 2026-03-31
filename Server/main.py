import os
import json
import time
import asyncio
from dotenv import load_dotenv
from google import genai
from fastapi import FastAPI, UploadFile, File, Form, Body, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from langchain_core.runnables import RunnableLambda
from typing import List, Optional
from models.VedioAnalysis import VideoAnalysis
from models.ScriptGeneration import ScriptResponse, GeneratedScript
from prompts.prompts import SYSTEM_PROMPT, SCRIPT_GENERATION_SYSTEM_PROMPT
from utils.DownloadVideo import download_video
from pipeline.extract_images import run_extract_images
from pipeline.scene_generation import run_scene_generation
from pipeline.asset_registry import build_asset_registry, save_asset_registry
from pipeline.kling_video import run_kling_video
from pipeline.merge_video import merge_videos
from pipeline.run_pipeline import run_full_pipeline
# Load environment variables from .env file
load_dotenv()

# Load API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set")

client = genai.Client(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def get_summary(output_vedio_path: str):

    video_file = client.files.upload(file=output_vedio_path)

    while True:
        video_file = client.files.get(name=video_file.name)
        print("File state:", video_file.state.name)

        if video_file.state.name == "ACTIVE":
            break

        if video_file.state.name == "FAILED":
            raise Exception("Video processing failed")

        time.sleep(2)

    response = client.models.generate_content(
    model="gemini-3.1-pro-preview",
    contents=[SYSTEM_PROMPT,video_file],
    config={
        "response_mime_type": "application/json",
        "response_schema": VideoAnalysis,
    },
     )
    
    try:
        os.remove(output_vedio_path)
        print("Deleted:", output_vedio_path)
    except Exception as e:
        print("Delete failed:", e)

    return response.text

def process_video_safely(video_url):
    """Process a single video with error handling. Returns result or error message."""
    try:
        result = chain.invoke(video_url)
        return {"status": "success", "url": video_url, "result": result}
    except Exception as e:
        print(f"Skipping video {video_url}: {str(e)}")
        return {"status": "failed", "url": video_url, "error": str(e)}


# Streaming generator for video processing results
def stream_video_results(urls: List[str]):
    """Generator that yields video processing results as they complete."""
    for url in urls:
        try:
            result = process_video_safely(url)
            yield json.dumps(result) + "\n"
        except Exception as e:
            error_result = {"status": "error", "url": url, "error": str(e)}
            yield json.dumps(error_result) + "\n"



download_video_from_link = RunnableLambda(download_video)
summarize_vedio=RunnableLambda(get_summary)


chain=download_video_from_link | summarize_vedio


# API Endpoints
@app.post("/process-videos")
async def process_videos_stream(urls: List[str]):
    """Process videos and stream results back to client."""
    return StreamingResponse(
        stream_video_results(urls),
        media_type="application/x-ndjson"
    )

@app.post("/process-single-video")
async def process_single_video(url: str):
    """Process a single video and stream result back."""
    return StreamingResponse(
        stream_video_results([url]),
        media_type="application/x-ndjson"
    )

@app.post("/generate-our-script")
async def generate_our_script(
    example_scripts: List[str] = Form(...),
    brand_name: str = Form(...),
    product_name: str = Form(...),
    price_range: str = Form(...),
    category: str = Form(...),
    product_type: str = Form(...),
    styling_type: str = Form(...),
    target_age_range: str = Form(...),
    target_gender: str = Form(...),
    target_behavior: str = Form(...),
    ideal_selling_location: str = Form(...),
    short_reasoning: str = Form(...),
    product_images: Optional[List[UploadFile]] = File(None),
    ):
    """Stream one generated script per example script back to the frontend using Gemini structured output."""

    product_details_text = f"""
                          Product Details:
                          - Brand Name: {brand_name}
                          - Product Name: {product_name}
                          - Price Range: {price_range}
                          - Category: {category}
                          - Product Type: {product_type}
                          - Styling Type: {styling_type}
                          - Target Age Range: {target_age_range}
                          - Target Gender: {target_gender}
                          - Ideal Selling Location: {ideal_selling_location}
                          - Short Reasoning: {short_reasoning}
                             """

    # Read images once and build Gemini Part objects
    image_parts = []
    if product_images:
        for img in product_images:
            img_bytes = await img.read()
            mime_type = img.content_type or "image/jpeg"
            image_parts.append(
                genai.types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
            )

    total = len(example_scripts)

    async def script_stream():
        for idx, example_script in enumerate(example_scripts):
            script_instruction = (
    "You are given ONE reference advertisement script below.\n\n"

    "Your task is to deeply analyze this script and understand its core storytelling and editing patterns. "
    "Specifically, break down and learn:\n"
    "- The opening hook (both visual and audio elements — how it grabs attention in the first few seconds)\n"
    "- The pacing and timing of scenes or dialogues\n"
    "- The overall structure (hook → problem → solution → benefits → call-to-action)\n"
    "- The tone, language style, and emotional appeal\n"
    "- The call-to-action format and how it drives user engagement\n\n"

    "IMPORTANT:\n"
    "- Pay special attention to the HOOK: identify whether it is curiosity-driven, emotional, shocking, or problem-based\n"
    "- Analyze how visuals and audio (voiceover/dialogue/music cues) work together to create impact\n"
    "- Observe transitions, rhythm, and flow of the script\n\n"

    "Then, using these insights, generate ONE new advertisement script for OUR product that:\n"
    "- Follows the SAME style, pacing, and structure\n"
    "- Uses a similarly strong hook (adapted to our product)\n"
    "- Maintains engaging storytelling and smooth flow\n"
    "- Includes clear visual and audio cues where relevant\n"
    "- Ends with a compelling call-to-action\n\n"

    "Do NOT copy the content. Only replicate the STYLE and STRUCTURE.\n\n"

    f"Reference Script:\n{example_script}"
                                            )
                
            full_prompt = f"""{SCRIPT_GENERATION_SYSTEM_PROMPT}
                              {product_details_text}
                              {script_instruction}"""

            # Build content parts: prompt text + any product images
            contents = [full_prompt] + image_parts

            # Use Gemini native structured output — no JSON parsing needed
            response = client.models.generate_content(
                model="gemini-3.1-pro-preview",
                contents=contents,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedScript,
                },
            )

            generated_script: GeneratedScript = response.parsed
            print(f"Generated script for reference #{idx + 1}:\n{generated_script}")

            script_response = ScriptResponse(
                reference_script_index=idx + 1,
                total_scripts=total,
                generated_script=generated_script,
            )

            yield script_response.model_dump_json() + "\n"

    return StreamingResponse(script_stream(), media_type="application/x-ndjson")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.post("/callback")
async def webhook_callback(request: Request, x_signature: Optional[str] = Header(None)):
    """Generic webhook callback endpoint.

    - Accepts JSON or raw bodies from external webhook providers.
    - Logs the payload and optional `X-Signature` header.
    - Returns a simple acknowledgment so the provider knows the callback was received.
    """
    try:
        payload = await request.json()
    except Exception:
        raw = await request.body()
        try:
            payload = raw.decode("utf-8")
        except Exception:
            payload = str(raw)

    print("Received webhook callback. X-Signature:", x_signature)
    try:
        print(json.dumps(payload))
    except Exception:
        print(payload)

    # TODO: validate signature, persist events, or enqueue for processing
    return {"status": "received"}



@app.post("/generate-video")
async def generate_video(
    script_json: str = Form(..., description="JSON string of the GeneratedScript"),
    product_images: Optional[List[UploadFile]] = File(None),
    model_images: Optional[List[UploadFile]] = File(None),
):
    print("product_images:", [img.filename for img in product_images] if product_images else "None")
    # Parse script
    try:
        script_data = json.loads(script_json)
        generated_script = GeneratedScript(**script_data)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Invalid script_json: {e}")

    scenes = [s.model_dump() for s in generated_script.scenes]

    # Save uploaded reference images to output/
    os.makedirs("output", exist_ok=True)
     
    #  Save Product images
    if product_images:
        for idx, img_file in enumerate(product_images, start=1):
            img_bytes = await img_file.read()
            ext = (img_file.filename).rsplit(".", 1)[-1].lower()
            print(f"Processing product image: {img_file.filename}, detected extension: {ext}")
            path = os.path.join("output", f"product{idx}.{ext}")
            with open(path, "wb") as f:
                f.write(img_bytes)
            print(f"✅ Saved product image: {path}")
    #  save model images
    if model_images:
        for idx, img_file in enumerate(model_images, start=1):
            img_bytes = await img_file.read()
            ext = (img_file.filename or "image.png").rsplit(".", 1)[-1].lower()
            path = os.path.join("output", f"model{idx}.{ext}")
            with open(path, "wb") as f:
                f.write(img_bytes)
            print(f"✅ Saved model image: {path}")

    # Run the heavy pipeline in a thread so the event loop is not blocked
    def _run_pipeline():
        # Step 1 – Extract model/clothing images (only if no model images were uploaded)
        existing_models = [f for f in os.listdir("output") if f.startswith("model") and f.endswith((".png", ".jpg", ".jpeg",".webp"))]
        if not existing_models:
            run_extract_images(scenes, json.dumps(script_data))
        else:
            print(f"⏭️  Using {len(existing_models)} uploaded model image(s), skipping extraction.")
            reg = build_asset_registry("output", extract_result=None, clothing_items=None)
            save_asset_registry(reg, "output")

        # Step 2 – Generate one scene image per scene
        run_scene_generation(scenes)

        # Step 3 – Generate Kling video clips per scene
        video_paths = run_kling_video(scenes)

        if not video_paths:
            raise RuntimeError("No video clips were generated. Check scene images and Kling API key.")

        # Step 4 – Merge all clips
        final_path = merge_videos(video_paths)
        return final_path

    try:
        final_video_path = await asyncio.to_thread(_run_pipeline)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

    return FileResponse(
        path=final_video_path,
        media_type="video/mp4",
        filename="advertisement_video.mp4",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)


