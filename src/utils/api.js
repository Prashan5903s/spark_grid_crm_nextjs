import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify'

export const useApi = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;

    const doGet = async (endpoint, params = {}) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;
        const query = new URLSearchParams(params).toString();
        const finalUrl = query ? `${url}?${query}` : url;

        try {
            const response = await fetch(finalUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Something went wrong');
            }

            return data?.data;
        } catch (error) {
            console.error('GET Request Error:', error.message);
            throw error;
        }
    };

    const doPost = async (url, body = {}) => {
        try {
            const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Something went wrong');
            }

            return data?.data;
        } catch (error) {
            console.error('POST Request Error:', error.message);
            throw error;
        }
    };

    const doDelete = async ({
        endpoint,
        params = {},
        onSuccess = () => { },
        onError = () => { }
    }) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;
        const query = new URLSearchParams(params).toString();
        const finalUrl = query ? `${url}?${query}` : url;

        try {
            const response = await fetch(finalUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess(data);
            } else {
                toast.error(data?.message || 'Error occurred', { autoClose: 1200 });
                console.error('Error', data);
            }
        } catch (error) {
            onError(error);
            toast.error(error, { autoClose: 1200 });
            console.error('DELETE Request Error', error);
        }
    };

    const doPostFormData = async ({
        endpoint,
        values,
        method = 'POST',
        onSuccess = () => { },
        onError = () => { },
    }) => {
        try {
            const formData = new FormData();

            Object.entries(values).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

            const response = await fetch(finalUrl, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                //toast.success(successMessage, { autoClose: 700 });
                onSuccess(data);
            } else {
                toast.error(data?.message || 'Error occurred', { autoClose: 1200 });
                console.error('Error', data);
            }
        } catch (error) {
            onError(error);
            toast.error(error, { autoClose: 1200 });
            console.error('Error occurred', error);
        }
    };

    const doPut = async ({
        endpoint,
        values,
        onSuccess = () => { },
        onError = () => { },
    }) => {
        try {
            const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

            const response = await fetch(finalUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok) {
                //toast.success(successMessage, { autoClose: 700 });
                onSuccess(data);
            } else {
                toast.error(data?.message || 'Error occurred', { autoClose: 1200 });
                console.error('Error', data);
            }
        } catch (error) {
            onError(error);
            toast.error(error, { autoClose: 1200 });
            console.error('Error occurred', error);
        }
    };



    return { doGet, doPost, doDelete, doPostFormData, doPut, token };
};
