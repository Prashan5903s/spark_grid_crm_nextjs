import PermissionGuardServer from '@/hocs/PermissionGuard'
import Department from '@views/apps/departments'

export default async function DepartmentApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuardServer locale={lang} element={'hasDepartmentPermission'}>
            <Department />
        </PermissionGuardServer>
    )

}
