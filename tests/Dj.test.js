import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dj from '../src/Dj/Dj';
import { fetchTopTracks, fetchAudioFeatures, fetchRecommendations } from '../src/api/spotifyAPI';
import { generateTextToSpeech } from '../src/api/generatetts';
import { getOpenAiText } from '../src/AudioAnalysis/OpenAi';

jest.mock('../src/api/spotifyAPI');
jest.mock('../src/api/generatetts');
jest.mock('../src/AudioAnalysis/OpenAi');


const mockToken = 'mockToken';

const mockSetToken = jest.fn();

// Mock the CustomSpotifyPlayer and Visualizer components
jest.mock('../src/Dj/SpotifyPlayer', () => () => <div>Custom Spotify Player Mock</div>);
jest.mock('../src/Visualizer/Visualizer', () => () => <div>Visualizer Mock</div>);

describe('Dj Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Start DJ Session button when session is not started', () => {
    render(<Dj token={mockToken} setToken={mockSetToken} />);

    expect(screen.getByText('Start DJ Session')).toBeInTheDocument();
  });

  it('starts session when Start DJ Session button is clicked', async () => {
    render(<Dj token={mockToken} setToken={mockSetToken} />);

    const startButton = screen.getByText('Start DJ Session');
    fireEvent.click(startButton);

    expect(await screen.findByText('Analyzing...')).toBeInTheDocument();
  });

  it('logs out correctly when Log out button is clicked', () => {
    render(<Dj token={mockToken} setToken={mockSetToken} />);

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(mockSetToken).toHaveBeenCalledWith('');
    expect(window.localStorage.clear).toHaveBeenCalledTimes(1);
  });

  it('renders CustomSpotifyPlayer after recommendations are fetched', async () => {
    // Mock the API functions
    fetchTopTracks.mockResolvedValue(['track1', 'track2']);
    fetchRecommendations.mockResolvedValue([{ uri: 'uri1' }, { uri: 'uri2' }]);
    fetchAudioFeatures.mockResolvedValue([{ uri: 'uri1', name: 'Track 1', artist: 'Artist 1', albumArt: 'Art1', audioFeatures: { tempo: 120, energy: 0.8 } }]);
    getOpenAiText.mockResolvedValue('Test script');
    generateTextToSpeech.mockResolvedValue('audio_url');

    render(<Dj token={mockToken} setToken={mockSetToken} />);

    const startButton = screen.getByText('Start DJ Session');
    fireEvent.click(startButton);

    // Wait for the CustomSpotifyPlayer to appear
    expect(await screen.findByText('Custom Spotify Player Mock')).toBeInTheDocument();
  });

  it('displays Visualizer component when session is started', async () => {
    render(<Dj token={mockToken} setToken={mockSetToken} />);

    const startButton = screen.getByText('Start DJ Session');
    fireEvent.click(startButton);

    // Wait for the Visualizer component to appear
    expect(await screen.findByText('Visualizer Mock')).toBeInTheDocument();
  });
});
