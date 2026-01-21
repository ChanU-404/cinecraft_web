#!/bin/bash

# Test the Storyboard API (Fireworks Flux.1)
# Ensure you have FIREWORKS_API_KEY in your .env.local and the server is running on localhost:3000

echo "Testing Storyboard Generation..."

curl -X POST http://localhost:3000/api/storyboard \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN_IF_NEEDED" \
  -d '{
    "shotId": "test-shot-1",
    "sceneContext": {
      "location": "EXT. CYBERPUNK CITY - NIGHT",
      "time": "Night",
      "emotion": ["Tense"],
      "directorIntent": "Show the scale of the city"
    },
    "shot": {
      "type": "Wide Shot",
      "camera": "Low Angle",
      "description": "A lone figure stands on a rainy rooftop overlooking neon-lit skyscrapers."
    }
  }' | json_pp

echo -e "\n\nCheck if 'image' field contains a base64 string."
