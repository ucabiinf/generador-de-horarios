/**
 * Check if two time slots conflict
 */
export function hasTimeConflict(slot1, slot2) {
  // Different days = no conflict
  if (slot1.day !== slot2.day) return false;

  // Check overlap: !(end1 <= start2 || end2 <= start1)
  return !(slot1.endMinutes <= slot2.startMinutes || slot2.endMinutes <= slot1.startMinutes);
}

/**
 * Check if a section conflicts with any existing time slots
 */
export function sectionConflictsWithSlots(section, usedSlots) {
  for (const scheduleSlot of section.schedule) {
    for (const usedSlot of usedSlots) {
      if (hasTimeConflict(scheduleSlot, usedSlot)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Convert time in minutes to pixel position for calendar
 * Calendar starts at 7:00 (420 minutes) and each hour is 60px
 */
export function timeToPosition(minutes, startHour = 7, hourHeight = 60) {
  const startMinutes = startHour * 60;
  return ((minutes - startMinutes) / 60) * hourHeight;
}

/**
 * Calculate block height based on duration
 */
export function durationToHeight(startMinutes, endMinutes, hourHeight = 60) {
  return ((endMinutes - startMinutes) / 60) * hourHeight;
}

/**
 * Format time from minutes to HH:MM
 */
export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get color for a subject (consistent colors based on ID)
 */
const subjectColors = [
  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
  { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white' },
  { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-gray-900' },
  { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
];

export function getSubjectColor(subjectId, colorMap = new Map()) {
  if (!colorMap.has(subjectId)) {
    const index = colorMap.size % subjectColors.length;
    colorMap.set(subjectId, subjectColors[index]);
  }
  return colorMap.get(subjectId);
}

/**
 * Day configuration for calendar
 */
export const DAYS = [
  { id: 0, name: 'Lunes', abbrev: 'LUN', short: 'L' },
  { id: 1, name: 'Martes', abbrev: 'MAR', short: 'M' },
  { id: 2, name: 'Miércoles', abbrev: 'MIE', short: 'X' },
  { id: 3, name: 'Jueves', abbrev: 'JUE', short: 'J' },
  { id: 4, name: 'Viernes', abbrev: 'VIE', short: 'V' },
  { id: 5, name: 'Sábado', abbrev: 'SAB', short: 'S' },
];

/**
 * Generate hour labels for calendar (7am - 9pm)
 */
export function generateHourLabels(startHour = 7, endHour = 21) {
  const labels = [];
  for (let h = startHour; h <= endHour; h++) {
    labels.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`
    });
  }
  return labels;
}
