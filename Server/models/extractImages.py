from pydantic import BaseModel,Field
from typing import List, Optional
class ModelAppearance(BaseModel):
    build: str
    hair: str
    makeup: str
    outfit: str

class ModelInfo(BaseModel):
    name: str = Field(description="Identifier e.g. model1")
    type: str = Field(description="male / female / group")
    age_range: str
    ethnicity_region: str
    persona: List[str]
    appearance: ModelAppearance
    role: str

class TargetAudience(BaseModel):
    age_range: str
    demographics: str
    interests: List[str]

class KeyAttributes(BaseModel):
    visual: List[str]
    emotional: List[str]
    functional: List[str]

class BrandMessage(BaseModel):
    core_theme: str
    positioning: List[str]

class ProductInfo(BaseModel):
    type: str
    category: str
    pricing_position: str
    target_audience: TargetAudience
    key_attributes: KeyAttributes
    presentation_strategy: List[str]
    brand_message: BrandMessage

class Lighting(BaseModel):
    type: str
    quality: str
    direction: str = None
    color_temperature: str = None
    focus: str = None

class Location(BaseModel):
    name: str
    region: str
    lighting: Lighting
    visual_elements: List[str]
    camera_style: List[str]
    mood: str

class EnvironmentInfo(BaseModel):
    locations: List[Location]

class ScriptAnalysisOutput(BaseModel):
    models: List[ModelInfo]
    product: ProductInfo
    environment: List[EnvironmentInfo]


class ClothingItem(BaseModel):
    name: str = Field(description="Short label e.g. 'White Linen Maxi Dress'")
    description: str = Field(description="Detailed visual description suitable for image generation")
    scene_numbers: List[int]
    count: int

class ClothingExtractionOutput(BaseModel):
    repeated_clothing: List[ClothingItem] = Field(
        description="Clothing appearing in MORE THAN ONE scene, ordered by frequency"
    )


class BackgroundLocation(BaseModel):
    key: str = Field(description="Short safe key for filename e.g. 'beach_golden_hour'")
    description: str = Field(description="Detailed visual description for generating a background plate image")
    scene_numbers: List[int] = Field(description="Which scene numbers use this background")

class BackgroundExtractionOutput(BaseModel):
    backgrounds: List[BackgroundLocation] = Field(
        description="Unique background locations extracted from the script, deduplicated"
    )