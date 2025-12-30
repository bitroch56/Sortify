const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const request = require('request');

const port = 5000;

dotenv.config();

var spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
var spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var spotify_redirect_uri = 'http://127.0.0.1:5000/auth/callback';

var access_token = '';
var refresh_token = '';

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var app = express();

app.use(express.json());

// Permet au serveur de servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../build')));

// Endpoint de connexion qui redirige vers l'API d'autorisation de Spotify
app.get('/auth/login', (req, res) => {
    var scope = "streaming user-read-email user-read-private user-read-playback-state playlist-read-private playlist-read-collaborative";
    var state = generateRandomString(16);

    var auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: spotify_redirect_uri,
        state: state
    });

    res.redirect('https://accounts.spotify.com/authorize?' + auth_query_parameters.toString());
});

// Endpoint de callback qui reçoit le code d'autorisation de Spotify
app.get('/auth/callback', (req, res) => {
    var code = req.query.code;

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: spotify_redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            refresh_token = body.refresh_token;

            var userOptions = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };

            // Requête pour obtenir le nom de l'utilisateur
            request.get(userOptions, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    const user_name = body.display_name;
                    // Redirection vers le frontend avec le nom de l'utilisateur dans le hash
                    res.redirect(`http://127.0.0.1:5000/#user_name=${encodeURIComponent(user_name)}`);
                } else {
                    res.redirect('/#error=user_info_failed');
                }
            });
        } else {
            res.redirect('/#error=invalid_token');
        }
    });
});

// Endpoint pour récupérer le jeton d'accès (utile pour la persistance de session)
app.get('/auth/token', (req, res) => {
    res.json({
        access_token: access_token
    });
});

app.get('/auth/playlists', (req, res) => {
    var playlistsOptions = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };

    request.get(playlistsOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            res.json(body.items);
        } else {
            res.status(response.statusCode).send(error);
        }
    });
});

// Démarrage du serveur sur le port spécifié
app.listen(port, () => {
    console.log(`Listening at http://127.0.0.1:${port}`);
});

app.get('/auth/playlist/:id/tracks', (req, res) => {
    const playlistId = req.params.id;
    var options = {
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };

    request.get(options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            const tracks = body.items.map(item => item.track).filter(Boolean);
            res.json(tracks);
        } else {
            res.status(response ? response.statusCode : 500).send(error || body);
        }
    });
});

app.post('/auth/create_playlist', (req, res) => {
    const { name, description, uris } = req.body;
    if (!name || !uris || !Array.isArray(uris)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    var meOptions = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };

    request.get(meOptions, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            return res.status(response ? response.statusCode : 500).send(error || body);
        }

        const userId = body.id;

        var createOptions = {
            url: `https://api.spotify.com/v1/users/${userId}/playlists`,
            headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, description: description || '', public: false })
        };

        request.post(createOptions, function(err2, resp2, body2) {
            if (err2 || resp2.statusCode < 200 || resp2.statusCode >= 300) {
                return res.status(resp2 ? resp2.statusCode : 500).send(err2 || body2);
            }

            let created = JSON.parse(body2);
            const playlistId = created.id;

            const batches = [];
            for (let i = 0; i < uris.length; i += 100) {
                batches.push(uris.slice(i, i + 100));
            }

            let batchPromises = batches.map(batch => {
                return new Promise((resolve, reject) => {
                    var addOptions = {
                        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                        headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uris: batch })
                    };
                    request.post(addOptions, function(e, r, b) {
                        if (e || r.statusCode < 200 || r.statusCode >= 300) reject(e || b);
                        else resolve(b);
                    });
                });
            });

            Promise.all(batchPromises)
                .then(() => res.json({ success: true, playlist: created }))
                .catch(errAdd => res.status(500).send(errAdd));
        });
    });
});