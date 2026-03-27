"use client"

import { useState, useEffect } from 'react'

// Util Imports
import { useRouter, useParams, useSearchParams } from 'next/navigation'

import { getLocalizedUrl } from '@/utils/i18n'

import WelcomeModuleCardLayout from './welcome-card-layout';
import ModuleFormLayout from './micro-module-form-layout';
import RemoteSessionModuleFormLayout from './remote-session-form-layout';
import ManageContentsCard from './layouts/manage-contents-card';

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
            {layoutType === '' && !id && <WelcomeModuleCardLayout setLayoutType={setLayoutType} />}
            {layoutType === 'micro-modules' && <ModuleFormLayout setLayoutType={setLayoutType} />}
            {layoutType === 'remote-session-modules' && <RemoteSessionModuleFormLayout setLayoutType={setLayoutType} />}
        </>
    )
}

export default ModuleLayout
