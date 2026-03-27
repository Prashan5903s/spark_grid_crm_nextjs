'use client'

import { useParams } from 'next/navigation';

import Language from '@views/apps/language'

import PermissionGuard from '@/hocs/PermissionClientGuard'

export default function LanguageApp() {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element={'isSuperAdmin'}>
      <Language />
    </PermissionGuard>
  )

}
