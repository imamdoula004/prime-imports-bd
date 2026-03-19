# HuggingFace prompt engineering for n8n AI Image Pipeline

## Recommended Model
`black-forest-labs/FLUX.1-schnell` is highly recommended for realistic product generation, as it is exceptionally fast and produces photo-realistic details, outperforming SDXL in object coherence.

## Base Parameters
When using the HuggingFace Inference API in n8n, map the product data to these prompt templates.

---

### 1. Catalog Image Prompt
**Goal:** Clean, centered, isolated product on a solid background for e-commerce grid.
**Prompt Template:**
`"Professional studio photography, a single package of {Product Name} {Brand}, centered, facing forward, pure white background, sharp focus, high resolution 8k, realistic food packaging layout, bright even lighting, e-commerce style, hyper-detailed"`

### 2. Zoom Image Prompt
**Goal:** Close-up macro shot showcasing the texture, label, or details for the image magnifier.
**Prompt Template:**
`"Macro close-up photography of {Product Name} {Brand} packaging, emphasizing the texture and typography of the label, sharp focus, extreme detail, dramatic studio lighting, depth of field blur in background, pure white background, 8k resolution"`

### 3. Lifestyle Image Prompt
**Goal:** The product situated in a natural environment that matches its category (e.g., kitchen counter for snacks).
**Prompt Template:**
`"Editorial food photography, a package of {Product Name} {Brand} placed on a natural surface, shallow depth of field, {Category Context, e.g., 'warm morning sunlight streaming across a wooden kitchen counter'}, cinematic lighting, photorealistic, 8k, appetizing and premium look"`

---
**n8n Implementation Note:** 
Use the `Expression` editor in n8n to inject `$json.title` and `$json.brand` into these templates dynamically before sending the HTTP request.
