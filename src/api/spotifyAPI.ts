import axios from "axios";
import { getOpenAiText } from '../AudioAnalysis/OpenAi';
import { getRandomNumberRange, pickRandomNSongs } from '../utils/utils';
import { clusterSongs } from "../AudioAnalysis/clusterSongs";

// Update the base URL to point to your backend server
const backendBaseURL = "http://localhost:5000"; // Update to match your backend server's URL

const authEndpoint = "https://accounts.spotify.com/authorize?";
const clientId = import.meta.env.VITE_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const scopes = ["user-read-email", 
  "user-read-private", 
  "user-library-read", 
  "playlist-read-private", 
  "user-modify-playback-state",
  "user-read-playback-state",
   "user-top-read",
   "user-library-modify",
   "streaming"];

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

export const fetchRecommendations = async (topTracks: any, isTest) => {
  let clusters
  const nTracks = getRandomNumberRange(5,7)
  const urilink = `recommendations?limit=${nTracks}&seed_tracks=`

  if (isTest) {
    const testUri = `${urilink}${topTracks.join(',')}`
    const testRecs = await makeRecommendationsFetch(testUri)
    return testRecs
  }

  try{
    const res = await fetchAudioFeatures(topTracks)
    clusters = clusterSongs(res, 10)
    if(clusters.length > 5) clusters = clusters.slice(0, 5);
  } 
  catch(error) {
    clusters = pickRandomNSongs(5, topTracks)
    clusters = clusters.map((track: { id: string }) => track.id)
  }
  const recUri = `${urilink}${clusters}`
  const recs = await makeRecommendationsFetch(recUri)
  return recs
}

const makeRecommendationsFetch = async (urilink:string) => {
  try{
    const res = await apiClient.get(urilink);
    const tracks = res.data.tracks;
    // console.log(tracks)
    return tracks;
  } catch (error) {
    console.error(error)
    console.log(error)
  }
}

export const fetchAudioFeatures = async (songList: any) => {
  try {
    // Get the song IDs
    const allSongIds = songList.map((track: { id: any }) => track.id);

    // Fetch audio features from Spotify API
    const res = await apiClient.get(`audio-features?ids=${allSongIds.join(',')}`);
    const audioFeatures = res.data.audio_features;

    // Combine each song with its corresponding audio features
    const updatedSongList = songList.map((song: any, index: number) => {
      return {
        ...song,
        audioFeatures: audioFeatures[index],
        // genre: song.map(song => s)
      };
    });

    return updatedSongList;
  } catch (error) {
    console.error('Error fetching audio features:', error);
    throw error;
  }
};
