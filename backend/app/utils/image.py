import os
from PIL import Image, ImageDraw, ImageFont
from StreamDeck.ImageHelpers import PILHelper
from ..config import settings

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "icons")


class ImageRenderer:
    def __init__(self):
        self.default_font = os.path.join(settings.fonts_path, "Roboto-Regular.ttf")
        self.default_icon = os.path.join(settings.images_path, "Released.png")

    def resolve_icon_path(self, icon_path: str) -> str:
        """Resolve API icon paths to filesystem paths."""
        if not icon_path:
            return None

        # Handle API paths
        if icon_path.startswith("/api/icons/asset/"):
            filename = icon_path.replace("/api/icons/asset/", "")
            return os.path.join(settings.images_path, filename)
        elif icon_path.startswith("/api/icons/upload/"):
            filename = icon_path.replace("/api/icons/upload/", "")
            return os.path.join(UPLOAD_DIR, filename)

        # Already a filesystem path
        return icon_path

    def render_key_image(
        self,
        deck,
        icon_path: str = None,
        label: str = None,
        background_color: str = None,
        icon_color: str = None,
        font_size: int = 14
    ):
        """Render a key image for the Stream Deck."""
        # Resolve API paths to filesystem paths
        resolved_path = self.resolve_icon_path(icon_path)

        # Check if we have a valid icon
        has_icon = resolved_path and os.path.exists(resolved_path)

        if has_icon:
            # Load and scale the icon
            icon = Image.open(resolved_path)
            margins = [0, 0, 20, 0] if label else [0, 0, 0, 0]
            image = PILHelper.create_scaled_key_image(deck, icon, margins=margins)
        else:
            # Create blank key image with background color
            bg_color = background_color if background_color else "#000000"
            image = PILHelper.create_key_image(deck, background=bg_color)

        # Apply background color if specified (only needed when we have an icon)
        if background_color and has_icon:
            bg = Image.new("RGBA", image.size, background_color)
            image = Image.alpha_composite(bg.convert("RGBA"), image.convert("RGBA"))

        # Draw label if specified
        if label:
            draw = ImageDraw.Draw(image)
            try:
                font = ImageFont.truetype(self.default_font, font_size)
            except OSError:
                font = ImageFont.load_default()

            text_color = icon_color if icon_color else "white"

            # Center text vertically if no icon, otherwise place at bottom
            if has_icon:
                text_y = image.height - 5
                anchor = "ms"  # middle-bottom
            else:
                text_y = image.height / 2
                anchor = "mm"  # middle-middle

            draw.text(
                (image.width / 2, text_y),
                text=label,
                font=font,
                anchor=anchor,
                fill=text_color
            )

        # Convert to RGB (JPEG doesn't support alpha channel)
        if image.mode == "RGBA":
            rgb_image = Image.new("RGB", image.size, (0, 0, 0))
            rgb_image.paste(image, mask=image.split()[3])
            image = rgb_image

        return PILHelper.to_native_key_format(deck, image)

    def render_blank_key(self, deck, color: str = "#000000"):
        """Render a blank key with optional color."""
        image = PILHelper.create_key_image(deck)
        if color != "#000000":
            draw = ImageDraw.Draw(image)
            draw.rectangle([0, 0, image.width, image.height], fill=color)

        # Convert to RGB if needed
        if image.mode == "RGBA":
            rgb_image = Image.new("RGB", image.size, (0, 0, 0))
            rgb_image.paste(image, mask=image.split()[3])
            image = rgb_image

        return PILHelper.to_native_key_format(deck, image)


image_renderer = ImageRenderer()
