import React, { useEffect, useRef, useState } from 'react';
import MusicPlayer from './MusicPlayer';
import { fetchTopTracks, fetchRecommendations, fetchAudioFeatures } from '../spotifyAPI';
import { getOpenAiText } from '../AudioAnalysis/OpenAi';
import { generateTextToSpeech } from '../../api/generatetts';
import { placeholder } from './placeholder';
import { pickRandomNSongs } from '../utils/utils';
import SpotifyPlayer from './SpotifyPlayer';

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
    const [isTtsPlaying, setIsTtsPlaying] = useState(false);
    const [isSessionStarted, setIsSessionStarted] = useState(false); // User-triggered session start
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchData = async () => {
        try {
            // Step 1: Fetch Top Tracks
            const topTracks = await fetchTopTracks();
            console.log(topTracks);

            // Step 2: Fetch Recommendations
            // let tracks = await fetchRecommendations(topTracks);
            let tracks = await fetchAudioFeatures(topTracks);
            tracks = pickRandomNSongs(3, tracks)
            // make placeholder for end of playlist
            const endOfPlaylistHolder = placeholder
            // Step 3: Generate Placeholder Audio with Text-to-Speech
            const test = 'This is a test';
            const placeholderAudioUrl = await generateTextToSpeech(test); // Generate TTS audio URL

            // Step 4: Update state with placeholder and recommendations
            setTracksData({
                topTracks,
                allSongs: [],
                recommendations: [...tracks, endOfPlaylistHolder],
            });
            console.log(tracks)
            // Step 5: Play the generated TTS
            if (audioRef.current) {
                audioRef.current.src = placeholderAudioUrl;
                setIsTtsPlaying(true);
                audioRef.current.play().catch((error) => {
                    console.error('Error playing audio:', error);
                });
            }
        } catch (error) {
            console.error("Error in fetching data sequence:", error);
        }
    };

    useEffect(() => {
        if (token && isSessionStarted) fetchData();
    }, [token, isSessionStarted]);

    useEffect(() => {
        if (audioRef.current) {
            // Add event listener for when the audio ends
            audioRef.current.addEventListener('ended', () => {
                setIsTtsPlaying(false);
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('ended', () => {
                    setIsTtsPlaying(false);
                });
            }
        };
    }, []);

    const handleEndOfPlaylist = () => {
        fetchData(); // Re-fetch recommendations and include a new placeholder
    };

    const handleLogout = () => {
        setToken("");
        window.localStorage.clear();
    };

    const handleStartSession = () => {
        setIsSessionStarted(true);
    };

    return (
        <div className='flex flex-col align-center'>
            <nav className='flex flex-row p-5 align-center justify-end fixed top-0 left-0 w-full'>
                <button className="menu-button" onClick={handleLogout}>Log out</button>
            </nav>

            {/* Start Session Button */}
            {!isSessionStarted && (
                <div className="flex flex-col items-center justify-center h-screen">
                    <button className="start-button" onClick={handleStartSession}>
                        Start DJ Session
                    </button>
                </div>
            )}

            <audio ref={audioRef} style={{ display: 'none' }} />
            
            {tracksData.recommendations?.length > 0 && isSessionStarted && !isTtsPlaying && (
                
                <MusicPlayer tracks={tracksData.recommendations} onEndOfPlaylist={handleEndOfPlaylist} loading={false} token={token} />
            )} 
        </div>
    );
};

export default Dj;
