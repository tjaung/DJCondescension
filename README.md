# DJ Condescension - Your Personalized Music Experience

Welcome to **DJ Condescension**, a Spotify-powered application that serves you the best tracks based on your music taste—with a twist. Unlike other playlists, our sarcastic DJ gives you a personalized, condescending analysis of your musical choices. Ready to hear what you don't want to hear about yourself?

## Features
- **Personalized Music Recommendations**: Uses your Spotify history to provide tailored song recommendations.
- **Judgemental DJ Commentary**: Your musical tastes analyzed and critiqued with condescending commentary.
- **Full Integration with Spotify**: Login with your Spotify premium account and enjoy seamless audio playback.
- **Custom Visualizer**: Enjoy a dynamic music visualizer while listening to your favorite tracks.

## Getting Started

If you want to run **DJ Condescension** locally:

### Prerequisites
- Node.js (v16+)
- npm (v7+) or Yarn
- [Spotify Premium Account](https://www.spotify.com/us/premium/)
- [Open AI api key](https://openai.com/index/openai-api/)
- [Eleven Labs api key](https://elevenlabs.io/docs/product/introduction)
- [Server Repo](https://github.com/tjaung/DJCondescension_server/tree/main)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-github-profile/dj-condescension.git
   ```

2. Navigate to the project directory:
   ```bash
   cd dj-condescension
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory to store your environment variables. Include the following:
   ```env
   VITE_CLIENT_ID=your_spotify_client_id
   VITE_CLIENT_SECRET=your_spotify_client_secret
   VITE_REDIRECT_URI=http://localhost:3000/callback
   VITE_OPENAI_KEY=your_openai_api_key
   VITE_ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
   ```

### Running the Application
To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5172`.

### Running Tests
To run the test suite, use: tests depreciated

## Directory Structure
- **src/**: Contains all the main source code for the app, including components, utilities, and API calls.
- **tests/**: depreciated
- **public/**: Static files such as index.html and images.

## Key Technologies
- **React**: Frontend framework for building UI components.
- **Spotify Web API**: Used to fetch user data, song recommendations, and control playback.
- **OpenAI API**: Provides scripts for dj commentary based on your music tastes.
- **Tailwind CSS**: CSS framework used for responsive UI design.

## Contributing
Feel free to contribute! Please create a new branch for your feature or bug fix, and submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- **Spotify** for providing the API and resources.
- **OpenAI** for providing the analysis and text generation features.
- **ElevenLabs** for providing the ai voice readings

## Contact
If you have any questions or suggestions, please feel free to open an issue or reach out to me on [GitHub](https://github.com/tjaung).

**Happy Listening!**
