from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

class FlightOption(BaseModel):
    id: str
    provider: str
    airline: str
    flight_number: Optional[str] = None
    origin: str
    destination: str
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = "scheduled"
    stops: int = 0
    price: float = 8000.0
    total_price: Optional[float] = 8000.0
    currency: str = "INR"
    booking_url: Optional[str] = None
    source: str = "Voyage Demo Provider"
    is_live: bool = False

    @model_validator(mode="after")
    def sync_prices(self):
        if self.price and not self.total_price:
            self.total_price = self.price
        elif self.total_price and not self.price:
            self.price = self.total_price
        return self

class HotelOption(BaseModel):
    id: str
    provider: str
    name: str
    location: str
    rating: float = 4.8
    review_count: int = 250
    room_type: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    price_per_night: float = 4266.67
    total_price: float = 12800.0
    total_cost: Optional[float] = 12800.0
    currency: str = "INR"
    booking_url: Optional[str] = None
    tier: str = "luxury_boutique"
    source: str = "Voyage Demo Provider"
    is_live: bool = False

    @model_validator(mode="after")
    def sync_costs(self):
        if self.total_price and not self.total_cost:
            self.total_cost = self.total_price
        elif self.total_cost and not self.total_price:
            self.total_price = self.total_cost
        return self

class RestaurantOption(BaseModel):
    id: str
    provider: str
    name: str
    location: str
    rating: float = 4.7
    cuisine: str = "Local & International"
    price_level: Optional[str] = "$$$"
    estimated_cost: float = 2400.0
    total_cost: Optional[float] = 2400.0
    currency: str = "INR"
    distance: Optional[str] = None
    booking_url: Optional[str] = None
    source: str = "Voyage Demo Provider"
    is_live: bool = False

    @model_validator(mode="after")
    def sync_costs(self):
        if self.estimated_cost and not self.total_cost:
            self.total_cost = self.estimated_cost
        elif self.total_cost and not self.estimated_cost:
            self.estimated_cost = self.total_cost
        return self

class ActivityOption(BaseModel):
    id: str
    provider: str
    title: str
    name: Optional[str] = None
    location: str
    rating: float = 4.9
    duration: Optional[str] = "3 hours"
    cost: float = 2500.0
    price: Optional[float] = 2500.0
    currency: str = "INR"
    booking_url: Optional[str] = None
    day: int = 1
    source: str = "Voyage Demo Provider"
    is_live: bool = False

    @model_validator(mode="after")
    def sync_fields(self):
        if self.title and not self.name:
            self.name = self.title
        elif self.name and not self.title:
            self.title = self.name
        if self.cost and not self.price:
            self.price = self.cost
        elif self.price and not self.cost:
            self.cost = self.price
        return self

class TransportOption(BaseModel):
    id: str
    provider: str
    type: str
    estimated_price: float = 2200.0
    total_estimated: Optional[float] = 2200.0
    currency: str = "INR"
    duration: Optional[str] = "45 mins"
    source: str = "Voyage Demo Provider"
    is_live: bool = False

    @model_validator(mode="after")
    def sync_costs(self):
        if self.estimated_price and not self.total_estimated:
            self.total_estimated = self.estimated_price
        elif self.total_estimated and not self.estimated_price:
            self.estimated_price = self.total_estimated
        return self

class ProviderMetadata(BaseModel):
    provider: str
    is_live: bool
    status: str = "active"
