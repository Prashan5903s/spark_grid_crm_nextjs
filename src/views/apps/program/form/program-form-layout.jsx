'use client'

// React Imports

import { useState, useEffect } from 'react'

import { useRouter, useParams, useSearchParams } from 'next/navigation'

import ProgramForm from './layouts/program-form';

const ProgramFormLayout = ({ setLayoutType }) => {
    const [showCards, setShowCards] = useState(false);
    const [moduleData, setModuleData] = useState();
    const [cardItems, setCardItems] = useState([]);
    const [cardItemsModuleType, setCardItemsModuleType] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!router.isReady) return;

        if (searchParams.get('showCards')) {
            setShowCards(true);
        }

    }, [router.isReady]);

    useEffect(() => {
        if (moduleData) {
            setModuleData(moduleData);

            if (moduleData?.cards?.length > 0) {
                setCardItems(moduleData.cards);
            }
        }
    }, [moduleData]);

    return (
        <>
            <ProgramForm setLayoutType={setLayoutType} setShowCards={setShowCards} setModuleData={setModuleData} />
        </>
    )
}

export default ProgramFormLayout
