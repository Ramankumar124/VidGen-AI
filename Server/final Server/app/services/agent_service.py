
from langgraph.types import interrupt
from sqlalchemy.orm import Session

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START,END,StateGraph
from typing import TypedDict
import subprocess
import uuid
import os
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
    chosen_cloth_human_decision:str

@dataclass
class ContextSchema:
    db: Session

def download_video(state:AgentState):
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

def get_summary(state:AgentState, runtime: Runtime[ContextSchema]):
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
    try:
       new_analysis=AnalisedVideo(
        url=state["url"],
        analysis=response.text
      )
       db.add(new_analysis)
       db.commit()
    except Exception as e:
        print("DB Insert failed:", e)

     
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

    decision=interrupt(
        {
            "message":"Choose product cloth",
            "options":["add_new", "choose_from_existing"]
        }
    )
    print("Choosing product cloth... (placeholder)")
    return {"chosen_cloth_human_decision": decision}
  

def route_after_cloth_decision(state: AgentState):
    if state["chosen_cloth_human_decision"] == "add_new":
        print("Routing to add new cloth flow... (placeholder)")
        return "add_new_cloth_node"
    else:
        print("Routing to choose from existing cloth flow... (placeholder)")
        return "choose_from_existing_cloth_node"

def add_new_cloth_node(state:AgentState):
    print('adding new cloths')
    return {}

def choose_from_existing_cloth_node(state:AgentState):
    print('choosing from existing')
    return {}

    
    
builder=StateGraph(AgentState,context_schema=ContextSchema)

builder.add_node('Download_Video',download_video)
builder.add_node('Summarize_vedio',get_summary)
builder.add_node('generate_script_human_approval',generate_script_human_approval)
builder.add_node('generate_script_node', generate_script_node)
# builder.add_node('route_after_cloth_decision',route_after_cloth_decision)
builder.add_node('add_new_cloth_node',add_new_cloth_node)
builder.add_node('choose_from_existing_cloth_node',choose_from_existing_cloth_node)
builder.add_edge(START,'Download_Video')
builder.add_edge('Download_Video','Summarize_vedio')
builder.add_edge('Summarize_vedio','generate_script_human_approval')

builder.add_conditional_edges(
    'generate_script_human_approval',
    route_after_human,
    {
        "generate_script_node": "generate_script_node",
        END: END
    }
)
# builder.add_edge('generate_script_node', 'route_after_cloth_decision')
builder.add_conditional_edges(
    'generate_script_node',
    route_after_cloth_decision,
    {
        "add_new_cloth_node": "add_new_cloth_node",
        'choose_from_existing_cloth_node':'choose_from_existing_cloth_node'
    }
)

checkpointer = SqliteSaver(conn=conn)
app = builder.compile(checkpointer=checkpointer)

def agent_run(url: str, thread_id: str,db:Session):
    config = {"configurable": {"thread_id": thread_id}}

    initial_input = {"url": url}

    for event in app.stream(initial_input, config=config,context={"db":db}):
        print(event)

        if "__interrupt__" in event:
                return {
                "status": "waiting",
                "interrupt": event["__interrupt__"]
            }
    return {
        "status": "completed",
        "interrupt": None
    }



def agent_resume(run_id: str, decision: str,db:Session):
    config = {"configurable": {"thread_id": run_id}}
    for event in app.stream(
        Command(resume=decision),
        config=config,
        context={"db": db}
    ):
        print("EVENT:", event)

        # If next interrupt comes → stop and return
        if "__interrupt__" in event:
            return {
                "status": "waiting",
                "interrupt": event["__interrupt__"]
            }

    # If no interrupt → flow completed
    return {
        "status": "completed",
        "interrupt": None
    }
    