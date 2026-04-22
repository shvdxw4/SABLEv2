import { createContext, useContext, useState } from "react";

export type SavedTrack = {
    id: number;
    title: string;
    tier: string;
    artist?: string;
    artwork_url?: string | null;
};

type LibraryContextType = {
    savedTracks: SavedTrack[];
    isSaved: (trackId: number) => boolean;
    toggleSavedTrack: (track: SavedTrack) => void;
};

const LibraryContext = createContext<LibraryContextType | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);

    function isSaved(trackId: number) {
        return savedTracks.some((track) => track.id === trackId);
    }

    function toggleSavedTrack(track: SavedTrack) {
        setSavedTracks((prev) =>
            prev.some((t) => t.id === track.id)
                ? prev.filter((t) => t.id !== track.id)
                : [track, ...prev]
        );
    }

    return (
        <LibraryContext.Provider
            value={{
                savedTracks,
                isSaved,
                toggleSavedTrack,
            }}
        >
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const ctx = useContext(LibraryContext);
    if (!ctx) {
        throw new Error("useLibrary must be used inside LibraryProvider");
    }
    return ctx;
}