import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import { getUserId } from './auth';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      if (__DEV__) console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Use projectId for newer expo-notifications
    token = (await Notifications.getExpoPushTokenAsync()).data;

    const userId = await getUserId();
    if (userId) {
      try {
        await api.post(`/users/push-token/${userId}`, { token });
      } catch {
        // Push token sync failure is non-fatal; notifications will work on next launch
      }
    }
  } else {
    if (__DEV__) console.warn('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
