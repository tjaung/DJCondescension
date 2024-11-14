import React, { useEffect, useRef, useState } from 'react';
import CustomSpotifyPlayer from './SpotifyPlayer';
import Visualizer from '../Visualizer/Visualizer';
import { fetchTopTracks, fetchAudioFeatures, fetchRecommendations } from '../api/spotifyAPI';
import { generateTextToSpeech } from '../api/generatetts';
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
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const [isTtsPlaying, setIsTtsPlaying] = useState(true);
  const [isTtsStarted, setIsTtsStarted] = useState(false); // Initially set to false to show "Analyzing..."
  const [scripts, setScripts] = useState('');
  const [currentTrack, setCurrentTrack] = useState<{
    name: string;
    artist: string;
    albumArt: string;
    audioFeatures: { tempo: number; energy: number };
  } | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const fetchData = async () => {
    try {
      setIsTtsStarted(false); // Start analysis, show "Analyzing..."
      setIsTtsPlaying(true);
      setTracksData((prev) => ({
        ...prev,
        recommendations: [],
      }));

      const topTracks = await fetchTopTracks();
      let tracks;
      try {
        const recs = await fetchRecommendations(topTracks);
        tracks = await fetchAudioFeatures(recs);
      } catch (error) {
        console.error(error);
        tracks = await fetchAudioFeatures(topTracks);
        tracks = pickRandomNSongs(6, tracks);
      }
      
      setTracksData({
        topTracks,
        allSongs: [],
        recommendations: [...tracks],
      });
      const djScript = await getOpenAiText(tracks);
      const djVoice = await generateTextToSpeech(djScript);
      
      if (audioRef.current) {
        audioRef.current.src = djVoice;
        // Play audio only after user interaction
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in fetching data sequence:', error);
    }
  };

  useEffect(() => {
    if (token && isSessionStarted) fetchData();
  }, [token, isSessionStarted]);

  useEffect(() => {
    const handleAudioStart = () => {
      setIsTtsStarted(true); // Audio started, hide "Analyzing..."
      console.log('audio start')
    };

    const handleAudioEnd = () => {
      setIsTtsPlaying(false);
      console.log('audio end')
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('playing', handleAudioStart); // Updated event listener to 'playing'
      audioRef.current.addEventListener('ended', handleAudioEnd);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('playing', handleAudioStart); // Updated event listener to 'playing'
        audioRef.current.removeEventListener('ended', handleAudioEnd);
      }
    };
  }, []);

  const handleEndOfPlaylist = () => {
    fetchData();
    setCurrentTrackIndex(0);
    setIsPlaying(false);
  };

  const handleStartSession = () => {
    // Ensure AudioContext is resumed upon user interaction
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (audioContext.current.state === 'suspended') {
      // Resume the AudioContext if it is suspended (Safari often suspends it by default)
      audioContext.current.resume().catch((error) => {
        console.error('Error resuming audio context:', error);
      });
    }

    setIsSessionStarted(true);
    setShowVisualizer(true);
  };

  const handleLogout = () => {
    setToken('');
    window.localStorage.clear();

    // Unmount the visualizer
    setShowVisualizer(false);

    // Stop any ongoing playback from audioRef
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear the source
    }

    // Close the audio context if it exists
    if (audioContext.current) {
      audioContext.current.close().then(() => {
        audioContext.current = null;
      }).catch((error) => {
        console.error('Error closing audio context:', error);
      });
    }

    // Reset the state variables to their initial state
    setIsPlaying(false);
    setIsSessionStarted(false);
    setIsTtsPlaying(false);
    setIsTtsStarted(false);
    setCurrentTrack(null);
    setTracksData({
      topTracks: [],
      allSongs: [],
      recommendations: [],
    });

    console.log('User logged out, resources cleaned up.');
  };

  return (
    <div className="flex flex-col align-center">
      <nav className="flex flex-row p-5 align-center justify-end fixed top-0 left-0 w-full">
        <button className="menu-button" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      {!isSessionStarted && (
        <div className="flex flex-col items-center justify-center h-screen">
          <button
            className="start-button bg-black bg-opacity-50"
            onClick={handleStartSession}
          >
            Start DJ Session
          </button>
        </div>
      )}
      
      {/* Analyzing Message */}
      {!isTtsStarted && isSessionStarted && (
        <div className="start-button text-md px-2.5 py-5 rounded">
          <p className="bg-black bg-opacity-50">Analyzing...</p>
        </div>
      )}
      
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Visualizer Component */}
      {showVisualizer && (
        <Visualizer
          audioRef={audioRef}
          audioContext={audioContext}
          isPlaying={isPlaying}
          albumImageUrl={currentTrack?.albumArt || null}
          audioFeatures={currentTrack?.audioFeatures || { tempo: 120, energy: 0.5 }}
          isCurrentTrackAvailable={!!currentTrack}
        />
      )}

      {/* Spotify Player Component */}
      {tracksData.recommendations.length > 0 && isSessionStarted && !isTtsPlaying && (
        <CustomSpotifyPlayer
          token={token}
          uris={tracksData.recommendations.map((track) => track.uri)}
          callback={(trackInfo) => {
            setCurrentTrack({
              name: trackInfo.name,
              artist: trackInfo.artist,
              albumArt: trackInfo.albumArt,
              //@ts-ignore
              audioFeatures: trackInfo.audioFeatures! || { tempo: 0, energy: 0.1 },
            });
          }}
          onEnd={handleEndOfPlaylist}
        />
      )}
    </div>
  );
};

export default Dj;
