from langchain_core.runnables import RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI
import subprocess
import uuid
from google import genai
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional
from fastapi import UploadFile, File, Form
import json
from pydantic import BaseModel, Field

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

import os
os.environ["GOOGLE_API_KEY"] = "AIzaSyBbRek5EMgTbhVyNe72C4Pv0t0WcXP2A8U"
# os.environ["GOOGLE_API_KEY"] = "AIzaSyD1UDLSELjiCuFpHRoOxVRGjOmXEXCzPPk"
client = genai.Client()


SYSTEM_PROMPT = """
You are an expert advertisement analyst and professional video editor.

Your task is to deeply analyze the provided advertisement video and explain how the ad is edited and constructed.

Do NOT just describe the video. Instead analyze it like a video editor and marketing strategist.

For the given video, extract the following details:

1. Scene Timeline
Break the video into scenes in chronological order.  
For each scene include:
- Timestamp (approximate)
- What visually appears
- When the scene cuts or transitions


2. Editing Techniques
Identify the editing methods used such as:
- Hard cuts
- Jump cuts
- Match cuts
- Slow motion
- Speed ramping
- Zoom effects
- Motion graphics
- Split screens
- Product reveal shots

3. Camera Work
Explain the camera techniques used:
- Close-up shots
- Wide shots
- Handheld shots
- Focus changes
- Angle of the camera

4. Product Presentation
Explain how the product is introduced and highlighted:
- First appearance of the product
- How the product is framed

5. Visual Elements
Analyze visual design choices:
- Text overlays
- On-screen graphics
- Color grading
- Lighting style
- Logo appearance

6. Audio Transcript
- What is the voiceover

7. Storytelling Structure
Explain the narrative structure of the advertisement:
- Hook (first few seconds)
- Problem setup
- Product solution
- Key benefits
- Final call-to-action

8. Marketing Strategy
Explain the advertising strategy used:
- Target audience
- Emotional triggers
- Persuasion techniques
- Branding strategy
Format the output in structured sections with clear headings.
make sure you don't provide content more than 500-600 words
Be very observant and mention every important editing decision used in the advertisement.
"""




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
    contents=[
        SYSTEM_PROMPT,
        video_file
    ]
     )
    
    try:
        os.remove(output_vedio_path)
        print("Deleted:", output_vedio_path)
    except Exception as e:
        print("Delete failed:", e)

    return response.text


download_video_from_link = RunnableLambda(download_video)
summarize_vedio=RunnableLambda(get_summary)


chain=download_video_from_link | summarize_vedio

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

SCRIPT_GENERATION_SYSTEM_PROMPT = """
You are an expert advertisement copywriter and video director.
You will be given:
1. One or more reference advertisement scripts that define a particular editing style, pacing, and storytelling structure.
2. Product images showing the product visually.
3. Product details (price range, category, product type, styling type, target audience, selling location, and a short reasoning).

Your job:
- Study the reference script(s) ONLY for their style, structure, pacing, scene breakdown format, tone of voice, hook style, and call-to-action approach.
- DO NOT copy any content from the reference scripts. They are style references only.
- Generate a brand-new advertisement video script for the given product.
- The script must be fully adapted to the product details provided.

=== CRITICAL: OUTPUT FORMAT ===
You MUST respond with ONLY a JSON object. NO markdown code blocks, NO explanation text, NO triple backticks, NO ``` characters.
Start your response immediately with the opening brace { and end with the closing brace }.

Required JSON structure:
{
  "title": "Advertisement Script Title Here",
  "product": "Product description",
  "style": {
    "tone": "description of tone",
    "pacing": "description of pacing",
    "visual_aesthetic": "description of visual style"
  },
  "sections": {
    "hook": [
      {
        "scene": 1,
        "timestamp": "0:00-0:03",
        "visual": "Visual description of the scene",
        "voiceover": "Voiceover text here or null",
        "editing": "Editing technique description"
      }
    ],
    "body": [
      {
        "scene": 2,
        "timestamp": "0:03-0:06",
        "visual": "Visual description",
        "voiceover": "Voiceover or null",
        "editing": "Editing technique"
      }
    ],
    "call_to_action": [
      {
        "scene": 10,
        "timestamp": "0:25-0:30",
        "visual": "Final visual",
        "voiceover": "CTA text",
        "editing": "Final editing technique"
      }
    ]
  }
}

Rules:
- Hook: 2-4 scenes for attention-grabbing opening (first 3-5 seconds)
- Body: 4-8 scenes for main narrative and product showcase
- Call to Action: 1-2 scenes for closing message
- Each scene must have: scene number, timestamp, visual, voiceover (can be null), editing
- Keep timestamps accurate in MM:SS-MM:SS format
- Ensure all scenes flow logically
- Use null for optional voiceover fields that don't have dialogue
- Do NOT use markdown, code blocks, or any formatting besides plain JSON
"""


# Pydantic Models for Structured Output
class SceneDetail(BaseModel):
    scene: int = Field(..., description="Scene number")
    timestamp: str = Field(..., description="Timestamp in MM:SS-MM:SS format")
    visual: str = Field(..., description="Visual description of the scene")
    voiceover: Optional[str] = Field(None, description="Voiceover or dialogue")
    dialogue: Optional[str] = Field(None, description="Character dialogue")
    editing: str = Field(..., description="Editing technique used")
    text_on_screen: Optional[List[str]] = Field(None, description="Text overlays")
    text_overlay: Optional[str] = Field(None, description="Text overlay")


class ScriptSections(BaseModel):
    hook: Optional[List[SceneDetail]] = Field(None, description="Hook scenes for attention-grabbing opening")
    body: Optional[List[SceneDetail]] = Field(None, description="Main scene breakdown/body")
    scene_breakdown: Optional[List[SceneDetail]] = Field(None, description="Alternative name for body scenes")
    call_to_action: Optional[List[SceneDetail]] = Field(None, description="Call to action scenes")


class GeneratedScript(BaseModel):
    """Structured advertisement script with hook, body, and call-to-action"""
    title: str = Field(..., description="Title of the advertisement script")
    product: str = Field(..., description="Product description")
    style: Optional[dict] = Field(None, description="Style information")
    sections: ScriptSections = Field(..., description="Sections containing hook, body, and call_to_action")


class ScriptResponse(BaseModel):
    reference_script_index: int = Field(..., description="Index of the reference script")
    total_scripts: int = Field(..., description="Total number of reference scripts")
    generated_script: GeneratedScript = Field(..., description="The generated advertisement script")


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
    """Stream one generated script per example script back to the frontend with structured JSON output using LangChain."""

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

    # Read images once and build Gemini Part objects directly (no base64 needed)
    image_parts = []
    if product_images:
        for img in product_images:
            img_bytes = await img.read()
            mime_type = img.content_type or "image/jpeg"
            image_parts.append(
                genai.types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
            )

    total = len(example_scripts)
    
    # Initialize LangChain LLM for better structured output handling
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        convert_system_message_to_human=True,
    )

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

            # Build the message content combining system prompt and product details
            full_prompt = f"""{SCRIPT_GENERATION_SYSTEM_PROMPT}

{product_details_text}

{script_instruction}

NOW GENERATE THE JSON RESPONSE. Remember: Output ONLY the JSON object with no other text, no markdown, no code blocks. Start with {{ and end with }}."""

            try:
                # Use LangChain to invoke the LLM with proper JSON parsing
                response = llm.invoke(full_prompt)
                response_text = response.content
                
                # Clean up markdown code blocks if present
                json_text = response_text.strip()
                
                # Remove markdown code block wrappers
                if json_text.startswith("```json"):
                    json_text = json_text[7:]
                elif json_text.startswith("```"):
                    json_text = json_text[3:]
                
                if json_text.endswith("```"):
                    json_text = json_text[:-3]
                
                json_text = json_text.strip()
                
                # Find the first { and last } to extract pure JSON
                start_idx = json_text.find('{')
                end_idx = json_text.rfind('}')
                
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    json_text = json_text[start_idx:end_idx+1]
                
                json_text = json_text.strip()
                
                # Parse and validate the JSON response
                script_json = json.loads(json_text)
                generated_script = GeneratedScript(**script_json)
                
            except (json.JSONDecodeError, ValueError) as e:
                # Fallback: wrap raw response
                print(f"JSON parse error: {e}, response: {response_text[:300]}")
                generated_script = GeneratedScript(
                    title=f"Advertisement Script {idx + 1}",
                    product=f"{product_name} - {product_type}",
                    sections={
                        "hook": [],
                        "body": [],
                        "call_to_action": []
                    }
                )

            # Create properly typed response
            script_response = ScriptResponse(
                reference_script_index=idx + 1,
                total_scripts=total,
                generated_script=generated_script
            )

            # Yield as properly formatted JSON line
            yield script_response.model_dump_json() + "\n"

    return StreamingResponse(script_stream(), media_type="application/x-ndjson")
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)



