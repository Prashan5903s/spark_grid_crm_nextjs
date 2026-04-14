'use client'


import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard'

import UserList from '@/views/apps/company/list'

export default function UserListApp() {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element={'isSuperAdmin'}>
      <UserList />
    </PermissionGuard>
  )

}
