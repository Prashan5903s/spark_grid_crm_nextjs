// Component Imports

import Group from '@/views/apps/group/index'

// Data Imports

import PermissionGuard from '@/hocs/PermissionGuard';

export default async function GroupApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element={'hasGroupPermission'}>
            <Group />
        </PermissionGuard>
    )

}
