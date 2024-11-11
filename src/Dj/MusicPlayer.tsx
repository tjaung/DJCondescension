import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faForward, faBackward, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import axios from 'axios';

library.add(faPause, faPlay, faForward, faBackward, faVolumeHigh);

import './MusicPlayer.css';

interface Track {
  id: string;
  name: string;
  uri: string;
  album: {
    images: { url: string }[];
  };
  artists: { name: string }[];
}

interface MusicPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onEndOfPlaylist: () => void;
  onTrackChange: (nextIndex: number) => void;
  onPlayPauseToggle: () => void;
  token: string; // Spotify Access Token
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onEndOfPlaylist,
  onTrackChange,
  onPlayPauseToggle,
  token
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [volume, setVolume] = useState(50);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [isManuallyPlaying, setIsManuallyPlaying] = useState(isPlaying);

  const currentTrack = tracks[currentTrackIndex];
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load the Spotify Web Playback SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize Spotify Player
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Your Web Player',
        getOAuthToken: cb => cb(token),
        volume: 0.1,
      });

      // Event listener for when the player is ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        setPlayer(spotifyPlayer);
        setIsDeviceReady(true);
        setDeviceId(device_id);
        // Wait for the device to be ready before trying to transfer playback
        transferPlaybackToDevice(device_id);
      });

      // Event listener for when the player goes offline
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        setIsDeviceReady(false);
      });

      // Event listener for player state changes
      spotifyPlayer.addListener('player_state_changed', state => {
        if (state) {
          setTrackProgress(state.position / 1000);
          setTrackDuration(state.duration / 1000);

          // Update play/pause state
          if (state.paused !== !isManuallyPlaying) {
            setIsManuallyPlaying(!state.paused);
          }

          // Handle track ending naturally
          if (state.paused && state.position === 0) {
            // If the current track is "Loading more songs...", stop playback and notify `Dj`
            if (currentTrack.name === "Loading more songs...") {
              console.log('end of playlist')
              stopProgressUpdate();
              onEndOfPlaylist(); // Notify `Dj` component to rerun fetchData()
            } else {
              // Proceed to the next track if it's not the end of playlist placeholder
              if (currentTrackIndex < tracks.length - 1) {
                onTrackChange(currentTrackIndex + 1);
              } else {
                onEndOfPlaylist();
              }
            }
          }
        }
      });

      // Connect to Spotify
      spotifyPlayer.connect();
    };

    // Clean up script and disconnect the player on unmount
    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, [token]);

  useEffect(() => {
    if (isDeviceReady && player) {
      if (isPlaying) {
        playCurrentTrack();
        startProgressUpdate();
      } else {
        player.togglePlay();
        stopProgressUpdate();
      }
    }
  }, [isPlaying, currentTrackIndex, isDeviceReady]);

  // Function to start updating the progress bar
  const startProgressUpdate = () => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(async () => {
      if (player) {
        try {
          const state = await player.getCurrentState();
          if (state && !state.paused) {
            setTrackProgress(state.position / 1000);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }, 1000); // Update every second
  };

  // Function to stop updating the progress bar
  const stopProgressUpdate = () => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const transferPlaybackToDevice = async (deviceId: string, retryCount = 3) => {
    if (!deviceId) {
      console.error("Device ID is not available.");
      return;
    }
    console.log(deviceId)
    try {
      // Adding a slight delay before transferring playback
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
  
      const response = await axios.put(
        'https://api.spotify.com/v1/me/player',
        {
          device_ids: [deviceId],
          play: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.status === 200) {
        console.log('Playback transferred successfully to device:', deviceId);
      }
    } catch (error: any) {
      console.error('Error transferring playback to new device:', error.message);
  
      // Retry mechanism if the request fails
      if (retryCount > 0) {
        console.log(`Retrying transfer playback (${retryCount} retries left)...`);
        setTimeout(() => transferPlaybackToDevice(deviceId, retryCount - 1), 2000); // Retry after 2 seconds
      }
    }
  };

  const playCurrentTrack = async () => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    if (player && deviceId && isDeviceReady) {
      if(currentTrack.name === 'Loading More Songs...'){
        console.log('hit end of playlist placeholder')
        nextTrack()
        togglePlayPause()
        onEndOfPlaylist()
      }
      try {
        await axios.put(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            uris: [currentTrack.uri],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  };

  const handleVolumeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    const newVolume = parseInt(event.target.value, 10) / 100;
    setVolume(newVolume * 100);
    if (player && isDeviceReady) {
      try {
        await player.setVolume(newVolume);
      } catch (error) {
        console.error('Error setting volume: ', error);
      }
    }
  };

  const nextTrack = () => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    if (currentTrack.name === "Loading more songs...") {
      console.log('end of playlist')
      onEndOfPlaylist();
    } else if (currentTrackIndex < tracks.length - 1) {
      onTrackChange(currentTrackIndex + 1);
    } else {
      onEndOfPlaylist();
    }
  };

  const prevTrack = () => {
    if (!player) {
      console.error('Player is not available.');
      return;
    }
    if (currentTrackIndex > 0) {
      onTrackChange(currentTrackIndex - 1);
    }
  };

  const togglePlayPause = async () => {
    if (player) {
      try{
        await player.togglePlay(); // This function handles both play and pause correctly
        setIsManuallyPlaying(prevState => !prevState); // Toggle the local `isManuallyPlaying` state
      } catch(error){
        console.error(error)
      } 
    }
  };

  if (!currentTrack) {
    return <p>Loading track...</p>;
  }

  return (
    <div className='fixed bottom-0 left-0 h-[180px] w-full bg-black bg-opacity-50'>
      <div className="grid grid-cols-[120px_1fr_0.2fr] w-full items-center h-[180px] p-2 border rounded-lg gap-4 top-2">
        {currentTrack.album.images.length > 0 ? (
          <img id='album-art' className="h-[120px] w-[120px]" src={currentTrack.album.images[0].url} alt="Album Art" />
        ) : (
          <div className="h-[120px] w-[120px] bg-gray-200 flex items-center justify-center">
            <span>No Image</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-2 w-full overflow-hidden">
            <div className="text-lg font-bold whitespace-nowrap track-title">{currentTrack.name}</div>
            <p className="text-lg font-semibold">{currentTrack.artists.map(artist => artist.name).join(', ')}</p>
          </div>
          <div className="controls flex gap-2">
            <button onClick={prevTrack} disabled={currentTrackIndex === 0}>
              <FontAwesomeIcon icon={faBackward} />
            </button>
            <button onClick={togglePlayPause}>
              <FontAwesomeIcon icon={isManuallyPlaying ? faPause : faPlay} />
            </button>
            <button onClick={nextTrack} disabled={currentTrackIndex === tracks.length - 1}>
              <FontAwesomeIcon icon={faForward} />
            </button>
          </div>
          {/* Track Progress Controller */}
          <div className="track-progress mt-2 flex flex-col gap-2">
            <input
              type="range"
              min="0"
              max={trackDuration}
              value={trackProgress}
              onChange={(e) => player?.seek(parseInt(e.target.value) * 1000)}
            />
            <div className="track-time">
              {Math.floor(trackProgress / 60)}:{Math.floor(trackProgress % 60).toString().padStart(2, '0')} / 
              {Math.floor(trackDuration / 60)}:{Math.floor(trackDuration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        {/* Volume Controller */}
        <div className="volume-control grid grid-rows-[1fr_4fr] h-full mt-2">
          <label htmlFor="volume"><FontAwesomeIcon icon={faVolumeHigh} /></label>
          <input
            className='-rotate-90 self-center w-[120px]'
            type="range"
            id="volume"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
