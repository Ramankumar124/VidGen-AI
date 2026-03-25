from typing import List, Optional
from pydantic import BaseModel, Field

class Scene(BaseModel):
    timestamp: str = Field(..., description="Approximate time (e.g., 00:01 - 00:04)")
    visual_description: str = Field(..., description="Detailed description of what appears visually")
    transition_type: str = Field(..., description="The type of cut or transition used to end the scene")
    voiceover: Optional[str] = Field(None, description="Text of any voiceover or dialogue in the scene")

class ProductPresentation(BaseModel):
    first_appearance: str = Field(..., description="Timestamp and context of first reveal")
    framing_techniques: List[str] = Field(..., description="Specific methods used to highlight the product")

class VisualElements(BaseModel):
    text_overlays: List[str]
    color_grading: str = Field(..., description="Description of the color palette and mood")
    lighting_style: str
    branding: str = Field(..., description="Details on logo placement and timing")

class StorytellingStructure(BaseModel):
    hook: str = Field(..., description="The first few seconds intended to grab attention")
    problem_setup: Optional[str]
    solution: str
    key_benefits: List[str]
    call_to_action: str

class MarketingStrategy(BaseModel):
    target_audience: str
    emotional_triggers: List[str]
    persuasion_techniques: List[str]
    branding_strategy: str

class VideoAnalysis(BaseModel):
    scene_timeline: List[Scene] = Field(..., description="Chronological breakdown of video scenes")
    editing_techniques: List[str] = Field(..., description="List of methods like jump cuts, speed ramping, etc.")
    camera_work: List[str] = Field(..., description="Analysis of angles, focus, and shot types")
    product_presentation: ProductPresentation
    visual_elements: VisualElements
    audio_transcript: str = Field(..., description="Complete voiceover or dialogue text")
    storytelling_structure: StorytellingStructure
    marketing_strategy: MarketingStrategy