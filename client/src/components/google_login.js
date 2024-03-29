import axios from 'axios';
import createAuth0Client from '@auth0/auth0-spa-js';
import jwtDecode from 'jwt-decode';
import m from 'mithril';

import { url, client_id } from '../constants';

let token, gClient, decodedToken;



const google_login = {
  async oncreate() {
    const setStorage = async (tokenDetails={},cb) => {
      console.log("tokenDetails", tokenDetails)
      const { decodedToken, token } = tokenDetails

      localStorage.setItem('authToken', token);
      localStorage.setItem('googleId', decodedToken.sub);
      localStorage.setItem('name', decodedToken.name);
      localStorage.setItem('imageUrl', decodedToken.picture);
      localStorage.setItem('email', decodedToken.email);

      try {
        console.log(client_id, url)
        const {
          email, picture, sub, name
        } = decodedToken
        const userData = { email, picture, googleId: sub, name };
        const options = {
          method: 'POST',
          url: `${url}/users`,
          headers: {
            'Content-Type': 'application/json',
          },
          data: userData,
        };
        const res = await axios.request(options);

        console.log(res)
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user._id);
        localStorage.setItem('role', res.data.user.role);
        localStorage.setItem('brand', res.data.user.brand);
        cb()
      } catch (err) {

        if (err.response && err.response.status === 404) {
          const {
            email, picture, sub, name
          } = decodedToken
          const userData = { email, picture, googleId: sub, name };
          const options = {
            method: 'POST',
            url: `${url}/users`,
            headers: {
              'Content-Type': 'application/json',
            },
            data: userData,
          };
          const res = await axios.request(options);
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userId', res.data.user._id);
          localStorage.setItem('role', res.data.user.role);
          localStorage.setItem('brand', res.data.user.brand);
          cb()
        } else {
          cb()
          console.error(err);
        }
      }
    };

    try {
      gClient = await window.google.accounts.id.initialize({
        client_id: client_id,
        callback: (response) => {
          // console.log(response)
          // alert('gClient, initialize, response', JSON.stringify(response));

          if (response.credential) {
            const { credential } = response;
            token = credential;
            decodedToken = jwtDecode(credential);
        
            if (!decodedToken) {
              alert('Error: Unable to retrieve valid credentials. Check the response for details.', JSON.stringify(response));
            } else {
              const tokenDetails = { decodedToken, token }
              setStorage(tokenDetails, () => window.location.reload());
            }
          } else {
            // Handle the case where response.credential is null or undefined
            // You might want to display an error message or handle it differently
            console.error('Error: response.credential is null or undefined', response);
          }
        }
        
      });

      await window.google.accounts.id.prompt(async (notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          document.cookie = `g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;
          await window.google.accounts.id.prompt()
        }
      });
    } catch (err) {
      console.log(err)
    }
  },
  view() {
    return m(
      "button",
      {
        type: "button",
        class: "btn btn-danger btn-sm ",
        onclick() {
          window.google.accounts.id.prompt(async (notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              document.cookie = `g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;
              await window.google.accounts.id.prompt()
            }
          });
        },
      },
      [m("i", { class: "bi bi-google align-text-bottom" }), "Login"]
    );

  },
};

export default google_login;
