import axios from "axios";
import { getOpenAiText } from './AudioAnalysis/OpenAi';
import { getRandomNumberRange, pickRandomNSongs } from './utils/utils';

const authEndpoint = "https://accounts.spotify.com/authorize?";
const clientId = import.meta.env.VITE_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const scopes = ["user-library-read", "playlist-read-private", "user-top-read", "user-modify-playback-state"];

export const loginEndpoint = `${authEndpoint}client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
  "%20"
)}&response_type=token&show_dialog=true`;

export const apiClient = axios.create({
  baseURL: "https://api.spotify.com/v1/",
});

  
export const setClientToken = (token: string | null) => {
  apiClient.interceptors.request.use(
    async function (config) {
      config.headers.Authorization = "Bearer " + token;
      return config;
    },
    function (error) {
      return Promise.reject(error); // Request error handling
    }
  );

  apiClient.interceptors.response.use(
    response => response,
    async function (error) {
      if (error.response?.status === 401) {
        console.log("Token expired or invalid. Refresh token if implemented.");
      } else if (error.response?.status === 429) {
        const retryAfter = error.response.headers["Retry-After"];
        console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
      }
      return Promise.reject(error);
    }
  );
};

export const fetchTopTracks = async (): Promise<string[]> => {
    const timeFrames = ['long_term', 'medium_term', 'short_term'];
    const randomTime = pickRandomNSongs(1, timeFrames)[0];
    const res = await apiClient.get(`me/top/tracks?time_range=${randomTime}&limit=50`);
    return res.data.items
};

export const fetchRecommendations = async (topTracks: any) => {
    let randomRes = pickRandomNSongs(5, topTracks)
    randomRes = randomRes.map((track: { id: string }) => track.id)
    const nTracks = getRandomNumberRange(4,7)
    const urilink = `recommendations?limit=${nTracks}&seed_tracks=${randomRes}`
    try{
      const res = await apiClient.get(urilink);
      const tracks = res.data.tracks;
      console.log(tracks)
      return tracks;
    } catch (error) {
      console.error(error)
      console.log(error)
    }
    
};

export const fetchAudioAnalysis = async (songList: any, allSongIds: string[]) => {
    const res = await apiClient.get(`audio-features?ids=${allSongIds.join(',')}`);
    const audioFeatures = res.data.audio_features;
    const openAiRes = getOpenAiText(songList);
    return openAiRes;
};

