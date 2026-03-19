import sys
import os
from rembg import remove
from PIL import Image, ImageOps
import io

def process_image(input_path, output_path, target_size=1024):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input path {input_path} does not exist.")
            return False

        with open(input_path, 'rb') as i:
            input_data = i.read()

        # Remove background - using the 'u2net' model (default)
        output_data = remove(input_data)

        # Process with PIL
        img = Image.open(io.BytesIO(output_data)).convert("RGBA")
        
        # Trim transparent margins
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        # Calculate aspect ratio and resize to fit within target_size
        width, height = img.size
        # Add some padding within the 1024x1024 frame
        ratio = min(target_size / width, target_size / height) * 0.9 
        
        new_size = (int(width * ratio), int(height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Create final 1024x1024 white background image
        final_img = Image.new("RGB", (target_size, target_size), (255, 255, 255))
        
        # Paste the product in the center
        paste_pos = (
            (target_size - new_size[0]) // 2,
            (target_size - new_size[1]) // 2
        )
        
        # We need an RGBA temp image to paste onto RGB background with alpha mask
        temp_product = Image.new("RGBA", (target_size, target_size), (255, 255, 255, 0))
        temp_product.paste(img, paste_pos, img)
        final_img.paste(temp_product, (0, 0), temp_product)

        # --- BRANDING OVERLAY ---
        try:
            # Find logo.jpeg in the project root
            # Script is in scripts/pipeline/, so logo is two levels up
            script_dir = os.path.dirname(os.path.abspath(__file__))
            logo_path = os.path.abspath(os.path.join(script_dir, "../../logo.jpeg"))
            
            if os.path.exists(logo_path):
                logo = Image.open(logo_path).convert("RGBA")
                
                # Resize logo (15% of target_size)
                logo_width = int(target_size * 0.15)
                w_percent = (logo_width / float(logo.size[0]))
                h_size = int((float(logo.size[1]) * float(w_percent)))
                logo = logo.resize((logo_width, h_size), Image.Resampling.LANCZOS)
                
                # Position: Bottom Right with padding
                padding = 30
                logo_pos = (target_size - logo_width - padding, target_size - h_size - padding)
                
                # Composite logo
                final_img.paste(logo, logo_pos, logo)
                print(f"[BRANDING] Logo overlaid successfully from {logo_path}")
            else:
                print(f"[BRANDING] Logo NOT FOUND at {logo_path}")
        except Exception as branding_err:
            print(f"[BRANDING] Failed to overlay logo: {branding_err}")
        
        # Save output as WebP (Convert back to RGB to remove alpha if needed for final save)
        final_img.convert("RGB").save(output_path, "WEBP", quality=85)
        print(f"Successfully processed {input_path} -> {output_path}")
        return True
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")
        # Log to stderr for node.js to capture better
        sys.stderr.write(f"Python Error: {str(e)}\n")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input_path> <output_path>")
        sys.exit(1)
    
    input_p = sys.argv[1]
    output_p = sys.argv[2]
    
    if process_image(input_p, output_p):
        sys.exit(0)
    else:
        sys.exit(1)
