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
  
  // Start playing the first track on component mount
  useEffect(() => {
    if (token && uris.length > 0) {
      setCurrentTrackIndex(0);
      setPlay(true);
    }
  }, [token, uris]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-80 p-4">
      <SpotifyPlayer
        token={token}
        play={play}
        initialVolume={25}
        hideAttribution
        uris={[uris[currentTrackIndex]]}
        callback={(state) => {
          if (state.track) {
            const trackInfo = {
              name: state.track.name,
              artist: state.track.artists.map((artist) => artist.name).join(', '),
              albumArt: state.track.image,
            };
            callback(trackInfo);
          }

          // Track ending logic
          if (
            state.track &&
            !state.isPlaying &&
            state.status === 'READY' &&
            !hasEnded
          ) {
            setHasEnded(true); // Prevent running the logic multiple times
            setTimeout(() => {
              // Increment the number of played tracks
              if (currentTrackIndex < uris.length - 1) {
                setCurrentTrackIndex((prevIndex) => prevIndex + 1);
                setPlay(true);
              } else {
                // If it is the last track, trigger the `onEnd` function
                onEnd();
              }
              setHasEnded(false); // Allow the logic to run again for the next track
            }, 500); // Small delay to prevent multiple triggers
          }
        }}
        styles={{
          activeColor: '#fff',
          bgColor: '#333',
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
