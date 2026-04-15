
from langgraph.types import interrupt
from sqlalchemy.orm import Session

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START,END,StateGraph
from typing import Any, TypedDict
import subprocess
import uuid
import os
import json
from google import genai
from app.agent.prompts import SYSTEM_PROMPT
from dotenv import load_dotenv
from app.schemas.VedioAnalysis import VideoAnalysis
import time
from langgraph.types import Command
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from dataclasses import dataclass
from langgraph.runtime import Runtime
from app.models.videoAnalisis import AnalisedVideo
from app.models.product import Product
load_dotenv()
conn = sqlite3.connect(database='agent.db', check_same_thread=False)
# Load API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set")

client = genai.Client(api_key=api_key)



class  AgentState(TypedDict,total=False):
    url:str
    vedio_downloaded_path: str
    analized_summary: VideoAnalysis
    generate_script_human_decision: str
    product_details_source_decision: str
    product_details: dict[str, Any]

@dataclass
class ContextSchema:
    db: Session

def download_video_from_url(state:AgentState):
    # Node 1: Download the source video from the provided URL.
    os.makedirs("downloads", exist_ok=True)
    video_url=state["url"]
    file_id = str(uuid.uuid4())

    try:
            result = subprocess.run([
                "yt-dlp",
                 "-f", "best[ext=mp4]/best",
                # "-f", "bestvideo+bestaudio/best",
                # "--merge-output-format", "mp4",
                "-o", f"downloads/{file_id}.%(ext)s",
                video_url
            ], capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        raise Exception(f"Failed to download video: {error_msg}")

    return {'vedio_downloaded_path':f"downloads/{file_id}.mp4"}

def analyze_video_and_store_summary(state:AgentState, runtime: Runtime[ContextSchema]):
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

def collect_new_product_details(state:AgentState,runtime: Runtime[ContextSchema]):
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
                 "productImages": ["string (image_url or file_path)"]
            }
        }
    )


    new_product=Product(
        product_name=details.product_name,
        brand=details.brand,
        category=details.category,
        price=details.price,
        description=details.description,
        product_images=details.productImages
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    product_id = new_product.id
    print("Received new product details input.")
    return {"product_details": {"source": "add_new", "details": details}}

def collect_existing_product_details(state:AgentState):
    # Node 5B: Ask user to choose an existing product reference/details.
    selected_product = interrupt(
        {
            "message": "Select product from existing catalog",
            "expected_payload": {
                "product_id": "string_or_number",
                "product_name": "optional_string"
            }
        }
    )
    print("Received existing product selection.")
    return {"product_details": {"source": "choose_from_existing", "details": selected_product}}

builder=StateGraph(AgentState,context_schema=ContextSchema)

# Build a clearly named LangGraph pipeline so each node is self-explanatory.
builder.add_node('download_video_from_url', download_video_from_url)
builder.add_node('analyze_video_and_store_summary', analyze_video_and_store_summary)
builder.add_node('ask_user_if_script_generation_is_needed', ask_user_if_script_generation_is_needed)
builder.add_node('collect_product_details_source_decision', collect_product_details_source_decision)
builder.add_node('collect_new_product_details', collect_new_product_details)
builder.add_node('collect_existing_product_details', collect_existing_product_details)

builder.add_edge(START, 'download_video_from_url')
builder.add_edge('download_video_from_url', 'analyze_video_and_store_summary')
builder.add_edge('analyze_video_and_store_summary', 'ask_user_if_script_generation_is_needed')

builder.add_conditional_edges(
    'ask_user_if_script_generation_is_needed',
    route_after_choosing_script_generation,
    {
        "collect_product_details_source_decision": "collect_product_details_source_decision",
        END: END
    }
)
builder.add_conditional_edges(
    'collect_product_details_source_decision',
    route_after_product_details_source_decision,
    {
        "collect_new_product_details": "collect_new_product_details",
        'collect_existing_product_details':'collect_existing_product_details'
    }
)
checkpointer = SqliteSaver(conn=conn)
app = builder.compile(checkpointer=checkpointer)

def agent_run(url: str, thread_id: str,db:Session):
    config = {"configurable": {"thread_id": thread_id}}
    initial_input = {"url": url}
    state = app.get_state(config=config)
    for event in app.stream(initial_input, config=config,context={"db":db}):

        if "__interrupt__" in event:
                return {
                "status": "waiting",
                "interrupt": event["__interrupt__"],
                "data": state.values   # 🔥 return partial state
            }
        
       
    return {
        "status": "completed",
        "interrupt": None,
        "data": state.values 
    }



def agent_resume(run_id: str, decision: Any,db:Session):
    config = {"configurable": {"thread_id": run_id}}
    state = app.get_state(config=config)

    for event in app.stream(
        Command(resume=decision),
        config=config,
        context={"db": db}
    ):
        # If next interrupt comes → stop and return
        if "__interrupt__" in event:
            return {
                "status": "waiting",
                "interrupt": event["__interrupt__"],
                "data":state.values
            }
    state = app.get_state(config=config)
    print('steate',state)
    # If no interrupt → flow completed
    return {
        "status": "completed",
        "interrupt": None,
        "data":state.values
    }
    