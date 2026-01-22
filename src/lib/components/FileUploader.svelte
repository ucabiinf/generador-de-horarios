<script>
  import { parseProjectionsCSV, parseSectionsCSV } from '../csvParser.js';
  
  let { 
    onProjectionsLoaded = () => {}, 
    onSectionsLoaded = () => {},
    projectionsStatus = $bindable('idle'),
    sectionsStatus = $bindable('idle')
  } = $props();
  
  let projectionsError = $state('');
  let sectionsError = $state('');
  let projectionsCount = $state(0);
  let sectionsCount = $state(0);
  
  let draggingProjections = $state(false);
  let draggingSections = $state(false);
  
  async function handleProjectionsFile(file) {
    if (!file) return;
    
    projectionsStatus = 'loading';
    projectionsError = '';
    
    try {
      const data = await parseProjectionsCSV(file);
      projectionsCount = data.length;
      projectionsStatus = 'success';
      onProjectionsLoaded(data);
    } catch (error) {
      projectionsStatus = 'error';
      projectionsError = error.message;
    }
  }
  
  async function handleSectionsFile(file) {
    if (!file) return;
    
    sectionsStatus = 'loading';
    sectionsError = '';
    
    try {
      const data = await parseSectionsCSV(file);
      sectionsCount = data.length;
      sectionsStatus = 'success';
      onSectionsLoaded(data);
    } catch (error) {
      sectionsStatus = 'error';
      sectionsError = error.message;
    }
  }
  
  function handleDrop(e, type) {
    e.preventDefault();
    if (type === 'projections') draggingProjections = false;
    else draggingSections = false;
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      if (type === 'projections') handleProjectionsFile(file);
      else handleSectionsFile(file);
    }
  }
  
  function handleDragOver(e, type) {
    e.preventDefault();
    if (type === 'projections') draggingProjections = true;
    else draggingSections = true;
  }
  
  function handleDragLeave(e, type) {
    if (type === 'projections') draggingProjections = false;
    else draggingSections = false;
  }
  
  function handleFileInput(e, type) {
    const file = e.target?.files?.[0];
    if (file) {
      if (type === 'projections') handleProjectionsFile(file);
      else handleSectionsFile(file);
    }
  }
</script>

<div class="grid md:grid-cols-2 gap-6">
  <!-- Proyecciones Upload -->
  <div class="card">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      Proyecciones (.csv)
    </h3>
    <p class="text-sm text-gray-400 mb-4">Archivo de materias disponibles por estudiante</p>
    
    <label
      class="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
        {draggingProjections ? 'border-accent-blue bg-accent-blue/10' : 'border-dark-500 hover:border-dark-400'}
        {projectionsStatus === 'success' ? 'border-green-500 bg-green-500/10' : ''}
        {projectionsStatus === 'error' ? 'border-red-500 bg-red-500/10' : ''}"
      ondrop={(e) => handleDrop(e, 'projections')}
      ondragover={(e) => handleDragOver(e, 'projections')}
      ondragleave={(e) => handleDragLeave(e, 'projections')}
    >
      <input
        type="file"
        accept=".csv"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onchange={(e) => handleFileInput(e, 'projections')}
      />
      
      {#if projectionsStatus === 'loading'}
        <div class="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full"></div>
        <span class="mt-2 text-sm text-gray-400">Procesando...</span>
      {:else if projectionsStatus === 'success'}
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="mt-2 text-sm text-green-400">{projectionsCount} estudiantes cargados</span>
      {:else if projectionsStatus === 'error'}
        <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span class="mt-2 text-sm text-red-400">{projectionsError}</span>
      {:else}
        <svg class="w-10 h-10 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <span class="mt-2 text-sm text-gray-400">Arrastra o haz clic para seleccionar</span>
      {/if}
    </label>
  </div>
  
  <!-- Oferta Académica Upload -->
  <div class="card">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      Oferta Académica (.csv)
    </h3>
    <p class="text-sm text-gray-400 mb-4">Archivo de secciones y horarios disponibles</p>
    
    <label
      class="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
        {draggingSections ? 'border-accent-purple bg-accent-purple/10' : 'border-dark-500 hover:border-dark-400'}
        {sectionsStatus === 'success' ? 'border-green-500 bg-green-500/10' : ''}
        {sectionsStatus === 'error' ? 'border-red-500 bg-red-500/10' : ''}"
      ondrop={(e) => handleDrop(e, 'sections')}
      ondragover={(e) => handleDragOver(e, 'sections')}
      ondragleave={(e) => handleDragLeave(e, 'sections')}
    >
      <input
        type="file"
        accept=".csv"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onchange={(e) => handleFileInput(e, 'sections')}
      />
      
      {#if sectionsStatus === 'loading'}
        <div class="animate-spin w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full"></div>
        <span class="mt-2 text-sm text-gray-400">Procesando...</span>
      {:else if sectionsStatus === 'success'}
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="mt-2 text-sm text-green-400">{sectionsCount} secciones cargadas</span>
      {:else if sectionsStatus === 'error'}
        <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span class="mt-2 text-sm text-red-400">{sectionsError}</span>
      {:else}
        <svg class="w-10 h-10 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <span class="mt-2 text-sm text-gray-400">Arrastra o haz clic para seleccionar</span>
      {/if}
    </label>
  </div>
</div>
