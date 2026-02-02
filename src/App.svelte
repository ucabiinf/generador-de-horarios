<script>
  import StudentSearch from './lib/components/StudentSearch.svelte';
  import SubjectSelector from './lib/components/SubjectSelector.svelte';
  import ScheduleCarousel from './lib/components/ScheduleCarousel.svelte';
  import { generateSchedules, estimateCombinations, sortSchedules } from './lib/scheduleGenerator.js';
  
  // Step management
  let currentStep = $state(1); // 1: Search, 2: Selection, 3: Results
  
  // Mobile sidebar state
  let isMobileSidebarOpen = $state(false);
  
  // Global state using Svelte 5 Runes
  let allSections = $state([]);
  
  let selectedStudent = $state(null);
  let selectedSections = $state([]);
  let generatedSchedules = $state([]);
  let colorMap = $state(new Map());
  
  let isGenerating = $state(false);
  let generationWarning = $state('');
  let generationError = $state('');
  
  // Derived states - dataLoaded is true when student is found (API handles data loading)
  let canProceedToStep2 = $derived(selectedStudent !== null);
  let canProceedToStep3 = $derived(selectedSections.length > 0);
  
  // Calculate total credits from selected sections
  let totalCredits = $derived(() => {
    const subjectCredits = new Map();
    for (const section of selectedSections) {
      if (!subjectCredits.has(section.subjectId)) {
        const subject = selectedStudent?.subjects.find(s => s.subjectId === section.subjectId);
        subjectCredits.set(section.subjectId, subject?.credits || 3);
      }
    }
    return Array.from(subjectCredits.values()).reduce((sum, c) => sum + c, 0);
  });
  
  // Group selected sections by subject for algorithm
  let sectionsBySubject = $derived(() => {
    const grouped = new Map();
    for (const section of selectedSections) {
      if (!grouped.has(section.subjectId)) {
        grouped.set(section.subjectId, []);
      }
      grouped.get(section.subjectId).push(section);
    }
    return grouped;
  });
  
  // Get unique subjects from selected sections
  let selectedSubjects = $derived(() => {
    if (!selectedStudent) return [];
    const subjectIds = new Set(selectedSections.map(s => s.subjectId));
    return selectedStudent.subjects.filter(s => subjectIds.has(s.subjectId));
  });
  
  // Unique subjects selected (for sidebar)
  let uniqueSelectedSubjects = $derived(() => {
    if (!selectedStudent) return [];
    const seen = new Set();
    const result = [];
    for (const section of selectedSections) {
      if (!seen.has(section.subjectId)) {
        seen.add(section.subjectId);
        const studentSubj = selectedStudent.subjects.find(s => s.subjectId === section.subjectId);
        if (studentSubj || section.subjectName) {
          result.push({
            subjectId: section.subjectId,
            subjectName: section.subjectName || studentSubj?.subjectName || section.subjectId,
            credits: section.credits || studentSubj?.credits || 0,
            sectionsCount: selectedSections.filter(s => s.subjectId === section.subjectId).length
          });
        }
      }
    }
    return result;
  });
  
  function handleSectionsLoaded(sections) {
    allSections = sections;
    selectedSections = [];
    generatedSchedules = [];
  }
  
  function handleStudentFound(student) {
    selectedStudent = student;
    selectedSections = [];
    generatedSchedules = [];
  }
  
  function handleSelectionChange(sections) {
    selectedSections = sections;
    generatedSchedules = [];
    generationWarning = '';
    generationError = '';
  }
  
  function goToStep(step) {
    if (step === 2 && !canProceedToStep2) return;
    if (step === 3 && !canProceedToStep3) return;
    currentStep = step;
    
    // Auto-generate when entering step 3
    if (step === 3 && generatedSchedules.length === 0) {
      handleGenerateSchedules();
    }
  }
  
  function handleGenerateSchedules() {
    if (!canProceedToStep3) return;
    
    isGenerating = true;
    generationError = '';
    generationWarning = '';
    
    const estimate = estimateCombinations(selectedSubjects(), sectionsBySubject());
    if (estimate.warning) {
      generationWarning = estimate.warning;
    }
    
    setTimeout(() => {
      try {
        const results = generateSchedules(
          selectedSubjects(),
          sectionsBySubject(),
          100
        );
        
        generatedSchedules = sortSchedules(results);
        
        if (results.length === 0) {
          generationError = 'No se encontraron combinaciones sin conflictos de horario.';
        } else if (results.length >= 100) {
          generationWarning = `Se muestran las primeras 100 combinaciones de ${estimate.totalCombinations.toLocaleString()} posibles.`;
        }
        
        colorMap = new Map();
        
      } catch (error) {
        generationError = 'Error al generar horarios: ' + error.message;
      }
      
      isGenerating = false;
    }, 100);
  }
  
  function getSemesterName(semester) {
    if (semester >= 9) return 'Quinto Año';
    if (semester >= 7) return 'Cuarto Año';
    if (semester >= 5) return 'Tercer Año';
    if (semester >= 3) return 'Segundo Año';
    return 'Primer Año';
  }
  
  // Total UC for the career
  const TOTAL_CAREER_UC = 265;
</script>

<div class="min-h-screen bg-dark-900 flex flex-col">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
      <div class="flex items-center justify-between gap-2">
        <!-- Logo & Title - Hidden on very small screens, compact on mobile -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="hidden xs:flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h1 class="text-sm sm:text-lg font-bold truncate">
              <span class="sm:hidden">Planificador</span>
              <span class="hidden sm:inline">Planificador Académico</span>
            </h1>
            <p class="text-xs text-gray-400 hidden md:block">Semestre 2024-1</p>
          </div>
        </div>
        
        <!-- Step Indicators - Compact on mobile -->
        <div class="flex items-center gap-1 sm:gap-2">
          {#each [1, 2, 3] as step}
            <button
              onclick={() => goToStep(step)}
              disabled={(step === 2 && !canProceedToStep2) || (step === 3 && !canProceedToStep3)}
              class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all text-sm
                {currentStep === step ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}
                {((step === 2 && !canProceedToStep2) || (step === 3 && !canProceedToStep3)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
              aria-label="Paso {step}"
            >
              <span class="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0
                {currentStep === step ? 'bg-white text-accent-blue' : 'bg-dark-500'}">
                {step}
              </span>
              <span class="hidden lg:block">
                {#if step === 1}Datos
                {:else if step === 2}Selección
                {:else}Horarios
                {/if}
              </span>
            </button>
          {/each}
        </div>
        
        <!-- Action Button -->
        {#if currentStep === 2 && canProceedToStep3}
          <button onclick={() => goToStep(3)} class="btn-primary text-sm px-2 sm:px-4 py-1.5 sm:py-2">
            <span class="hidden sm:inline">Generar</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        {:else if currentStep === 1 && canProceedToStep2}
          <button onclick={() => goToStep(2)} class="btn-primary text-sm px-2 sm:px-4 py-1.5 sm:py-2">
            <span class="hidden sm:inline">Continuar</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        {:else}
          <div class="w-8 sm:w-32"></div>
        {/if}
      </div>
    </div>
  </header>
  
  <main class="flex-1">
    <!-- STEP 1: Student Search -->
    {#if currentStep === 1}
      <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <StudentSearch
          onStudentFound={handleStudentFound}
          onSectionsLoaded={handleSectionsLoaded}
        />
        
        {#if selectedStudent}
          <!-- Student Info Card (like mockup 1) -->
          <div class="card p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <!-- Avatar -->
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-xl sm:text-2xl font-bold relative flex-shrink-0">
                {selectedStudent.name.charAt(0)}
                <div class="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-dark-800"></div>
              </div>
              
              <!-- Info -->
              <div class="flex-1 w-full text-center sm:text-left">
                <div class="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-2 gap-2">
                  <div>
                    <h3 class="text-lg sm:text-xl font-bold">{selectedStudent.name}</h3>
                    <p class="text-gray-400 text-sm sm:text-base">{selectedStudent.career}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                    <span class="px-2 sm:px-3 py-1 bg-dark-600 rounded-lg text-xs sm:text-sm">ID: {selectedStudent.studentId}</span>
                    <span class="badge-open">{selectedStudent.status}</span>
                  </div>
                </div>
                
                <!-- Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 py-4 border-t border-b border-dark-600">
                  <div>
                    <div class="text-xs text-gray-500 uppercase">Promedio</div>
                    <div class="text-xl sm:text-2xl font-bold">{selectedStudent.gpa.toFixed(2)}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 uppercase">Créditos</div>
                    <div class="text-xl sm:text-2xl font-bold">{selectedStudent.accumulatedCredits}<span class="text-xs sm:text-sm text-gray-400">/{TOTAL_CAREER_UC}</span></div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 uppercase">Semestre</div>
                    <div class="text-xl sm:text-2xl font-bold">{selectedStudent.semester}°</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 uppercase">Nivel</div>
                    <div class="text-lg sm:text-2xl font-bold">{getSemesterName(selectedStudent.semester)}</div>
                  </div>
                </div>
                
                <!-- Progress -->
                <div class="mt-4">
                  <div class="flex items-center justify-between text-sm mb-2">
                    <span class="text-gray-400">Progreso de Carrera</span>
                    <span class="text-accent-cyan">{Math.round((selectedStudent.accumulatedCredits / TOTAL_CAREER_UC) * 100)}%</span>
                  </div>
                  <div class="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all"
                      style="width: {Math.min((selectedStudent.accumulatedCredits / TOTAL_CAREER_UC) * 100, 100)}%"
                    ></div>
                  </div>
                </div>
                
                <!-- Subject count -->
                <div class="mt-4 flex items-center justify-center sm:justify-start gap-6 text-sm">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <span><strong>{selectedStudent.subjects.length}</strong> materias disponibles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- STEP 2: Course Selection -->
    {#if currentStep === 2}
      <div class="flex flex-col lg:flex-row h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] relative">
        <!-- Mobile Sidebar Toggle -->
        <button 
          onclick={() => isMobileSidebarOpen = !isMobileSidebarOpen}
          class="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-accent-blue rounded-full shadow-lg flex items-center justify-center text-white"
          aria-label="Toggle Navigation"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          {#if uniqueSelectedSubjects().length > 0}
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center">
              {uniqueSelectedSubjects().length}
            </span>
          {/if}
        </button>
        
        <!-- Mobile Overlay -->
        {#if isMobileSidebarOpen}
          <div 
            class="lg:hidden fixed inset-0 bg-black/50 z-40"
            onclick={() => isMobileSidebarOpen = false}
             onkeydown={(e) => e.key === 'Escape' && (isMobileSidebarOpen = false)}
             role="button"
             tabindex="0"
             aria-label="Close Sidebar"
          ></div>
        {/if}
        
        <!-- Sidebar - Selected Subjects -->
        <aside class="
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-72 sm:w-80 lg:w-64 bg-dark-800 border-r border-dark-600 flex flex-col
          transform transition-transform duration-300 ease-in-out
          {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ">
          <div class="p-4 border-b border-dark-600 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-sm text-gray-400 uppercase">Materias Seleccionadas</h3>
              <p class="text-xs text-gray-500 mt-1">Basado en prerrequisitos</p>
            </div>
            <button 
              onclick={() => isMobileSidebarOpen = false}
              class="lg:hidden p-2 hover:bg-dark-700 rounded-lg"
              aria-label="Cerrar barra lateral"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2">
            {#if uniqueSelectedSubjects().length === 0}
              <div class="text-center py-8 text-gray-500 text-sm">
                <p>No has seleccionado materias</p>
              </div>
            {:else}
              {#each uniqueSelectedSubjects() as subject}
                <div class="flex items-center gap-3 p-3 rounded-lg bg-dark-700 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{subject.subjectName}</div>
                    <div class="text-xs text-gray-500">{subject.subjectId}</div>
                  </div>
                  <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              {/each}
            {/if}
          </div>
          
          <!-- Credits Progress -->
          <div class="p-4 border-t border-dark-600">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="font-medium">{totalCredits()} / 40 Créditos</span>
              <span class="text-gray-400">{Math.round((totalCredits() / 40) * 100)}%</span>
            </div>
            <div class="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
              <div 
                class="h-full bg-accent-blue rounded-full transition-all"
                style="width: {Math.min((totalCredits() / 40) * 100, 100)}%"
              ></div>
            </div>
          </div>
        </aside>
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-6">
          <div class="max-w-4xl">
            <div class="mb-4 sm:mb-6">
              <h2 class="text-xl sm:text-2xl font-bold">Selección de Materias</h2>
              <p class="text-gray-400 mt-1 text-sm sm:text-base">Selecciona las secciones para tu horario del semestre 2024-1</p>
            </div>
            
            <SubjectSelector
              studentSubjects={selectedStudent?.subjects || []}
              allSections={allSections}
              bind:selectedSections
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </div>
    {/if}
    
    <!-- STEP 3: Schedule Results -->
    {#if currentStep === 3}
      <div class="flex flex-col lg:flex-row h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] relative">
        <!-- Mobile Sidebar Toggle -->
        <button 
          onclick={() => isMobileSidebarOpen = !isMobileSidebarOpen}
          class="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-accent-blue rounded-full shadow-lg flex items-center justify-center text-white"
          aria-label="Toggle Sidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </button>
        
        <!-- Mobile Overlay -->
        {#if isMobileSidebarOpen}
          <div 
            class="lg:hidden fixed inset-0 bg-black/50 z-40"
            onclick={() => isMobileSidebarOpen = false}
             onkeydown={(e) => e.key === 'Escape' && (isMobileSidebarOpen = false)}
             role="button"
             tabindex="0"
             aria-label="Close Sidebar"
          ></div>
        {/if}
        
        <!-- Sidebar - Credits & Sections Summary -->
        <aside class="
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-72 sm:w-80 lg:w-64 bg-dark-800 border-r border-dark-600 flex flex-col
          transform transition-transform duration-300 ease-in-out
          {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ">
          <div class="p-4 border-b border-dark-600">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-500 uppercase">Total Créditos</span>
              <div class="flex items-center gap-2">
                <span class="badge-open">En Límite</span>
                <button 
                  onclick={() => isMobileSidebarOpen = false}
                  class="lg:hidden p-1 hover:bg-dark-700 rounded-lg"
                  aria-label="Cerrar barra lateral"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="text-3xl font-bold">{totalCredits()}<span class="text-lg text-gray-400">/ 40 máx</span></div>
            
            <!-- Credits Progress Bar -->
            <div class="mt-3">
              <div class="w-full h-3 bg-dark-600 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all
                    {totalCredits() <= 18 ? 'bg-green-500' : totalCredits() <= 30 ? 'bg-yellow-500' : 'bg-red-500'}"
                  style="width: {Math.min((totalCredits() / 40) * 100, 100)}%"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- Selected Sections List -->
          <div class="flex-1 overflow-y-auto p-2">
            {#if generatedSchedules.length > 0}
              {#each uniqueSelectedSubjects() as subject}
                <div class="p-3 rounded-lg bg-dark-700 mb-2">
                  <div class="flex items-center justify-between mb-2">
                    <div class="font-medium text-sm truncate flex-1">{subject.subjectName}</div>
                    <div class="w-2 h-2 rounded-full flex-shrink-0
                      {subject.sectionsCount > 0 ? 'bg-green-500' : 'bg-gray-500'}"></div>
                  </div>
                  <div class="text-xs text-gray-500">{subject.subjectId}</div>
                  <div class="flex items-center justify-between mt-2 text-xs">
                    <span class="text-gray-400">NRC: Varía</span>
                    <span class="badge-open">Disponible</span>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </aside>
        
        <!-- Main Content - Calendar -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-6">
          {#if isGenerating}
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="animate-spin w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-gray-400">Generando combinaciones...</p>
              </div>
            </div>
          {:else if generationError}
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-red-400">{generationError}</p>
                <button onclick={() => goToStep(2)} class="btn-secondary mt-4">
                  Volver a Selección
                </button>
              </div>
            </div>
          {:else}
            <ScheduleCarousel
              schedules={generatedSchedules}
              {colorMap}
              {totalCredits}
            />
          {/if}
          
          {#if generationWarning && !isGenerating}
            <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {generationWarning}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>
