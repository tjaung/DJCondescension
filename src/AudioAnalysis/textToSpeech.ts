export const generateTextToSpeech = async (text) => {
    try {
        const response = await fetch('/api/generateTTS', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch TTS audio");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob); // Create URL from blob for audio playback

        return audioUrl;
    } catch (error) {
        console.error("Error generating TTS audio:", error);
        return null;
    }
};
