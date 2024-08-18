const CLIENT_ID = 'YOUR_CLIENT_ID';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';
const AUTH_URL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=activity%20nutrition%20profile%20settings%20sleep%20weight&expires_in=604800`;

const redirectToFitbitAuth = () => {
    window.location.href = AUTH_URL;
};

const getAccessToken = async (authCode) => {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code: authCode,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
    });
    const data = await response.json();
    return data.access_token;
};

const fetchFitbitData = async (accessToken) => {
    const response = await fetch('https://api.fitbit.com/1/user/-/activities/date/today.json', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    console.log(data);
};
