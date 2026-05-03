import { create } from 'zustand';

interface Track {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  queue: [],
  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
}));
