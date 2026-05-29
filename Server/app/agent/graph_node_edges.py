
from google import genai
from app.agent.prompts import SYSTEM_PROMPT
from app.models.videoAnalisis import AnalisedVideo
from app.models.product import Product
from app.models.ScriptGeneration import GeneratedScript
from app.agent.types import AgentState, ContextSchema
from langgraph.graph import END
from langgraph.types import interrupt
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from langgraph.types import Runtime
import os
import subprocess
import uuid    
import time
import json
from app.agent.prompts import SCRIPT_GENERATION_SYSTEM_PROMPT
from dotenv import load_dotenv
from app.models.ScriptGeneration import GeneratedScript
from app.models.videoAnalisis import AnalisedVideo
from app.schemas.VedioAnalysis import VideoAnalysis
from app.models.product import Product
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set")
client = genai.Client(api_key=api_key)

def download_video_from_url(state:AgentState):
    # Node 1: Download the source video from the provided URL.
    os.makedirs("downloads", exist_ok=True)
    video_url=state["url"]
    file_id = str(uuid.uuid4())
    env = os.environ.copy()
    env["PATH"] += os.pathsep + os.path.expanduser("~/.deno/bin")

    try:
            result = subprocess.run([
                "yt-dlp",
                #  "-f", "best[ext=mp4]/best",
                "-f", "bestvideo+bestaudio/best",
                "--merge-output-format", "mp4",
                  # ✅ cookies (VERY IMPORTANT)
                "--cookies", "cookies.txt",
               "--remote-components", "ejs:github",
               "--extractor-args", "youtube:player_client=web",
                "-o", f"downloads/{file_id}.%(ext)s",
                video_url
            ],
            capture_output=True,
            text=True,
            check=True,
            env=env
            )
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        raise Exception(f"Failed to download video: {error_msg}")

    return {'vedio_downloaded_path':f"downloads/{file_id}.mp4"}

def analyze_video_and_store_summary(state:AgentState, runtime: "Runtime[ContextSchema]"):
    # Node 2: Upload video to Gemini, generate analysis JSON, and persist it.
    db=runtime.context.db
    output_vedio_path=state["vedio_downloaded_path"]

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
     

     #store the analysis data in database
    parsed_analysis: dict[str, Any]
    try:
       parsed_analysis = json.loads(response.text)
    except Exception:
       parsed_analysis = {"raw_response": response.text}

    try:
       new_analysis=AnalisedVideo(
        url=state["url"],
        analysis=parsed_analysis
      )
       db.add(new_analysis)
       db.commit()
       db.refresh(new_analysis)
    except Exception as e:
        print("DB Insert failed:", e)
        new_analysis = None

     
    # Store summary + DB record id for downstream product-details persistence.
    return {"analized_summary": response.text}

def ask_user_if_script_generation_is_needed(state:AgentState):
    # Node 3: Pause flow and ask whether to skip or continue to script generation.
    
    decision=interrupt(
        {
            "message":"Do u want to  skip or  generate script?",
            "options":["skip", "generate_script"]
        }
    )
    return {"generate_script_human_decision": decision}
                
def route_after_choosing_script_generation(state: AgentState):
    if state["generate_script_human_decision"] == "skip":
        return END
    else:
        return "collect_product_details_source_decision"

def collect_product_details_source_decision(state: AgentState):
    # Node 4: Ask user whether product details are new or selected from existing.

    decision=interrupt(
        {
            "message":"How do you want to provide product details?",
            "options":["add_new", "choose_from_existing"]
        }
    )
    print("Collecting product details source decision...")
    return {"product_details_source_decision": decision}
  

def route_after_product_details_source_decision(state: AgentState):
    if state["product_details_source_decision"] == "add_new":
        print("Routing to add new product details flow...")
        return "collect_new_product_details"
    else:
        print("Routing to choose existing product flow...")
        return "collect_existing_product_details"

def collect_new_product_details(state:AgentState,runtime: "Runtime[ContextSchema]"):
    db=runtime.context.db
    # Node 5A: Ask user for brand-new product details to store.
    details = interrupt(
        {
            "message": "Provide new product details",
            "expected_payload": {
                "product_name": "string",
                "brand": "string",
                "category": "string",
                "price": "number_or_string",
                "description": "string",
                'IdealSellingLocation': "string",
                'productType': "string",
                 "productImages": ["string (image_url or file_path)"]
            }
        }
    )


    new_product=Product(
        product_name=details.get("product_name", ""),
        brand=details.get("brand", ""),
        category=details.get("category", ""),
        price=details.get("price", ""),
        description=details.get("description", ""),
        product_images=details.get("productImages", [])
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    print("Received new product details input.")
    
    product_dict = {
        "id": new_product.id,
        "product_name": new_product.product_name,
        "brand": new_product.brand,
        "category": new_product.category,
        "price": new_product.price,
        "description": new_product.description,
        "product_images": new_product.product_images
    }
    return {"product_details": {"source": "add_new", "details": product_dict}}

def collect_existing_product_details(state: AgentState):
    # Node 5B: Interrupt to receive the chosen product dict from the frontend.
    selected_product = interrupt(
        {
            "message": "Select product from existing catalog",
            "expected_payload": {
                "product_id": "string_or_number",
                "product_name": "optional_string",
                "brand": "string",
                "category": "string",
                "price": "string",
                "description": "string",
                "productImages": ["string (file_path)"]
            }
        }
    )
    # selected_product is the dict the frontend sends via /agent/resume decision
    print("Received existing product decision:", selected_product)
    return {"product_details": {"source": "choose_from_existing", "details": selected_product}}


def create_script_from_summary_and_product_details(state: AgentState):
    # Extract product details from the state (handles DB model or plain dict)
    product_entry = state.get("product_details", {})
    product = None
    if isinstance(product_entry, dict):
        product = product_entry.get("details")
    else:
        product = product_entry

    def _get(field, default=""):
        if product is None:
            return default
        # dataclass / ORM object attribute
        if hasattr(product, field):
            try:
                return getattr(product, field) or default
            except Exception:
                return default
        # dict-like access
        if isinstance(product, dict):
            return product.get(field, default)
        return default


    product_details_text = f"""
                          Product Details:
                          - Brand Name:{_get("brand")}
                          - Product Name: {_get("product_name")}
                          - Price: {_get("price")}
                          - Category: {_get("category")}
                          - Product Type: {_get("productType")}
                          - Ideal Selling Location: {_get('IdealSellingLocation')}
                          - Short Reasoning: {_get('description')}
                             """

    # Read images once and build Gemini Part objects
    product_images = _get("productImages") or []
    image_parts = []
    if product_images:
        for img_path in product_images:
            try:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()
                # Determine mime type from extension
                ext = str(img_path).lower().split('.')[-1]
                mime_type = "image/png" if ext == "png" else "image/webp" if ext == "webp" else "image/jpeg"
                image_parts.append(
                    genai.types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                )
            except Exception as e:
                print(f"Failed to read image {img_path}: {e}")

    referenceScript= state["analized_summary"]


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

    f"Reference Script:\n{referenceScript}")
                
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
    return {"generateted_script": generated_script}
