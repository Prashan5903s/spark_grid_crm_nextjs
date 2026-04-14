import PermissionGuardServer from '@/hocs/PermissionGuard';
import Permissions from '@views/apps/permission/page'

export default async function PermissionApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuardServer locale={lang} element={'isSuperAdmin'}>
            <Permissions />
        </PermissionGuardServer>
    );
}
