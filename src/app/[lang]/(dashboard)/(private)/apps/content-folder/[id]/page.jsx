'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import ProgramCardComponent from '@/components/program-component/CardComponent'

const ContentComponent = () => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [activePage, setActivePage] = useState(0)
    const [totalItems, setTotalItems] = useState(0)

    const itemsPerPage = 6

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token
    const { lang: locale, id } = useParams()

    const getContentFolderList = async (page = 0) => {
        try {
            setLoading(true)

            const response = await fetch(
                `${API_URL}/company/content-folder/${id}?page=${page}&limit=${itemsPerPage}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            const result = await response.json()

            if (response.ok) {
                const maxPage = Math.max(
                    0,
                    Math.ceil(result.data.totalItems / itemsPerPage) - 1
                )

                setActivePage(Math.min(page, maxPage))
                setData(result.data.data)
                setTotalItems(result.data.totalItems)
            }
        } catch (error) {
            console.error('Failed to fetch card data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (API_URL && token && id) {
            getContentFolderList(0)
        }
    }, [API_URL, token, id])

    return (
        <ProgramCardComponent
            locale={locale}
            stage="Content Folder"
            currentId={id}
            parent="Program"
            formLink={`/${locale}/apps/content-folder/${id}/create`}
            data={data}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            activePage={activePage}
            getModuleList={getContentFolderList}
            nextLink={`/${locale}/apps/modules`}
            parentCategory={`/${locale}/apps/content-folder`}
        />
    )
}

export default ContentComponent
