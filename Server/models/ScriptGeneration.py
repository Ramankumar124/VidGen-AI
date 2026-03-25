# Pydantic Models for Structured Output
from pydantic import BaseModel, Field
from typing import List, Optional


class SceneDetail(BaseModel):
    scene: int = Field(..., description="Scene number")
    timestamp: str = Field(..., description="Timestamp in MM:SS-MM:SS format. Each scene must be exactly 8 seconds long (e.g. 00:00-00:08, 00:08-00:16, 00:16-00:24, ...)")
    duration_seconds: int = Field(8, description="Duration of this scene in seconds. Must always be 8.")
    cuts: Optional[List[str]] = Field(None, description="Optional list of sub-cut descriptions within this 8-second scene. Use this when the scene contains multiple quick cuts or transitions.")
    visual: str = Field(..., description="Detailed visual description of the scene", min_length=100)
    voiceover: Optional[str] = Field(None, description="Voiceover or dialogue")
    dialogue: Optional[str] = Field(None, description="Character dialogue")
    editing: str = Field(..., description="Editing technique used")
    text_overlay: Optional[str] = Field(None, description="Text overlay on screen")
    model_clothes: List[str] = Field(None, description="Descriptions of clothes worn by models in the scene like color and style and very detailed")
    model_appearance: List[str] = Field(None, description="Descriptions of models' appearances in the scene")


class StyleInfo(BaseModel):
    """Style metadata for the advertisement script"""
    tone: Optional[str] = Field(None, description="Overall tone of the script (e.g. energetic, calm, luxurious)")
    pacing: Optional[str] = Field(None, description="Pacing style (e.g. fast-cut, slow-burn)")
    color_palette: Optional[str] = Field(None, description="Dominant color palette suggested")
    music_mood: Optional[str] = Field(None, description="Suggested background music mood")
    notes: Optional[str] = Field(None, description="Any additional style notes")


class GeneratedScript(BaseModel):
    """Structured advertisement script as a flat ordered list of scenes"""
    title: str = Field(..., description="Title of the advertisement script")
    product: str = Field(..., description="Product description")
    style: Optional[StyleInfo] = Field(None, description="Style information for the advertisement")
    scenes: List[SceneDetail] = Field(..., description="Ordered list of all scenes in the advertisement")


class ScriptResponse(BaseModel):
    reference_script_index: int = Field(..., description="Index of the reference script")
    total_scripts: int = Field(..., description="Total number of reference scripts")
    generated_script: GeneratedScript = Field(..., description="The generated advertisement script")
