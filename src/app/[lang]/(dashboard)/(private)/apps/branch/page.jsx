'use client'

import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard';

import Branch from '@views/apps/branch'

export default function BranchApp() {

    const { lang: locale } = useParams();

    return (
        <PermissionGuard locale={locale} element="hasBranchPermission">
            <Branch />
        </PermissionGuard>
    );
}
