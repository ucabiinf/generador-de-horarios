<script>
  import ScheduleCalendar from './ScheduleCalendar.svelte';
  
  let { 
    schedules = [],
    colorMap = new Map(),
    totalCredits = () => 0
  } = $props();
  
  let currentIndex = $state(0);
  
  let currentSchedule = $derived(() => {
    if (schedules.length === 0) return null;
    return schedules[currentIndex];
  });
  
  function goToPrevious() {
    if (currentIndex > 0) {
      currentIndex--;
    }
  }
  
  function goToNext() {
    if (currentIndex < schedules.length - 1) {
      currentIndex++;
    }
  }
  
  $effect(() => {
    if (schedules.length > 0 && currentIndex >= schedules.length) {
      currentIndex = 0;
    }
  });
</script>

{#if schedules.length === 0}
  <div class="flex items-center justify-center h-64">
    <div class="text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <h3 class="text-lg font-medium text-gray-400 mb-2">No hay horarios generados</h3>
      <p class="text-sm text-gray-500">Selecciona materias y haz clic en "Generar Combinaciones"</p>
    </div>
  </div>
{:else}
  <div class="space-y-4">
    <!-- Navigation Header -->
    <div class="flex items-center justify-between bg-dark-800 rounded-xl p-3 border border-dark-600">
      <button
        onclick={goToPrevious}
        disabled={currentIndex === 0}
        class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="hidden sm:inline">Anterior</span>
      </button>
      
      <div class="flex items-center gap-4">
        <span class="text-lg font-semibold">
          Opción <span class="text-accent-blue">{currentIndex + 1}</span> de {schedules.length}
        </span>
        <span class="text-gray-400 text-sm">• {totalCredits()} Créditos</span>
        {#if currentSchedule()?.hasFullSections}
          <span class="badge-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Incluye llenas
          </span>
        {/if}
      </div>
      
      <button
        onclick={goToNext}
        disabled={currentIndex === schedules.length - 1}
        class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span class="hidden sm:inline">Siguiente</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
    
    <!-- Calendar -->
    {#if currentSchedule()}
      <ScheduleCalendar 
        schedule={currentSchedule().sections} 
        {colorMap}
      />
      
      <!-- NRC Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {#each currentSchedule().sections as section}
          <div class="bg-dark-800 rounded-lg p-3 border border-dark-600
            {!section.hasAvailability ? 'border-red-500/50' : ''}">
            <div class="text-xs text-gray-500 mb-1">NRC</div>
            <div class="font-mono text-lg font-bold text-accent-blue">{section.nrc}</div>
            <div class="text-sm text-gray-400 truncate mt-1">{section.subjectName || section.subjectId}</div>
            {#if !section.hasAvailability}
              <div class="text-xs text-red-400 mt-1 flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Sin cupo
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
