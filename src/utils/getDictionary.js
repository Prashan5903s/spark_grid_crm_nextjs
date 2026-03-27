import 'server-only'

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

const URL = process.env.NEXT_PUBLIC_API_URL;

const getMenuList = async () => {
  const session = await getServerSession(authOptions);
  const token = session?.user?.token;

  try {
    const response = await fetch(`${URL}/company/menu/list`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();

      return data.data || {};
    } else {
      return {};
    }
  } catch (error) {

    return {};
  }
};

// Static fallback dictionaries
const dictionaries = {
  en: () => Promise.resolve({ navigation: { /* ... */ } }),
  hi: () => Promise.resolve({ navigation: { /* ... */ } }),
  fr: () => import('@/data/dictionaries/fr.json').then(m => m.default),
  ar: () => import('@/data/dictionaries/ar.json').then(m => m.default),
};

// Final exported function
export const getDictionary = async (locale) => {
  const menuList = await getMenuList();

  const dynamic = menuList?.[locale];

  if (dynamic && typeof dynamic === 'object') {
    return { navigation: dynamic }; // Use API dictionary if available
  }

  const fallback = dictionaries[locale];

  if (!fallback) {
    throw new Error(`Dictionary for locale '${locale}' not found`);
  }

  return fallback(); // Return static if API fails
};
