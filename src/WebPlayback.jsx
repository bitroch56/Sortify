import React, { useState, useEffect } from 'react';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
};

function WebPlayback(props) {
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);

    useEffect(() => {
        let scriptAdded = false;
        const setupPlayer = () => {
            if (!window.Spotify) return;
            const p = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

            setPlayer(p);

            p.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                window.spotify_device_id = device_id;
                window.spotify_player = p;
            });

            p.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            p.addListener('player_state_changed', (state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
                setPaused(state.paused);
                p.getCurrentState().then(st => setActive(!!st));
            }));

            p.connect();
        };

        if (!window.Spotify) {
            const existing = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
            if (!existing) {
                const script = document.createElement("script");
                script.src = "https://sdk.scdn.co/spotify-player.js";
                script.async = true;
                document.body.appendChild(script);
                scriptAdded = true;
            }

            window.onSpotifyWebPlaybackSDKReady = () => {
                setupPlayer();
            };
        } else {
            setupPlayer();
        }

        return () => {
            try {
                if (player && player.disconnect) player.disconnect();
            } catch (e) {}
            try { if (window.spotify_player === player) window.spotify_player = undefined; } catch (e) {}
            try { if (window.spotify_device_id && !window.spotify_player) window.spotify_device_id = undefined; } catch (e) {}
            try { window.onSpotifyWebPlaybackSDKReady = null; } catch (e) {}
            if (scriptAdded) {
                const s = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
                if (s && s.parentNode) s.parentNode.removeChild(s);
            }
        };
    }, [props.token]);

    if (!is_active) {
        return (
            <div className="webplayback-player">
                <div className="container">
                    <div className="main-wrapper">
                        <b>Instance inactive :</b> Veuillez transférer la lecture sur cet appareil depuis l'application Spotify.
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="webplayback-player">
                <div className="container">
                    <div className="main-wrapper">
                        <img src={current_track.album.images[0].url} 
                             className="now-playing__cover" alt="" />
                        <div className="now-playing__side">
                            <div className="now-playing__name">
                                {current_track.name}
                            </div>
                            <div className="now-playing__artist">
                                {current_track.artists[0].name}
                            </div>
                            <div className="controls">
                                <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
                                    &lt;&lt;
                                </button>
                                <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                                    {is_paused ? "PLAY" : "PAUSE"}
                                </button>
                                <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
                                    &gt;&gt;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default WebPlayback;