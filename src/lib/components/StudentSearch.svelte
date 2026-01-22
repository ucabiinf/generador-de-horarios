<script>
  let { 
    projections = [],
    onStudentFound = () => {},
    onError = () => {}
  } = $props();
  
  let searchQuery = $state('');
  let isSearching = $state(false);
  let searchResult = $state(null);
  let error = $state('');
  
  function handleSearch() {
    if (!searchQuery.trim()) {
      error = 'Ingresa una cédula para buscar';
      return;
    }
    
    isSearching = true;
    error = '';
    searchResult = null;
    
    // Simulate brief loading for UX
    setTimeout(() => {
      const query = searchQuery.trim();
      const found = projections.find(p => p.studentId === query);
      
      if (found) {
        searchResult = found;
        onStudentFound(found);
        error = '';
      } else {
        searchResult = null;
        error = `Estudiante con cédula "${query}" no encontrado`;
        onError(error);
      }
      
      isSearching = false;
    }, 300);
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
  <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
    <svg class="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
    Búsqueda de Estudiante
  </h3>
  
  <div class="flex gap-3">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={searchQuery}
        onkeypress={handleKeyPress}
        placeholder="Ingresa la cédula del estudiante (ej: 8-900-1234)"
        class="input-field pl-10"
        disabled={projections.length === 0}
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      {#if searchQuery}
        <button 
          onclick={clearSearch}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <button 
      onclick={handleSearch}
      disabled={projections.length === 0 || isSearching}
      class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isSearching}
        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      {/if}
      Buscar
    </button>
  </div>
  
  {#if projections.length === 0}
    <p class="text-sm text-yellow-500 mt-3 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      Primero carga el archivo de Proyecciones
    </p>
  {/if}
  
  {#if error}
    <div class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-sm">{error}</span>
    </div>
  {/if}
  
  {#if searchResult}
    <div class="mt-4 p-4 bg-dark-700 rounded-xl border border-dark-500">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-xl font-bold">
          {searchResult.studentId.charAt(0)}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold">Estudiante</span>
            <span class="badge-open">Activo</span>
          </div>
          <p class="text-gray-400">Cédula: {searchResult.studentId}</p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-accent-cyan">{searchResult.subjects.length}</div>
          <div class="text-sm text-gray-400">Materias disponibles</div>
        </div>
      </div>
    </div>
  {/if}
</div>
