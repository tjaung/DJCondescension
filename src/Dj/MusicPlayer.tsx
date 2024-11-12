import React, { useEffect, useState } from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faForward, faBackward, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';

library.add(faPause, faPlay, faForward, faBackward, faVolumeHigh);

interface PlayerProps {
  token: string;
  uris: string[];
}

const Player: React.FC<PlayerProps> = ({ token, uris }) => {
  const [play, setPlay] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState({
    name: '',
    artist: '',
    albumArt: '',
  });
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    if (token && uris.length > 0) {
      setPlay(true);
    }
  }, [token, uris, currentTrackIndex]);

  const nextTrack = () => {
    if (currentTrackIndex < uris.length - 1) {
      setCurrentTrackIndex((prevIndex) => prevIndex + 1);
      setPlay(true);
    }
  };

  const previousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prevIndex) => prevIndex - 1);
      setPlay(true);
    }
  };

  const handlePlayPause = () => {
    setPlay((prevPlay) => !prevPlay);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value, 10);
    setVolume(newVolume);
  };

  if (!token || uris.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 h-[180px] w-full bg-black bg-opacity-50">
      <div className="grid grid-cols-[120px_1fr_0.2fr] w-full items-center h-[180px] p-2 border rounded-lg gap-4 top-2">
        {trackInfo.albumArt ? (
          <img
            id="album-art"
            className="h-[120px] w-[120px]"
            src={trackInfo.albumArt}
            alt="Album Art"
          />
        ) : (
          <div className="h-[120px] w-[120px] bg-gray-200 flex items-center justify-center">
            <span>No Image</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-2 w-full overflow-hidden">
            <div className="text-lg font-bold whitespace-nowrap track-title">{trackInfo.name}</div>
            <p className="text-lg font-semibold">{trackInfo.artist}</p>
          </div>
          <div className="controls flex gap-2">
            <button onClick={previousTrack} disabled={currentTrackIndex === 0}>
              <FontAwesomeIcon icon={faBackward} />
            </button>
            <button onClick={handlePlayPause}>
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <button onClick={nextTrack} disabled={currentTrackIndex === uris.length - 1}>
              <FontAwesomeIcon icon={faForward} />
            </button>
          </div>
          {/* Track Progress Controller (Placeholder) */}
          <div className="track-progress mt-2 flex flex-col gap-2">
            <input type="range" min="0" max="100" value="0" />
            <div className="track-time">
              0:00 / 0:00
            </div>
          </div>
        </div>
        {/* Volume Controller */}
        <div className="volume-control grid grid-rows-[1fr_4fr] h-full mt-2">
          <label htmlFor="volume">
            <FontAwesomeIcon icon={faVolumeHigh} />
          </label>
          <input
            className="-rotate-90 self-center w-[120px]"
            type="range"
            id="volume"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>

      <SpotifyPlayer
        token={token}
        play={play}
        uris={[uris[currentTrackIndex]]}
        callback={(state) => {
          if (!state.isPlaying) {
            setPlay(false);
            setIsPlaying(false);
          } else {
            setIsPlaying(true);
          }

          // Automatically switch to the next track if the current one finishes
          if (state.track && state.progressMs === 0 && !state.isPlaying) {
            if (currentTrackIndex < uris.length - 1) {
              setCurrentTrackIndex((prevIndex) => prevIndex + 1);
              setPlay(true);
            }
          }

          // Update track information
          if (state.track) {
            setTrackInfo({
              name: state.track.name,
              artist: state.track.artists.map(artist => artist.name).join(', '),
              albumArt: state.track.image,
            });
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
        }}
        showSaveIcon={true}
        magnifySliderOnHover={true}
      />
    </div>
  );
};

export default Player;
