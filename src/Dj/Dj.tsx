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
  const [isTtsStarted, setIsTtsStarted] = useState(false);
  const [scripts, setScripts] = useState('');
  const [currentTrack, setCurrentTrack] = useState<{
    name: string;
    artist: string;
    albumArt: string;
    audioFeatures: { tempo: number; energy: number };
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const fetchData = async (isTest=false) => {
    try {
      // refresh the states
      setIsTtsStarted(false); // Start analysis, show "Analyzing..."
      setIsTtsPlaying(true);
      setTracksData((prev) => ({
        ...prev,
        recommendations: [],
      }));

      // fetch user data
      let topTracks: any
      let recs: any
      let tracks: any
      if (isTest){ 
        console.log('testing function')
        // get mock data for testing
        topTracks = ["5CCNOyJdEWDCVMRRIshNUL", "7KXjTSCq5nL1LoYtL7XAwS", "4Vfgc4BdSKM2hRlkaRFc9C", "0jcw8cJf3TNMZN0BXlueML"]
        recs = await fetchRecommendations(topTracks, isTest);
        console.log(recs)
        tracks = await fetchAudioFeatures(recs);
        tracks = pickRandomNSongs(6, tracks);
      } 
      else { 
        // production data
        topTracks = await fetchTopTracks();
        try {
          recs = await fetchRecommendations(topTracks, false);
          tracks = await fetchAudioFeatures(recs);
        } catch (error) {
          console.error(error);
          tracks = await fetchAudioFeatures(topTracks);
          tracks = pickRandomNSongs(6, tracks);
        }
      }

      console.log(tracks);
      
      // update playlist
      setTracksData({
        topTracks,
        allSongs: [],
        recommendations: [...tracks],
      });

      // get dj audio data
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


  // useEffect(() => {
  //   if (token && isSessionStarted) fetchData(isTest);
  // }, [token, isSessionStarted]);

  useEffect(() => {
    const handleAudioStart = () => {
      setIsTtsStarted(true); // Audio started, hide "Analyzing..."
      console.log('audio start');
    };

    const handleAudioEnd = () => {
      setIsTtsPlaying(false);
      console.log('audio end');
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('playing', handleAudioStart);
      audioRef.current.addEventListener('ended', handleAudioEnd);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('playing', handleAudioStart);
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
    fetchData()
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

  const handleTestApp = () => {
    // For testing purposes, call fetchData directly
    setIsSessionStarted(true);
    setShowVisualizer(true);
    fetchData(true);
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
          <button
            className="test-button bg-gray-800 text-white mt-4 px-4 py-2 rounded"
            onClick={handleTestApp}
          >
            Test the App
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
