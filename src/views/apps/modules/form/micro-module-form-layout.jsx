'use client'

// React Imports

import { useState, useEffect } from 'react'

import { useRouter, useParams, useSearchParams } from 'next/navigation'

import ModuleTypes from './module-type';
import MicroForm from './layouts/micro-form';
import ManageContentsCard from './layouts/manage-contents-card';

const ModuleFormLayout = ({ setLayoutType }) => {
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
            {showCards ? (
                <>
                    {moduleData?.cards?.length > 0 ? (
                        <ManageContentsCard
                            cardrows={cardItems}
                            setShowCards={setShowCards}
                            moduleData={moduleData}
                            currentPage='direct'
                            setCardItemsModuleType={setCardItemsModuleType}
                        />
                    ) : (
                        <ModuleTypes setShowCards={setShowCards} moduleData={moduleData} />
                    )}
                </>
            ) : (
                <MicroForm setLayoutType={setLayoutType} setShowCards={setShowCards} setModuleData={setModuleData} />
            )}
        </>
    )
}

export default ModuleFormLayout
