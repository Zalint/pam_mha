/**
 * Import / Export xlsx + gestion des versions (UI).
 * Dépend de api.js (API.actions.importXlsx/exportXlsx, API.versions.*) et
 * de notifications.js (showSuccess/showError/confirmAction). Expose window.ImportExport.
 */
(function () {
  let selectedFile = null;
  const $ = (id) => document.getElementById(id);

  const CLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  function esc(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }
  function srcLabel(s) { return s === 'pre-import' ? 'avant import' : s === 'pre-restore' ? 'avant restauration' : 'manuel'; }
  function fmtDateTime(s) { if (!s) return ''; try { return new Date(s).toLocaleString('fr-FR'); } catch (_) { return s; } }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function setFile(file) {
    selectedFile = file || null;
    const chip = $('importFileChip'), name = $('importFileName'), btn = $('importRunBtn');
    if (!chip) return;
    if (selectedFile) { name.textContent = selectedFile.name; chip.classList.add('show'); if (btn) btn.disabled = false; }
    else { chip.classList.remove('show'); if (btn) btn.disabled = true; }
  }

  async function doExport(filters) {
    try {
      if (window.showInfo) showInfo('Préparation de l\'export…');
      const blob = await API.actions.exportXlsx(filters || {});
      if (blob) {
        const filtered = filters && (filters.programme || filters.statut || filters.search);
        downloadBlob(blob, `Plan d'actions MHA 2026 - export${filtered ? ' (vue filtrée)' : ''}.xlsx`);
      }
    } catch (e) { if (window.showError) showError(e.message || 'Erreur lors de l\'export'); }
  }

  async function doImport() {
    if (!selectedFile) return;
    const msg = `Importer « ${selectedFile.name} » ?\nLes données actuelles seront archivées dans une version, puis entièrement remplacées.`;
    const ok = window.confirmAction ? await confirmAction(msg, 'Confirmer l\'import') : window.confirm(msg);
    if (!ok) return;

    const btn = $('importRunBtn');
    const old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Import en cours…'; }
    try {
      const res = await API.actions.importXlsx(selectedFile);
      if ($('importResult')) {
        $('importResult').innerHTML =
          `<div class="callout" style="margin-top:16px;background:var(--success-bg);color:var(--success);">` +
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>` +
          `<span><strong>${res.importedCount}</strong> actions importées · <strong>${res.snapshotCount}</strong> actions archivées dans la version #${res.snapshotVersionId}.</span></div>`;
      }
      if (window.showSuccess) showSuccess(`${res.importedCount} actions importées. Ancien jeu archivé (version #${res.snapshotVersionId}).`, 'Import réussi');
      setFile(null); if ($('importFileInput')) $('importFileInput').value = '';
      if (window.refreshAppData) await window.refreshAppData();
      renderVersions();
    } catch (e) {
      if (window.showError) showError(e.message || 'Erreur lors de l\'import', 'Échec de l\'import');
    } finally {
      if (btn) { btn.innerHTML = old; btn.disabled = !selectedFile; }
    }
  }

  async function renderVersions() {
    const list = $('versionsList');
    if (!list) return;
    list.innerHTML = '<div class="loading">Chargement des versions…</div>';
    try {
      const versions = await API.versions.list();
      const nv = document.getElementById('navVersionsCount');
      if (nv) nv.textContent = (versions || []).length;
      if (!versions || !versions.length) {
        list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg><h3>Aucune version</h3><p>Les versions seront créées automatiquement lors des imports.</p></div>';
        return;
      }
      list.innerHTML = versions.map((v) => `
        <div class="version-item">
          <span class="v-icon">${CLOCK_SVG}</span>
          <div class="v-main">
            <div class="v-label">${esc(v.label)} <span class="tag-source ${esc(v.source)}">${srcLabel(v.source)}</span></div>
            <div class="v-meta">${fmtDateTime(v.createdat)}${v.createdbyname ? ' · ' + esc(v.createdbyname) : ''}${v.reason ? ' · ' + esc(v.reason) : ''}</div>
          </div>
          <span class="v-count">${v.actioncount} actions</span>
          <div class="v-actions">
            <button class="btn btn-secondary btn-small" data-export="${v.id}">Exporter</button>
            <button class="btn btn-primary btn-small" data-restore="${v.id}">Restaurer</button>
          </div>
        </div>`).join('');
      list.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', () => restoreVersion(b.getAttribute('data-restore'))));
      list.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => exportVersion(b.getAttribute('data-export'))));
    } catch (e) {
      list.innerHTML = '<div class="empty-state"><h3>Erreur de chargement</h3></div>';
    }
  }

  async function restoreVersion(id) {
    const msg = 'Restaurer cette version ? L\'état actuel sera d\'abord archivé dans une nouvelle version de sécurité.';
    const ok = window.confirmAction ? await confirmAction(msg, 'Restaurer la version') : window.confirm(msg);
    if (!ok) return;
    try {
      const res = await API.versions.restore(id);
      if (window.showSuccess) showSuccess(`${res.restoredCount} actions restaurées.`, 'Restauration effectuée');
      if (window.refreshAppData) await window.refreshAppData();
      renderVersions();
    } catch (e) { if (window.showError) showError(e.message || 'Erreur lors de la restauration', 'Échec'); }
  }

  async function exportVersion(id) {
    try {
      const blob = await API.versions.exportVersion(id);
      if (blob) downloadBlob(blob, `Plan d'actions - version ${id}.xlsx`);
    } catch (e) { if (window.showError) showError(e.message || 'Erreur'); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dz = $('importDropzone'), fi = $('importFileInput');
    if (dz && fi) {
      dz.addEventListener('click', () => fi.click());
      dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault(); dz.classList.remove('dragover');
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) setFile(f);
      });
      fi.addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) setFile(f); });
    }
    $('importRunBtn') && $('importRunBtn').addEventListener('click', doImport);
    $('exportBtn') && $('exportBtn').addEventListener('click', () => doExport());
    // Le bouton "Exporter" de la page Actions est câblé dans app.js (il passe les filtres courants).
  });

  window.ImportExport = { renderVersions, doExport };
})();
