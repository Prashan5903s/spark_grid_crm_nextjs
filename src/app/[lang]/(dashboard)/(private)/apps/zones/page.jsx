import PermissionGuard from '@/hocs/PermissionGuard';
import Zones from '@views/apps/zones';

const ZonesApp = async ({ params }) => {

  const { lang } = await params;

  return (
    <PermissionGuard locale={lang} element="hasZonePermission">
      <Zones />
    </PermissionGuard>
  );
}

export default ZonesApp
