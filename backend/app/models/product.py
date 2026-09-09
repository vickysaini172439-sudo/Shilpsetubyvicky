from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, LargeBinary
from sqlalchemy.orm import relationship, deferred
from datetime import datetime
from app.database.db import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)

    name = Column(String, nullable=False)
    name_hindi = Column(String, nullable=True)
    description_english = Column(Text, nullable=True)
    description_hindi = Column(Text, nullable=True)
    material = Column(String, nullable=True)
    category = Column(String, nullable=True)
    craft_type = Column(String, nullable=True)
    price = Column(Float, nullable=True)

    # --- Catalogue richness (added so the public store actually looks
    # --- like a shop rather than a grid of thumbnails) ----------------
    # The AI Catalogue was already generating features and a marketing
    # caption on every run, and we were throwing both away. Storing them
    # is what lets a visitor see WHY a piece is worth buying instead of
    # just its name and price.
    #
    # features: one feature per line. Deliberately plain text rather than
    # JSON - it survives a hand edit by a non-technical user, and a
    # malformed line degrades to a harmless extra bullet instead of
    # throwing a parse error on the public page.
    features = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    # How many the artisan currently has to sell. Null means "not tracked",
    # which is different from 0 ("sold out") - so the storefront can stay
    # quiet about stock for artisans who do not count it.
    stock_quantity = Column(Integer, nullable=True)

    status = Column(String, default="draft")  # "draft" or "published"

    # --- The photo itself ---------------------------------------------
    # These hold the actual bytes. Photos used to be written to
    # backend/uploads/ and served from disk, which silently destroyed
    # every image on each deploy because Render's filesystem is rebuilt
    # from the repo - see services/stored_image.py for the evidence.
    #
    # image_url is kept, but it is now a route on this API
    # ("/products/<id>/image") rather than a path on a disk that does not
    # survive. Old rows still holding "/uploads/..." simply 404, and the
    # storefront falls back to the category tile for those.
    #
    # This is the COVER photo - the one on every card and thumbnail. Any
    # further views of the same piece live in ProductImage below. Keeping
    # the cover exactly where it was means nothing that already works has
    # to change in order for a gallery to exist.
    image_data = Column(LargeBinary, nullable=True)
    image_mime = Column(String, nullable=True)
    image_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="products")

    # Extra views of the same piece - the back of a shawl, the base of a
    # pot, a close-up of the stitching. One photo cannot answer "what does
    # it actually look like", and for a handmade object bought sight
    # unseen that question is the whole sale.
    gallery = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.position, ProductImage.id",
    )


class ProductImage(Base):
    """
    One extra photo belonging to a product.

    A separate table rather than more columns on `products`, because the
    number of views a piece needs is not knowable in advance - a ring
    needs two, a saree needs six - and columns cannot grow per row.

    Being a NEW table is also what makes this safe to ship: SQLAlchemy's
    create_all() builds it on startup, so no existing row is read, written
    or migrated. Products that have no extra photos simply have none.
    """

    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # deferred() matters more than it looks. Without it, SQLAlchemy loads
    # every column of every gallery row whenever a product is loaded - so
    # listing twenty products would pull all their photo bytes into memory
    # to serve a page that shows none of them. Deferred means the bytes are
    # fetched only by the one route that actually sends them.
    image_data = deferred(Column(LargeBinary, nullable=False))
    image_mime = Column(String, nullable=True)

    # Lets the artisan decide the order views appear in. Ties fall back to
    # id, so rows written before this mattered still come out stable.
    position = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="gallery")

    @property
    def url(self) -> str:
        """
        Where this photo is served from.

        No cache-busting tag is needed here, unlike the cover photo: a
        gallery row's bytes are never rewritten. Replacing a view means
        deleting that row and adding another, which gets a new id and
        therefore a new URL, so a cached copy can never be stale.
        """
        return f"/products/{self.product_id}/images/{self.id}"
