const CLIENT_ID = "2230c0aa7f8617ff589361ef02e8a380";
const REDIRECT_URI = "http://localhost";
const AUTH_URL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=activity%20nutrition%20profile%20settings%20sleep%20weight&expires_in=604800`;

export const redirectToFitbitAuth = () => {
  window.location.href = AUTH_URL;
};

export const getAccessToken = async (authCode) => {
  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${CLIENT_ID}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: authCode,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const data = await response.json();
  return data.access_token;
};

export const fetchFitbitData = async (accessToken) => {
  const response = await fetch(
    "https://api.fitbit.com/1/user/-/activities/date/today.json",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  console.log(data);
};
