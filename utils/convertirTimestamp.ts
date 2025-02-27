export function convertirTimestamp(fechaStr) {
    // Convertir la cadena en número
    const timestampMs = parseInt(fechaStr, 10);
  
    // Crear un objeto Date a partir del timestamp (en milisegundos)
    const fecha = new Date(timestampMs);
  
    // Extraer año, mes y día
    const year = fecha.getFullYear();
    // Los meses en JavaScript van de 0 (enero) a 11 (diciembre)
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    // Obtener la hora y los minutos
    let hours = fecha.getHours();
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    
    // Determinar AM o PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convertir la hora al formato de 12 horas
    hours = hours % 12;
    // En formato de 12 horas, las 0 equivalen a las 12
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
  
    // Formar la cadena final: YYYY-MM-DD hh:mm AM/PM
    return `${year}-${month}-${day} ${hoursStr}:${minutes} ${ampm}`;
  }
  