// Component Imports
import PermissionGuard from '@/hocs/PermissionGuard'
import UserList from '@/views/apps/user/list'

export default async function UserListApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuard locale={lang} element={'hasUserPermission'}>
      <UserList />
    </PermissionGuard>
  )

}
