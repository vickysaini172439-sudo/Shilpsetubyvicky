"""
The fixed product-photography prompt used by every image AI provider
(Gemini, OpenAI). Kept in one place so switching providers can never
accidentally change what we ask the AI to do - only which AI does it.

Why a FIXED prompt instead of letting the user type one: the artisan
should not have to learn prompt engineering. They press one button. The
prompt below is the product decision - it is tuned to improve the photo
WITHOUT altering the craft itself, which matters enormously here: the
slight irregularities of handmade work are the value, and an AI that
"beautifies" them into something machine-perfect would be misrepresenting
the product to a buyer.
"""

PRODUCT_PHOTO_PROMPT = """You are an expert e-commerce product photographer and photo retoucher
working on a catalogue of authentic Indian handmade crafts.

Re-shoot this photograph of a handmade craft product so that it looks like a professional
online-marketplace catalogue image.

MUST KEEP EXACTLY AS THEY ARE:
- The product's true shape, proportions, colours, patterns, material and texture.
- Every handmade detail and small irregularity. These are proof the item is handcrafted,
  not factory made. Do NOT smooth, straighten, symmetrise or "perfect" them.
- Any visible weave, brush stroke, carving mark, stitch, glaze variation or grain.

PLEASE IMPROVE:
- Replace a cluttered, dark or distracting background with a clean, plain, softly lit
  studio background in a neutral light tone that suits the product's colours.
- Light the product evenly and softly, as if in a lightbox. Remove harsh shadows,
  blown-out highlights, camera flash glare and colour casts from indoor tube lights.
- Correct the white balance so the colours look true to the real object.
- Straighten the framing, centre the product, and leave comfortable empty margin around it.
- Increase sharpness and clarity so fine craft detail is clearly visible.
- Remove distracting foreground objects, hands, wires, dust and background people.

STRICTLY DO NOT:
- Add any text, watermark, logo, label, price tag, sticker or border.
- Add props, decorations, flowers, extra objects or a second copy of the product.
- Change the product into a different design, colour or style.
- Make the item look mass produced, plastic, or computer generated.

Output only the edited photograph."""
