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

The artisan can also name the specific item, which is better grounding
still - see build_photo_prompt's product_name argument.

WHY IT WAS REWRITTEN AGAIN (the "earrings came back as a shawl" bug)
--------------------------------------------------------------------
Grounding worked too well. An artisan photographed a packet of silver
jhumka earrings while the product selected on screen happened to be
"Handmade Wool Cushion" in "Textiles & Weaving" - so the prompt opened by
declaring that the photograph showed "a handwoven Indian textile - such as
a saree, dupatta, stole, shawl, rug, cushion cover...", then spent a
paragraph on weave structure, pallu and drape. The model obeyed: it
returned the earrings lying on a shawl it had invented.

There WAS a "trust the photograph" line, but it sat at the end of one
short block and was outweighed by everything after it. Two lines of
hedging cannot compete with three paragraphs of confident textile
description.

So the hierarchy is now explicit and ordered, strongest first:

  1. the photograph      - the subject is whatever is actually in it
  2. the artisan's words - a hint for RECOGNISING that object, and
                           labelled as possibly wrong
  3. the category guide  - applied only IF the photo matches it

and adding any object that is not already in the photograph is now its
own named prohibition, because "do not add props" was never read as
covering "the backdrop the category told you to expect".
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
                "natural patina, every hammered dent and engraved or repousse line, and the real "
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

# Longest product description we will put into the prompt. An artisan
# naming their product needs a handful of words; anything beyond this is
# either a paste or an attempt to steer the model, and neither belongs in
# a photo-retouching instruction.
MAX_PRODUCT_NAME_CHARS = 90

# The artisan's free-text "anything extra to tell the AI?" box. Longer
# than a product name, because it is a sentence rather than a label, but
# still bounded - it is a framing note, not a place to write a new brief.
MAX_INSTRUCTION_CHARS = 300


def _clean_product_name(raw: str, max_chars: int = MAX_PRODUCT_NAME_CHARS) -> str:
    """
    Makes an artisan's free-text product description safe to drop into the
    prompt.

    This is the one place in Photo Studio where user-typed text reaches an
    AI instruction, so it is treated as data, not as instruction:

      - newlines and control characters are collapsed to spaces, so the
        text cannot break out of its line and pose as a new directive
      - double quotes are dropped, since the name is inserted inside
        quotes and could otherwise close them early
      - it is length-capped

    The prompt itself does the rest of the work by labelling the value
    ("The artisan calls this item ...") under a heading that calls it a
    hint which may be wrong, and by telling the model to trust the
    photograph over the description when they disagree - so even a
    determined instruction typed into this box reads as a claim about the
    product, not as a command.
    """
    if not raw:
        return ""
    cleaned = " ".join(str(raw).split())
    cleaned = cleaned.replace('"', "").replace("\\", "")
    cleaned = "".join(ch for ch in cleaned if ch.isprintable())

    # Every section header in this prompt is written in capitals ("MUST
    # SURVIVE THE EDIT EXACTLY", "STRICTLY DO NOT"). Text typed into the
    # product box cannot start a new line any more, but a run of capitals
    # still *looks* like a header, and looking like one is most of how
    # these things work on a model. Two or more capitalised words in a row
    # is not how anyone names a diya, so those runs get lowercased. Single
    # capitalised words survive, which keeps real names like "GI tagged
    # Madhubani" or "BRASS diya" readable.
    words = cleaned.split(" ")
    run_start = None
    for i in range(len(words) + 1):
        word = words[i] if i < len(words) else ""
        is_shouty = len(word) >= 2 and word.isupper() and word.isalpha()
        if is_shouty:
            if run_start is None:
                run_start = i
        else:
            if run_start is not None and i - run_start >= 2:
                for j in range(run_start, i):
                    words[j] = words[j].lower()
            run_start = None
    cleaned = " ".join(words).strip()
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars].rsplit(" ", 1)[0].strip()
    return cleaned


# The look every enhanced photo should end up with.
#
# This is not a generic "nice studio background" - it is one specific
# reference the artisan chose and sent: a crochet bouquet lying on a
# softly rumpled off-white cloth, lit by window daylight from one side,
# with a gentle shadow anchoring it to the surface, shot from a little
# above. Warm, calm and tactile.
#
# It is written out in this much detail because "clean, plain, softly lit
# studio background in a neutral tone" is four different photographs
# depending on which model reads it, and the artisan was getting all four.
# Naming the surface, the light, the shadow, the angle and the mood pins
# it down to one - and pinning the BACKDROP down also closes the gap the
# model used to fill by inventing a prop.
HOUSE_STYLE = """HOW TO PRESENT IT (this is the house look - match it):
- BACKGROUND: one plain, softly rumpled off-white cloth - natural cotton or linen in a warm
  ivory or cream tone - filling the whole frame behind and beneath the product. Its folds
  should be soft and slightly out of focus so they read as gentle texture, never as clutter.
  Nothing else on it: no pattern, no second colour, no props, no visible table edge and no
  hard line where a wall meets a surface.
- LIGHT: soft diffused daylight coming from one side and slightly above, as though through a
  window with a sheer curtain. A gentle gradient across the cloth is good. No flash, no
  hotspots, no hard-edged shadows, no yellow or green cast from indoor tube lights.
- SHADOW: one soft, diffused shadow falling away from the product and touching its base, so
  the piece sits on the cloth instead of floating or looking cut out.
- CAMERA: a little above the product and tilted slightly, close to overhead but not flat on,
  so the piece keeps its depth. Product centred and upright, with generous even margin all
  around it.
- COLOUR AND DETAIL: true-to-life colours, corrected white balance, and enough sharpness that
  the individual stitches, grain, weave, glaze or hammer marks are clearly readable.
- The result must look like ONE real photograph taken on a cloth-covered table in daylight.
  Not a cut-out on pure white, not a flat lightbox shot, not a computer render."""


def _clean_instruction(raw: str) -> str:
    """
    The same treatment as _clean_product_name, applied to the artisan's
    free "anything extra to tell the AI?" note.

    This box now has a microphone beside it, which makes it the easiest
    text in the app to fill with a long ramble, and dictated speech
    arrives without any punctuation to bound it. Both of those make an
    unbounded paste into the prompt more likely, not less - so the note
    is collapsed to a single line, stripped of quotes and backslashes,
    de-shouted so a run of capitals cannot pose as one of this prompt's
    section headers, and length-capped.

    It stays a request, not a command: the prompt appends it under a
    heading that says it may only change framing, lighting and crop -
    never what the object is.
    """
    return _clean_product_name(raw, max_chars=MAX_INSTRUCTION_CHARS)


def build_photo_prompt(category: str = "", extra_instruction: str = "",
                       product_name: str = "") -> str:
    """
    Builds the photo-editing prompt for one specific artisan's product.

    The three inputs are deliberately ranked, and the prompt says so out
    loud, because a previous version got the ranking wrong and the model
    invented a whole shawl to satisfy a stale category (see the module
    docstring):

      1. The photograph is the subject. Always.
      2. `product_name` - what the artisan calls this exact item ("brass
         diya", "silver jhumka earrings"). A hint for RECOGNISING what is
         in the photograph, never a licence to put it there.
      3. `category` - their craft category, or this product's own. Broader
         than the name and more likely to be stale, since it describes
         their shop rather than this photo. Its detailed guidance is
         applied conditionally: "if the photograph shows such an object".

    An unknown or empty category degrades to the generic wording rather
    than raising, so a new category added to the frontend can never break
    Photo Studio in production.
    """
    category = (category or "").strip()
    guide = CATEGORY_PHOTO_GUIDE.get(category, _GENERIC)
    known = guide is not _GENERIC
    name = _clean_product_name(product_name)

    # ---- 1. The photograph, first and unconditional -------------------
    subject_block = (
        "RULE ONE - WHAT YOU ARE PHOTOGRAPHING:\n"
        "The subject is the object that is physically present in the uploaded photograph,\n"
        "whatever that object turns out to be. Look at the photograph and identify what is\n"
        "actually there before you do anything else. It is a real, physical object that already\n"
        "exists and belongs to someone. Your job is to RETOUCH this photograph of it: never to\n"
        "design it, redraw it, replace it with a different object, or place it with anything it\n"
        "did not already come with."
    )

    # ---- 2. The artisan's words, explicitly fallible ------------------
    if name and known:
        said = f'The artisan calls this item "{name}", and their shop sells {category}.'
    elif name:
        said = f'The artisan calls this item "{name}".'
    elif known:
        said = f"The artisan's shop sells {category}."
    else:
        said = ""

    if said:
        hint_block = (
            "\n\nWHAT THE ARTISAN SAYS THIS IS (a hint, and it may be wrong):\n"
            f"{said}\n"
            "This describes their shop and their own label for the item, not necessarily this\n"
            "photograph - they may have picked the wrong item on screen, or photographed something\n"
            "new. Use it ONLY to help you recognise the object you can already see. If it describes\n"
            "something that is not in the photograph, ignore it completely and trust the photograph.\n"
            "Never introduce an object into the picture because it was named here."
        )
    else:
        hint_block = ""

    # ---- 3. Category guidance, conditional on the photo matching ------
    if known:
        category_block = (
            f"\n\nIF THE PHOTOGRAPH SHOWS {guide['identity']}, THEN ALSO:\n"
            f"- Preserve {guide['keep']}.\n"
            f"- Stage it this way: {guide['staging']}.\n"
            "If the photograph shows anything else, ignore this section completely and follow only\n"
            "the general rules below. Do not add such an object to make this section apply."
        )
    else:
        category_block = ""

    prompt = f"""You are an expert e-commerce product photographer and photo retoucher preparing a
catalogue image of an authentic Indian handmade craft for an online marketplace.

{subject_block}{hint_block}{category_block}

MUST SURVIVE THE EDIT EXACTLY:
- The product's true shape, proportions, colours, material and texture. The buyer must be
  able to hold the real object beside this photograph and see the same thing. Nothing about
  the item itself changes - only the quality of the photograph of it does.
- Every handmade detail and small irregularity. These are the proof the item is handcrafted
  rather than factory made, and they are what the buyer is paying for. Do NOT smooth,
  straighten, symmetrise, tidy or "perfect" them.
- The count of things: if there are three bangles, keep three; do not add or remove pieces.

{HOUSE_STYLE}

REMOVE THESE UNWANTED THINGS:
- The product is the ONLY object that may remain in the picture. Everything else that was in
  the original photo goes, and nothing takes its place.
- Hands, fingers, arms and people, including anyone holding or wearing the product.
- Packaging the product is sold in but is not part of it: plastic bags and wrappers, polythene,
  boxes, cards, price stickers and brand labels. Unwrap it visually so the object itself is seen.
- Background clutter: other household objects, furniture edges, bedding, curtains, floors,
  wires, cables, switchboards.
- Dust, lint, stray threads and hair lying on or beside the product.
- Distracting foreground objects and anything partly cut off at the edge of the frame.
- Reflections of the room, the photographer or the phone in any shiny or metal surface.
- Only remove things that are NOT part of the product. If the artisan photographed the item
  with a part that belongs to it - a lid, a strap, a stand, a matching pair - keep it.

STRICTLY DO NOT:
- Add any object that was not already in the photograph. No fabric or textile item, no tray,
  plate, stand, flower, leaf, prop, decoration or companion piece - not even one named in the
  hint above, and not even to make the composition look nicer. The plain off-white cloth
  described above is the backdrop and the ONLY thing that may be added to the scene.
- Turn the subject into a different object, or photograph a different object that the hint
  mentioned instead of the one that is really there.
- Add a second copy of the product, or more pieces than the photograph contains.
- Add any text, watermark, logo, label, price tag, sticker, badge or border.
- Change the product into a different design, colour, material or style.
- Restyle it as a render, illustration, painting or 3D model.
- Make the item look mass produced, plastic, glossy-artificial or computer generated.

Output only the edited photograph."""

    instruction = _clean_instruction(extra_instruction)
    if instruction:
        prompt += (
            "\n\nADDITIONAL REQUEST FROM THE ARTISAN (follow it only where it does not conflict "
            "with the rules above; it can change how the object is framed, lit or cropped, but it "
            f"can never change WHAT the object is or add anything to the picture):\n{instruction}"
        )

    return prompt


# Backwards-compatible module-level constant. Any caller that has not yet
# been updated to pass a category still gets a valid, working prompt -
# just the generic one, without the category grounding.
PRODUCT_PHOTO_PROMPT = build_photo_prompt()
