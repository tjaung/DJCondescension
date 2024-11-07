import React, { useState, useEffect } from "react";
import { setClientToken } from "../spotifyAPI";
import {Login} from "../Login/Login";
import Dj from "../Dj/Dj";


export const Home = () => {
  const [token, setToken] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    const hash = window.location.hash;
    window.location.hash = "";
    if (!token && hash) {
      const _token = hash.split("&")[0].split("=")[1];
      window.localStorage.setItem("token", _token);
      setToken(_token);
      setClientToken(_token);
    } else {
      setToken(token);
      setClientToken(token);
    }
  }, []);

  return !token ? (
    <>
        <Login />
    </>

  ) : (
    
      <div className="main-body">
        <Dj 
            token={token}
            setToken={setToken}
        />
      </div>
  );
}