import PermissionGuardServer from '@/hocs/PermissionGuard';
import Lead from '@/views/apps/leads/index'

export default async function LeadApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuardServer locale={lang} element={"isUser"}>
            <Lead />
        </PermissionGuardServer>
    )

}
