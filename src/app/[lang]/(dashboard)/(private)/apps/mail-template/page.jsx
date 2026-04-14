import MailTemplate from '@/views/apps/mail-template/index'

import PermissionGuard from '@/hocs/PermissionGuard';

export default async function GroupApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element={'isCompany'}>
            <MailTemplate />
        </PermissionGuard>
    )

}
