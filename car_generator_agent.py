import os
import time
import requests
from openai import OpenAI

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================
# Replace with your actual OpenAI API key (or set it as an environment variable)
os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"

# The output folder where the images will be saved
OUTPUT_DIR = "cars"

# List of Automobilista 2 cars (using the likely SimHub ID format). 
# You can expand this list with any other cars you race!
AMS2_CARS = [
    "formula_v10_gen1",
    "formula_v10_gen2",
    "formula_reiza",
    "formula_ultimate_gen1",
    "formula_ultimate_gen2",
    "porsche_911_gt3_r",
    "mclaren_720s_gt3",
    "mercedes_amg_gt3",
    "bmw_m4_gt3",
    "porsche_cayman_gt4",
    "mclaren_570s_gt4",
    "camaro_gt4_r",
    "porsche_911_rsr_gte",
    "corvette_c8_r_gte",
    "stock_car_brasil_corolla",
    "stock_car_brasil_cruze",
    "copa_truck_mercedes",
    "copa_truck_vw",
    "sprint_race_v6",
    "caterham_superlight",
    "group_c_porsche_962c",
    "group_c_sauber_c9",
    "gt1_porsche_911_gt1",
    "gt1_mercedes_clk_lm"
]

def generate_car_image(client, car_id):
    # Convert ID to a readable prompt name (e.g., "porsche_911_gt3_r" -> "Porsche 911 Gt3 R")
    car_name = car_id.replace("_", " ").title()
    
    prompt = f"8-bit pixel art graphic of a {car_name} race car, side profile facing right, dark gray asphalt background, retro video game style, simple colors"
    
    print(f"🎨 Generating: {car_name}...")
    
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        
        # Download the image
        img_data = requests.get(image_url).content
        filepath = os.path.join(OUTPUT_DIR, f"{car_id}.png")
        
        with open(filepath, 'wb') as handler:
            handler.write(img_data)
            
        print(f"✅ Saved: {filepath}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to generate {car_name}: {e}")
        return False

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    client = OpenAI()
    
    print(f"🚀 Starting background agent to generate {len(AMS2_CARS)} cars...")
    
    for car_id in AMS2_CARS:
        # Check if we already generated it so we can resume if stopped
        if os.path.exists(os.path.join(OUTPUT_DIR, f"{car_id}.png")):
            print(f"⏭️ Skipping {car_id} (already exists)")
            continue
            
        success = generate_car_image(client, car_id)
        
        # Rate limiting pause (DALL-E 3 has rate limits based on tier)
        if success:
            print("⏳ Waiting 15 seconds to avoid API rate limits...")
            time.sleep(15)

    print("🎉 All car images generated successfully!")

if __name__ == "__main__":
    main()
