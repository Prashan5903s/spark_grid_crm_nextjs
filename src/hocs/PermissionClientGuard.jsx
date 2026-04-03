'use client'

import { useEffect, useState } from 'react';

import { useRouter, redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import PermissionGuardClient from '@/components/PermissionGuardClient';

const fetchPermission = async (url, token) => {
    try {
        const response = await fetch(`${url}/admin/role/allow/permission`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Permission API error 1st:', await response.text());

            return null;
        }

        const data = await response.json();

        return data?.data || null;
    } catch (error) {
        console.error('Permission fetch error:', error);

        return null;
    }
};

export default function PermissionGuard({ children, locale, element }) {
    const { data: session, status } = useSession();
    const [isAllowed, setIsAllowed] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkPermission = async () => {
            if (status === 'loading') return;

            const token = session?.user?.token;
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            if (!token || !API_URL) {
                console.error('Missing token or API_URL');
                router.replace(`/${locale}/login`);

                return;
            }

            const permissions = await fetchPermission(API_URL, token);
            const listingId = session.user?.listing;
            const allowedPermissions = permissions?.[element];

            const allowed =
                permissions &&
                permissions[element] &&
                (!Array.isArray(allowedPermissions) || allowedPermissions.includes(listingId));

            if (!allowed) {

                if (permissions?.isUser) {

                    redirect(`/${locale}/dashboard/user/${'learner'}`);
                }

                if (permissions?.notUser) {

                    redirect(`/${locale}/dashboard/crm`);
                }

            } else {
                setIsAllowed(true);
            }
        };

        checkPermission();
    }, [status, session, locale, element, router]);

    if (isAllowed) {
        return <PermissionGuardClient>{children}</PermissionGuardClient>;
    }

    // Optional: render a loading state
    return null;
}
