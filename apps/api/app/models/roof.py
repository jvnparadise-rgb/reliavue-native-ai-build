from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class Roof(UuidTimestampMixin, Base):
    __tablename__ = "roofs"

    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    roof_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area_sqft: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    building = relationship("Building", back_populates="roofs")
    missions = relationship("Mission", back_populates="roof")
