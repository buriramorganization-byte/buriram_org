const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxJUK8UiGq6e5JPnuspuEGKZmckrDpuva8MWupFQ0Qmszy0NAybJMuKZ516B69gwN6l/exec";

export interface GoogleSheetBookingPayload {
  squadName: string;
  ign: string;
  phoneNumber: string;
  tournamentTitle?: string;
  status?: string;
}

/**
 * 1. Slot Booking Sync (POST):
 * Sends POST request to Google Sheet WebApp URL when a slot is booked.
 * Includes Squad Name, IGN, Phone Number, and Status ("Paid").
 */
export async function syncSlotBookingToGoogleSheet(payload: GoogleSheetBookingPayload): Promise<boolean> {
  try {
    const postData = {
      squadName: payload.squadName,
      "Squad Name": payload.squadName,
      teamName: payload.squadName,
      ign: payload.ign,
      "IGN": payload.ign,
      phoneNumber: payload.phoneNumber,
      "Phone Number": payload.phoneNumber,
      status: payload.status || "Paid",
      "Status": payload.status || "Paid",
      tournamentTitle: payload.tournamentTitle || "Tournament Match",
      timestamp: new Date().toISOString()
    };

    // Google Apps Script accepts text/plain JSON payload with no-cors mode to prevent CORS issues
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(postData)
    });

    console.log("Slot booking synced to Google Sheet:", postData);
    return true;
  } catch (error) {
    console.warn("Failed to sync slot booking to Google Sheet:", error);
    return false;
  }
}

/**
 * 2. Slot Availability Check (GET):
 * Sends GET request to Google Sheet WebApp URL on website load.
 * Returns total filled slots count or row list from Google Sheet.
 */
export async function fetchGoogleSheetSlotData(): Promise<{ bookedSlots?: number; data?: any[] } | null> {
  try {
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) return null;
    const json = await response.json();

    if (typeof json === "number") {
      return { bookedSlots: json };
    } else if (Array.isArray(json)) {
      return { bookedSlots: json.length, data: json };
    } else if (json && typeof json === "object") {
      const bookedSlots = json.bookedSlots ?? json.filledSlots ?? json.count ?? (Array.isArray(json.rows) ? json.rows.length : undefined);
      return { bookedSlots, data: json.data || json.rows };
    }
    return null;
  } catch (error) {
    console.warn("Error fetching slot availability from Google Sheet:", error);
    return null;
  }
}
