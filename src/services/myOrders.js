const STORAGE_KEY = "my_order_ids";

export function saveMyOrderId(orderId) {
  const ids = getMyOrderIds();
  if (!ids.includes(orderId)) {
    ids.unshift(orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function getMyOrderIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
