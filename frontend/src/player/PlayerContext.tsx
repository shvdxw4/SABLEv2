import { createContext, useContext, useRef, useState } from "react";
import { fetchTrackStreamUrl } from "../api/tracks";

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

    queue: PlayerTrack[];
    currentIndex: number;

    currentTime: number;
    duration: number;

    playTrack: (track: PlayerTrack, url: string) => void;
    setQueueFromTracks: (tracks: PlayerTrack[], startIndex: number) => void;
    playNext: () => Promise<void>;
    playPrevious: () => Promise<void>;
    togglePlay: () => Promise<void>;

    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    setDurationFromAudio: () => void;
    setCurrentTimeFromAudio: () => void;
    seekTo: (time: number) => void;
    handleEnded: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recentTracks, setRecentTracks] = useState<PlayerTrack[]>([]);

    const [queue, setQueue] = useState<PlayerTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    function playTrack(track: PlayerTrack, url: string) {
        const newTrack = {
            ...track,
            streamUrl: url,
            artist: track.artist ?? "SABLE Sessions",
        };

        setCurrentTrack(newTrack);
        setIsPlaying(true);
        setCurrentTime(0);
        setDuration(0);

        setRecentTracks((prev) => {
            const filtered = prev.filter((t) => t.id !== track.id);
            return [newTrack, ...filtered].slice(0, 10);
        });
    }

    function setQueueFromTracks(tracks: PlayerTrack[], startIndex: number) {
        setQueue(tracks);
        setCurrentIndex(startIndex);
    }

    async function playNext() {
        if (queue.length === 0) return;

        const nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
            setIsPlaying(false);
            return;
        }

        const nextTrack = queue[nextIndex];

        try {
            const url = await fetchTrackStreamUrl(nextTrack.id);
            playTrack(nextTrack, url);
            setCurrentIndex(nextIndex);
        } catch (err) {
            console.error("Failed to play next track", err);
        }
    }

    async function playPrevious() {
        if (queue.length === 0) return;

        const previousIndex = currentIndex - 1;
        if (previousIndex < 0) return;

        const previousTrack = queue[previousIndex];

        try {
            const url = await fetchTrackStreamUrl(previousTrack.id);
            playTrack(previousTrack, url);
            setCurrentIndex(previousIndex);
        } catch (err) {
            console.error("Failed to play previous track", err);
        }
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

    function setDurationFromAudio() {
        const audio = audioRef.current;
        if (!audio) return;
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    }

    function setCurrentTimeFromAudio() {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
    }

    function seekTo(time: number) {
        const audio = audioRef.current;
        if (!audio) return;

        const safeTime = Math.max(0, Math.min(time, duration || 0));
        audio.currentTime = safeTime;
        setCurrentTime(safeTime);
    }

    async function handleEnded() {
        setIsPlaying(false);
        await playNext();
    }

    return (
        <PlayerContext.Provider
            value={{
                currentTrack,
                recentTracks,
                isPlaying,
                audioRef,
                queue,
                currentIndex,
                currentTime,
                duration,
                playTrack,
                setQueueFromTracks,
                playNext,
                playPrevious,
                togglePlay,
                setIsPlaying,
                setDurationFromAudio,
                setCurrentTimeFromAudio,
                seekTo,
                handleEnded,
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
