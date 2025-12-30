import React, { useState, useEffect } from 'react';
import './App.css';
import Tournament from './Tournament';

function PlaylistDetail(props) {
    const { playlist, onBack } = props;
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('detail');

    useEffect(() => {
        async function getTracks() {
            try {
                const response = await fetch(`/auth/playlist/${playlist.id}/tracks`);
                const json = await response.json();
                setTracks(json);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des pistes:', error);
                setLoading(false);
            }
        }

        getTracks();
    }, [playlist.id]);

    if (mode === 'tournament') {
        return <Tournament playlist={playlist} tracks={tracks} onCancel={() => setMode('detail')} />;
    }

    return (
        <div className="App">
            <header className="App-header">
                <button className="back-button" onClick={onBack}>← Retour</button>
                
                <div className="playlist-detail-header">
                    <img 
                        src={playlist.images[0]?.url || 'https://via.placeholder.com/300'} 
                        alt={playlist.name} 
                        className="playlist-detail-image" 
                    />
                    <div className="playlist-detail-info">
                        <h1>{playlist.name}</h1>
                        <p className="playlist-owner">Par {playlist.owner.display_name}</p>
                        <p className="playlist-description">{playlist.description || 'Aucune description'}</p>
                        <p className="playlist-tracks-count">Total de pistes : {playlist.tracks.total}</p>
                    </div>
                </div>

                <div className="playlist-modes">
                    <button className="mode-button tournament-mode" onClick={() => setMode('tournament')}>Mode Tournoi</button>
                    <button className="mode-button linear-mode">Mode Linéaire</button>
                </div>

                <div className="tracks-container">
                    {loading ? (
                        <p>Chargement des pistes...</p>
                    ) : tracks.length > 0 ? (
                        <div className="tracks-list">
                            {tracks.map((track, index) => (
                                <div key={track.id || index} className="track-item">
                                    <span className="track-number">{index + 1}</span>
                                    <span className="track-name">{track.name}</span>
                                    <span className="track-artist">
                                        {track.artists?.map(artist => artist.name).join(', ') || 'Artiste inconnu'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Aucune piste trouvée.</p>
                    )}
                </div>
            </header>
        </div>
    );
}

export default PlaylistDetail;
