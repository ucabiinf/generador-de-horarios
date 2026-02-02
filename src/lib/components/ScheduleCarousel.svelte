<script>
  import ScheduleCalendar from './ScheduleCalendar.svelte';
  import { getSubjectColor } from '../timeUtils.js';
  import html2canvas from 'html2canvas'; 
  import jsPDF from 'jspdf';
  
  let { 
    schedules = [],
    colorMap = new Map(),
    totalCredits = () => 0,
    isDarkMode = true
  } = $props();
  
  // Theme colors
  let colors = $derived(() => {
    if (isDarkMode) {
      return {
        bgPrimary: '#0f1419',
        bgSecondary: '#151c24',
        bgTertiary: '#1c2834',
        border: '#243141',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        accent: '#3b82f6'
      };
    } else {
      return {
        bgPrimary: '#f8fafc',
        bgSecondary: '#ffffff',
        bgTertiary: '#f1f5f9',
        border: '#e2e8f0',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        accent: '#2563eb'
      };
    }
  });
  
  let currentPage = $state(0);
  const pageSize = 10;
  
  let totalPages = $derived(Math.ceil(schedules.length / pageSize));
  
  let visibleSchedules = $derived(() => {
    if (schedules.length === 0) return [];
    const start = currentPage * pageSize;
    return schedules.slice(start, start + pageSize);
  });
  
  function goToPrevious() {
    if (currentPage > 0) {
      currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  function goToNext() {
    if (currentPage < totalPages - 1) {
      currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  $effect(() => {
    if (schedules.length > 0 && currentPage >= totalPages) {
      currentPage = 0;
    }
  });

  async function downloadPNG(index) {
      const element = document.getElementById(`schedule-card-${index}`);
      if (!element) return;
      
      try {
          const canvas = await html2canvas(element, {
              backgroundColor: colors().bgPrimary,
              scale: 2, 
              useCORS: true,
              allowTaint: true,
              logging: false,
              ignoreElements: (el) => el.classList.contains('no-capture')
          });
          
          const link = document.createElement('a');
          link.download = `horario_opcion_${index}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
      } catch (error) {
          console.error('Error generating PNG:', error);
          alert('Hubo un error al generar la imagen. Por favor intenta de nuevo.');
      }
  }

  async function downloadPDF(index) {
      const element = document.getElementById(`schedule-card-${index}`);
      if (!element) return;
      
      try {
          const canvas = await html2canvas(element, {
              backgroundColor: colors().bgPrimary,
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              ignoreElements: (el) => el.classList.contains('no-capture')
          });
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF({
              orientation: canvas.width > canvas.height ? 'l' : 'p',
              unit: 'px',
              format: [canvas.width, canvas.height] 
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
          pdf.save(`horario_opcion_${index}.pdf`);
      } catch (error) {
          console.error('Error generating PDF:', error);
          alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
      }
  }
</script>

{#if schedules.length === 0}
  <div class="flex items-center justify-center h-64">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style="background-color: {colors().bgTertiary};">
        <svg class="w-10 h-10" style="color: {colors().textMuted};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold mb-2" style="color: {colors().textPrimary};">No hay horarios generados</h3>
      <p class="text-sm" style="color: {colors().textMuted};">Selecciona materias y haz clic en "Generar Combinaciones"</p>
    </div>
  </div>
{:else}
  <div class="space-y-6 sm:space-y-8">
    <!-- Navigation Header -->
    <div class="flex items-center justify-between glass-panel rounded-2xl p-3 sm:p-4 sticky top-0 z-10">
      <button
        onclick={goToPrevious}
        disabled={currentPage === 0}
        class="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-theme-tertiary hover:bg-theme-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-theme"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="hidden sm:inline text-sm font-medium text-theme-primary">Anterior</span>
      </button>
      
      <div class="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-center">
        <span class="text-sm sm:text-lg font-bold text-theme-primary">
           Página <span class="text-accent-blue">{currentPage + 1}</span> de {totalPages}
        </span>
        <span class="text-theme-muted text-xs sm:text-sm px-3 py-1 bg-theme-tertiary rounded-full border border-theme">
           {schedules.length} resultados
        </span>
      </div>
      
      <button
        onclick={goToNext}
        disabled={currentPage === totalPages - 1}
        class="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-theme-tertiary hover:bg-theme-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-theme"
      >
        <span class="hidden sm:inline text-sm font-medium text-theme-primary">Siguiente</span>
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
    
    <!-- Schedules List -->
    <div class="space-y-12">
      {#each visibleSchedules() as schedule, index}
        {@const globalIndex = currentPage * pageSize + index + 1}
        <div class="rounded-2xl p-5 sm:p-6 shadow-lg" id="schedule-card-{globalIndex}" style="background-color: {colors().bgSecondary}; border: 1px solid {colors().border};">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4 no-capture">
             <div class="flex items-center gap-4">
               <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);">
                 <span class="text-white font-bold text-lg">{globalIndex}</span>
               </div>
               <div>
                 <h3 class="text-xl sm:text-2xl font-bold" style="color: {colors().textPrimary};">Opción {globalIndex}</h3>
                 <p class="text-sm" style="color: {colors().textMuted};">{totalCredits()} créditos totales</p>
               </div>
             </div>
             <div class="flex flex-wrap gap-2 sm:gap-3">
                <button
                    onclick={() => downloadPNG(globalIndex)}
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all hover-lift"
                    style="background-color: {colors().bgTertiary}; border-color: {colors().border}; color: {colors().textPrimary};"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    PNG
                </button>
                <button
                    onclick={() => downloadPDF(globalIndex)}
                    class="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-cyan rounded-xl text-sm border border-accent-blue/30 transition-all hover-lift"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    PDF
                </button>
                {#if schedule.hasFullSections}
                  <span class="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Secciones Llenas
                  </span>
                {/if}
             </div>
          </div>

          <ScheduleCalendar 
            schedule={schedule.sections} 
            {colorMap}
            {isDarkMode}
          />
          
          <!-- NRC Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
            {#each schedule.sections as section}
              <div class="rounded-xl p-4 border transition-all hover-lift"
                   style="background-color: {colors().bgTertiary}; border-color: {!section.hasAvailability ? '#ef4444' : colors().border};">
                <div class="text-[10px] sm:text-xs mb-1 uppercase tracking-wider font-bold" style="color: {colors().textMuted};">NRC</div>
                <div class="font-mono text-xl sm:text-2xl font-black leading-none mb-2" style="color: {colors().accent};">{section.nrc}</div>
                <div class="text-xs sm:text-sm font-medium leading-tight line-clamp-2 min-h-[2.5em]" style="color: {colors().textPrimary};" title={section.subjectName}>
                  {section.subjectName || section.subjectId}
                </div>
                {#if !section.hasAvailability}
                  <div class="text-[10px] sm:text-xs mt-3 flex items-center gap-1.5 font-bold px-2 py-1 rounded-lg" style="color: #f87171; background-color: rgba(239, 68, 68, 0.1);">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    SIN CUPO
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Bottom Pagination -->
    {#if totalPages > 1}
        <div class="flex items-center justify-center gap-4 mt-8">
            <button
                onclick={goToPrevious}
                disabled={currentPage === 0}
                class="p-3 rounded-xl bg-theme-tertiary hover:bg-theme-elevated disabled:opacity-30 transition-all border border-theme"
                aria-label="Página anterior"
             >
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
             </button>
             <span class="text-theme-secondary font-medium">
                Página {currentPage + 1} de {totalPages}
             </span>
             <button
                onclick={goToNext}
                disabled={currentPage === totalPages - 1}
                class="p-3 rounded-xl bg-theme-tertiary hover:bg-theme-elevated disabled:opacity-30 transition-all border border-theme"
                aria-label="Página siguiente"
             >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
             </button>
        </div>
    {/if}
  </div>
{/if}
