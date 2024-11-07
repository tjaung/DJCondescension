import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faForward, faBackward } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import Visualizer from './Visualizer';

library.add(faPause, faPlay, faForward, faBackward);

import './MusicPlayer.css';

interface Track {
  id: string;
  name: string;
  preview_url: string;
  album: {
    images: { url: string }[];
  };
  artists: { name: string }[];
}

interface MusicPlayerProps {
  tracks: Track[];
  onEndOfPlaylist: () => void;
  loading: boolean; // Indicates if new songs are loading
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks, onEndOfPlaylist, loading }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.pause();
      audioRef.current.src = tracks[currentTrackIndex]?.preview_url || '';
      if (isPlaying) {
        audioRef.current.play().catch((error) => console.error("Error playing audio:", error));
      }
    }
  }, [tracks, currentTrackIndex, isPlaying, loading]);

  const handleTrackEnd = () => {
    if (currentTrackIndex === tracks.length - 1) {
      setIsPlaying(false);
      setFreeze(true);
      onEndOfPlaylist();
    } else {
      nextTrack();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleTrackEnd);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
    };
  }, [currentTrackIndex, tracks]);

  const playTrack = () => {
    if (!loading && !freeze && audioRef.current) {
      // Initialize AudioContext on first play
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume the AudioContext if it's in a suspended state
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audioRef.current.play().catch((error) => console.error("Error playing track:", error));
      setIsPlaying(true);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const nextTrack = () => {
    if (!loading && !freeze) {
      const nextIndex = currentTrackIndex + 1;
      if (nextIndex < tracks.length) {
        setCurrentTrackIndex(nextIndex);
      } else {
        setIsPlaying(false);
        setFreeze(true);
        onEndOfPlaylist();
      }
    }
  };

  const prevTrack = () => {
    if (!loading && !freeze) {
      const prevIndex = currentTrackIndex - 1;
      if (prevIndex >= 0) {
        setCurrentTrackIndex(prevIndex);
      }
    }
  };

  useEffect(() => {
    if (!loading && freeze && tracks.length > 0) {
      setFreeze(false);
      setCurrentTrackIndex(0);
    }
  }, [loading, freeze, tracks]);

  if (tracks.length === 0) {
    return <p>Loading tracks...</p>;
  }

  const currentTrack = tracks[currentTrackIndex] || null;

  return (
    <section className='flex flex-col align-center pt-[400px]'>
      <audio ref={audioRef} />
      <Visualizer audioRef={audioRef} audioContext={audioContextRef} isPlaying={isPlaying} />
      <div className="grid grid-cols-[120px_1fr] items-center w-[400px] h-[150px] p-2 border rounded-lg gap-4 top-2">
        {loading ? (
          <p>Loading new playlist...</p>
        ) : (
          <>
            {currentTrack && currentTrack.album && currentTrack.album.images?.length > 0 ? (
              <img className="h-[120px] w-[120px]" src={currentTrack.album.images[0].url} alt="Album Art" />
            ) : (
              <div className="h-[120px] w-[120px] bg-gray-200 flex items-center justify-center">
                <span>No Image</span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center">
              <div className="text-center mb-2 w-full overflow-hidden">
                <div className="text-lg font-bold whitespace-nowrap track-title">
                  {currentTrack ? currentTrack.name : 'Unknown Track'}
                </div>
                <p className="text-lg font-semibold">
                  {currentTrack && currentTrack.artists?.length > 0 ? currentTrack.artists[0].name : 'Unknown Artist'}
                </p>
              </div>
              <div className="controls flex gap-2">
                <button onClick={prevTrack} disabled={loading || freeze}>
                  <FontAwesomeIcon icon={faBackward} />
                </button>
                {isPlaying ? (
                  <button onClick={pauseTrack}>
                    <FontAwesomeIcon icon={faPause} />
                  </button>
                ) : (
                  <button onClick={playTrack} disabled={loading || freeze}>
                    <FontAwesomeIcon icon={faPlay} />
                  </button>
                )}
                <button onClick={nextTrack} disabled={loading || freeze}>
                  <FontAwesomeIcon icon={faForward} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default MusicPlayer;
