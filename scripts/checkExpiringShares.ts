import { ensureExpiringShareNotifications } from "../lib/notifications/service";

await ensureExpiringShareNotifications();
console.info(JSON.stringify({ event: "expiring_share_check_completed", checkedAt: new Date().toISOString() }));
