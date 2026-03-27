// Component Imports
import PermissionGuard from '@/hocs/PermissionGuard'
import Region from '@views/apps/region'

export default async function RegionApp({ params }) {

  const { lang } = await params;

  const locale = lang;

  return (
    <PermissionGuard locale={locale} element={'hasRegionPermission'}>
      <Region />
    </PermissionGuard>
  )
}
