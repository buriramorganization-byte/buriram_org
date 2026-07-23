export function formatTimeBilingual(dateStr: string, isBengali: boolean): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert hours to 12-hour format
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

  if (!isBengali) {
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  // Bengali formatting
  let period = "";
  if (hours >= 5 && hours < 12) {
    period = "সকাল";
  } else if (hours >= 12 && hours < 15) {
    period = "দুপুর";
  } else if (hours >= 15 && hours < 18) {
    period = "বিকেল";
  } else if (hours >= 18 && hours < 20) {
    period = "সন্ধ্যা";
  } else {
    period = "রাত";
  }

  // Convert numerals to Bengali
  const bengaliNumerals: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    ':': ':'
  };

  const formattedTime = `${displayHours}:${displayMinutes}`.split('').map(char => bengaliNumerals[char] || char).join('');

  return `${period} ${formattedTime} টা`;
}

export function formatDhakaTime(dateStr: string, isBengali: boolean): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    let hour = 12;
    let minute = "00";
    for (const part of parts) {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "minute") minute = part.value;
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHours = hour % 12 || 12;

    if (!isBengali) {
      return `${displayHours}:${minute} ${ampm}`;
    }

    let period = "";
    if (hour >= 5 && hour < 12) {
      period = "সকাল";
    } else if (hour >= 12 && hour < 15) {
      period = "দুপুর";
    } else if (hour >= 15 && hour < 18) {
      period = "বিকেল";
    } else if (hour >= 18 && hour < 20) {
      period = "সন্ধ্যা";
    } else {
      period = "রাত";
    }

    const formattedTime = `${displayHours}:${minute}`.split('').map(char => {
      const bengaliNumerals: Record<string, string> = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
        ':': ':'
      };
      return bengaliNumerals[char] || char;
    }).join('');

    return `${period} ${formattedTime} টা`;
  } catch (error) {
    return formatTimeBilingual(dateStr, isBengali);
  }
}

export function formatDhakaDate(dateStr: string, isBengali: boolean): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const formatted = formatter.format(d); // e.g. "Jul 20, 2026"
    if (!isBengali) return formatted;

    const monthsMap: Record<string, string> = {
      'Jan': 'জানু', 'Feb': 'ফেব্রু', 'Mar': 'মার্চ', 'Apr': 'এপ্রিল',
      'May': 'মে', 'Jun': 'জুন', 'Jul': 'জুলাই', 'Aug': 'আগস্ট',
      'Sep': 'সেপ্টে', 'Oct': 'অক্টো', 'Nov': 'নভে', 'Dec': 'ডিসে'
    };
    
    let result = formatted;
    Object.entries(monthsMap).forEach(([en, bn]) => {
      result = result.replace(en, bn);
    });

    return convertToBengaliNumbers(result);
  } catch (e) {
    return dateStr;
  }
}

export function formatShortDateTime(dateStr: string, isBengali: boolean): string {
  const dateFormatted = formatDhakaDate(dateStr, isBengali);
  const timeFormatted = formatDhakaTime(dateStr, isBengali);
  return `${dateFormatted}, ${timeFormatted}`;
}

export function convertToBengaliNumbers(num: number | string): string {
  const bengaliNumerals: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().split('').map(char => bengaliNumerals[char] || char).join('');
}

export function getMapDisplayName(mapName?: string, isBengali?: boolean): string {
  if (!mapName) return isBengali ? "বারমুডা" : "Bermuda";
  
  const maps = mapName.split(",").map(m => m.trim()).filter(Boolean);
  const mapTranslations: Record<string, { en: string; bn: string }> = {
    "Bermuda": { en: "Bermuda", bn: "বারমুডা" },
    "Purgatory": { en: "Purgatory", bn: "পারগেটরি" },
    "Kalahari": { en: "Kalahari", bn: "কালাহারি" },
    "Alpine": { en: "Alpine", bn: "আলপাইন" },
    "NeXTera": { en: "NeXTera", bn: "নেক্সটএরা" },
    "Custom / Other": { en: "Custom / Other", bn: "কাস্টম/অন্যান্য" },
    "Custom": { en: "Custom", bn: "কাস্টম" }
  };

  const translated = maps.map(m => {
    if (mapTranslations[m]) {
      return isBengali ? mapTranslations[m].bn : mapTranslations[m].en;
    }
    return m;
  });

  return translated.join(", ");
}
