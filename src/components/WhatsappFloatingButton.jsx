import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getSettings } from "../services/api";

export default function WhatsappFloatingButton() {
  const [link, setLink] = useState(null);

  useEffect(() => {
    getSettings().then((s) => setLink(s.whatsapp_link)).catch(() => {});
  }, []);

  if (!link) return null;

  return (
    <a href={link} target="_blank" rel="noreferrer" className="whatsapp-fab" aria-label="Chat on WhatsApp">
      <MessageCircle size={26} fill="#fff" />
    </a>
  );
}
