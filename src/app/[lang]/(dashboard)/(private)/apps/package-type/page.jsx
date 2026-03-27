import PermissionGuardServer from '@/hocs/PermissionGuard'
import PackageType from '@views/apps/package-type'

export default async function PackageTypeApp({ params }) {

  const { lang } = await params

  return (
    <PermissionGuardServer locale={lang} element={'isSuperAdmin'}>
      <PackageType />
    </PermissionGuardServer>
  )
}
