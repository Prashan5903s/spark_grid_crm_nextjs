// Component Imports
import Roles from '@views/apps/roles'

// Data Imports
import { getUserData } from '@/app/server/actions'
import PermissionGuard from '@/hocs/PermissionGuard';

export default async function RoleApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuard locale={lang} element={'isSuperAdmin'}>
      <Roles />
    </PermissionGuard>
  )

}
