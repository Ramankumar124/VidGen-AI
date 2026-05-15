
from langgraph.types import interrupt
from sqlalchemy.orm import Session

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START,END,StateGraph
from typing import Any, TypedDict
from dotenv import load_dotenv
from app.schemas.VedioAnalysis import VideoAnalysis
from langgraph.types import Command
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from dataclasses import dataclass
from app.models.ScriptGeneration import GeneratedScript
from app.agent.types import AgentState, ContextSchema
from app.agent.graph_node_edges import download_video_from_url, analyze_video_and_store_summary, ask_user_if_script_generation_is_needed, collect_product_details_source_decision, collect_new_product_details, collect_existing_product_details, create_script_from_summary_and_product_details, route_after_choosing_script_generation, route_after_product_details_source_decision
import time
from pathlib import Path
load_dotenv()


conn = sqlite3.connect(database='agent.db', check_same_thread=False)

builder=StateGraph(AgentState,context_schema=ContextSchema)


# Build a clearly named LangGraph pipeline so each node is self-explanatory.
builder.add_node('download_video_from_url', download_video_from_url)
builder.add_node('analyze_video_and_store_summary', analyze_video_and_store_summary)
builder.add_node('ask_user_if_script_generation_is_needed', ask_user_if_script_generation_is_needed)
builder.add_node('collect_product_details_source_decision', collect_product_details_source_decision)
builder.add_node('collect_new_product_details', collect_new_product_details)
builder.add_node('collect_existing_product_details', collect_existing_product_details)
builder.add_node('create_script_from_summary_and_product_details', create_script_from_summary_and_product_details)  # Placeholder for script generation node

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
builder.add_edge('collect_new_product_details', 'create_script_from_summary_and_product_details')
builder.add_edge('collect_existing_product_details', 'create_script_from_summary_and_product_details')
builder.add_edge('create_script_from_summary_and_product_details', END)
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
    