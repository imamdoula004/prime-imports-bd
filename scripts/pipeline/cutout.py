import os
import glob
import io
import sys
try:
    from rembg import remove, new_session
except ImportError:
    print("Please install rembg: pip install rembg")
    exit(1)
from PIL import Image, ImageFilter

# Setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CUTOUTS_DIR = os.path.join(BASE_DIR, "sandbox", "cutouts")
os.makedirs(CUTOUTS_DIR, exist_ok=True)

def process_single_cutout(session, img_path, out_path):
    with open(img_path, "rb") as i:
        input_data = i.read()
    
    # Remove background
    output_data = remove(input_data, session=session)
    
    # Load into PIL for feathering
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")
    r, g, b, a = img.split()
    a_blurred = a.filter(ImageFilter.GaussianBlur(radius=3))
    
    img_feathered = Image.merge("RGBA", (r, g, b, a_blurred))
    img_feathered.save(out_path, format="PNG")

def main():
    session = new_session("u2net")

    # CLI Mode: python cutout.py <input> <output>
    if len(sys.argv) > 2:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        print(f"Extracting single image: {input_path} -> {output_path}")
        process_single_cutout(session, input_path, output_path)
        print("Single image extraction complete.")
        return

    # Batch Mode
    CLEAN_DIR = os.path.join(BASE_DIR, "sandbox", "clean")
    clean_images = glob.glob(os.path.join(CLEAN_DIR, "*.jpg"))
    print(f"Found {len(clean_images)} images for background removal.")

    for idx, img_path in enumerate(clean_images):
        product_id = os.path.splitext(os.path.basename(img_path))[0]
        print(f"[{idx+1}/{len(clean_images)}] Extracting {product_id}...")
        try:
            out_path = os.path.join(CUTOUTS_DIR, f"{product_id}.png")
            process_single_cutout(session, img_path, out_path)
        except Exception as e:
            print(f"Failed to cutout {product_id}: {e}")

    print("STEP 4: BACKGROUND REMOVAL COMPLETE")

if __name__ == "__main__":
    main()
