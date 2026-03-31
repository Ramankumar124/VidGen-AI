# Pydantic Models for Structured Output
from pydantic import BaseModel, Field
from pydantic import field_validator
from typing import List, Optional


_ALLOWED_DURATIONS = [4, 8, 12, 16]
class VisualElement(BaseModel):
    name: str = Field(..., description="What the element is (e.g. product, text, sticker)")
    size: str = Field(..., description="Size (small, medium, large)")
    position: str = Field(..., description="Position (top, center, bottom, etc.)")

class SceneDetail(BaseModel):
    scene: int = Field(..., description="Scene number")
    timestamp: str = Field(..., description="Timestamp in MM:SS-MM:SS format. Each scene must be exactly 4, 8, 12, or 16 seconds long (e.g. 00:00-00:04, 00:04-00:08, ...)")
    duration_seconds: int = Field(
        4,
        description=(
            "Duration of this scene in seconds. "
            "MUST be exactly one of: 4, 8, 12, or 16. "
            "These are the only allowed values (soramm2 video generation constraint)."
        )
    )

    @field_validator("duration_seconds", mode="before")
    @classmethod
    def snap_to_allowed(cls, v: int) -> int:
        """Snap any value the AI returns to the nearest allowed duration."""
        return min(_ALLOWED_DURATIONS, key=lambda d: abs(d - int(v)))
    cuts: Optional[List[str]] = Field(None, description="Optional list of sub-cut descriptions within this scene. Use this when the scene contains multiple quick cuts or transitions.")
    visual: str = Field(
    ...,
    description=(
        "Detailed visual description of the scene (minimum 100 characters). "
        "Ensure the content is safe and appropriate: avoid any sexual, violent, explicit, "
        "or harmful elements, and do not include anything that violates video generation guidelines don't use word like voyeuristic."
    ),
    min_length=100
)
    voiceover: Optional[str] = Field(None, description="Voiceover background story narration")
    dialogue: Optional[str] = Field(None, description="Character dialogue")
    editing: str = Field(..., description="Editing technique used")
    visual_elements: List[VisualElement] = Field(..., description="List of key visual elements in the scene (e.g. product shots, text overlays, sticker overlays, motion graphics, etc.)")
    scene_background_location: Optional[str] = Field(None, description="Description of the scene's background and location (e.g. indoor, outdoor, cityscape, nature, etc.)",min_length=100)
    camera_movement: Optional[str] = Field(
        None,
        description=(
            "Camera work for this scene: shot size and framing (e.g. extreme close-up, medium wide), "
            "lens feel / depth of field, and how the camera moves or behaves during the take "
            "(static tripod, slow push-in, pan, tilt, dolly, tracking, handheld, crane, orbit, whip pan, etc.). "
            "Be specific; this guides both the keyframe image composition and the motion in video generation."
            "Ensure the content is safe and appropriate: avoid any sexual, violent, explicit, "
             "or harmful elements, and do not include anything that violates video generation guidelines. Don't use words like voyeuristic."
            ""
        ),
        min_length=200    )
    model_clothes: List[str] = Field(None, description="Descriptions of clothes worn by models in the scene like color and style and very detailed")
    model_appearance: List[str] = Field(None, description="Descriptions of models' appearances in the scene")
    reference_models: Optional[List[str]] = Field(
        None,
        description=(
            "Optional. Which model reference keys to use for this scene only (e.g. ['model1']). "
            "Omit for automatic selection. Use an empty list to force no character reference images."
        ),
    )
    reference_products: Optional[List[int]] = Field(
        None,
        description=(
            "Optional. 1-based product image indices for this scene (e.g. [1] for product1.png). "
            "Omit for automatic selection (all products). Use an empty list to force no product reference images."
        ),
    )
    reference_clothing: Optional[List[str]] = Field(
        None,
        description=(
            "Optional. Clothing item labels matching generated reference names from the pipeline. "
            "Omit for automatic selection from scene numbers. Use an empty list for no clothing reference images."
        ),
    )


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


