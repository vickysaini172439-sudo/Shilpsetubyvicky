"""
The product-photography prompt used by every image AI provider
(Gemini, OpenAI). Kept in one place so switching providers can never
accidentally change what we ask the AI to do - only which AI does it.

Why the artisan never types a prompt: they should not have to learn
prompt engineering. They press one button. What the prompt SAYS is a
product decision, made here.

WHY THIS FILE WAS REWRITTEN (the "output bekaar aa raha hai" bug)
----------------------------------------------------------------
The original prompt was one fixed paragraph that never told the model
WHAT the object in the photo actually was. Image-edit models are far
more likely to redraw an object they cannot confidently identify - so a
half-lit phone photo of a brass diya would come back as a generic
"decorative bowl", and a folded ikat saree as a flat piece of cloth. The
artisan sees this as "the AI ruined my product".

The fix is to tell the model what it is looking at, using the craft
category the artisan already selected when they made their account. We
are not guessing: they told us. That single line of grounding is the
difference between "retouch this brass oil lamp" and "make something
nice out of these pixels".

Each category below therefore carries three things:
  identity  - what the object IS, so the model anchors to it
  keep      - the specific handmade details that must survive the edit
  staging   - how this kind of craft is normally shot for a catalogue
"""

# Categories match CRAFT_CATEGORIES in frontend/src/constants.js exactly.
# If a category is ever added there, add it here too - an unknown
# category falls back to the generic guidance below rather than failing.
CATEGORY_PHOTO_GUIDE = {
    "Textiles & Weaving": {
        "identity": "a handwoven Indian textile - such as a saree, dupatta, stole, shawl, "
                    "rug, cushion cover or length of loom fabric",
        "keep": "the exact weave structure and thread count, every motif and border pattern, "
                "the true dye colours, the drape and natural folds of the cloth, any pallu, "
                "selvedge, fringe, tassel or knot, and slight irregularities in the handloom weave",
        "staging": "lay the fabric so its pattern and border are readable, keeping natural soft "
                   "folds rather than flattening it; if it is already folded or draped, keep that "
                   "same arrangement",
    },
    "Pottery & Ceramics": {
        "identity": "a handmade piece of Indian pottery or ceramic - such as a pot, matka, vase, "
                    "diya, cup, bowl, plate or terracotta figure",
        "keep": "the true clay body and glaze colour, the throwing rings and finger marks from the "
                "wheel, glaze pooling and colour variation, any crazing, unglazed foot ring, "
                "hand-painted line work, and the real silhouette of the rim and base",
        "staging": "stand the piece upright on a flat surface at a slight three-quarter angle so "
                   "both the form and the rim opening are visible, with a soft contact shadow "
                   "under it so it does not look like it is floating",
    },
    "Wood Carving": {
        "identity": "a hand-carved Indian wooden object - such as a carved panel, box, figurine, "
                    "toy, bowl, frame or piece of furniture detail",
        "keep": "the natural wood grain, colour and knots, every chisel and gouge mark, the exact "
                "depth and shape of the carved relief, any inlay, lacquer or polish sheen, and the "
                "true proportions of the carving",
        "staging": "angle the piece so the carved detail catches soft raking light and reads three-"
                   "dimensionally rather than flat, with a soft contact shadow",
    },
    "Metal Craft": {
        "identity": "a handmade Indian metal craft object - such as a brass, bronze, copper or "
                    "bell-metal lamp, diya, urli, idol, bell, plate or engraved vessel",
        "keep": "the true metal tone (brass gold, copper red, oxidised black or silver) and its "
                "natural patina, every hammered dent and engraved or repoussé line, and the real "
                "reflections in the metal surface",
        "staging": "light it with soft, broad, diffused light so the metal reads as metal without "
                   "blown-out hotspots or harsh mirror glare, and keep reflections clean and "
                   "neutral rather than showing the room",
    },
    "Jewelry & Ornaments": {
        "identity": "a piece of handmade Indian jewellery or ornament - such as a necklace, "
                    "earrings, bangle, ring, anklet, pendant or hair ornament",
        "keep": "the exact metal colour and finish, the real number, size, colour and setting of "
                "every stone, bead and pearl, the chain and clasp construction, and all "
                "filigree, meenakari, kundan or oxidised detail",
        "staging": "shoot it close and very sharp, arranged neatly and symmetrically flat or on a "
                   "simple neutral surface, with soft even light and no hard glare on the stones",
    },
    "Paintings & Art": {
        "identity": "a handmade Indian painting or artwork - such as a Madhubani, Warli, Pattachitra, "
                    "Gond, miniature, Kalamkari or contemporary painted piece on paper, cloth or canvas",
        "keep": "every brush stroke, line and dot exactly as painted, the true pigment colours, the "
                "paper or canvas texture and edges, and the complete composition - do not add, "
                "remove, redraw, complete or 'improve' any part of the artwork itself",
        "staging": "photograph it flat and perfectly square-on like an artwork reproduction, evenly "
                   "lit corner to corner with no glare or hotspot, cropped just outside its edges",
    },
    "Bamboo & Cane Craft": {
        "identity": "a handmade Indian bamboo or cane product - such as a basket, tray, lampshade, "
                    "stool, mat, box or woven storage item",
        "keep": "the exact weave pattern and strip width, the natural bamboo or cane colour with its "
                "nodes and grain, every binding, rim wrap and joint, and the real open structure "
                "and shadows cast by the weave",
        "staging": "angle it so the weave pattern and the object's opening or depth are both visible, "
                   "lit so the weave texture reads clearly",
    },
    "Leather Craft": {
        "identity": "a handmade Indian leather product - such as a bag, sandal or jutti, belt, "
                    "wallet, journal cover, or a Kolhapuri or embroidered leather item",
        "keep": "the true leather grain, colour and natural markings, every hand stitch and its "
                "thread colour, tooled or embossed patterns, edge finishing, buckles and hardware, "
                "and the natural way the leather sits and creases",
        "staging": "shape the item so it holds its real form rather than lying collapsed, at a "
                   "three-quarter angle, with soft light that shows the grain",
    },
    "Embroidery & Needlework": {
        "identity": "a handmade Indian embroidered or needlework piece - such as embroidered fabric, "
                    "a kantha, phulkari, chikankari, zari or mirror-work item, or a stitched garment panel",
        "keep": "every individual stitch and its direction, the true thread colours and sheen, the "
                "base fabric weave and colour, all mirror work, sequins, beads and zari, and the "
                "slight raised texture the embroidery gives the cloth",
        "staging": "shoot close enough that the stitching is clearly visible, lit at a slight angle "
                   "so the raised thread texture reads instead of looking printed flat",
    },
    "Other": {
        "identity": "a handmade Indian craft product",
        "keep": "the product's true material, colour, form and every handmade detail and irregularity",
        "staging": "position it so its most recognisable side faces the camera, with a soft contact "
                   "shadow underneath",
    },
}

_GENERIC = CATEGORY_PHOTO_GUIDE["Other"]


def build_photo_prompt(category: str = "", extra_instruction: str = "") -> str:
    """
    Builds the photo-editing prompt for one specific artisan's product.

    `category` is the craft category from their account (or the product's
    own category when one is set). It is used to tell the model what the
    object actually is, which is what stops the model from inventing a
    different product - see the module docstring.

    An unknown or empty category degrades to the generic wording rather
    than raising, so a new category added to the frontend can never break
    Photo Studio in production.
    """
    guide = CATEGORY_PHOTO_GUIDE.get((category or "").strip(), _GENERIC)
    known = guide is not _GENERIC

    if known:
        identity_block = (
            f"WHAT YOU ARE LOOKING AT:\n"
            f"The artisan sells {category}. This photograph shows {guide['identity']}.\n"
            f"Treat it as exactly that. It is a real, physical object that already exists - your job\n"
            f"is to RETOUCH this photograph of it, never to design, redraw or replace the object."
        )
    else:
        identity_block = (
            f"WHAT YOU ARE LOOKING AT:\n"
            f"This photograph shows {guide['identity']}. It is a real, physical object that already\n"
            f"exists - your job is to RETOUCH this photograph of it, never to design, redraw or\n"
            f"replace the object."
        )

    prompt = f"""You are an expert e-commerce product photographer and photo retoucher preparing a
catalogue image of an authentic Indian handmade craft for an online marketplace.

{identity_block}

MUST SURVIVE THE EDIT EXACTLY:
- {guide['keep']}.
- The product's true shape, proportions, colours, material and texture.
- Every handmade detail and small irregularity. These are the proof the item is handcrafted
  rather than factory made, and they are what the buyer is paying for. Do NOT smooth,
  straighten, symmetrise, tidy or "perfect" them.
- The count of things: if there are three bangles, keep three; do not add or remove pieces.

HOW TO PRESENT IT:
- {guide['staging']}.
- Replace a cluttered, dark or distracting background with a clean, plain, softly lit studio
  background in a neutral tone that flatters the product's own colours.
- Light the product evenly and softly, as if inside a lightbox. Remove harsh shadows,
  blown-out highlights, camera-flash glare and the yellow/green colour cast of indoor tube lights.
- Correct the white balance so the colours match the real object.
- Straighten the framing, centre the product, and leave comfortable, even margin around it.
- Increase sharpness and local clarity so the fine craft detail is clearly readable.

REMOVE THESE UNWANTED THINGS:
- Hands, fingers, arms and people, including anyone holding or wearing the product.
- Background clutter: other household objects, furniture edges, bedding, curtains, floors,
  wires, cables, switchboards, plastic bags, packaging and price stickers.
- Dust, lint, stray threads and hair lying on or beside the product.
- Distracting foreground objects and anything partly cut off at the edge of the frame.
- Reflections of the room, the photographer or the phone in any shiny or metal surface.
- Only remove things that are NOT part of the product. If the artisan photographed the item
  with a part that belongs to it - a lid, a strap, a stand, a matching pair - keep it.

STRICTLY DO NOT:
- Add any text, watermark, logo, label, price tag, sticker, badge or border.
- Add props, flowers, decorations, extra objects, or a second copy of the product.
- Change the product into a different design, colour, material or style.
- Restyle it as a render, illustration, painting or 3D model.
- Make the item look mass produced, plastic, glossy-artificial or computer generated.

Output only the edited photograph."""

    if extra_instruction and extra_instruction.strip():
        prompt += (
            "\n\nADDITIONAL REQUEST FROM THE ARTISAN (follow it only where it does not conflict "
            f"with the rules above):\n{extra_instruction.strip()}"
        )

    return prompt


# Backwards-compatible module-level constant. Any caller that has not yet
# been updated to pass a category still gets a valid, working prompt -
# just the generic one, without the category grounding.
PRODUCT_PHOTO_PROMPT = build_photo_prompt()
