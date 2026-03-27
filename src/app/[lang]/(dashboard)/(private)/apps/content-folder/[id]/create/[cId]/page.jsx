'use client'

import { useState, useEffect } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import ContentFolderFormComponent from '@components/program-component/FormComponent';

const ContentFolderForm = () => {

    const { data: session } = useSession()
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const { lang: locale, id: id, cId: cid } = useParams()

    const [loading, setLoading] = useState(false)
    const [editFormData, setEditFormData] = useState();

    const fetchEditData = async () => {
        try {

            setLoading(false)

            const response = await fetch(`${API_URL}/company/content-folder/${id}/edit/${cid}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const value = result?.data

                setEditFormData(value)

                setLoading(true)

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token && id && cid) {
            fetchEditData()
        }
    }, [API_URL, token, id, cid])

    return (
        <>
            <ContentFolderFormComponent
                stage={'Content Folder'}
                id={cid}
                token={token}
                loading={loading}
                editData={editFormData}
                backURL={`/apps/content-folder/${id}`}
                editURL={`${API_URL}/company/content-folder/${id}/update`}
                backPageName={"Content Folder"}
            />
        </>
    )
}

export default ContentFolderForm;
