import { Activity } from '../types';

/**
 * TravelGenie Custom Library
 * 包含專案中通用的邏輯運算與格式化工具
 */

/**
 * 計算兩個日期之間的天數（包含起始日）
 */
export const calculateTripDuration = (startDateStr: string, endDateStr: string): number => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const timeDiff = end.getTime() - start.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  
  return days > 0 ? days : 0;
};

/**
 * 格式化金額顯示
 */
export const formatMoney = (amount: number, currencySymbol: string = '$'): string => {
  return `${currencySymbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * 根據活動類型回傳對應的 Tailwind CSS 顏色類別
 */
export const getActivityColorClass = (type: string): string => {
  switch (type) {
    case 'food': return 'bg-orange-400';
    case 'transport': return 'bg-blue-400';
    case 'sight': return 'bg-indigo-500';
    case 'flight': return 'bg-blue-600';
    default: return 'bg-gray-400';
  }
};

/**
 * 取得活動類型的中文名稱
 */
export const getActivityTypeName = (type: string): string => {
   switch (type) {
      case 'food': return '餐飲';
      case 'transport': return '交通';
      case 'sight': return '景點'; 
      case 'flight': return '航班';
      default: return '其他';
   }
};

/**
 * 解析時間字串為分鐘數 (從 00:00 開始)
 * 支援 "09:30", "09:30 AM", "9:30 PM"
 */
export const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    
    // Normalize string
    const normalized = timeStr.toUpperCase().trim();
    let [time, modifier] = normalized.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

/**
 * 將分鐘數轉換回時間字串 (HH:mm)
 */
export const formatTimeFromMinutes = (totalMinutes: number): string => {
    let h = Math.floor(totalMinutes / 60) % 24; // Handle overflow past midnight roughly
    let m = totalMinutes % 60;
    
    // Format to HH:mm 24-hour format for simplicity in logic, 
    // UI can convert to AM/PM if needed, but keeping 24h is standard for transport apps
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}:${mStr}`;
};

/**
 * 重新計算一整天的行程時間軸
 * @param activities 當天的活動列表
 * @param startTimeStr 第一個活動的開始時間 (預設 "09:00")
 */
export const recalculateTimeline = (activities: Activity[]): Activity[] => {
    if (activities.length === 0) return [];

    let currentMinutes = parseTime(activities[0].time);

    return activities.map((activity, index) => {
        // Skip recalculating the very first activity to respect its set start time,
        // unless we want to force a start time. 
        // Logic: Set current activity time to current cursor, then add duration for next.
        
        // If it's a flight, we usually trust the flight time and jump the cursor to arrival time
        if (activity.type === 'flight' && activity.flightDetails) {
            const startT = activity.time;
            const endT = activity.flightDetails.arrivalTime;
            // Update cursor to arrival time + 30 mins buffer
            currentMinutes = parseTime(endT) + 60; // +60 mins for immigration/baggage
            return activity;
        }

        // For normal activities
        const newTime = formatTimeFromMinutes(currentMinutes);
        
        // Update cursor for the NEXT activity
        currentMinutes += activity.durationMinutes;
        
        // Add a small travel buffer (e.g. 15 mins) if type is sight or food, unless next is transport
        if (activity.type !== 'transport') {
            currentMinutes += 15;
        }

        return {
            ...activity,
            time: newTime
        };
    });
};
