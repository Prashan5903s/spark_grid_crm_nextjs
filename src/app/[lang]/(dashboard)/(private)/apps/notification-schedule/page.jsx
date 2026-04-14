// Component Imports

import NotificationSchedule from '@/views/apps/notification-schedule/index'

// Data Imports

import PermissionGuard from '@/hocs/PermissionGuard';

export default async function GroupApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element={'isCompany'}>
            <NotificationSchedule />
        </PermissionGuard>
    )

}
