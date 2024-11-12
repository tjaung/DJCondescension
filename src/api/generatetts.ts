export const generateTextToSpeech = async (text) => {
    try {
        const response = await fetch('https://dj-condescension-server.vercel.app/generateTTS', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'xi-api-key': import.meta.env.ELEVEN_LABS_API_KEY
             },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch TTS audio");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        return audioUrl; // Use this URL in the placeholder track
    } catch (error) {
        console.error("Error generating TTS audio:", error);
        return null;
    }
};
