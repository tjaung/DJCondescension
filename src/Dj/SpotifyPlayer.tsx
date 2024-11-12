import React, { useEffect, useState } from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';

interface SpotifyPlayerProps {
  token: string;
  uris: string[];
  callback: (trackInfo: { name: string; artist: string; albumArt: string }) => void;
  onEnd: () => void;
}

const CustomSpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ token, uris, callback, onEnd }) => {
  const [play, setPlay] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    // Set play to true when changing to a new track
    if (uris.length > 0) {
      setPlay(true);
    }
  }, [currentTrackIndex]);

  const handleTrackEnd = () => {
    if (currentTrackIndex < uris.length - 1) {
      setCurrentTrackIndex((prevIndex) => prevIndex + 1);
    } else {
      setPlay(false);
      onEnd();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-100 p-4">
      <SpotifyPlayer
        token={token}
        play={play}
        initialVolume={25}
        showSaveIcon={true}
        hideAttribution
        uris={[uris[currentTrackIndex]]}
        callback={(state) => {
          // Update track info when a new track starts playing
          if (state.track && state.isPlaying) {
            const trackInfo = {
              name: state.track.name,
              artist: state.track.artists.map((artist) => artist.name).join(', '),
              albumArt: state.track.image,
            };
            callback(trackInfo);
            setHasEnded(false); // Reset track end flag when a new track starts playing
          }

          // Handle track ending logic when playback reaches the end
          if (
            state.track &&
            !state.isPlaying &&
            state.progressMs === 0 &&
            state.position === 0 &&
            !hasEnded
          ) {
            setHasEnded(true);
            handleTrackEnd();
          }

          // Update play/pause state based on the player status
          if (state.isPlaying) {
            setPlay(true);
          } else if (!state.isPlaying && state.status === 'PAUSED') {
            setPlay(false);
          }
        }}
        styles={{
          activeColor: '#fff',
          bgColor: 'rgba(25, 20, 20, 0.75)',
          color: '#fff',
          loaderColor: '#fff',
          sliderColor: '#1cb954',
          trackArtistColor: '#ccc',
          trackNameColor: '#fff',
          height: 60, // Set a smaller height for a more footer-like appearance
        }}
      />
    </div>
  );
};

export default CustomSpotifyPlayer;
