"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MessageCircle } from "lucide-react"; // Using a relevant icon

export function PurchaseCode() {
  // --- IMPORTANT: CUSTOMIZE THIS ---
  const whatsAppNumber = "2340000000000"; // REPLACE with your WhatsApp number (including country code, no '+')
  const prefilledMessage =
    "Hello PREP, I'm interested in purchasing an access code for an exam."; // The message users will send
  // ---------------------------------

  // This creates the correct WhatsApp URL
  const whatsAppLink = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(
    prefilledMessage
  )}`;

  return (
    <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
      <Button variant="secondary" className="w-full">
        <MessageCircle className="mr-2 h-5 w-5" />
        Pay via WhatsApp to Get Code
      </Button>
    </a>
  );
}
