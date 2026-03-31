from typing import List, Optional
from pydantic import BaseModel, Field

class VisualElement(BaseModel):
    name: str = Field(..., description="What the element is (e.g. product, text, sticker)")
    size: str = Field(..., description="Size (small, medium, large)")
    position: str = Field(..., description="Position (top, center, bottom, etc.)")

class Scene(BaseModel):
    timestamp: str = Field(..., description="Approximate time (e.g., 00:01 - 00:04)")
    visual_description: str = Field(...,
    description=(
        "Detailed description of what appears visually"
        "Ensure the content is safe and appropriate: avoid any sexual, violent, explicit, "
        "or harmful elements, and do not include anything that violates video generation guidelines don't use word like voyeuristic."
        ))
    transition_type: str = Field(..., description="The type of cut or transition used to end the scene")
    scene_background_location: Optional[str] = Field(None, description="Description of the scene's background and location (e.g. indoor, outdoor, cityscape, nature, etc.)",min_length=100)
    camera_movement: str = Field(
        ...,
        description=(
            "Camera work for this scene: shot size and framing (e.g. extreme close-up, medium wide), "
            "lens / depth-of-field feel, and how the camera moves during the take "
            "(static tripod, slow push-in, pan, tilt, dolly, tracking, handheld, crane, orbit, whip pan, etc.). "
            "Be specific — this is used as a style reference for generating new scripts."
            "Ensure the content is safe and appropriate: avoid any sexual, violent, explicit, "
            "or harmful elements, and do not include anything that violates video generation guidelines don't use word like voyeuristic."
            "keeps the explaination simple and clear, avoid using technical jargon that may not be widely understood."
        ),
        min_length=200
    )
    visual_elements: List[VisualElement] = Field(..., description="List of key visual elements in the scene (e.g. product shots, text overlays, sticker overlays, motion graphics, etc.)")
    voiceover: Optional[str] = Field(None, description="Voiceover background story narration")
    dialogue: Optional[str] = Field(None, description="Character dialogue")

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