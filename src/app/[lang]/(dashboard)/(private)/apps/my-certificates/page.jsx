import CertificateCard from "@/components/certificateCard";

import PermissionGuard from "@/hocs/PermissionGuard";

const certificateData = [
    {
        issued_by: "DW",
        issued_on: "JUL 3rd 2024",
        valid_till: "_",
        certificate_type: "Internal",
        certificate_url: ""
    },
    {
        issued_by: "DW",
        issued_on: "JUL 3rd 2024",
        valid_till: "_",
        certificate_type: "Internal",
        certificate_url: ""
    },
    {
        issued_by: "DW",
        issued_on: "JUL 3rd 2024",
        valid_till: "_",
        certificate_type: "Internal",
        certificate_url: ""
    },
    {
        issued_by: "DW",
        issued_on: "JUL 3rd 2024",
        valid_till: "_",
        certificate_type: "Internal",
        certificate_url: ""
    }
];

const MyCertificate = async ({ params }) => {

    const { lang: lang } = await params;

    return (
        <>
            <PermissionGuard locale={lang} element={'isUser'}>
                <CertificateCard searchValue={certificateData} />
            </PermissionGuard>
        </>
    )

}

export default MyCertificate
