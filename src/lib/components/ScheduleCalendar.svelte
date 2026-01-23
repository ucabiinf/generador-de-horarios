<script>
  import { timeToPosition, durationToHeight, getSubjectColor, DAYS, generateHourLabels } from '../timeUtils.js';
  
  let { 
    schedule = [],
    colorMap = new Map()
  } = $props();
  
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

<div class="card overflow-hidden">
  <!-- Mobile scroll hint -->
  <div class="sm:hidden text-xs text-gray-500 p-2 text-center border-b border-dark-600">
    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
    </svg>
    Desliza horizontalmente para ver todos los días
  </div>
  
  <div class="overflow-x-auto">
    <div class="flex min-w-[600px] sm:min-w-0">
      <!-- Time Column -->
      <div class="w-12 sm:w-16 flex-shrink-0 border-r border-dark-600">
        <div class="h-10 sm:h-12 border-b border-dark-600"></div>
        {#each hourLabels as hour}
          <div 
            class="text-[10px] sm:text-xs text-gray-500 text-right pr-1 sm:pr-2 border-b border-dark-700"
            style="height: {hourHeight}px;"
          >
            {hour.label}
          </div>
        {/each}
      </div>
      
      <!-- Days Grid -->
      <div class="flex-1 flex">
        {#each DAYS as day}
          <div class="flex-1 min-w-[80px] sm:min-w-0 border-r border-dark-600 last:border-r-0">
            <!-- Day Header -->
            <div class="h-10 sm:h-12 border-b border-dark-600 flex items-center justify-center">
              <span class="text-xs sm:text-sm font-medium text-gray-300">{day.short}</span>
            </div>
            
            <!-- Day Content -->
            <div class="relative" style="height: {hourLabels.length * hourHeight}px;">
              <!-- Hour Lines -->
              {#each hourLabels as _, i}
                <div 
                  class="absolute w-full border-b border-dark-700"
                  style="top: {i * hourHeight}px; height: {hourHeight}px;"
                ></div>
              {/each}
              
              <!-- Schedule Blocks -->
              {#each getBlocksForDay(day.id) as block}
                <div
                  class="absolute left-0.5 right-0.5 rounded-md sm:rounded-lg px-1 sm:px-1.5 py-0.5 sm:py-1 overflow-hidden shadow-lg transition-all hover:scale-[1.02] hover:z-10
                    {block.color.bg} {block.color.text}
                    {!block.hasAvailability ? 'ring-2 ring-red-500' : ''}"
                  style="top: {block.top}px; height: {block.height}px; min-height: 28px;"
                  title="{block.subjectName} - NRC: {block.nrc}"
                >
                  <div class="text-[9px] sm:text-xs font-semibold truncate">{block.subjectId}</div>
                  {#if block.height > 35}
                    <div class="text-[8px] sm:text-[10px] opacity-80 truncate">{block.subjectName}</div>
                  {/if}
                  {#if block.height > 50}
                    <div class="text-[8px] sm:text-[10px] opacity-70 truncate flex items-center gap-0.5 mt-0.5">
                      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      </svg>
                      {block.room || 'TBA'}
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
