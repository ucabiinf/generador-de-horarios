<script>
  import { timeToPosition, durationToHeight, getSubjectColor, DAYS, generateHourLabels } from '../timeUtils.js';
  
  let { 
    schedule = [],
    colorMap = new Map(),
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
        textMuted: '#64748b'
      };
    } else {
      return {
        bgPrimary: '#f8fafc',
        bgSecondary: '#ffffff',
        bgTertiary: '#f1f5f9',
        border: '#e2e8f0',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8'
      };
    }
  });
  
  const hourLabels = generateHourLabels(7, 21);
  const hourHeight = 50; // pixels per hour (desktop)
  const hourHeightMobile = 40; // pixels per hour (mobile)
  const startHour = 7;
  
  // Process sections into calendar blocks
  let calendarBlocks = $derived(() => {
    const blocks = [];
    
    for (const section of schedule) {
      const color = getSubjectColor(section.subjectId, colorMap);
      
      for (const slot of section.schedule) {
        const top = timeToPosition(slot.startMinutes, startHour, hourHeight);
        const height = durationToHeight(slot.startMinutes, slot.endMinutes, hourHeight);
        
        blocks.push({
          ...slot,
          section,
          color,
          top,
          height,
          subjectId: section.subjectId,
          subjectName: section.subjectName,
          nrc: section.nrc,
          room: slot.room,
          hasAvailability: section.hasAvailability
        });
      }
    }
    
    return blocks;
  });
  
  function getBlocksForDay(dayIndex) {
    return calendarBlocks().filter(b => b.day === dayIndex);
  }
</script>

<!-- Using inline styles for html2canvas compatibility with dynamic theme -->
<div class="rounded-2xl overflow-hidden border" style="background-color: {colors().bgSecondary}; border-color: {colors().border};">
  <!-- Mobile scroll hint -->
  <div class="sm:hidden text-xs p-3 text-center border-b flex items-center justify-center gap-2" style="color: {colors().textMuted}; border-color: {colors().border}; background-color: {colors().bgTertiary};">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
    </svg>
    <span>Desliza horizontalmente para ver todos los días</span>
  </div>
  
  <div class="overflow-x-auto">
    <div class="flex min-w-[600px] sm:min-w-0">
      <!-- Time Column -->
      <div class="w-14 sm:w-16 flex-shrink-0 border-r" style="border-color: {colors().border}; background-color: {colors().bgTertiary};">
        <div class="h-12 sm:h-14 border-b flex items-center justify-center" style="border-color: {colors().border};">
          <svg class="w-4 h-4" style="color: {colors().textMuted};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        {#each hourLabels as hour}
          <div 
            class="text-[10px] sm:text-xs font-medium text-right pr-2 sm:pr-3 border-b flex items-start justify-end pt-1"
            style="height: {hourHeight}px; color: {colors().textMuted}; border-color: {colors().border};"
          >
            {hour.label}
          </div>
        {/each}
      </div>
      
      <!-- Days Grid -->
      <div class="flex-1 flex">
        {#each DAYS as day, dayIdx}
          <div class="flex-1 min-w-[80px] sm:min-w-0 border-r last:border-r-0" style="border-color: {colors().border};">
            <!-- Day Header -->
            <div class="h-12 sm:h-14 border-b flex items-center justify-center" style="border-color: {colors().border}; background-color: {colors().bgTertiary};">
              <div class="text-center">
                <span class="text-xs sm:text-sm font-bold block" style="color: {colors().textPrimary};">{day.short}</span>
                <span class="text-[10px] hidden sm:block" style="color: {colors().textMuted};">{day.name}</span>
              </div>
            </div>
            
            <!-- Day Content -->
            <div class="relative" style="height: {hourLabels.length * hourHeight}px; background-color: {colors().bgSecondary};">
              <!-- Hour Lines -->
              {#each hourLabels as _, i}
                <div 
                  class="absolute w-full border-b"
                  style="top: {i * hourHeight}px; height: {hourHeight}px; border-color: {colors().border};"
                >
                  <!-- Half-hour line -->
                  <div class="absolute w-full border-b opacity-30" style="top: {hourHeight / 2}px; border-color: {colors().border};"></div>
                </div>
              {/each}
              
              <!-- Schedule Blocks -->
              {#each getBlocksForDay(day.id) as block}
                <div
                  class="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-visible shadow-lg transition-all duration-200 hover:scale-[1.02] hover:z-20 cursor-pointer
                    {block.color.bg} {block.color.text}
                    {!block.hasAvailability ? 'ring-2 ring-red-500' : ''}"
                  style="top: {block.top}px; height: {block.height}px; min-height: 35px;"
                  title="{block.subjectName} - NRC: {block.nrc}"
                >
                  <div class="text-[11px] sm:text-[13px] font-bold leading-tight break-words" style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                    {block.subjectName || block.subjectId}
                  </div>
                  
                  <div class="flex flex-col absolute bottom-1.5 left-2 right-2 gap-0.5">
                    {#if block.height > 55}
                      <div class="text-[10px] sm:text-[11px] font-black font-mono rounded-md px-2 py-0.5 w-fit" style="background-color: rgba(0,0,0,0.4);">
                        NRC {block.nrc}
                      </div>
                    {/if}
                    
                    {#if block.height > 85}
                      <div class="text-[9px] sm:text-[10px] opacity-90 flex items-center gap-1.5 font-semibold">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span class="whitespace-nowrap">{block.room || 'Por asignar'}</span>
                      </div>
                    {/if}
                  </div>
                  
                  {#if !block.hasAvailability}
                    <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-lg" style="background-color: #ef4444;">
                      <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
