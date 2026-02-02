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
    <div class="card text-center py-16">
      <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-theme-tertiary flex items-center justify-center">
        <svg class="w-10 h-10 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p class="text-theme-muted text-lg">No hay materias con secciones disponibles</p>
    </div>
  {:else}
    {#each semesters() as group}
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="h-px flex-1 bg-gradient-to-r from-transparent via-theme to-transparent" style="background: linear-gradient(90deg, transparent, var(--border-default), transparent);"></div>
          <h3 class="text-sm font-bold text-theme-muted uppercase tracking-widest px-3 py-1.5 bg-theme-tertiary rounded-full border border-theme">
            {group.semester === 0 ? 'Preliminar' : `Semestre ${group.semester}`}
          </h3>
          <div class="h-px flex-1 bg-gradient-to-r from-transparent via-theme to-transparent" style="background: linear-gradient(90deg, transparent, var(--border-default), transparent);"></div>
        </div>
        
        <div class="space-y-3">
          {#each group.subjects as subject}
            <div class="card overflow-hidden hover-lift">
              <!-- Subject Header -->
              <div 
                class="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 cursor-pointer hover:bg-theme-tertiary transition-all rounded-xl"
                onclick={() => toggleSubjectExpand(subject.subjectId)}
                onkeydown={(e) => e.key === 'Enter' && toggleSubjectExpand(subject.subjectId)}
                role="button"
                tabindex="0"
              >
                <!-- Icon -->
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center text-xl flex-shrink-0 border border-accent-blue/30">
                  {getSubjectIcon(subject.subjectId)}
                </div>
                
                <!-- Subject Name & Code -->
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <div class="font-bold text-base sm:text-lg leading-tight text-theme-primary">{subject.subjectName}</div>
                    <span class="px-2.5 py-0.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-lg text-[10px] font-bold uppercase">
                      {subject.semester === 0 ? 'Prelim' : `Sem ${subject.semester}`}
                    </span>
                  </div>
                  <div class="text-xs sm:text-sm text-theme-muted">{subject.credits || 0} Créditos • {subject.subjectId}</div>
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
                  
                  <div class="flex items-center gap-3">
                    <span class="text-xs sm:text-sm bg-theme-tertiary px-3 py-1.5 rounded-lg font-medium border border-theme">{subject.totalSections} Secciones</span>
                    <svg 
                      class="w-5 h-5 transition-transform duration-300 text-theme-muted {expandedSubjects.has(subject.subjectId) ? 'rotate-180' : ''}" 
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
                <div class="border-t border-theme sm:hidden">
                  <div class="p-3 space-y-2">
                    {#each subject.sections as section}
                      <div 
                        class="p-4 rounded-xl border transition-all cursor-pointer
                          {isSectionSelected(section.nrc) 
                            ? 'bg-accent-blue/10 border-accent-blue/50 shadow-glow' 
                            : 'bg-theme-tertiary border-theme hover:border-accent-blue/30'}"
                        onclick={() => toggleSectionSelection(section, subject)}
                        onkeydown={(e) => e.key === 'Enter' && toggleSectionSelection(section, subject)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <!-- NRC and Availability -->
                            <div class="flex items-center gap-2 mb-3">
                              <span class="font-mono font-bold text-accent-blue text-lg">{section.nrc}</span>
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
                            <div class="flex items-center gap-2 mb-3">
                              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {section.profesor ? section.profesor.charAt(0) : '?'}
                              </div>
                              <span class="text-sm text-theme-primary truncate">{section.profesor || 'Por asignar'}</span>
                            </div>
                            
                            <!-- Schedule -->
                            <div class="flex flex-wrap gap-1.5">
                              {#each formatSchedule(section.schedule) as slot}
                                <span class="text-xs bg-theme-elevated px-2.5 py-1 rounded-lg border border-theme">
                                  <span class="text-accent-cyan font-semibold">{slot.days.join('/')}</span>
                                  <span class="text-theme-muted ml-1">{slot.time}</span>
                                </span>
                              {/each}
                            </div>
                          </div>
                          
                          <!-- Selection indicator -->
                          <div class="flex-shrink-0 mt-1">
                            {#if isSectionSelected(section.nrc)}
                              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center shadow-glow">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            {:else}
                              <div class="w-7 h-7 rounded-full border-2 border-theme"></div>
                            {/if}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Desktop Table View -->
                <div class="border-t border-theme hidden sm:block overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-theme-tertiary">
                      <tr class="text-xs text-theme-muted uppercase">
                        <th class="p-4 text-left w-16">Sel.</th>
                        <th class="p-4 text-left">NRC</th>
                        <th class="p-4 text-left">Profesor</th>
                        <th class="p-4 text-left">Horario</th>
                        <th class="p-4 text-right">Cupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each subject.sections as section}
                        <tr 
                          class="border-t border-theme hover:bg-theme-tertiary transition-colors cursor-pointer
                            {isSectionSelected(section.nrc) ? 'bg-accent-blue/5' : ''}"
                          onclick={() => toggleSectionSelection(section, subject)}
                        >
                          <td class="p-4" onclick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSectionSelected(section.nrc)}
                              onchange={() => toggleSectionSelection(section, subject)}
                              class="custom-checkbox-sm"
                            />
                          </td>
                          <td class="p-4">
                            <span class="font-mono font-bold text-sm text-accent-blue">{section.nrc}</span>
                          </td>
                          <td class="p-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {section.profesor ? section.profesor.charAt(0) : '?'}
                              </div>
                              <span class="text-sm text-theme-primary">{section.profesor || 'Por asignar'}</span>
                            </div>
                          </td>
                          <td class="p-4">
                            {#each formatSchedule(section.schedule) as slot}
                              <div class="flex items-center gap-2 text-sm mb-1">
                                <span class="font-semibold text-accent-cyan">{slot.days.join('/')}</span>
                                <span class="text-theme-muted whitespace-nowrap">{slot.time}</span>
                              </div>
                            {/each}
                          </td>
                          <td class="p-4 text-right">
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
