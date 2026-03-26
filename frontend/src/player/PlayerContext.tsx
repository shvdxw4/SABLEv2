import { createContext, useContext, useRef, useState } from "react";

export type PlayerTrack = {
    id: number;
    title: string;
    tier: string;
    artist?: string;
    streamUrl?: string;
};

type PlayerContextType = {
    currentTrack: PlayerTrack | null;
    recentTracks: PlayerTrack[];
    isPlaying: boolean;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playTrack: (track: PlayerTrack, url: string) => void;
    togglePlay: () => Promise<void>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recentTracks, setRecentTracks] = useState<PlayerTrack[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    function playTrack(track: PlayerTrack, url: string) {
        const newTrack = {
            ...track,
            streamUrl: url,
            artist: track.artist ?? "SABLE Sessions",
        };
        setCurrentTrack(newTrack);
        setIsPlaying(true);

        setRecentTracks((prev) => {
            const filtered = prev.filter((t) => t.id !== track.id);
            return [newTrack, ...filtered].slice(0, 10);
        })

        // audio element updates after render, so play happens via autoPlay
    }

    async function togglePlay() {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Error playing audio:", error);
            }
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    }

    return (
        <PlayerContext.Provider
            value={{
                currentTrack,
                isPlaying,
                audioRef,
                playTrack,
                togglePlay,
                setIsPlaying,
                recentTracks,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const ctx = useContext(PlayerContext);
    if (!ctx) {
        throw new Error("usePlayer must be used inside PlayerProvider");
    }
    return ctx;
}