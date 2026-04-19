from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class PvField(UuidTimestampMixin, Base):
    __tablename__ = "pv_fields"

    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dc_capacity_kw: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)

    building = relationship("Building", back_populates="pv_fields")
    missions = relationship("Mission", back_populates="pv_field")
