"use client"

import { useState, useEffect } from "react"

import { useSession } from "next-auth/react"

import SelfEnrollmentCard from "@/components/SelfEnrollModuleComponent"

const ITEMS_PER_PAGE = 6

const SelfEnrollModule = () => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const { data: session } = useSession()
    const token = session?.user?.token

    const [moduleData, setModuleData] = useState([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchModuleData = async () => {
        try {
            setLoading(true)

            const response = await fetch(
                `${API_URL}/user/self/enroll/data?page=${page}&limit=${ITEMS_PER_PAGE}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            const value = await response.json()

            if (response.ok) {

                const result = value?.data;

                setModuleData(result?.data || [])
                setTotalPages(result?.pagination?.totalPages || 1)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchModuleData()
        }
    }, [API_URL, token, page])

    return (
        <SelfEnrollmentCard
            modules={moduleData}
            loading={loading}
            page={page}
            fetchModuleData={fetchModuleData}
            totalPages={totalPages}
            onPageChange={setPage}
        />
    )
}

export default SelfEnrollModule
