import os
import glob
import sys
from PIL import Image, ImageDraw

user_site = os.path.join(os.environ['APPDATA'], 'Python', 'Python314', 'site-packages')
if user_site not in sys.path: sys.path.append(user_site)

from simple_lama_inpainting import SimpleLama

# Setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_DIR = os.path.join(BASE_DIR, "sandbox", "clean")
os.makedirs(CLEAN_DIR, exist_ok=True)

def process_single_image(lama, img_path, out_path):
    image = Image.open(img_path).convert("RGB")
    width, height = image.size

    # Create binary mask (0 = keep, 255 = inpaint)
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # Mask Top-Right 20% (MarketDay area)
    draw.rectangle([int(width * 0.75), 0, width, int(height * 0.25)], fill=255)

    # Mask Bottom 18% entirely (ChocolateShop and common area)
    draw.rectangle([0, int(height * 0.82), width, height], fill=255)
    
    # Mask Middle-Right strip 10% (Secondary watermark area)
    draw.rectangle([int(width * 0.88), int(height * 0.3), width, int(height * 0.7)], fill=255)

    # Run LaMa
    result = lama(image, mask)
    result.save(out_path, quality=95)

def main():
    lama = SimpleLama()

    # CLI Mode: python cleaner.py <input> <output>
    if len(sys.argv) > 2:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        print(f"Cleaning single image: {input_path} -> {output_path}")
        process_single_image(lama, input_path, output_path)
        print("Single image cleaning complete.")
        return

    # Batch Mode
    MATCHED_DIR = os.path.join(BASE_DIR, "sandbox", "matched")
    matched_images = glob.glob(os.path.join(MATCHED_DIR, "*", "raw.jpg"))
    print(f"Found {len(matched_images)} images to clean.")

    for idx, img_path in enumerate(matched_images):
        product_id = os.path.basename(os.path.dirname(img_path))
        print(f"[{idx+1}/{len(matched_images)}] Cleaning watermarks for {product_id}...")
        try:
            out_path = os.path.join(CLEAN_DIR, f"{product_id}.jpg")
            process_single_image(lama, img_path, out_path)
        except Exception as e:
            print(f"Failed to clean {product_id}: {e}")

    print("STEP 3: LAMA CLEANING COMPLETE")

if __name__ == "__main__":
    main()
