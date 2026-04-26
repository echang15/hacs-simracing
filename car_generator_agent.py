import os
import json
import time
from google import genai

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================
# Get your free Gemini API key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY = "AIzaSyDO1j2CQ9iQabuMSNkwzi8qEiRQEIWeDU4"

CARS_OUTPUT_DIR = "cars"
TRACKS_OUTPUT_DIR = "tracks"

# ==========================================

def load_json_list(filepath, key):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get(key, [])
    except FileNotFoundError:
        print(f"⚠️ Could not find {filepath}. Make sure it is in the same directory.")
        return []

def generate_image(client, prompt, output_path):
    print(f"🎨 Generating: {output_path}...")
    
    try:
        # We use the Imagen 3 model via the Gemini API
        result = client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=prompt,
            config=dict(
                number_of_images=1,
                output_mime_type="image/png",
                aspect_ratio="1:1"
            )
        )
        
        # Save the raw image bytes to a file
        for generated_image in result.generated_images:
            with open(output_path, 'wb') as f:
                f.write(generated_image.image.image_bytes)
                
        print(f"✅ Saved successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def main():
    if not os.path.exists(CARS_OUTPUT_DIR):
        os.makedirs(CARS_OUTPUT_DIR)
    if not os.path.exists(TRACKS_OUTPUT_DIR):
        os.makedirs(TRACKS_OUTPUT_DIR)
        
    if GEMINI_API_KEY == "your_gemini_api_key_here":
        print("❌ Please add your Gemini API Key to the script! Get one at https://aistudio.google.com/")
        return

    # Initialize the Gemini SDK client
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # ----------------------------------------
    # 1. GENERATE CARS FROM JSON
    # ----------------------------------------
    cars = load_json_list("ams2_cars.json", "automobilista_2_cars")
    if cars:
        print(f"🚀 Found {len(cars)} cars in JSON. Starting car generation...")
        
        for car in cars:
            car_id = car["id"]
            car_name = car["name"]
            output_path = os.path.join(CARS_OUTPUT_DIR, f"{car_id}.png")
            
            if os.path.exists(output_path):
                print(f"⏭️ Skipping {car_name} (already exists)")
                continue
                
            prompt = f"8-bit pixel art graphic of a {car_name} race car, side profile facing right, dark gray asphalt background, retro video game style, simple colors"
            success = generate_image(client, prompt, output_path)
            
            if success:
                print("⏳ Waiting 10 seconds to respect API rate limits...")
                time.sleep(10)

    # ----------------------------------------
    # 2. GENERATE TRACKS FROM JSON
    # ----------------------------------------
    tracks = load_json_list("ams2_tracks.json", "automobilista_2_tracks")
    if tracks:
        print(f"\n🚀 Found {len(tracks)} tracks in JSON. Starting track generation...")
        
        for track in tracks:
            track_id = track["id"]
            track_name = track["name"]
            output_path = os.path.join(TRACKS_OUTPUT_DIR, f"{track_id}.png")
            
            if os.path.exists(output_path):
                print(f"⏭️ Skipping {track_name} (already exists)")
                continue
                
            prompt = f"Minimalist top-down circuit map outline of {track_name} layout. Thin glowing neon cyan line on a very dark gradient background. No text, no other details, extremely minimalist, abstract geometric line art shape."
            success = generate_image(client, prompt, output_path)
            
            if success:
                print("⏳ Waiting 10 seconds to respect API rate limits...")
                time.sleep(10)

    print("\n🎉 All library images generated successfully!")

if __name__ == "__main__":
    main()
