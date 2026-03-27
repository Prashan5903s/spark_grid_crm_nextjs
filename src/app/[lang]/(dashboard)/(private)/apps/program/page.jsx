'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { useSession } from 'next-auth/react';

import PermissionGuard from '@/hocs/PermissionClientGuard';

import CardComponent from '@components/program-component/CardComponent';

const MyTrainingPage = () => {

  const { lang } = useParams();

  const locale = lang;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [activePage, setActivePage] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;

  const fetchCardData = async (page = 0) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/company/program?page=${page}&limit=${itemsPerPage}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {

        const value = result?.data;

        setCardData(value);
        setTotalItems(value?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch card data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (API_URL && token) {
      fetchCardData(activePage);
    }
  }, [API_URL, token, activePage]);

  return (
    <PermissionGuard locale={locale} element="isCompany">
      <CardComponent
        locale={locale}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        data={cardData}
        loading={loading}
        stage="Program"
        nextLink={`/${locale}/apps/content-folder`}
        formLink={`/${locale}/apps/program/create`}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        activePage={activePage}
        getModuleList={(page) => setActivePage(page)}
      />
    </PermissionGuard>
  );
};

export default MyTrainingPage;
