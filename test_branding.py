from PIL import Image
import os

def overlay_logo(image_path, logo_path, output_path):
    # Open product image
    img = Image.open(image_path).convert("RGBA")
    # Open logo
    logo = Image.open(logo_path).convert("RGBA")
    
    # Resize logo (e.g., 15% of product image width)
    logo_width = int(img.width * 0.15)
    w_percent = (logo_width / float(logo.size[0]))
    h_size = int((float(logo.size[1]) * float(w_percent)))
    logo = logo.resize((logo_width, h_size), Image.Resampling.LANCZOS)
    
    # Position: Bottom Right
    padding = 20
    position = (img.width - logo.width - padding, img.height - logo.height - padding)
    
    # Paste logo onto image
    img.paste(logo, position, logo)
    
    # Save as WebP
    img.convert("RGB").save(output_path, "WEBP", quality=85)
    print(f"Branded image saved to {output_path}")

if __name__ == "__main__":
    sample_img = "sandbox/precheck/100-plus-isotonic-drink-325ml-malaysia-original-energy-boost-bangladesh/catalog.webp"
    logo_img = "logo.jpeg"
    out_img = "sandbox/branded_test.webp"
    
    if os.path.exists(sample_img) and os.path.exists(logo_img):
        overlay_logo(sample_img, logo_img, out_img)
    else:
        print("Required files not found.")
