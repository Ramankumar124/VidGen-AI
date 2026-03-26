import os
import json
import time
from dotenv import load_dotenv
from google import genai
from fastapi import FastAPI, UploadFile, File, Form, Body, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.runnables import RunnableLambda
from typing import List, Optional
from models.VedioAnalysis import VideoAnalysis
from models.ScriptGeneration import ScriptResponse, GeneratedScript
from prompts.prompts import SYSTEM_PROMPT, SCRIPT_GENERATION_SYSTEM_PROMPT
from utils.DownloadVideo import download_video
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
    model="gemini-2.5-flash",
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
                          - Target Behavior: {target_behavior}
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
            if total == 1:
                script_instruction = (
                    "You have been given ONE reference script below. "
                    "Analyze its editing style, pacing, structure, hook, and call-to-action format. "
                    "Generate ONE advertisement script for our product following the same style.\n\n"
                    f"Reference Script:\n{example_script}"
                )
            else:
                script_instruction = (
                    f"You have been given {total} reference scripts. "
                    f"This is reference script #{idx + 1} of {total}. "
                    "Analyze its editing style, pacing, structure, hook, and call-to-action format. "
                    "Generate ONE advertisement script for our product following the style of THIS reference script only.\n\n"
                    f"Reference Script #{idx + 1}:\n{example_script}"
                )

            full_prompt = f"""{SCRIPT_GENERATION_SYSTEM_PROMPT}
                              {product_details_text}
                              {script_instruction}"""

            # Build content parts: prompt text + any product images
            contents = [full_prompt] + image_parts

            # Use Gemini native structured output — no JSON parsing needed
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedScript,
                },
            )

            generated_script: GeneratedScript = response.parsed

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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)



