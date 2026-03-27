'use client'

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import ProgramFormComponent from "@/components/program-component/FormComponent";

const ContentFolderForm = () => {

    const { data: session } = useSession()
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const { lang: locale, id: id } = useParams()

    return (
        <>
            <ProgramFormComponent
                loading={true}
                stage={"Content Folder"}
                backURL={`/apps/content-folder/${id}`}
                addURL={`${API_URL}/company/content-folder/${id}`}
                token={token}
                backPageName={"Content Folder"}
            />
        </>
    )

}

export default ContentFolderForm;
