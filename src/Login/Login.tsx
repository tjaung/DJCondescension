import React from "react";
import { loginEndpoint } from "../spotifyAPI";

export const Login = () => {
  const handleLogin = () => {
    // Redirect user to the Spotify authorization page
    window.location.href = loginEndpoint;
  };

  return (
    <div className="login-page">
      <div className="h-50 pxy-5 m-5">
        <h2>Welcome to</h2>
        <h1>DJ Condescension</h1>
      </div>
      <div>
        <p>Your personal radio station for the very best tracks tailored to your music taste</p>
        <p>Word of caution, our host is...very condescending. He's gonna take a look at your listening</p>
        <p>history and pick out some great new tracks for you to hear. Just know that he will be judging you.</p>
        <p>Are you ready to hear what you don't want to hear about yourself?</p>
      </div>
      <div className="m-10">
      <button onClick={handleLogin} className="login-btn border-white">LOG IN</button>
      </div>
      <div className="m-5">
        <p>Note: this requires a Spotify premium account to use</p>
      </div>
      
      <div className="flex items-center">
        <img
          src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
          alt="logo-spotify"
          className="logo h-5"
        />
      </div>
    </div>
  );
};
