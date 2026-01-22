import { sectionConflictsWithSlots } from './timeUtils.js';

/**
 * Generate all valid schedule combinations using backtracking
 * @param {Object[]} subjects - Array of subjects to schedule
 * @param {Map} sectionsBySubject - Map of subjectId -> sections[]
 * @param {number} maxResults - Maximum combinations to generate (default 100)
 * @returns {Object[]} Array of valid schedule combinations
 */
export function generateSchedules(subjects, sectionsBySubject, maxResults = 100) {
  const results = [];

  // Filter subjects that have selected sections
  const validSubjects = subjects.filter(subj => {
    const sections = sectionsBySubject.get(subj.subjectId);
    return sections && sections.length > 0;
  });

  if (validSubjects.length === 0) {
    return results;
  }

  /**
   * Recursive backtracking function
   * @param {number} index - Current subject index
   * @param {Object[]} currentSchedule - Current combination of sections
   * @param {Object[]} usedTimeSlots - Array of used time slots
   */
  function backtrack(index, currentSchedule, usedTimeSlots) {
    // Stop if we have enough results
    if (results.length >= maxResults) return;

    // Base case: all subjects assigned
    if (index === validSubjects.length) {
      // Check if any section has no availability
      const hasFullSections = currentSchedule.some(s => !s.hasAvailability);

      results.push({
        sections: [...currentSchedule],
        hasFullSections,
        totalCredits: currentSchedule.length // Simplified
      });
      return;
    }

    const subject = validSubjects[index];
    const sections = sectionsBySubject.get(subject.subjectId) || [];

    // Try each section for this subject
    for (const section of sections) {
      // Check if this section conflicts with used slots
      if (!sectionConflictsWithSlots(section, usedTimeSlots)) {
        // Add section to current schedule
        currentSchedule.push({
          ...section,
          subjectName: subject.subjectName
        });

        // Add this section's time slots to used slots
        const newSlots = [...usedTimeSlots, ...section.schedule];

        // Recurse to next subject
        backtrack(index + 1, currentSchedule, newSlots);

        // Backtrack: remove section
        currentSchedule.pop();
      }
    }
  }

  // Start backtracking from first subject
  backtrack(0, [], []);

  return results;
}

/**
 * Check if generation would likely exceed limits
 * @param {Object[]} subjects - Subjects to check
 * @param {Map} sectionsBySubject - Sections map
 * @returns {{ totalCombinations: number, isLarge: boolean, warning: string|null }}
 */
export function estimateCombinations(subjects, sectionsBySubject) {
  let total = 1;

  for (const subject of subjects) {
    const sections = sectionsBySubject.get(subject.subjectId);
    if (sections && sections.length > 0) {
      total *= sections.length;
    }
  }

  const isLarge = total > 1000;
  const warning = isLarge
    ? `Se estiman ${total.toLocaleString()} combinaciones posibles. El cálculo puede tomar tiempo.`
    : null;

  return { totalCombinations: total, isLarge, warning };
}

/**
 * Sort schedule combinations by preference
 * Prefers schedules with available seats, then by earliest start time
 */
export function sortSchedules(schedules) {
  return [...schedules].sort((a, b) => {
    // Prefer schedules without full sections
    if (a.hasFullSections !== b.hasFullSections) {
      return a.hasFullSections ? 1 : -1;
    }

    // Then by total available seats
    const availA = a.sections.reduce((sum, s) => sum + s.disponibles, 0);
    const availB = b.sections.reduce((sum, s) => sum + s.disponibles, 0);

    return availB - availA;
  });
}
