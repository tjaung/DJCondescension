import React from "react";
import { loginEndpoint } from "../spotifyAPI";

export const Login = () => {
  const handleLogin = () => {
    // Redirect user to the Spotify authorization page
    window.location.href = loginEndpoint;
  };

  return (
    <div className="login-page">
      <img
        src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
        alt="logo-spotify"
        className="logo"
      />
      <button onClick={handleLogin} className="login-btn">LOG IN</button>
    </div>
  );
};
