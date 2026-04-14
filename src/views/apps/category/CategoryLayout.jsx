'use client'

// Component Imports

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import CategoryComponent from '@/views/apps/category/CategoryComponent'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import { useApi } from '../../../utils/api';

const CategoryApp = ({ type }) => {
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const [data, setData] = useState()
    const { doGet } = useApi();

    const loadTableData = async () => {
        const result = await doGet(`admin/categories?type=${type}`);

        setData(result);
    };

    useEffect(() => {
        if (token) {
            loadTableData()
        }
    }, [token])

    return data ?
        <CategoryComponent
            tableRows={data}
            loadTableData={loadTableData}
            type={type}
        />
        :
        <SkeletonTableComponent />
}

export default CategoryApp
