import { apiUrl } from './constants';

const registerUser = async (email, password) => {
    const response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
};

export { registerUser };