from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class Building(UuidTimestampMixin, Base):
    __tablename__ = "buildings"

    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    building_code: Mapped[str | None] = mapped_column(String(100), nullable=True)

    site = relationship("Site", back_populates="buildings")
    roofs = relationship("Roof", back_populates="building", cascade="all, delete-orphan")
    pv_fields = relationship("PvField", back_populates="building", cascade="all, delete-orphan")
