'use client'


import { useParams } from 'next/navigation';

import PermissionServer from '@/hocs/PermissionClientGuard';

import Notification from '@views/apps/Notification/page'

export default function AdminNotification() {

    const { lang: locale } = useParams()

    return (
        <PermissionServer locale={locale} element={'isSuperAdmin'}>
            <Notification />
        </PermissionServer>
    );
}
