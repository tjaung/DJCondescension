import React, { useEffect, useRef, useState } from 'react';
import MusicPlayer from './MusicPlayer';
import Visualizer from '../Visualizer/Visualizer';
import { fetchTopTracks, fetchRecommendations, fetchAudioFeatures } from '../spotifyAPI';
import { generateTextToSpeech } from '../../api/generatetts';
import { placeholder } from './placeholder';
import { pickRandomNSongs } from '../utils/utils';
import { getOpenAiText } from '../AudioAnalysis/OpenAi';

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
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSessionStarted, setIsSessionStarted] = useState(false); // User-triggered session start
    const [isTtsPlaying, setIsTtsPlaying] = useState(true);
    const [isTtsStarted, setIsTtsStarted] = useState(false)
    const [scripts, setScripts] = useState('')
    const [recentScript, setRecentScript] = useState(null)
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchData = async () => {
        try {
            setIsTtsStarted(false);
            setIsTtsPlaying(true);
            // Clear existing recommendations
            setTracksData(prev => ({
                ...prev,
                recommendations: []
            }));

            const topTracks = await fetchTopTracks();
            let tracks = await fetchAudioFeatures(topTracks);
            tracks = pickRandomNSongs(3, tracks);
            const endOfPlaylistHolder = placeholder;

            setTracksData({
                topTracks,
                allSongs: [],
                recommendations: [...tracks, endOfPlaylistHolder],
            });

            const test = 'This is a test';
            // const djScript = await getOpenAiText(tracks)
            const djVoice = await generateTextToSpeech(test); // Generate TTS audio URL
            // setRecentScript(djScript)
            const addNew = scripts + `/n ${test}`;
            setScripts(addNew);
            if (audioRef.current) {
                audioRef.current.src = djVoice;
                audioRef.current.play().catch((error) => {
                    console.error('Error playing audio:', error);
                });
                // setRecentScript(null)
            }
        } catch (error) {
            console.error("Error in fetching data sequence:", error);
        }
    };

    useEffect(() => {
        if (token && isSessionStarted) fetchData();
    }, [token, isSessionStarted]);

    useEffect(() => {
        const handleAudioStart = () => {
            console.log("Audio started playing");
            setIsTtsStarted(true);
        };
    
        const handleAudioEnd = () => {
            setIsTtsPlaying(false);
        };
    
        if (audioRef.current) {
            // Add event listeners for play and ended events
            audioRef.current.addEventListener('play', handleAudioStart);
            audioRef.current.addEventListener('ended', handleAudioEnd);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('play', handleAudioStart);
                audioRef.current.removeEventListener('ended', handleAudioEnd);
            }
        };
    }, []);

    const handleEndOfPlaylist = () => {
        fetchData(); // Re-fetch new recommendations and clear the current playlist
        setCurrentTrackIndex(0);
        setIsPlaying(false)
    };

    const handleTrackChange = (nextIndex: number) => {
        setCurrentTrackIndex(nextIndex);
        setIsPlaying(true); // Automatically play the next track when changing tracks
    };

    const handlePlayPauseToggle = () => {
        setIsPlaying((prev) => !prev);
    };

    const handleStartSession = () => {
        setIsSessionStarted(true);
    };

    const handleLogout = () => {
        setToken("");
        window.localStorage.clear();
    };

    const currentTrack = tracksData.recommendations[currentTrackIndex];

    return (
        <div className='flex flex-col align-center'>
            <nav className='flex flex-row p-5 align-center justify-end fixed top-0 left-0 w-full'>
                <button className="menu-button" onClick={() => handleLogout()}>Log out</button>
            </nav>

            {/* Start Session Button */}
            {!isSessionStarted && (
                <div className="flex flex-col items-center justify-center h-screen">
                    <button className="start-button bg-black bg-opacity-50" onClick={handleStartSession}>
                        Start DJ Session
                    </button>
                </div>
            )}
            {isTtsStarted === false && (
                <div className='start-button text-md px-2.5 py-5 rounded'>
                    <p className='bg-black bg-opacity-50'>Analyzing...</p>
                </div>
            )}
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Visualizer Component */}
            {currentTrack && !isTtsPlaying ? (
                <Visualizer
                    isPlaying={isPlaying}
                    albumImageUrl={currentTrack.album?.images.length > 0 ? currentTrack.album.images[0].url : null}
                    audioFeatures={currentTrack.audioFeatures || { tempo: 120, energy: 0.5 }}
                />
            ) : (
                <Visualizer
                    isPlaying={false}
                    albumImageUrl={null}
                    audioFeatures={{ tempo: 30, energy: 1 }}
                />
            )}

            {/* Music Player Component */}
            {tracksData.recommendations.length > 0 && isSessionStarted && !isTtsPlaying && (
                <MusicPlayer
                    tracks={tracksData.recommendations}
                    currentTrackIndex={currentTrackIndex}
                    isPlaying={isPlaying}
                    onEndOfPlaylist={handleEndOfPlaylist}
                    onTrackChange={handleTrackChange}
                    onPlayPauseToggle={handlePlayPauseToggle}
                    token={token}
                />
            )}
        </div>
    );
};

export default Dj;
