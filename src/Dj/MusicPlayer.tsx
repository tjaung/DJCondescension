import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faForward, faBackward } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import axios from 'axios';
import Visualizer from '../Visualizer/Visualizer';
import { getImageColors, getThreeColors, quantization, rgbToHsl } from '../utils/utils';

library.add(faPause, faPlay, faForward, faBackward);

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
  onEndOfPlaylist: () => void;
  loading: boolean; // Indicates if new songs are loading
  token: string; // Spotify Access Token
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks, onEndOfPlaylist, loading, token }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [visColors, setVisColors] = useState({
    primary: { r: 0, g: 0, b: 0 },
    secondary: { r: 0, g: 0, b: 0 },
    tertiary: {r: 0.3, g: 0.9, b: 0.3}
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const albumImageUrl = currentTrack?.album?.images?.length > 0 ? currentTrack.album.images[0].url : null;

  // Transfer Playback to the new device
  const transferPlaybackToDevice = async (deviceId: string) => {
    try {
      await axios.put(
        'https://api.spotify.com/v1/me/player',
        {
          device_ids: [deviceId],
          play: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Start playing the current track after transferring playback
      playCurrentTrack();
    } catch (error) {
      console.error('Error transferring playback to new device:', error);
    }
  };

  // Play the current track on the player
  const playCurrentTrack = async () => {
    if (currentTrack && player && deviceId) {
      try {
        await axios.put(
          `https://api.spotify.com/v1/me/player/play`,
          {
            uris: [currentTrack.uri], // Play the selected track
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  };

  // Set up Spotify Web Playback SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Your Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.1,
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);

        // Set the player and deviceId in the state
        setPlayer(spotifyPlayer);
        setDeviceId(device_id);

        // Transfer playback to the new device
        transferPlaybackToDevice(device_id);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      spotifyPlayer.addListener('player_state_changed', state => {
        if (state) {
          setIsPlaying(!state.paused);
          if (state.paused && state.position === 0 && state.track_window.current_track) {
            // If the track ends (paused and position is at start), move to the next track
            nextTrack();
            console.log(currentTrack)
          }
        }
      });

      spotifyPlayer.connect().then(success => {
        if (success) {
          console.log('Player connected successfully');
        }
      });
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]);

  // Extract colors from album art
  useEffect(() => {
    if (albumImageUrl) {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.src = albumImageUrl;

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = getImageColors(imageData);
          const palette = getThreeColors(quantization(colors, 1));
          const colorTheme = { primary: palette[0], secondary: palette[1], tertiary: palette[2] };
          setVisColors(colorTheme);
        }
      };
    }
  }, [albumImageUrl]);

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.pause();
      audioRef.current.src = currentTrack?.uri || '';
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
      audioRef.current.addEventListener('ended', async () => {
        if (player) {
          await player.pause();
        }
        handleTrackEnd();
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
    };
  }, [currentTrackIndex, tracks]);
  
  useEffect(() => {
    console.log(currentTrack)
    playCurrentTrack(); // Play track whenever currentTrack changes
  }, [currentTrack]);

  const playTrack = async () => {
    if (!loading && !freeze && player) {
      setIsPlaying(true);
      await player.resume();
    }
  };

  const pauseTrack = async () => {
    if (player) {
      try {
        await player.pause(); // Pause playback with Spotify Web Playback SDK
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing track:', error);
      }
    }
  };

  const nextTrack = () => {
    if (player && !loading && currentTrackIndex < tracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(tracks[nextIndex]);
    } else {
      setIsPlaying(false);
      setFreeze(true);
      onEndOfPlaylist();
    }
  };

  const prevTrack = () => {
    if (player && !loading && currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(tracks[prevIndex]);
    }
  };

  useEffect(() => {
    // If a new playlist arrives, automatically play it if we're at the start
    if (!loading && freeze && tracks.length > 0) {
      setFreeze(false);
      setCurrentTrackIndex(0);
      setCurrentTrack(tracks[0]);
      playCurrentTrack();
    }
  }, [loading, freeze, tracks]);

  if (tracks.length === 0) {
    return <p>Loading tracks...</p>;
  }

  return (
    <section className='flex flex-col align-center pt-[400px]'>
      <Visualizer isPlaying={isPlaying} colors={visColors} />
      <div className='fixed bottom-0 left-0 w-full bg-black'>
        <div className="grid grid-cols-[120px_1fr] w-full items-center w-[400px] h-[150px] p-2 border rounded-lg gap-4 top-2">
          {loading ? (
            <p>Loading new playlist...</p>
          ) : (
            <>
              {albumImageUrl ? (
                <img id='album-art' className="h-[120px] w-[120px]" src={albumImageUrl} alt="Album Art" />
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
      </div>
    </section>
  );
};

export default MusicPlayer;
