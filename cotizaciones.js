(() => {
  'use strict';
  const WHATSAPP_NUMBER = '528333126947'; // Confirmar y cambiar si el número receptor es distinto.
  const BACKUP_EMAIL = 'contacto@loopline.com';   // Correo de respaldo (debe existir y estar activo).
  const BACKUP_ENDPOINT = '';                      // Opcional: URL de Formspree u otro servicio, p. ej. 'https://formspree.io/f/xxxxxxxx'. Vacío = desactivado.
  const BACKUP_KEY = 'loopline_ultima_solicitud';
  const dialog = document.getElementById('dlg-solicitud');
  const form = document.getElementById('form-solicitud');
  const serviceField = document.getElementById('solicitud-interes');
  const status = document.getElementById('solicitud-estado');
  const open = (service='Cotización general') => {
    if (!dialog) return;
    serviceField.value = service;
    clearBackup();
    dialog.showModal();
    document.getElementById('sol-nombre')?.focus();
  };
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cotizar], [data-solicitar], #c-consulta');
    if (!btn) return;
    event.preventDefault();
    const service = btn.dataset.cotizar || btn.dataset.solicitar || 'Cotización general';
    open(service);
  });
  document.getElementById('solicitud-cerrar')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  function clearBackup() { document.getElementById('solicitud-respaldo')?.remove(); }
  function showBackup(message, url, opened) {
    clearBackup();
    status.textContent = opened ? 'Tu solicitud está lista y WhatsApp se abrió en otra pestaña. Confirma el envío allí.' : 'Tu solicitud está lista. WhatsApp se abrirá en esta pestaña para que confirmes el envío.';
    const box = document.createElement('div'); box.id = 'solicitud-respaldo'; box.className = 'solicitud-respaldo';
    const p = document.createElement('p'); p.textContent = '¿No se abrió WhatsApp? Tu solicitud no se pierde:'; box.append(p);
    const acts = document.createElement('div'); acts.className = 'acciones'; box.append(acts);
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copiar mensaje';
    copy.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(message); ok = true; } catch (e) {
        const t = document.createElement('textarea'); t.value = message; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.append(t); t.select();
        try { ok = document.execCommand('copy'); } catch (e2) {} t.remove();
      }
      copy.textContent = ok ? 'Mensaje copiado' : 'No se pudo copiar';
    });
    const mail = document.createElement('a');
    mail.href = `mailto:${BACKUP_EMAIL}?subject=${encodeURIComponent('Solicitud de cotización Loopline')}&body=${encodeURIComponent(message.slice(0, 1800))}`;
    mail.textContent = 'Enviar por correo';
    const again = document.createElement('a'); again.href = url; again.target = '_blank'; again.rel = 'noopener'; again.textContent = 'Abrir WhatsApp de nuevo';
    acts.append(again, mail, copy);
    status.after(box);
  }
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const lines = [
      'Hola, quiero solicitar una cotización para Loopline.',
      '', `Servicio: ${data.get('interes') || 'Por definir'}`,
      `Nombre: ${data.get('nombre')} ${data.get('apellido')}`,
      `Empresa o negocio: ${data.get('empresa')}`,
      `Descripción del negocio: ${data.get('descripcion_negocio')}`,
      `Correo: ${data.get('correo')}`,
      `Teléfono / WhatsApp: ${data.get('whatsapp')}`,
      `Necesidad: ${data.get('detalles')}`
    ];
    const message = lines.join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    // 1) Respaldo local: el mensaje queda guardado en este navegador.
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ fecha: new Date().toISOString(), mensaje: message })); } catch (e) {}
    // 2) Respaldo remoto opcional (no bloquea el envío por WhatsApp).
    if (BACKUP_ENDPOINT) {
      try {
        fetch(BACKUP_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, keepalive: true,
          body: JSON.stringify({ servicio: data.get('interes'), nombre: data.get('nombre'), apellido: data.get('apellido'), empresa: data.get('empresa'),
            descripcion_negocio: data.get('descripcion_negocio'), correo: data.get('correo'), whatsapp: data.get('whatsapp'), detalles: data.get('detalles'), consentimiento: 'aceptado' }) }).catch(() => {});
      } catch (e) {}
    }
    // 3) WhatsApp en otra pestaña para no perder el formulario; si el navegador lo bloquea, se usa la misma pestaña.
    const win = window.open(url, '_blank', 'noopener');
    showBackup(message, url, !!win);
    if (!win) window.location.href = url;
  });
  document.getElementById('anio') && (document.getElementById('anio').textContent = new Date().getFullYear());
})();
