import PermissionGuardClient from "@/components/PermissionGuardClient";
import TrainingSourcesComponent from "@/views/apps/training-source/index";

const DownloadCenter = async ({ params }) => {

    const { lang } = await params;


    return (
        <>
            <PermissionGuardClient locale={lang} element="isUser">

                <TrainingSourcesComponent isCompany={false} />
            </PermissionGuardClient>
        </>
    )

}

export default DownloadCenter;
