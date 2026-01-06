import * as admin from 'firebase-admin';
import User from '../models/User';

// Initialize Firebase Admin SDK
// You need to download the service account key from Firebase Console
// Project Settings -> Service Accounts -> Generate new private key
// Save it as 'firebase-service-account.json' in the backend root directory

let firebaseInitialized = false;

const initializeFirebase = () => {
    if (firebaseInitialized) return;

    try {
        // Check if service account file exists
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath)
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
        console.error('⚠️ Firebase Admin SDK initialization failed:', error);
        console.log('Push notifications will not work. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    }
};

// Initialize on module load
initializeFirebase();

interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Send push notification to a specific user
 */
export const sendToUser = async (userId: string, payload: NotificationPayload): Promise<boolean> => {
    try {
        if (!firebaseInitialized) {
            console.log('Firebase not initialized, skipping push notification');
            return false;
        }

        const user = await User.findById(userId).select('fcmToken notificationsEnabled');

        if (!user?.fcmToken || user.notificationsEnabled === false) {
            console.log(`No FCM token or notifications disabled for user ${userId}`);
            return false;
        }

        const message: admin.messaging.Message = {
            token: user.fcmToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
        };

        await admin.messaging().send(message);
        console.log(`✅ Push notification sent to user ${userId}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Failed to send push to user ${userId}:`, error.message);
        return false;
    }
};

/**
 * Send push notification to all users with a specific role
 */
export const sendToRole = async (role: string, payload: NotificationPayload): Promise<number> => {
    try {
        if (!firebaseInitialized) return 0;

        const users = await User.find({
            role,
            fcmToken: { $exists: true, $ne: null },
            notificationsEnabled: true
        }).select('fcmToken');

        let successCount = 0;

        for (const user of users) {
            try {
                const message: admin.messaging.Message = {
                    token: user.fcmToken!,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: payload.data || {},
                };
                await admin.messaging().send(message);
                successCount++;
            } catch (e) {
                // Individual send failure, continue with others
            }
        }

        console.log(`✅ Sent ${successCount}/${users.length} notifications to role: ${role}`);
        return successCount;
    } catch (error: any) {
        console.error(`❌ Failed to send to role ${role}:`, error.message);
        return 0;
    }
};

/**
 * Send notification when order status changes
 */
export const notifyOrderStatusChange = async (
    orderId: string,
    customerId: string,
    restaurantOwnerId: string | null,
    deliveryPartnerId: string | null,
    newStatus: string,
    restaurantName: string
): Promise<void> => {
    const statusMessages: Record<string, { customer: string; restaurant?: string; rider?: string }> = {
        confirmed: {
            customer: `Your order from ${restaurantName} has been confirmed! 🎉`,
            restaurant: `New order received! Order #${orderId.slice(-6)}`,
        },
        preparing: {
            customer: `${restaurantName} is preparing your order! 👨‍🍳`,
        },
        ready: {
            customer: `Your order is ready for pickup! 🍽️`,
            rider: `Order #${orderId.slice(-6)} is ready for pickup at ${restaurantName}`,
        },
        out_for_delivery: {
            customer: `Your order is on its way! 🛵`,
        },
        delivered: {
            customer: `Your order has been delivered! Enjoy your meal! 😋`,
            restaurant: `Order #${orderId.slice(-6)} has been delivered successfully! ✅`,
            rider: `Delivery completed! Order #${orderId.slice(-6)} 💰`,
        },
        cancelled: {
            customer: `Your order from ${restaurantName} has been cancelled.`,
            restaurant: `Order #${orderId.slice(-6)} has been cancelled.`,
            rider: `Order #${orderId.slice(-6)} has been cancelled.`,
        },
    };

    const messages = statusMessages[newStatus];
    if (!messages) return;

    // Notify customer
    if (messages.customer) {
        await sendToUser(customerId, {
            title: 'Order Update',
            body: messages.customer,
            data: { type: 'order_update', orderId, status: newStatus },
        });
    }

    // Notify restaurant
    if (messages.restaurant && restaurantOwnerId) {
        await sendToUser(restaurantOwnerId, {
            title: 'Order Update',
            body: messages.restaurant,
            data: { type: 'order_update', orderId, status: newStatus },
        });
    }

    // Notify delivery partner
    if (messages.rider && deliveryPartnerId) {
        await sendToUser(deliveryPartnerId, {
            title: 'Delivery Update',
            body: messages.rider,
            data: { type: 'delivery_update', orderId, status: newStatus },
        });
    }
};

/**
 * Send broadcast notification to all users
 */
export const sendBroadcast = async (payload: NotificationPayload): Promise<number> => {
    try {
        if (!firebaseInitialized) return 0;

        const users = await User.find({
            fcmToken: { $exists: true, $ne: null },
            notificationsEnabled: true,
        }).select('fcmToken');

        let successCount = 0;

        for (const user of users) {
            try {
                await admin.messaging().send({
                    token: user.fcmToken!,
                    notification: { title: payload.title, body: payload.body },
                    data: payload.data || {},
                });
                successCount++;
            } catch (e) {
                // Continue with others
            }
        }

        console.log(`✅ Broadcast sent to ${successCount}/${users.length} users`);
        return successCount;
    } catch (error: any) {
        console.error('❌ Broadcast failed:', error.message);
        return 0;
    }
};

export default {
    sendToUser,
    sendToRole,
    notifyOrderStatusChange,
    sendBroadcast,
};
