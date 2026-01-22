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
  
  // Get available sections for each student subject
  let subjectsWithSections = $derived(() => {
    return studentSubjects.map(subj => {
      const sections = sectionsBySubject.get(subj.subjectId) || [];
      const availableSections = sections.filter(s => s.hasAvailability);
      return {
        ...subj,
        sections,
        availableSections,
        totalSections: sections.length,
        availableCount: availableSections.length
      };
    }).filter(s => s.totalSections > 0);
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

<div class="space-y-3">
  {#if subjectsWithSections().length === 0}
    <div class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-gray-500">No hay materias con secciones disponibles</p>
    </div>
  {:else}
    {#each subjectsWithSections() as subject}
      <div class="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
        <!-- Subject Header -->
        <div 
          class="p-4 flex items-center gap-4 cursor-pointer hover:bg-dark-700 transition-colors"
          onclick={() => toggleSubjectExpand(subject.subjectId)}
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center text-lg">
            {getSubjectIcon(subject.subjectId)}
          </div>
          
          <!-- Subject Name & Code -->
          <div class="flex-1">
            <div class="font-semibold text-lg">{subject.subjectName}</div>
            <div class="text-sm text-gray-500">{subject.credits || 3} Créditos • {subject.subjectId}</div>
          </div>
          
          <!-- Selection checkbox -->
          <label class="flex items-center gap-2" onclick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedSubjectIds.has(subject.subjectId)}
              onchange={() => toggleSubjectSelection(subject)}
              class="w-5 h-5 rounded bg-dark-600 border-dark-400 text-accent-blue focus:ring-accent-blue"
            />
          </label>
          
          <!-- Sections count -->
          <div class="flex items-center gap-2">
            <span class="text-sm bg-dark-600 px-2 py-1 rounded">{subject.totalSections} Secciones</span>
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
        
        <!-- Sections List (Expanded) -->
        {#if expandedSubjects.has(subject.subjectId)}
          <div class="border-t border-dark-600">
            <table class="w-full">
              <thead class="bg-dark-700">
                <tr class="text-xs text-gray-400 uppercase">
                  <th class="p-3 text-left w-16">Selec.</th>
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
                        class="w-4 h-4 rounded bg-dark-600 border-dark-400 text-accent-blue focus:ring-accent-blue"
                      />
                    </td>
                    <td class="p-3">
                      <span class="font-mono font-medium">{section.nrc}</span>
                    </td>
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-medium">
                          {section.profesor ? section.profesor.charAt(0) : '?'}
                        </div>
                        <span class="text-sm">{section.profesor || 'Por asignar'}</span>
                      </div>
                    </td>
                    <td class="p-3">
                      {#each formatSchedule(section.schedule) as slot}
                        <div class="flex items-center gap-2 text-sm">
                          <span class="font-medium text-accent-cyan">{slot.days.join(' / ')}</span>
                          <span class="text-gray-400">{slot.time}</span>
                        </div>
                      {/each}
                    </td>
                    <td class="p-3 text-right">
                      {#if section.hasAvailability}
                        {#if section.disponibles > 5}
                          <span class="badge-open">{section.disponibles} / {section.cupo} Abierto</span>
                        {:else}
                          <span class="badge-limited">{section.disponibles} / {section.cupo} Limitado</span>
                        {/if}
                      {:else}
                        <span class="badge-full">{section.inscritos} / {section.cupo} Lleno</span>
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
    
    <!-- Looking for more courses -->
    <div class="card text-center py-8 border-dashed border-2 border-dark-500">
      <div class="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </div>
      <p class="font-medium text-gray-400">¿Buscas más materias?</p>
      <p class="text-sm text-gray-500 mt-1">Contacta a tu coordinador académico para revisar tus prerrequisitos</p>
    </div>
  {/if}
</div>
