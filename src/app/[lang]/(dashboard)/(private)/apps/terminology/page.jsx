// Component Imports
'use client'

import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard'

import Terminology from '@views/apps/terminology'


export default function TerminologyApp() {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element={'isSuperAdmin'}>
      <Terminology />
    </PermissionGuard>
  )
}
