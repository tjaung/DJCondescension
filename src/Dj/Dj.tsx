import React, { useEffect, useState } from 'react';
import MusicPlayer from './MusicPlayer';
import { fetchTopTracks, fetchRecommendations } from '../spotifyAPI';
import { getOpenAiText } from '../AudioAnalysis/OpenAi';
import { generateTextToSpeech } from '../../api/generatetts';

interface DjInterface {
    token: string;
    setToken: (newValue: string) => void;
}

const Dj = ({ token, setToken }: DjInterface) => {
    const [tracksData, setTracksData] = useState({
        topTracks: [] as string[],
        allSongs: [] as string[],
        recommendations: [] as any[],
    });

    const fetchData = async () => {
        try {
            // Step 1: Fetch Top Tracks
            const topTracks = await fetchTopTracks();
            console.log(topTracks)
            // Step 2: Fetch Recommendations
            // const tracks = await fetchRecommendations(topTracks);
            // const allSongIds = tracks.map((track: { id: any }) => track.id);
            // console.log(tracks)
            // Step 3: Generate Placeholder Audio with Text-to-Speech
            // const djScript = await getOpenAiText(topTracks)//, tracks);
            // console.log(djScript)
            const test = 'this is a test'
            const placeholderAudioUrl = await generateTextToSpeech(test); // Generate TTS audio URL
            // console.log("Generated Blob URL:", placeholderAudioUrl)
            const placeholderTrack = {
                id: "placeholder",
                name: "DJ Intro",
                uri: placeholderAudioUrl, // Blob URL from generateTextToSpeech
                album: { images: [{ url: "placeholder-image-url" }] },
                artists: [{ name: "DJ" }]
            };
            console.log(placeholderTrack)
            // Step 4: Update state with placeholder and recommendations
            setTracksData({
                topTracks,
                allSongs: [],//allSongIds,
                recommendations: [placeholderTrack, ...topTracks],
            });
        } catch (error) {
            console.error("Error in fetching data sequence:", error);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleEndOfPlaylist = () => {
        fetchData(); // Re-fetch recommendations and include a new placeholder
    };

    const handleLogout = () => {
        setToken("");
        window.localStorage.clear();
    };

    return (
        <div className='flex flex-col align-center'>
            <nav className='flex flex-row p-5 align-center justify-end fixed top-0 left-0 w-full'>
                <button className="menu-button" onClick={handleLogout}>Log out</button>
            </nav>
            
            {tracksData.recommendations?.length > 0 && (
                <>
                    <MusicPlayer tracks={tracksData.recommendations} onEndOfPlaylist={handleEndOfPlaylist} loading={false} token={token}/>
                </>
            )}
        </div>
    );
};

export default Dj;
