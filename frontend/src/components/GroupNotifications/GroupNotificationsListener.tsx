import { useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

interface GroupNotification {
  type: "GROUP_EXPENSE_ADDED" | "DEBT_PAID" | "DEBT_CONFIRMED";
  groupId?: number | string;
  groupName?: string;
  title?: string;
  amount?: number;
  userShare?: number;
  createdByEmail?: string;
  debtId?: number | string;
  message: string;
}

const getWebSocketUrl = (token: string) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname;
  return `${protocol}://${host}:8080/ws/group-notifications?token=${encodeURIComponent(token)}`;
};



const GroupNotificationsListener = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = new WebSocket(getWebSocketUrl(token));

    socket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as GroupNotification;

        if (notification.type === "GROUP_EXPENSE_ADDED") {
          toast.info(notification.message);
          window.dispatchEvent(new Event("refreshGlobalBalance"));
          window.dispatchEvent(new Event("refreshGroupDebts"));
          window.dispatchEvent(new Event("refreshGroupMembers"));
        }

        if (notification.type === "DEBT_PAID") {
          toast.info(notification.message);
          // Odświeżamy listę długów żeby pokazać przycisk "Potwierdź spłatę"
          window.dispatchEvent(new Event("refreshGroupDebts"));
          window.dispatchEvent(new Event("refreshGroupMembers"));
        }

        if (notification.type === "DEBT_CONFIRMED") {
          toast.success(notification.message);
          // Odświeżamy bilans i długi po potwierdzeniu
          window.dispatchEvent(new Event("refreshGlobalBalance"));
          window.dispatchEvent(new Event("refreshGroupDebts"));
          window.dispatchEvent(new Event("refreshGroupMembers"));
        }
      } catch (error) {
        console.error("Nie udało się obsłużyć komunikatu grupowego:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Błąd połączenia WebSocket z komunikatami grupowymi:", error);
    };

    return () => {
      socket.close();
    };
  }, [isAuthenticated]);

  return null;
};

export default GroupNotificationsListener;