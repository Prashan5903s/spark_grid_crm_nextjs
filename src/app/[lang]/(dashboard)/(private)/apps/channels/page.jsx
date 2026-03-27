import PermissionGuardServer from '@/hocs/PermissionGuard'
import Channel from '@views/apps/channel'

export default async function ChannelApp({ params }) {

    const { lang } = await params

    return (
        <PermissionGuardServer locale={lang} element={'hasDepartmentPermission'}>
            <Channel />
        </PermissionGuardServer>
    )

}
