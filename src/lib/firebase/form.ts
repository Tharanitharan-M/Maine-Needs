import { db } from './firebase.ts';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FormConfig } from '../types/form';

const FORM_CONFIG_COLLECTION = 'formConfigs';
const DEFAULT_FORM_ID = 'default-form';

export async function getFormConfig(): Promise<FormConfig | null> {
  try {
    const docRef = doc(db, FORM_CONFIG_COLLECTION, DEFAULT_FORM_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FormConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching form config:', error);
    throw error;
  }
}

export async function saveFormConfig(config: Omit<FormConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const docRef = doc(db, FORM_CONFIG_COLLECTION, DEFAULT_FORM_ID);
    const docSnap = await getDoc(docRef);
    
    const now = Date.now();
    const formConfig: FormConfig = {
      ...config,
      id: DEFAULT_FORM_ID,
      createdAt: docSnap.exists() ? (docSnap.data() as FormConfig).createdAt : now,
      updatedAt: now,
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, formConfig);
    } else {
      await setDoc(docRef, formConfig);
    }
  } catch (error) {
    console.error('Error saving form config:', error);
    throw error;
  }
} 