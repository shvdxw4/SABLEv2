import { createContext, useContext, useState } from "react";

type LibraryContextType = {
    savedTrackIds: number[];
    isSaved: (trackId: number) => boolean;
    toggleSavedTrack: (trackId: number) => void;
};

const LibraryContext = createContext<LibraryContextType | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [savedTrackIds, setSavedTrackIds] = useState<number[]>([]);

    function isSaved(trackId: number) {
        return savedTrackIds.includes(trackId);
    }

    function toggleSavedTrack(trackId: number) {
        setSavedTrackIds((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    }

    return (
        <LibraryContext.Provider
            value={{
                savedTrackIds,
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