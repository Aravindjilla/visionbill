import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import PurchasesUI from 'react-native-purchases-ui';

// RevenueCat Entitlement and Product IDs
export const ENTITLEMENT_ID = 'vision bill Pro';
export const REVENUECAT_API_KEY = 'test_vorWiXtcECeEtBMZBlARiKthVmz';

/**
 * Initialize RevenueCat SDK
 */
export const initRevenueCat = async (userId?: string) => {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Purchases.configure({ 
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId 
    });
  }
};

/**
 * Identify a user when they log in to the app
 */
export const identifyUser = async (userId: string) => {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.error('RevenueCat Login Error:', e);
  }
};

/**
 * Reset RevenueCat user when they log out
 */
export const logoutUser = async () => {
  try {
    await Purchases.logOut();
  } catch (e) {
    console.error('RevenueCat Logout Error:', e);
  }
};

/**
 * Check if the user has an active Pro entitlement
 */
export const checkProEntitlement = (customerInfo: CustomerInfo): boolean => {
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
};

/**
 * Present the RevenueCat Paywall
 */
export const presentPaywall = async (): Promise<boolean> => {
  try {
    const result = await PurchasesUI.presentPaywall();
    // PAYWALL_RESULT is the enum from PurchasesUI
    return result === 'PURCHASED' || result === 'RESTORED';
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error('Paywall Error:', e);
    }
    return false;
  }
};

/**
 * Present the RevenueCat Customer Center
 */
export const presentCustomerCenter = async () => {
  try {
    await PurchasesUI.presentCustomerCenter();
  } catch (e) {
    console.error('Customer Center Error:', e);
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.error('Get Customer Info Error:', e);
    return null;
  }
};
