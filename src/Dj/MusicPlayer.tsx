import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faForward, faBackward, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import axios from 'axios';
import Visualizer from '../Visualizer/Visualizer';
import { getImageColors, getThreeColors, quantization, rgbToHsl } from '../utils/utils';

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
  onEndOfPlaylist: () => void;
  loading: boolean; // Indicates if new songs are loading
  token: string; // Spotify Access Token
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks, onEndOfPlaylist, loading, token }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolume] = useState(50); // Volume control (0-100)
  const [trackProgress, setTrackProgress] = useState(0); // Track progress in seconds
  const [trackDuration, setTrackDuration] = useState(0); // Track duration in seconds

  const [freeze, setFreeze] = useState(false);
  if(currentTrack !== null){
    console.log(`current track: ${currentTrack.name}, index: ${currentTrackIndex}`)
  }

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const albumImageUrl = currentTrack?.album?.images?.length > 0 ? currentTrack.album.images[0].url : null;

  const handleVolumeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value, 10);
    setVolume(newVolume);
  
    // Ensure player is ready and device is active
    if (player && isDeviceReady && deviceId) {
      try {
        await player.setVolume(newVolume / 100);
        console.log(`Volume set to ${newVolume}%`);
      } catch (error) {
        console.error('Error setting volume: ', error);
      }
    } else {
      console.warn('Player is not ready or device ID is not set. Cannot change volume.');
    }
  };
  

  const handleProgressChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(event.target.value, 10);
    setTrackProgress(newPosition);
    if (player) {
      try{
        await player.seek(newPosition * 1000); // Spotify API expects position in milliseconds
      } catch (error) {
        console.error('Error scrubbing song: ', error)
      }
    }
  };

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
      console.log('Playback transferred to device:', deviceId);
    } catch (error) {
      console.error('Error transferring playback to new device:', error);
    }
  };
  

  // Play the current track on the player
  const playCurrentTrack = async () => {
    if (currentTrack && player && deviceId && isDeviceReady) {
      console.log(deviceId, isDeviceReady, currentTrack, player)
      // If the current track is the placeholder, pause and do not play it
      if (currentTrack.id === 'placeholder') {

        console.log('reached end of playlist, dont play')
        setIsPlaying(false);
        player.togglePlay()
        return;
      }
      try {
        console.log(currentTrack.uri)
        // if(player){
          await axios.put(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
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
          // playCurrentTrack()
        // }
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

      spotifyPlayer.addListener('ready', async ({ device_id }:{device_id: string}) => {
        console.log('Ready with Device ID', device_id);

        // Set the player and deviceId in the state
        setPlayer(spotifyPlayer);
        setIsDeviceReady(true)
        setDeviceId(device_id);

        // Transfer playback to the new device
        await transferPlaybackToDevice(device_id).then(() => {
          console.log('success')
        }).catch(error => console.log(error));
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }:{device_id:string}) => {
        console.log('Device ID has gone offline', device_id);
        setIsDeviceReady(false)
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (state) {
          setIsPlaying(!state.paused);
          setTrackProgress(state.position / 1000);
          setTrackDuration(state.duration / 1000);
  
          // Directly handle the end of the track
          if (state.paused && state.position === 0 && currentTrackIndex < tracks.length - 1) {
            // console.log('next track')
            const nextIndex = currentTrackIndex + 1;
  
            if (nextIndex  == tracks.length) {
              console.log('End of playlist reached');
              setIsPlaying(false);
              onEndOfPlaylist();
            } else {
              console.log('Playing next track');
              setCurrentTrackIndex(nextIndex);
              setCurrentTrack(tracks[nextIndex]);
              playCurrentTrack();
            }
          }
        }
      });

      spotifyPlayer.connect().then(success => {
        if (success) {
          setIsDeviceReady(true)
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

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.pause();
      audioRef.current.src = currentTrack?.uri || '';
      if (isPlaying) {
        audioRef.current.play().catch((error) => console.error("Error playing audio:", error));
      }
    }
  }, [tracks, player, currentTrackIndex, isPlaying, loading]);

  const handleTrackEnd = () => {
    if (currentTrackIndex === tracks.length) {
      setIsPlaying(false);
      setFreeze(true);
      
      onEndOfPlaylist();
    } else {
      // nextTrack();
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
  }, [currentTrackIndex, player, tracks]);
  

  useEffect(() => {
    console.log(currentTrack)
    if (token && player && currentTrackIndex < tracks.length){
      console.log('autoplay next', currentTrack, currentTrackIndex)
      
      playCurrentTrack(); // Play track whenever currentTrack changes
    }
    // else if (token && player && currentTrackIndex == tracks.length) {
    //   return
    // }
  }, [currentTrack, player, token]);

  // music controls
  // Real-time Track Progress Update
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        try{
          if (typeof player.getCurrentState == 'function') {
            player.getCurrentState().then(state => {
              if (state) {
                setTrackProgress(state.position / 1000);
                setTrackDuration(state.duration / 1000);
              }
            })
          }
        }  catch(error){
          console.log(error);
        }
        
      }, 1000); // Update track progress every second
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, player]);

  
  const playTrack = async () => {
    if (!loading && !freeze && player) {
      setIsPlaying(true);
      console.log(player)
      await player.togglePlay().then(() => {
        console.log('Toggled playback!');
      });
    }
  };

  const pauseTrack = async () => {
    if (player) {
      try {
        console.log(player)
        await player.togglePlay().then(() => {
          console.log('Toggled playback!');
        }); // Pause playback with Spotify Web Playback SDK
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing track:', error);
      }
    }
  };

  const nextTrack = () => {
    if (player && !loading) {
      const nextIndex = currentTrackIndex + 1;
  
      if (nextIndex >= tracks.length) {
        console.log('End of playlist reached');
        setIsPlaying(false);
        onEndOfPlaylist();
      } else {
        console.log('Playing next track');
        setCurrentTrackIndex(nextIndex);
        setCurrentTrack(tracks[nextIndex]);
        playCurrentTrack();
      }
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
    <section className='flex flex-col align-center pt-[10px]'>
      {currentTrack && (
        <Visualizer isPlaying={isPlaying} albumImageUrl={currentTrack?.album?.images?.length > 0 ? currentTrack.album.images[0].url : null} audioFeatures={currentTrack.audioFeatures} />
      
      )}
      {isDeviceReady && player && tracks && (
        <div className='fixed bottom-0 left-0 h-[180px] w-full bg-black bg-opacity-50'>
        <div className="grid grid-cols-[120px_1fr_0.2fr] w-full items-center h-[180px] p-2 border rounded-lg gap-4 top-2">
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
                {/* Track Progress Controller */}
                <div className="track-progress mt-2 flex flex-col gap-2">
                  <input
                    type="range"
                    min="0"
                    max={trackDuration}
                    value={trackProgress}
                    onChange={handleProgressChange}
                  />
                  <div className="track-time">
                    {Math.floor(trackProgress / 60)}:{Math.floor(trackProgress % 60).toString().padStart(2, '0')} / 
                    {Math.floor(trackDuration / 60)}:{Math.floor(trackDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
              {/* Volume Controller */}
              <div className="volume-control grid grid-rows-[1fr_4fr] h-full mt-2">
                  <label className="" htmlFor="volume"><FontAwesomeIcon icon={faVolumeHigh} /></label>
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
            </>
          )}
        </div>
      </div>
      )}
      
    </section>
  );
};

export default MusicPlayer;
