// ttsService.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

app.post('/api/generateTTS', async (req, res) => {
    const { text } = req.body;
    const params = {
        voice: "Sarah",
        text: text,
        model_id: "eleven_multilingual_v2",
    };
    
    try {
        const response = await axios.post(
            'https://api.elevenlabs.io/v1/generate', // replace with the correct ElevenLabs API endpoint
            params,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ELEVEN_LABS_API_KEY}`,
                }
            }
        );

        // Send audio data as response
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);
    } catch (error) {
        console.error("Error generating TTS:", error);
        res.status(500).send("Failed to generate TTS audio");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
