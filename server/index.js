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
        url: 'https://accounts.spotify.com/api/token4',
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