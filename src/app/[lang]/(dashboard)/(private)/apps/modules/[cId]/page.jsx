'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import PermissionGuard from '@/hocs/PermissionClientGuard'

import ModuleCardComponent from '@components/program-component/CardComponent'

const MyModulePage = () => {
  const { lang: locale, cId: cid } = useParams()

  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const token = session?.user?.token

  const [data, setData] = useState([])
  const [activePage, setActivePage] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const itemsPerPage = 3

  const getModuleList = async (page = 0) => {
    try {
      setActivePage(page)

      const response = await fetch(
        `${API_URL}/company/module/${cid}?page=${page}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (response.ok) {

        const value = result?.data;

        setData(value.data)
        setTotalItems(value.totalItems) // IMPORTANT
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token && cid) {
      getModuleList(0)
    }
  }, [API_URL, token, cid])

  return (
    <PermissionGuard locale={locale} element="isCompany">
      <ModuleCardComponent
        locale={locale}
        stage="Module"
        parent="Content Folder"
        currentId={cid}
        data={data}
        activePage={activePage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        getModuleList={getModuleList}
        formLink={`/${locale}/apps/modules/${cid}/form`}
        parentCategory={`/${locale}/apps/modules`}
        nextLink={`/${locale}/apps/activity`}
      />
    </PermissionGuard>
  )
}

export default MyModulePage
