import React from "react";
import { loginEndpoint } from "../api/spotifyAPI";
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export const Login = () => {
  const handleLogin = () => {
    // Redirect user to the Spotify authorization page
    window.location.href = loginEndpoint;
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-8 min-h-screen bg-gray-900 text-white">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold">Welcome to</h2>
        <h1 className="text-3xl sm:text-5xl font-bold">DJ Condescension</h1>
      </div>

      <div className="w-full max-w-2xl text-center space-y-4">
        <p className="text-base sm:text-lg">Your personal radio station for the very best tracks tailored to your music taste.</p>
        <p className="text-base sm:text-lg">Word of caution, our host is... very condescending. He's going to take a look at your listening history and pick out some great new tracks for you to hear. Just know that he will be judging you.</p>
        <p className="text-base sm:text-lg font-semibold">Are you ready to hear what you don't want to hear about yourself?</p>
      </div>

      <div className="w-full max-w-sm">
        <button 
          onClick={handleLogin} 
          className="w-full py-4 px-8 mt-6 font-bold text-xl bg-gradient-to-b from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:to-purple-700 text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out">
          Log in with Spotify
        </button>
      </div>

      <div className="text-center mt-6 font-semibold">
        <p>Note: This requires a Spotify premium account to use.</p>
      </div>

      <div className="flex flex-col items-center w-full mt-8 space-y-4">
        <img
          src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
          alt="logo-spotify"
          className="h-12 sm:h-16"
        />
        <p className="text-xs w-full max-w-3xl text-center px-4">
          This application uses the Spotify API but is not endorsed, certified, or otherwise associated with Spotify. All song data, album artwork, and music playback are provided by Spotify, and remain the property of Spotify and its respective content owners. For more information, please visit Spotify's Terms of Service.
        </p>
      </div>

      <footer className="w-full mt-8 text-center">
        <div>
          <a href="https://github.com/tjaung/DJCondescension" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400 transition-colors duration-300">
            <FontAwesomeIcon icon={faGithub} size="2x" />
          </a>
        </div>
      </footer>
    </div>
  );
};
