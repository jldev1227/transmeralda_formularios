export function formatearFechaPersonalizada(fechaISO) {
    const fecha = new Date(fechaISO);
  
    // Ajuste del año (p.ej. 2025 -> 205)
    // Si deseas otra lógica, modifícala:
    const anioOriginal = fecha.getFullYear();   // 2025
  
    // Mes y día con 2 dígitos
    const mes  = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia  = String(fecha.getDate()).padStart(2, '0');
  
    // Hora y minuto
    let horas    = fecha.getHours();           // 0..23
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
  
    // AM o PM
    const sufijo = horas >= 12 ? 'pm' : 'am';
  
    // Convertir a 12h
    horas = horas % 12;
    horas = horas || 12; // si el resultado es 0, se convierte a 12
    const horas12 = String(horas).padStart(2, '0');
  
    // Unir en el formato deseado: "205-01-17 hh:mm am/pm"
    return `${anioOriginal}-${mes}-${dia} ${horas12}:${minutos} ${sufijo}`;
  }
  
  