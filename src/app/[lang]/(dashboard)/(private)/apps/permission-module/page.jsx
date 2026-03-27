import PermissionGuardServer from '@/hocs/PermissionGuard'
import Permissions from '@views/apps/permission-module/index'

export default async function PermissionApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuardServer locale={lang} element={'isSuperAdmin'}>
      <Permissions />
    </PermissionGuardServer>
  )

}
