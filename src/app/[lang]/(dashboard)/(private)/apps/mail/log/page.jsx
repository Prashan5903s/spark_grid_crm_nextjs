import PermissionGuardServer from '@/hocs/PermissionGuard'
import MailLogComponent from '@/views/apps/mail_log/page'

export default async function DesignationApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuardServer locale={lang} element={'hasDesignationPermission'}>
      <MailLogComponent />
    </PermissionGuardServer>
  )
}
