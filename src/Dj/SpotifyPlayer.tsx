import React, { useEffect, useState } from 'react';

const SpotifyPlayer = ({ token, trackUris }) => {
  const [player, setPlayer] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;

  document.body.appendChild(script);
  useEffect(() => {

    // if (!window.Spotify) {
    //   console.error('Spotify SDK not loaded.');
    //   return;
    // }

    window.onSpotifyWebPlaybackSDKReady = () => {
        const newPlayer = new window.Spotify.Player({
          name: 'Your Web Player',
          getOAuthToken: cb => { cb(token); },
          volume: 0.1,
        });
    

    newPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
    });

    newPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    newPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setIsPaused(state.paused);

      if (state.paused && state.position === 0 && currentTrackIndex < trackUris.length - 1) {
        setCurrentTrackIndex(prevIndex => prevIndex + 1);
        playTrack(trackUris[currentTrackIndex + 1]);
      }
    });

    newPlayer.connect();
    setPlayer(newPlayer);
    }
    return () => {
        if(player){
            player.disconnect();
        }
    };
  }, [token, currentTrackIndex, trackUris]);

  const playTrack = (track) => {
    if (player && deviceId && track) {
        const uri = track.map(track => track.uri)
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
  };

  const play = () => {
    if (trackUris && trackUris.length > 0) {
      playTrack(trackUris[currentTrackIndex]);
    }
  };

  const togglePlay = () => {
    if (player) {
      player.togglePlay();
    }
  };

  return (
    <div>
      <button onClick={play}>Start Playlist</button>
      <button onClick={togglePlay}>{isPaused ? 'Play' : 'Pause'}</button>
    </div>
  );
};

export default SpotifyPlayer;
