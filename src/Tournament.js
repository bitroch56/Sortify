import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import WebPlayback from './WebPlayback';

function Tournament({ playlist, tracks: initialTracks, onCancel }) {
    const [remaining, setRemaining] = useState([...initialTracks]);
    const [sorted, setSorted] = useState([]);
    const [candidate, setCandidate] = useState(null);
    const [low, setLow] = useState(0);
    const [high, setHigh] = useState(0);
    const [mid, setMid] = useState(null);
    const [finished, setFinished] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createdPlaylist, setCreatedPlaylist] = useState(null);

    const leftAudioRef = useRef(null);
    const rightAudioRef = useRef(null);
    const leftTimeoutRef = useRef(null);
    const rightTimeoutRef = useRef(null);
    const sdkTimeoutRef = useRef(null);
    const tokenRef = useRef(null);
    const leftLoadedHandlerRef = useRef(null);
    const rightLoadedHandlerRef = useRef(null);

    const onLeftPlay = () => {
        if (rightAudioRef.current && !rightAudioRef.current.paused) rightAudioRef.current.pause();
        if (rightTimeoutRef.current) { clearTimeout(rightTimeoutRef.current); rightTimeoutRef.current = null; }
        if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
        leftTimeoutRef.current = setTimeout(() => {
            if (leftAudioRef.current && !leftAudioRef.current.paused) leftAudioRef.current.pause();
            leftTimeoutRef.current = null;
        }, 30000);
    };
    const onRightPlay = () => {
        if (leftAudioRef.current && !leftAudioRef.current.paused) leftAudioRef.current.pause();
        if (leftTimeoutRef.current) { clearTimeout(leftTimeoutRef.current); leftTimeoutRef.current = null; }
        if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
        rightTimeoutRef.current = setTimeout(() => {
            if (rightAudioRef.current && !rightAudioRef.current.paused) rightAudioRef.current.pause();
            rightTimeoutRef.current = null;
        }, 30000);
    };

    const onLeftPauseOrEnd = () => {
        if (leftTimeoutRef.current) { clearTimeout(leftTimeoutRef.current); leftTimeoutRef.current = null; }
    };
    const onRightPauseOrEnd = () => {
        if (rightTimeoutRef.current) { clearTimeout(rightTimeoutRef.current); rightTimeoutRef.current = null; }
    };

    const [sdkPlaying, setSdkPlaying] = useState(null);
    const [showWebPlayback, setShowWebPlayback] = useState(false);
    const [webPlaybackToken, setWebPlaybackToken] = useState(null);

    const getTokenCached = async () => {
        if (tokenRef.current) return tokenRef.current;
        const resp = await fetch('/auth/token');
        const json = await resp.json();
        tokenRef.current = json.access_token;
        return tokenRef.current;
    };

    const playViaSDK = async (track, offsetMs = 0) => {
        try { if (leftAudioRef.current && !leftAudioRef.current.paused) leftAudioRef.current.pause(); } catch(e){}
        try { if (rightAudioRef.current && !rightAudioRef.current.paused) rightAudioRef.current.pause(); } catch(e){}

        const deviceId = window.spotify_device_id;
        if (!deviceId) {
            alert('Web Playback device not ready. Activez le player dans la page WebPlayback.');
            return;
        }

        const token = await getTokenCached();
        if (!token) {
            alert('Token Spotify introuvable. Reconnectez-vous.');
            return;
        }

        const uri = track.uri || `spotify:track:${track.id}`;

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [uri], position_ms: offsetMs })
        });

        setSdkPlaying(track.id || uri);

        const t = setTimeout(async () => {
            await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSdkPlaying(null);
            if (sdkTimeoutRef.current) { clearTimeout(sdkTimeoutRef.current); sdkTimeoutRef.current = null; }
        }, 30000);

        if (leftTimeoutRef.current) { clearTimeout(leftTimeoutRef.current); leftTimeoutRef.current = null; }
        if (rightTimeoutRef.current) { clearTimeout(rightTimeoutRef.current); rightTimeoutRef.current = null; }
        if (sdkTimeoutRef.current) { clearTimeout(sdkTimeoutRef.current); sdkTimeoutRef.current = null; }
        sdkTimeoutRef.current = t;
    };

    const pauseSdk = async () => {
        try {
            const deviceId = window.spotify_device_id;
            if (!deviceId) return;
            const token = await getTokenCached();
            if (!token) return;
            await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Failed to pause SDK', e);
        } finally {
            setSdkPlaying(null);
            if (leftTimeoutRef.current) { clearTimeout(leftTimeoutRef.current); leftTimeoutRef.current = null; }
            if (rightTimeoutRef.current) { clearTimeout(rightTimeoutRef.current); rightTimeoutRef.current = null; }
            if (sdkTimeoutRef.current) { clearTimeout(sdkTimeoutRef.current); sdkTimeoutRef.current = null; }
        }
    };

    const ensureWebPlaybackReady = () => {
        const deviceId = window.spotify_device_id;
        if (!deviceId) {
            showWebPlaybackInline();
            return false;
        }
        return true;
    };

    const showWebPlaybackInline = async () => {
        try {
            const token = await getTokenCached();
            if (!token) {
                alert('Token Spotify introuvable. Reconnectez-vous.');
                return;
            }
            setWebPlaybackToken(token);
            setShowWebPlayback(true);
            setTimeout(() => {
                const el = document.querySelector('.webplayback-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } catch (e) {
            console.error('Failed to fetch token for WebPlayback', e);
        }
    };

    const playPreview = async (side, track) => {
        const audioRef = side === 'left' ? leftAudioRef : rightAudioRef;
        const otherAudioRef = side === 'left' ? rightAudioRef : leftAudioRef;
        try { if (otherAudioRef.current && !otherAudioRef.current.paused) otherAudioRef.current.pause(); } catch (e) {}
        try { await pauseSdk(); } catch (e) {}

        if (!track) return;
        const randomOffsetForPreview = (durationSec) => {
            const lower = 10;
            const upper = Math.max(lower, Math.floor(durationSec - 20));
            if (upper <= lower) return lower;
            return lower + Math.random() * (upper - lower);
        };

        const randomOffsetForTrack = (durationMs) => {
            const lowerMs = 10000;
            const upperMs = Math.max(lowerMs, durationMs - 20000);
            if (upperMs <= lowerMs) return lowerMs;
            return Math.floor(lowerMs + Math.random() * (upperMs - lowerMs));
        };

        if (track.preview_url) {
            if (audioRef.current) {
                const prev = side === 'left' ? leftLoadedHandlerRef.current : rightLoadedHandlerRef.current;
                if (prev && audioRef.current) {
                    try { audioRef.current.removeEventListener('loadedmetadata', prev); } catch (e) {}
                }

                audioRef.current.src = track.preview_url;
                const onLoaded = async () => {
                    try {
                        const duration = audioRef.current.duration || 30;
                        const offsetSec = randomOffsetForPreview(duration);
                        audioRef.current.currentTime = offsetSec;
                        try { await audioRef.current.play(); } catch (e) { console.error(e); }
                        if (side === 'left') onLeftPlay(); else onRightPlay();
                    } catch (e) {
                        console.error('Error during preview playback', e);
                    } finally {
                        try { audioRef.current.removeEventListener('loadedmetadata', onLoaded); } catch (e) {}
                        if (side === 'left') leftLoadedHandlerRef.current = null; else rightLoadedHandlerRef.current = null;
                    }
                };
                if (side === 'left') leftLoadedHandlerRef.current = onLoaded; else rightLoadedHandlerRef.current = onLoaded;
                audioRef.current.addEventListener('loadedmetadata', onLoaded);
                if (audioRef.current.readyState >= 1) onLoaded();
            }
        } else {
            const durMs = track.duration_ms || 30000;
            const offsetMs = randomOffsetForTrack(durMs);
            await playViaSDK(track, offsetMs);
        }
    };

    const pausePreview = (side) => {
        const audioRef = side === 'left' ? leftAudioRef : rightAudioRef;
        if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
        if (sdkPlaying) pauseSdk();
    };

    useEffect(() => {
        if (candidate === null) {
            if (sorted.length === 0 && remaining.length >= 2) {
                setSorted([remaining[0]]);
                const next = remaining[1];
                setRemaining(r => r.slice(2));
                setCandidate(next);
                setLow(0);
                setHigh(0);
                setMid(0);
            } else if (remaining.length > 0) {
                const next = remaining[0];
                setRemaining(r => r.slice(1));
                setCandidate(next);
                setLow(0);
                setHigh(sorted.length - 1);
                setMid(sorted.length > 0 ? Math.floor((0 + sorted.length - 1) / 2) : null);
            }
        }

        if (remaining.length === 0 && candidate === null && sorted.length > 0) {
            setFinished(true);
        }
    }, [remaining, candidate, sorted]);

    useEffect(() => {
        return () => {
            try { if (leftAudioRef.current && !leftAudioRef.current.paused) leftAudioRef.current.pause(); } catch (e) {}
            try { if (rightAudioRef.current && !rightAudioRef.current.paused) rightAudioRef.current.pause(); } catch (e) {}
            if (leftTimeoutRef.current) { clearTimeout(leftTimeoutRef.current); leftTimeoutRef.current = null; }
            if (rightTimeoutRef.current) { clearTimeout(rightTimeoutRef.current); rightTimeoutRef.current = null; }
            if (sdkTimeoutRef.current) { clearTimeout(sdkTimeoutRef.current); sdkTimeoutRef.current = null; }
            try { if (leftLoadedHandlerRef.current && leftAudioRef.current) leftAudioRef.current.removeEventListener('loadedmetadata', leftLoadedHandlerRef.current); } catch (e) {}
            try { if (rightLoadedHandlerRef.current && rightAudioRef.current) rightAudioRef.current.removeEventListener('loadedmetadata', rightLoadedHandlerRef.current); } catch (e) {}
            try { if (window.spotify_device_id) { getTokenCached().then(t => { if (t) fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${window.spotify_device_id}`, { method:'PUT', headers:{ 'Authorization': `Bearer ${t}` } }); }); } } catch (e) {}
        };
    }, []);

    const makeNextCandidate = () => {
        if (remaining.length > 0) {
            const next = remaining[0];
            setRemaining(r => r.slice(1));
            setCandidate(next);
            setLow(0);
            setHigh(sorted.length - 1);
            setMid(sorted.length > 0 ? Math.floor((0 + sorted.length - 1) / 2) : null);
        } else {
            setCandidate(null);
            if (sorted.length > 0) setFinished(true);
        }
    };

    const insertCandidateAt = (index) => {
        const newSorted = [...sorted];
        newSorted.splice(index, 0, candidate);
        setSorted(newSorted);
        setCandidate(null);
        setTimeout(makeNextCandidate, 50);
    };

    const handleChoice = (preference) => {
        if (sorted.length === 0) {
            setSorted([candidate]);
            setCandidate(null);
            setTimeout(makeNextCandidate, 50);
            return;
        }

        if (low > high) {
            insertCandidateAt(low);
            return;
        }

        const currentMid = mid !== null ? mid : Math.floor((low + high) / 2);
        const midItem = sorted[currentMid];

        if (preference === 'candidate') {
            const newLow = low;
            const newHigh = currentMid - 1;
            setLow(newLow);
            setHigh(newHigh);
            if (newLow > newHigh) {
                insertCandidateAt(newLow);
            } else {
                setMid(Math.floor((newLow + newHigh) / 2));
            }
        } else {
            const newLow = currentMid + 1;
            const newHigh = high;
            setLow(newLow);
            setHigh(newHigh);
            if (newLow > newHigh) {
                insertCandidateAt(newLow);
            } else {
                setMid(Math.floor((newLow + newHigh) / 2));
            }
        }
    };

    const handleCreatePlaylist = async () => {
        setCreating(true);
        try {
            const uris = sorted.map(t => t.uri).filter(Boolean);
            const name = `${playlist.name}_SORTIFIED`;
            const resp = await fetch('/auth/create_playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: `Sortified from ${playlist.name}`, uris })
            });
            const json = await resp.json();
            setCreatedPlaylist(json.playlist || null);
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    if (finished && !creating && !createdPlaylist) {
        return (
            <div className="App">
                <header className="App-header">
                    <button className="back-button" onClick={onCancel}>← Retour</button>
                    <h2>Résultat du tri pour {playlist.name}</h2>
                    <div className="tracks-list">
                        {sorted.map((t, i) => (
                            <div key={t.id || i} className="track-item">
                                <span className="track-number">{i + 1}</span>
                                <span className="track-name">{t.name}</span>
                                <span className="track-artist">{t.artists?.map(a=>a.name).join(', ')}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{marginTop:16}}>
                        <button className="mode-button tournament-mode" onClick={handleCreatePlaylist}>Créer la playlist {playlist.name}_SORTIFIED</button>
                    </div>
                </header>
            </div>
        );
    }

    if (createdPlaylist) {
        return (
            <div className="App">
                <header className="App-header">
                    <h2>Playlist créée</h2>
                    <p>Nom: {createdPlaylist.name}</p>
                    <p>Voir sur Spotify: <a href={createdPlaylist.external_urls?.spotify} target="_blank" rel="noreferrer">Ouvrir</a></p>
                    <button className="back-button" onClick={onCancel}>Terminer</button>
                </header>
            </div>
        );
    }

    const currentMidIndex = (sorted.length > 0 && mid !== null) ? mid : (sorted.length > 0 ? Math.floor((low + high) / 2) : null);
    const midItem = currentMidIndex !== null ? sorted[currentMidIndex] : null;

    return (
        <div className="App">
            <header className="App-header tournament-split">
                <button className="back-button" onClick={onCancel}>← Annuler</button>
                <h2>Mode Tournoi: {playlist.name}</h2>

                {candidate ? (
                    <div>
                        <p>Choisissez votre morceau préféré :</p>
                        <div className="tournament-split-container">
                            <div className="tournament-side left">
                                <div className="player-card">
                                    <div className="player-info">
                                        <div className="player-title">{candidate.name}</div>
                                        <div className="player-artist">{candidate.artists?.map(a=>a.name).join(', ')}</div>
                                        <div className="player-album">{candidate.album?.name}</div>
                                    </div>
                                    <div>
                                        <button
                                            className={`play-button ${candidate.preview_url ? '' : 'secondary'}`}
                                            onClick={async () => {
                                                if (candidate.preview_url) {
                                                    if (leftAudioRef.current && !leftAudioRef.current.paused) pausePreview('left');
                                                    else await playPreview('left', candidate);
                                                } else {
                                                    if (sdkPlaying && (sdkPlaying === candidate.id || sdkPlaying === candidate.uri)) {
                                                        await pauseSdk();
                                                    } else {
                                                        if (!ensureWebPlaybackReady()) return;
                                                        const durMs = candidate.duration_ms || 30000;
                                                        const lowerMs = 10000;
                                                        const upperMs = Math.max(lowerMs, durMs - 20000);
                                                        let offsetMs = lowerMs;
                                                        if (upperMs > lowerMs) offsetMs = Math.floor(lowerMs + Math.random() * (upperMs - lowerMs));
                                                        await playViaSDK(candidate, offsetMs);
                                                    }
                                                }
                                            }}
                                        >
                                            { (leftAudioRef.current && !leftAudioRef.current.paused) || (sdkPlaying && (sdkPlaying === candidate.id || sdkPlaying === candidate.uri)) ? 'Pause' : 'Play' }
                                        </button>
                                    </div>
                                    <audio className="hidden-audio" ref={leftAudioRef} src={candidate.preview_url || ''} onPlay={onLeftPlay} onPause={onLeftPauseOrEnd} onEnded={onLeftPauseOrEnd} />
                                </div>
                                <button className="choose-button" onClick={() => handleChoice('candidate')}>Choisir</button>
                            </div>

                            <div className="tournament-vs">vs</div>

                            <div className="tournament-side right">
                                {midItem ? (
                                    <>
                                        <div className="player-card">
                                            <div className="player-info">
                                                <div className="player-title">{midItem.name}</div>
                                                <div className="player-artist">{midItem.artists?.map(a=>a.name).join(', ')}</div>
                                                <div className="player-album">{midItem.album?.name}</div>
                                            </div>
                                            <div>
                                                <button
                                                    className={`play-button ${midItem.preview_url ? '' : 'secondary'}`}
                                                    onClick={async () => {
                                                        if (midItem.preview_url) {
                                                            if (rightAudioRef.current && !rightAudioRef.current.paused) pausePreview('right');
                                                            else await playPreview('right', midItem);
                                                        } else {
                                                            if (sdkPlaying && (sdkPlaying === midItem.id || sdkPlaying === midItem.uri)) {
                                                                await pauseSdk();
                                                            } else {
                                                                if (!ensureWebPlaybackReady()) return;
                                                                const durMs = midItem.duration_ms || 30000;
                                                                const lowerMs = 10000;
                                                                const upperMs = Math.max(lowerMs, durMs - 20000);
                                                                let offsetMs = lowerMs;
                                                                if (upperMs > lowerMs) offsetMs = Math.floor(lowerMs + Math.random() * (upperMs - lowerMs));
                                                                await playViaSDK(midItem, offsetMs);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    { (rightAudioRef.current && !rightAudioRef.current.paused) || (sdkPlaying && (sdkPlaying === midItem.id || sdkPlaying === midItem.uri)) ? 'Pause' : 'Play' }
                                                </button>
                                            </div>
                                            <audio className="hidden-audio" ref={rightAudioRef} src={midItem.preview_url || ''} onPlay={onRightPlay} onPause={onRightPauseOrEnd} onEnded={onRightPauseOrEnd} />
                                        </div>
                                        <button className="choose-button" onClick={() => handleChoice('mid')}>Choisir</button>
                                    </>
                                ) : (
                                    <p>Aucun morceau de comparaison disponible</p>
                                )}
                            </div>
                        </div>

                        <p>Progression: {sorted.length} triés, {remaining.length + (candidate ? 1 : 0)} restants</p>
                    </div>
                ) : (
                    <p>Initialisation...</p>
                )}
                {/* Inline WebPlayback (hidden until needed) */}
                <div className="webplayback-anchor" style={{marginTop:20}}>
                    {showWebPlayback && webPlaybackToken ? (
                        <div style={{width:'100%', maxWidth:800, margin:'20px auto'}}>
                            <WebPlayback token={webPlaybackToken} />
                        </div>
                    ) : null}
                </div>
            </header>
        </div>
    );
}

export default Tournament;
