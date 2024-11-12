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
    <div className="login-page flex flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold sm:text-2xl md:text-3xl">Welcome to</h2>
        <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">DJ Condescension</h1>
      </div>
      <div className="w-full max-w-lg text-center mb-8">
        <p className="text-base sm:text-lg">Your personal radio station for the very best tracks tailored to your music taste.</p>
        <p className="text-base sm:text-lg mt-4">Word of caution, our host is...very condescending. He's gonna take a look at your listening
        history and pick out some great new tracks for you to hear. Just know that he will be judging you.</p>
        <p className="text-base sm:text-lg mt-4">Are you ready to hear what you don't want to hear about yourself?</p>
      </div>
      <div className="w-full flex justify-center mb-10">
        <button 
          onClick={handleLogin} 
          className="login-btn bg-indigo-500 text-white py-3 px-6 rounded-md shadow-md transition transform hover:scale-105 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
          Log in with Spotify
        </button>
      </div>
      <div className="text-center mb-8 font-semibold">
        <p>Note: This requires a Spotify premium account to use</p>
      </div>
      <div className="flex flex-col items-center w-full max-w-md">
        <img
          src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
          alt="logo-spotify"
          className="w-32 h-auto mb-4"
        />
        <p className="text-xs text-center">This application uses the Spotify API but is not endorsed, certified, or otherwise associated with Spotify. All song data, album artwork, and music playback are provided by Spotify, and remain the property of Spotify and its respective content owners. For more information, please visit Spotify's Terms of Service.</p>
      </div>
      <footer className="mt-12 w-full flex justify-center">
        <a href="https://github.com/tjaung/DJCondescension" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition">
          <FontAwesomeIcon icon={faGithub} className="text-2xl" />
        </a>
      </footer>
    </div>
  );
};
