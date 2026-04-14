import PermissionGuardServer from '@/hocs/PermissionGuard'
import DesignationComponent from '@/views/apps/designation/index'

export default async function DesignationApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuardServer locale={lang} element={'hasDesignationPermission'}>
      <DesignationComponent />
    </PermissionGuardServer>
  )
}
