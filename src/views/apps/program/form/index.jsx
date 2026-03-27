"use client"

import { useState, useEffect } from 'react'

// Util Imports
import { useRouter, useParams, useSearchParams } from 'next/navigation'

import { getLocalizedUrl } from '@/utils/i18n'

import ProgramFormLayout from './program-form-layout';


const ModuleLayout = props => {
    const [layoutType, setLayoutType] = useState('');
    const { lang: locale, id: id } = useParams()

    useEffect(() => {
        if (id) {
            setLayoutType('micro-modules');
        }

    }, [id])

    return (
        <>
            <ProgramFormLayout setLayoutType={setLayoutType} />
        </>
    )
}

export default ModuleLayout
