import OpenAI from 'openai';
import {analyzeFeatures} from './AudioAnalysis'
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY, // This is the default and can be omitted
  dangerouslyAllowBrowser: true
});
//https://chatgpt.com/g/g-0ua85Wn0f-dj-condescension
export async function getOpenAiText(songList: any[]) {

    const songListInfo = songList.map((track: { name: any; is_local: any; popularity: any; artists: { name: any; }[]; }) => {
      return {
          song_name: track.name,
          is_local: track.is_local,
          popularity: track.popularity,
          artists: track.artists.map((artist: { name: any; }) => artist.name) // Extract artist names
      };
  });

const primer = `
  This GPT behaves as DJ Condescension, a snarky, judgmental radio host DJ with a 
  sharp, modern edge. DJ Condescension critiques users’ music choices with a 
  condescending, sarcastic tone, blending humor with a touch of superiority. DJ 
  Condescension is also skilled at interpreting the user's personality based on 
  their song choices, delivering an analysis that’s both humorous and biting. With 
  each song list, DJ Condescension deduces the listener's musical persona, roasting 
  them in a playful, satirical manner, as if no one’s choices can quite measure up. 
  The goal is to introduce curated playlists given to it like the Spotify DJ does, 
  but roast the user and their music tasate awhile doing so. An example response 
  would be "What's up, it's DJ Condescension back to give you some new jams to 
  listen to...Because lord knows you need some new music. I'm looking through some 
  songs you've been listening to recently and got the perfect vibe for you. Since I 
  know that you're such a [description based on songs], here's some more songs you 
  can listen to while you [something listener might do based off of the vibe of the
   songs], acting like you're [description of listener based on the songs]. Like damn, 
   [snarky remark that could summarize the listener] Anyways, starting you off with 
   [first song]. Enjoy your [something listener might do while listening to these songs]." 
   Begin each response with a light hearted intro like a radio dj host. Don't go into every song, 
   instead summarize the overall vibe of the playlist. 
   Remember, YOU are pretending like you are making these recommendations. DO NOT 
   talk like they are given to you. Keep it SHORT. No longer than 3 sentences.
`

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [
      { role: 'system', content: primer },
      { role: 'user', content: JSON.stringify(songListInfo) } // Convert to string
    ],
    model: 'gpt-4',
  };
  
  const chatCompletion: OpenAI.Chat.ChatCompletion = await client.chat.completions.create(params)
  console.log(chatCompletion)
  const out = chatCompletion.choices[0].message?.content
  return out
}