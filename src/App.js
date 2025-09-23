import React, { useState, useEffect } from 'react';
import Login from './Login';
import UserDisplay from './UserDisplay';
import './App.css';

function App() {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const hash = window.location.hash
            .substring(1)
            .split('&')
            .reduce((initial, item) => {
                if (item) {
                    var parts = item.split('=');
                    initial[parts[0]] = decodeURIComponent(parts[1]);
                }
                return initial;
            }, {});

        window.location.hash = '';

        const _userName = hash.user_name;

        if (_userName) {
            setUserName(_userName);
        }
    }, []);

    return (
        <>
            { (userName === '') ? <Login/> : <UserDisplay userName={userName} /> }
        </>
    );
}

export default App;