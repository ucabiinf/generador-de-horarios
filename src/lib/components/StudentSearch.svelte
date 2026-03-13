<script>
  let { 
    studentsData = [],
    sectionsData = [],
    onStudentFound = () => {},
    onSectionsLoaded = () => {},
    onError = () => {}
  } = $props();
  
  let searchQuery = $state('');
  let isSearching = $state(false);
  let searchResult = $state(null);
  let error = $state('');
  
  function handleSearch() {
    if (!studentsData.length || !sectionsData.length) {
      error = 'Primero debes cargar los archivos de oferta y proyecciones';
      return;
    }

    if (!searchQuery.trim()) {
      error = 'Ingresa una cédula para buscar';
      return;
    }
    
    isSearching = true;
    error = '';
    searchResult = null;
    
    const cedula = searchQuery.trim();
    
    try {
      // 1. Buscar Estudiante en los datos locales
      const student = studentsData.find(s => s.studentId === cedula);
      
      if (!student) {
        throw new Error(`Estudiante con cédula "${cedula}" no encontrado en el archivo de proyecciones`);
      }
      
      // 2. Filtrar Secciones para el estudiante basado en sus materias proyectadas
      // Obtenemos los IDs de las materias que el estudiante tiene proyectadas
      const projectedSubjectIds = new Set(student.subjects.map(s => s.subjectId));
      
      // Filtramos la oferta académica para obtener las secciones de esas materias
      const relevantSections = sectionsData.filter(section => 
        projectedSubjectIds.has(section.subjectId)
      );
      
      if (relevantSections.length === 0) {
        console.warn('No se encontraron secciones en la oferta para las materias proyectadas del estudiante');
      }
      
      searchResult = student;
      onStudentFound(student);
      onSectionsLoaded(relevantSections);
      
    } catch (e) {
      console.error('Error en búsqueda local:', e);
      error = e.message || 'Error al procesar la búsqueda';
      searchResult = null;
      onError(error);
    } finally {
      isSearching = false;
    }
  }
  
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }
  
  function clearSearch() {
    searchQuery = '';
    searchResult = null;
    error = '';
    onStudentFound(null);
  }

</script>

<div class="card">
  <h3 class="text-lg font-bold mb-4 flex items-center gap-3 text-theme-primary">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 flex items-center justify-center border border-accent-cyan/30">
      <svg class="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
    Búsqueda de Estudiante
  </h3>
  
  <div class="flex gap-3">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={searchQuery}
        onkeypress={handleKeyPress}
        placeholder="Ingresa la cédula del estudiante (ej: 17051235)"
        class="input-field pl-12"
      />
      <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      {#if searchQuery}
        <button 
          onclick={clearSearch}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors p-1 rounded-lg hover:bg-theme-tertiary"
          aria-label="Limpiar búsqueda"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <button 
      onclick={handleSearch}
      disabled={isSearching}
      class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isSearching}
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      {/if}
      <span class="hidden sm:inline">Buscar</span>
    </button>
  </div>
  
  {#if error}
    <div class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
      <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <span class="text-sm font-medium">{error}</span>
    </div>
  {/if}
  
  {#if searchResult}
    <div class="mt-4 p-4 bg-theme-tertiary rounded-xl border border-theme hover-lift">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent-blue via-accent-purple to-accent-pink flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0 shadow-glow">
          {searchResult.name.charAt(0)}
        </div>
        <div class="flex-1 text-center sm:text-left">
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <span class="text-base sm:text-lg font-bold text-theme-primary">{searchResult.name}</span>
            <span class="badge-open">{searchResult.status}</span>
          </div>
          <p class="text-theme-muted text-sm mt-1">Cédula: {searchResult.studentId}</p>
        </div>
        <div class="text-center sm:text-right px-4 py-3 bg-accent-cyan/10 rounded-xl border border-accent-cyan/20">
          <div class="text-2xl sm:text-3xl font-bold text-accent-cyan">{searchResult.subjects.length}</div>
          <div class="text-xs sm:text-sm text-theme-muted">Materias disponibles</div>
        </div>
      </div>
    </div>
  {/if}
</div>
