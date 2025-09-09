// Necessary imports
const express = require('express');
const dotenv = require('dotenv');
const request = require('request');
const axios = require('axios');

// Initialize Express app
const app = express();
const port = 5000;

// Load environment variables from .env file
dotenv.config();

// Spotify API credentials
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// Redirect URI for Spotify authentication
const redirect_uri = 'http://127.0.0.1:3000/auth/callback';

// Middleware to parse JSON bodies
app.use(express.json());

// Function to generate a random string for state parameter
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Function to get user ID from Spotify API
async function getUserId(access_token) {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    return response.data.id;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}

// Routes
// Route to initiate Spotify login
app.get('/auth/login', (req, res) => {
  const scope = 'streaming user-read-email user-read-private';
  const state = generateRandomString(16);

  const auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
  });

  res.redirect('https://accounts.spotify.com/authorize?' + auth_query_parameters.toString());
});

// Callback route for Spotify authentication
app.get('/auth/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#' + new URLSearchParams({ error: 'state_mismatch' }).toString());
  } else {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;

        res.redirect('/#');
        
        res.redirect('/#' + new URLSearchParams({
          access_token: access_token,
          refresh_token: refresh_token
        }).toString());

      } else {
        res.redirect('/#' + new URLSearchParams({ error: 'invalid_token' }).toString());
      }
    });
  }
});

// Route to get access token
app.get('/auth/token', (req, res) => {
  res.json({ access_token: req.query.access_token });
});

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Route to get user's playlists
app.get('/users/playlists', async (req, res) => {
  const access_token = req.query.access_token;

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
      params: {
        limit: 50,
        offset: 0
      }
    });

    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
});