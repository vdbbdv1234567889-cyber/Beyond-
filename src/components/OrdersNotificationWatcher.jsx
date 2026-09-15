import { useEffect, useRef } from "react";
import { getOrders } from "../services/api";

const LAST_SEEN_KEY = "admin_last_seen_order_id";
const POLL_INTERVAL = 15000;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function OrdersNotificationWatcher() {
  const intervalRef = useRef(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    async function checkForNewOrders() {
      try {
        const orders = await getOrders();
        if (orders.length === 0) return;

        const latestId = Math.max(...orders.map((o) => o.id));
        const lastSeen = parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0", 10);

        if (lastSeen === 0) {
          localStorage.setItem(LAST_SEEN_KEY, String(latestId));
          return;
        }

        if (latestId > lastSeen) {
          const newOrders = orders.filter((o) => o.id > lastSeen);
          playBeep();

          if ("Notification" in window && Notification.permission === "granted") {
            newOrders.forEach((order) => {
              new Notification("New Order Received!", {
                body: `Order #${order.id} from ${order.customer_name} — EGP ${Math.round(order.total)}`,
              });
            });
          }

          document.title = `(${newOrders.length}) New Order! — Admin`;
          localStorage.setItem(LAST_SEEN_KEY, String(latestId));
        }
      } catch {}
    }

    checkForNewOrders();
    intervalRef.current = setInterval(checkForNewOrders, POLL_INTERVAL);

    function resetTitleOnFocus() {
      if (document.title.includes("New Order")) document.title = "Admin Dashboard";
    }
    window.addEventListener("focus", resetTitleOnFocus);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("focus", resetTitleOnFocus);
    };
  }, []);

  return null;
}
