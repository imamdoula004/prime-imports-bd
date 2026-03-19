import os
import glob
import subprocess
import sys
from PIL import Image, ImageEnhance

# Setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPSCALED_DIR = os.path.join(BASE_DIR, "sandbox", "upscaled")
EXECUTABLE_PATH = os.path.join(BASE_DIR, "realesrgan-ncnn-vulkan.exe")
os.makedirs(UPSCALED_DIR, exist_ok=True)

def upscale_image(img_path, out_path, target_size=2048):
    has_executable = os.path.exists(EXECUTABLE_PATH)
    
    if has_executable:
        # AI Upscale
        subprocess.run([EXECUTABLE_PATH, "-i", img_path, "-o", out_path, "-s", "4"], 
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        img = Image.open(out_path).convert("RGBA")
    else:
        # Lanczos Fallback
        img = Image.open(img_path).convert("RGBA")
        width, height = img.size
        scale = target_size / max(width, height)
        if scale > 1.0:
            img = img.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.2)

    # Final resize to exactly target_size bounding box
    width, height = img.size
    if max(width, height) > target_size:
        scale = target_size / max(width, height)
        img = img.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
    
    img.save(out_path, format="PNG")

def main():
    # CLI Mode: python upscale.py <input> <output>
    if len(sys.argv) > 2:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        print(f"Upscaling single image: {input_path} -> {output_path}")
        upscale_image(input_path, output_path)
        print("Single image upscaling complete.")
        return

    # Batch Mode
    CUTOUTS_DIR = os.path.join(BASE_DIR, "sandbox", "cutouts")
    cutout_images = glob.glob(os.path.join(CUTOUTS_DIR, "*.png"))
    print(f"Found {len(cutout_images)} images to upscale.")

    for idx, img_path in enumerate(cutout_images):
        product_id = os.path.splitext(os.path.basename(img_path))[0]
        print(f"[{idx+1}/{len(cutout_images)}] Upscaling {product_id}...")
        try:
            out_path = os.path.join(UPSCALED_DIR, f"{product_id}.png")
            upscale_image(img_path, out_path)
        except Exception as e:
            print(f"Failed to upscale {product_id}: {e}")

    print("STEP 5: UPSCALING COMPLETE")

if __name__ == "__main__":
    main()
