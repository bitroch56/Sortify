import React, { useState, useEffect } from 'react';
import PlaylistDetail from './PlaylistDetail';
import './App.css';

function UserDisplay(props) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    useEffect(() => {
        async function getPlaylists() {
            const response = await fetch('/auth/playlists');
            const json = await response.json();
            setPlaylists(json);
            setLoading(false);
        }

        getPlaylists();
    }, []);

    if (selectedPlaylist) {
        return <PlaylistDetail playlist={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} />;
    }

    const handlePlaylistClick = (playlist) => {
        setSelectedPlaylist(playlist);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Bienvenue, {props.userName} !</h1>
                <p>Vous êtes maintenant connecté à Spotify.</p>
                <h2 className="section-title">Vos Playlists</h2>
                <div className="playlists-container">
                    {loading ? (
                        <p>Chargement des playlists...</p>
                    ) : playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <div 
                                key={playlist.id} 
                                className="playlist-card"
                                onClick={() => handlePlaylistClick(playlist)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img 
                                    src={playlist.images[0]?.url || 'https://via.placeholder.com/150'} 
                                    alt={playlist.name} 
                                    className="playlist-image" 
                                />
                                <div className="playlist-info">
                                    <p className="playlist-name">{playlist.name}</p>
                                    <p className="playlist-tracks">Total de pistes : {playlist.tracks.total}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Aucune playlist trouvée.</p>
                    )}
                </div>
            </header>
        </div>
    );
}

export default UserDisplay;