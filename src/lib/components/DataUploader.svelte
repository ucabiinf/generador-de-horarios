<script>
  import { parseProjectionsExcel, parseSectionsCSV } from '../csvParser';
  
  let { onDataLoaded = () => {} } = $props();
  
  let projectionsFile = $state(null);
  let offeringsFile = $state(null);
  let semesterId = $state('202625');
  let isLoading = $state(false);
  let error = $state('');
  let successMessage = $state('');
  
  let projectionsInput;
  let offeringsInput;
  
  async function handleProjectionsChange(e) {
    projectionsFile = e.target.files[0];
    error = '';
  }
  
  async function handleOfferingsChange(e) {
    offeringsFile = e.target.files[0];
    error = '';
  }
  
  async function handleSubmit() {
    if (!projectionsFile || !offeringsFile || !semesterId) {
      error = 'Por favor selecciona ambos archivos y el ID del semestre';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const [students, sections] = await Promise.all([
        parseProjectionsExcel(projectionsFile, semesterId),
        parseSectionsCSV(offeringsFile)
      ]);
      
      if (!students || students.length === 0) {
        throw new Error('No se encontraron estudiantes en el archivo de proyecciones');
      }
      
      if (!sections || sections.length === 0) {
        throw new Error('No se encontraron secciones en el archivo de oferta');
      }
      
      successMessage = `¡Éxito! Se cargaron ${students.length} estudiantes y ${sections.length} secciones.`;
      
      // Delay to show success message before switching view
      setTimeout(() => {
        onDataLoaded({ students, sections });
      }, 1500);
      
    } catch (e) {
      console.error('Error al cargar datos:', e);
      error = e.message || 'Error desconocido al procesar los archivos';
      isLoading = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto py-8 px-4">
  <div class="card bg-theme-secondary border-theme glow-blue">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold gradient-text mb-2">Carga de Datos</h2>
      <p class="text-theme-secondary">Sube los archivos necesarios para comenzar la planificación</p>
    </div>
    
    <div class="space-y-6">
      <!-- Semester ID -->
      <div class="flex flex-col gap-2">
        <label for="semester-id" class="text-sm font-medium text-theme-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ID de Semestre (ej. 202625)
        </label>
        <input 
          id="semester-id"
          type="text" 
          bind:value={semesterId} 
          class="input-field"
          placeholder="Ej: 202625"
        />
      </div>

      <!-- Projections File -->
      <div class="flex flex-col gap-2">
        <label for="projections-input" class="text-sm font-medium text-theme-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Archivo de Proyecciones (XLSX)
        </label>
        <button 
          type="button"
          class="relative group text-left w-full focus:outline-none"
          onclick={() => projectionsInput.click()}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && projectionsInput.click()}
        >
          <div class="input-field flex items-center justify-between border-dashed border-2 group-hover:border-accent-primary transition-colors">
            <span class={projectionsFile ? 'text-theme-primary' : 'text-theme-muted'}>
              {projectionsFile ? projectionsFile.name : 'Seleccionar proyecciones.xlsx...'}
            </span>
            <span class="text-xs bg-theme-tertiary px-2 py-1 rounded-md text-theme-secondary">Explorar</span>
          </div>
        </button>
        <input 
          id="projections-input"
          bind:this={projectionsInput}
          type="file" 
          accept=".xlsx,.xls" 
          class="hidden" 
          onchange={handleProjectionsChange} 
        />
      </div>
      
      <!-- Offerings File -->
      <div class="flex flex-col gap-2">
        <label for="offerings-input" class="text-sm font-medium text-theme-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          Oferta Académica (CSV)
        </label>
        <button 
          type="button"
          class="relative group text-left w-full focus:outline-none"
          onclick={() => offeringsInput.click()}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && offeringsInput.click()}
        >
          <div class="input-field flex items-center justify-between border-dashed border-2 group-hover:border-accent-secondary transition-colors">
            <span class={offeringsFile ? 'text-theme-primary' : 'text-theme-muted'}>
              {offeringsFile ? offeringsFile.name : 'Seleccionar oferta.csv...'}
            </span>
            <span class="text-xs bg-theme-tertiary px-2 py-1 rounded-md text-theme-secondary">Explorar</span>
          </div>
        </button>
        <input 
          id="offerings-input"
          bind:this={offeringsInput}
          type="file" 
          accept=".csv" 
          class="hidden" 
          onchange={handleOfferingsChange} 
        />
      </div>
      
      {#if error}
        <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      {/if}
      
      {#if successMessage}
        <div class="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {successMessage}
        </div>
      {/if}
      
      <button 
        class="btn-primary w-full justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={handleSubmit}
        disabled={isLoading || !projectionsFile || !offeringsFile}
      >
        {#if isLoading}
          <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        {:else}
          Cargar Datos e Iniciar
        {/if}
      </button>
      
      <p class="text-xs text-center text-theme-muted mt-4">
        La información se procesa localmente y no se almacena permanentemente.
      </p>
    </div>
  </div>
</div>
