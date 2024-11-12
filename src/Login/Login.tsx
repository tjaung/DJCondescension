import React from "react";
import { loginEndpoint } from "../spotifyAPI";

import '../App.css'

export const Login = () => {
  const handleLogin = () => {
    // Redirect user to the Spotify authorization page
    window.location.href = loginEndpoint;
  };

  return (
    <div className="login-page">
      <div className="h-50 pxy-5 m-5 font-bold">
        <h2>Welcome to</h2>
        <h1>DJ Condescension</h1>
      </div>
      <div className="w-9/12">
        <p>Your personal radio station for the very best tracks tailored to your music taste.</p>
        <p>Word of caution, our host is...very condescending. He's gonna take a look at your listening
        history and pick out some great new tracks for you to hear. Just know that he will be judging you.
        </p>
        <p>Are you ready to hear what you don't want to hear about yourself?</p>
      </div>
      <div className="m-10 flex justify-center align-center">
        <div className="w-9/12 h-full">
          <button onClick={handleLogin} className="login-btn border-indigo-500 h-9/12">Log in with Spotify</button>
        </div>
      </div>
      <div className="m-5 font-bold">
        <p>Note: this requires a Spotify premium account to use</p>
      </div>
      
      <div className="flex flex-col items-center w-full">
        <img
          src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
          alt="logo-spotify"
          className="logo h-5"
        />
        <p className="text-xs w-9/12">This application uses the Spotify API but is not endorsed, certified, or otherwise associated with Spotify. All song data, album artwork, and music playback are provided by Spotify, and remain the property of Spotify and its respective content owners. For more information, please visit Spotify's Terms of Service."</p>
      </div>
      <footer className="float top-0 left-0 w-full">
        <div>
          
        </div>
      </footer>
    </div>
  );
};
