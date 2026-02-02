<script>
  import { groupSectionsBySubject, formatScheduleDisplay } from '../csvParser.js';
  
  let { 
    studentSubjects = [],
    allSections = [],
    selectedSections = $bindable([]),
    onSelectionChange = () => {}
  } = $props();
  
  let expandedSubjects = $state(new Set());
  let selectedSubjectIds = $state(new Set());
  
  // Group sections by subject ID
  let sectionsBySubject = $derived(groupSectionsBySubject(allSections));
  
  // Get available sections for each student subject grouped by semester
  let semesters = $derived(() => {
    // 1. Map existing student subjects
    const subjects = studentSubjects.map(subj => {
      const sections = sectionsBySubject.get(subj.subjectId) || [];
      const availableSections = sections.filter(s => s.hasAvailability);
      const semester = sections[0]?.semester || 0;
      const subjectName = sections[0]?.subjectName || subj.subjectName;
      
      return {
        ...subj,
        subjectName,
        semester,
        sections,
        availableSections,
        totalSections: sections.length,
        availableCount: availableSections.length
      };
    });

    // 2. Find any "P" (Lab) versions of those subjects in allSections
    const studentSubjectIds = new Set(studentSubjects.map(s => s.subjectId));
    
    for (const [subjectId, sections] of sectionsBySubject.entries()) {
      if (subjectId.includes('-P')) {
        const theoryId = subjectId.replace('-P', '-0');
        if (studentSubjectIds.has(theoryId) && !studentSubjectIds.has(subjectId)) {
          const availableSections = sections.filter(s => s.hasAvailability);
          subjects.push({
            subjectId,
            subjectName: sections[0]?.subjectName || `${subjectId} (Práctica)`,
            semester: sections[0]?.semester || 0,
            credits: 0,
            sections,
            availableSections,
            totalSections: sections.length,
            availableCount: availableSections.length
          });
        }
      }
    }
    
    // 3. Group by semester
    const grouped = new Map();
    subjects.filter(s => s.totalSections > 0).forEach(s => {
      const sem = s.semester !== null && s.semester !== undefined ? s.semester : 11; // Fallback for unknown
      if (!grouped.has(sem)) grouped.set(sem, []);
      grouped.get(sem).push(s);
    });
    
    // Sort semesters and their subjects
    return Array.from(grouped.entries())
      .map(([semester, subjects]) => ({
        semester,
        subjects: subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      }))
      .sort((a, b) => a.semester - b.semester);
  });
  
  function toggleSubjectExpand(subjectId) {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId);
    } else {
      newSet.add(subjectId);
    }
    expandedSubjects = newSet;
  }
  
  function toggleSubjectSelection(subject) {
    const newSelectedIds = new Set(selectedSubjectIds);
    const newSelectedSections = [...selectedSections];
    
    if (newSelectedIds.has(subject.subjectId)) {
      newSelectedIds.delete(subject.subjectId);
      const remaining = newSelectedSections.filter(s => s.subjectId !== subject.subjectId);
      selectedSections = remaining;
    } else {
      newSelectedIds.add(subject.subjectId);
      const filtered = newSelectedSections.filter(s => s.subjectId !== subject.subjectId);
      const sectionsToAdd = subject.sections.filter(s => s.hasAvailability);
      selectedSections = [...filtered, ...sectionsToAdd];
    }
    
    selectedSubjectIds = newSelectedIds;
    onSelectionChange(selectedSections);
  }
  
  function toggleSectionSelection(section, subject) {
    const newSelectedSections = [...selectedSections];
    const index = newSelectedSections.findIndex(s => s.nrc === section.nrc);
    
    if (index >= 0) {
      newSelectedSections.splice(index, 1);
    } else {
      newSelectedSections.push(section);
    }
    
    selectedSections = newSelectedSections;
    
    const subjectSectionsSelected = newSelectedSections.filter(s => s.subjectId === subject.subjectId);
    if (subjectSectionsSelected.length > 0) {
      selectedSubjectIds = new Set([...selectedSubjectIds, subject.subjectId]);
    } else {
      const newIds = new Set(selectedSubjectIds);
      newIds.delete(subject.subjectId);
      selectedSubjectIds = newIds;
    }
    
    onSelectionChange(selectedSections);
  }
  
  function isSectionSelected(nrc) {
    return selectedSections.some(s => s.nrc === nrc);
  }
  
  function formatSchedule(schedule) {
    // Group by time
    const byTime = {};
    for (const slot of schedule) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!byTime[key]) {
        byTime[key] = { time: `${slot.startTime} - ${slot.endTime}`, days: [] };
      }
      byTime[key].days.push(slot.dayAbbrev);
    }
    return Object.values(byTime);
  }
  
  function getSubjectIcon(subjectId) {
    if (subjectId.startsWith('INFO')) return '💻';
    if (subjectId.startsWith('FING')) return '📐';
    if (subjectId.startsWith('MATH')) return '∑';
    if (subjectId.startsWith('PHYS')) return '⚛️';
    return '📚';
  }
</script>

<div class="space-y-8">
  {#if semesters().length === 0}
    <div class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-gray-500">No hay materias con secciones disponibles</p>
    </div>
  {:else}
    {#each semesters() as group}
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-dark-600"></div>
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {group.semester === 0 ? 'Preliminar' : `Semestre ${group.semester}`}
          </h3>
          <div class="h-px flex-1 bg-dark-600"></div>
        </div>
        
        <div class="space-y-3">
          {#each group.subjects as subject}
            <div class="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
              <!-- Subject Header -->
              <div 
                class="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 cursor-pointer hover:bg-dark-700 transition-colors"
                onclick={() => toggleSubjectExpand(subject.subjectId)}
                onkeydown={(e) => e.key === 'Enter' && toggleSubjectExpand(subject.subjectId)}
                role="button"
                tabindex="0"
              >
                <!-- Icon -->
                <div class="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center text-lg flex-shrink-0">
                  {getSubjectIcon(subject.subjectId)}
                </div>
                
                <!-- Subject Name & Code -->
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-0.5">
                    <div class="font-semibold text-base sm:text-lg leading-tight">{subject.subjectName}</div>
                    <span class="px-2 py-0.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded text-[10px] font-bold uppercase">
                      {subject.semester === 0 ? 'Prelim' : `Sem ${subject.semester}`}
                    </span>
                  </div>
                  <div class="text-xs sm:text-sm text-gray-500">{subject.credits || 0} Créditos • {subject.subjectId}</div>
                </div>
                
                <!-- Selection checkbox & sections count -->
                <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div class="flex items-center gap-2" onclick={(e) => e.stopPropagation()} role="group">
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.has(subject.subjectId)}
                      onchange={() => toggleSubjectSelection(subject)}
                      class="custom-checkbox"
                      aria-label="Seleccionar materia"
                    />
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-xs sm:text-sm bg-dark-600 px-2 py-1 rounded">{subject.totalSections} Secciones</span>
                    <svg 
                      class="w-5 h-5 transition-transform {expandedSubjects.has(subject.subjectId) ? 'rotate-180' : ''}" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- Sections List (Expanded) -->
              {#if expandedSubjects.has(subject.subjectId)}
                <!-- Mobile Card View -->
                <div class="border-t border-dark-600 sm:hidden">
                  <div class="p-2 space-y-2">
                    {#each subject.sections as section}
                      <div 
                        class="p-3 rounded-lg border transition-colors cursor-pointer
                          {isSectionSelected(section.nrc) 
                            ? 'bg-accent-blue/20 border-accent-blue/50' 
                            : 'bg-dark-700 border-dark-600 hover:border-dark-500'}"
                        onclick={() => toggleSectionSelection(section, subject)}
                        onkeydown={(e) => e.key === 'Enter' && toggleSectionSelection(section, subject)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <!-- NRC and Availability -->
                            <div class="flex items-center gap-2 mb-2">
                              <span class="font-mono font-bold text-accent-blue">{section.nrc}</span>
                              {#if section.hasAvailability}
                                {#if section.disponibles > 5}
                                  <span class="badge-open text-[10px]">{section.disponibles} cupos</span>
                                {:else}
                                  <span class="badge-limited text-[10px]">{section.disponibles} cupos</span>
                                {/if}
                              {:else}
                                <span class="badge-full text-[10px]">Lleno</span>
                              {/if}
                            </div>
                            
                            <!-- Professor -->
                            <div class="flex items-center gap-2 mb-2">
                              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                {section.profesor ? section.profesor.charAt(0) : '?'}
                              </div>
                              <span class="text-sm text-gray-300 truncate">{section.profesor || 'Por asignar'}</span>
                            </div>
                            
                            <!-- Schedule -->
                            <div class="flex flex-wrap gap-1">
                              {#each formatSchedule(section.schedule) as slot}
                                <span class="text-xs bg-dark-600 px-2 py-0.5 rounded">
                                  <span class="text-accent-cyan font-medium">{slot.days.join('/')}</span>
                                  <span class="text-gray-400 ml-1">{slot.time}</span>
                                </span>
                              {/each}
                            </div>
                          </div>
                          
                          <!-- Selection indicator -->
                          <div class="flex-shrink-0 mt-1">
                            {#if isSectionSelected(section.nrc)}
                              <div class="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            {:else}
                              <div class="w-6 h-6 rounded-full border-2 border-dark-500"></div>
                            {/if}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Desktop Table View -->
                <div class="border-t border-dark-600 hidden sm:block overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-dark-700">
                      <tr class="text-xs text-gray-400 uppercase">
                        <th class="p-3 text-left w-16">Sel.</th>
                        <th class="p-3 text-left">NRC</th>
                        <th class="p-3 text-left">Profesor</th>
                        <th class="p-3 text-left">Horario</th>
                        <th class="p-3 text-right">Cupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each subject.sections as section}
                        <tr 
                          class="border-t border-dark-700 hover:bg-dark-700/50 transition-colors
                            {isSectionSelected(section.nrc) ? 'bg-accent-blue/10' : ''}"
                        >
                          <td class="p-3">
                            <input
                              type="checkbox"
                              checked={isSectionSelected(section.nrc)}
                              onchange={() => toggleSectionSelection(section, subject)}
                              class="custom-checkbox-sm"
                            />
                          </td>
                          <td class="p-3">
                            <span class="font-mono font-medium text-sm">{section.nrc}</span>
                          </td>
                          <td class="p-3">
                            <div class="flex items-center gap-2">
                              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {section.profesor ? section.profesor.charAt(0) : '?'}
                              </div>
                              <span class="text-sm">{section.profesor || 'Por asignar'}</span>
                            </div>
                          </td>
                          <td class="p-3">
                            {#each formatSchedule(section.schedule) as slot}
                              <div class="flex items-center gap-2 text-sm">
                                <span class="font-medium text-accent-cyan">{slot.days.join('/')}</span>
                                <span class="text-gray-400 whitespace-nowrap">{slot.time}</span>
                              </div>
                            {/each}
                          </td>
                          <td class="p-3 text-right">
                            {#if section.hasAvailability}
                              {#if section.disponibles > 5}
                                <span class="badge-open">{section.disponibles}/{section.cupo}</span>
                              {:else}
                                <span class="badge-limited">{section.disponibles}/{section.cupo}</span>
                              {/if}
                            {:else}
                              <span class="badge-full">{section.inscritos}/{section.cupo}</span>
                            {/if}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
