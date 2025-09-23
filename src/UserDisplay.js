import React, { useState, useEffect } from 'react';
import './App.css';

function UserDisplay(props) {
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        async function getPlaylists() {
            const response = await fetch('/auth/playlists');
            const json = await response.json();
            setPlaylists(json);
        }

        getPlaylists();
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Bienvenue, {props.userName} !</h1>
                <p>Vous êtes maintenant connecté à Spotify.</p>
                <h2>Vos Playlists</h2>
                <div className="playlists-container">
                    {playlists.length > 0 ? (
                        <ul>
                            {playlists.map((playlist) => (
                                <li key={playlist.id}>
                                    <img src={playlist.images[0]?.url} alt={playlist.name} style={{ width: '50px', height: '50px' }} />
                                    <span>{playlist.name}</span>
                                    <p>Total de pistes : {playlist.tracks.total}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune playlist trouvée.</p>
                    )}
                </div>
            </header>
        </div>
    );
}

export default UserDisplay;