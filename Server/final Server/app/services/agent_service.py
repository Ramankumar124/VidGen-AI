
from langgraph.types import interrupt
from sqlalchemy.orm import Session

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START,END,StateGraph
from typing import Any, TypedDict
from dotenv import load_dotenv
from app.schemas.VedioAnalysis import VideoAnalysis
<<<<<<< HEAD
from langgraph.types import Command
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from dataclasses import dataclass
from app.models.ScriptGeneration import GeneratedScript
from app.agent.graph_node_edges import download_video_from_url, analyze_video_and_store_summary, ask_user_if_script_generation_is_needed, collect_product_details_source_decision, collect_new_product_details, collect_existing_product_details, create_script_from_summary_and_product_details, route_after_choosing_script_generation, route_after_product_details_source_decision
=======
import time
from pathlib import Path
>>>>>>> 846694b (starting adding electron app)
load_dotenv()


conn = sqlite3.connect(database='agent.db', check_same_thread=False)


class  AgentState(TypedDict,total=False):
    url:str
    vedio_downloaded_path: str
    analized_summary: VideoAnalysis
    generate_script_human_decision: str
    product_details_source_decision: str
    product_details: dict[str, Any]
    generateted_script: GeneratedScript

@dataclass
class ContextSchema:
    db: Session

builder=StateGraph(AgentState,context_schema=ContextSchema)


# Build a clearly named LangGraph pipeline so each node is self-explanatory.
builder.add_node('download_video_from_url', download_video_from_url)
builder.add_node('analyze_video_and_store_summary', analyze_video_and_store_summary)
builder.add_node('ask_user_if_script_generation_is_needed', ask_user_if_script_generation_is_needed)
builder.add_node('collect_product_details_source_decision', collect_product_details_source_decision)
builder.add_node('collect_new_product_details', collect_new_product_details)
builder.add_node('collect_existing_product_details', collect_existing_product_details)
builder.add_node('create_script_from_summary_and_product_details', create_script_from_summary_and_product_details)  # Placeholder for script generation node

<<<<<<< HEAD
builder.add_edge(START, 'download_video_from_url')
builder.add_edge('download_video_from_url', 'analyze_video_and_store_summary')
builder.add_edge('analyze_video_and_store_summary', 'ask_user_if_script_generation_is_needed')

=======
def download_video(state:AgentState):
    BASE_DIR = Path(__file__).resolve().parent
    DOWNLOAD_DIR = BASE_DIR / "downloads"

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    video_url=state["url"]
    file_id = str(uuid.uuid4())
    output_template = str(DOWNLOAD_DIR / f"{file_id}.%(ext)s")

    try:
            result = subprocess.run([
                "yt-dlp",
                 "-f", "best[ext=mp4]/best",
                "-o",output_template,
                video_url
            ], capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        raise Exception(f"Failed to download video: {error_msg}")

    print('my veido id',file_id)
    return {'vedio_downloaded_path':f"downloads/{file_id}.mp4"}

def get_summary(state:AgentState):

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
     
    print('final response',response.text)
    # Store the model output back into graph state under a stable key
    return {"analized_summary": response.text}

def generate_script_human_approval(state:AgentState):
    decision=interrupt(
        {
            "message":"Do u want to  skip or  generate script?",
            "options":["skip", "generate_script"]
        }
    )
    return {"generate_script_human_decision": decision}

def route_after_human(state: AgentState):
    if state["generate_script_human_decision"] == "skip":
        return END
    else:
        return "generate_script_node"

def generate_script_node(state: AgentState):
    print("Generating script... (placeholder)")
    return {}
builder=StateGraph(AgentState)

builder.add_node('Download_Video',download_video)
builder.add_node('Summarize_vedio',get_summary)
builder.add_node('generate_script_human_approval',generate_script_human_approval)
builder.add_node('generate_script_node', generate_script_node)
builder.add_edge(START,'Download_Video')
builder.add_edge('Download_Video','Summarize_vedio')
builder.add_edge('Summarize_vedio','generate_script_human_approval')
>>>>>>> 846694b (starting adding electron app)
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
    # If no interrupt → flow completed
    return {
        "status": "completed",
        "interrupt": None,
        "data":state.values
    }
    