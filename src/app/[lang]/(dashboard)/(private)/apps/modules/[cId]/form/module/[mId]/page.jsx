'use client'

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import ModuleTypeFormComponent from "@components/program-component/FormComponent";

const ModuleAddForm = () => {

    const [createData, setCreateData] = useState();

    const { mId: mId, lang: locale, cId: cId } = useParams();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;

    const fetchCreateData = async () => {
        try {
            const response = await fetch(`${API_URL}/company/program/create/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                const result = data?.data;

                setCreateData(result)

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData()
        }
    }, [API_URL, token])


    return (
        <>
            <ModuleTypeFormComponent
                type={mId}
                loading={true}
                stage={mId == '688219557b6953e899cb57d2' ? "Micro Learning Session" : (mId == '688219557b6953e899cb57d3' ? "Live Session" : "ILT")}
                backPageName={"Module"}
                backURL={`/${locale}/apps/modules/${cId}`}
                createData={createData}
                addURL={`${API_URL}/company/module/${cId}/create/${mId}`}
                token={token}
            />
        </>
    )
}

export default ModuleAddForm;
