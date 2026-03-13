import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse the Proyecciones Excel file (student subjects)
 * The file is an XLSX and the data is in the sheet named "Poblaciones (semesterId)"
 * @param {File} file The Excel file
 * @param {string} semesterId The semester ID (e.g., 202625)
 */
export async function parseProjectionsExcel(file, semesterId) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = `Poblaciones (${semesterId})`;
    
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`No se encontró la hoja "${sheetName}" en el archivo Excel. Hojas disponibles: ${workbook.SheetNames.join(', ')}`);
    }
    
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error(`La hoja "${sheetName}" está vacía.`);
    }

    const studentMap = new Map(); // studentId -> student data

    for (const row of jsonData) {
      // Try to get student ID from various column names
      const studentId = String(
        row['studentId'] ||
        row['CEDULA'] ||
        row['Cedula'] ||
        row['ID'] ||
        ''
      ).trim();

      if (!studentId || studentId.length < 5) continue;

      // Get subject info
      const subjectId = String(
        row['subjectId'] ||
        row['CODIGO_MATERIA'] ||
        row['Codigo Materia'] ||
        row['MATERIA'] ||
        ''
      ).trim();

      const subjectName = String(
        row['subjectName'] ||
        row['NOMBRE_MATERIA'] ||
        row['Nombre Materia'] ||
        row['DESCRIPCION_MATERIA'] ||
        ''
      ).trim();

      const credits = parseInt(row['subjectCredits'] || row['CREDITOS'] || row['UC_BASE'] || row['Credits']) || 3;

      if (!subjectId) continue;

      // Initialize student if not exists
      if (!studentMap.has(studentId)) {
        // Parse semester: "08SE" -> 8
        let semesterVal = row['semesterLocation'] || row['SEMESTRE'] || row['Semester Location'] || '1';
        if (typeof semesterVal === 'string' && semesterVal.includes('SE')) {
          semesterVal = parseInt(semesterVal.replace('SE', '')) || 1;
        } else {
          semesterVal = parseInt(semesterVal) || 1;
        }

        studentMap.set(studentId, {
          studentId,
          name: String(row['studentName'] || row['NOMBRE_ESTUDIANTE'] || row['Nombre Estudiante'] || row['NOMBRE_COMPLETO'] || 'Estudiante').trim(),
          career: String(row['program'] || row['CARRERA_NOMBRE'] || row['Carrera'] || row['PROGRAMA'] || 'Ingeniería Informática').trim(),
          gpa: parseFloat(String(row['averageGradePoints'] || row['PROMEDIO'] || row['GPA'] || '0').replace(',', '.')) || 0,
          accumulatedCredits: parseInt(row['accumulatedCredits'] || row['CREDITOS_ACUMULADOS'] || row['Earned Credits']) || 0,
          semester: semesterVal,
          status: String(row['status'] || row['ESTADO'] || row['Status'] || 'Activo').trim(),
          subjects: []
        });
      }

      // Add subject if not duplicate
      const student = studentMap.get(studentId);
      if (!student.subjects.find(s => s.subjectId === subjectId)) {
          student.subjects.push({
          subjectId,
          subjectName: subjectName || subjectId,
          credits
        });
      }
    }

    return Array.from(studentMap.values());
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    throw new Error('Error al procesar el archivo Excel de proyecciones: ' + error.message);
  }
}

/**
 * Parse the Proyecciones CSV (student subjects)
 * Format: CSV delimited by semicolon (;)
 * Extracts: studentId, name, career, GPA, credits, semester, subjects
 */
export function parseProjectionsCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const studentMap = new Map(); // studentId -> student data

          for (const row of results.data) {
            // Try to get student ID from various column names
            const studentId = String(
              row['CEDULA'] ||
              row['studentId'] ||
              row['ESTUDIANTE_ID'] ||
              ''
            ).trim();

            if (!studentId || studentId.length < 5) continue;

            // Get subject info
            const subjectId = String(
              row['CODIGO_MATERIA'] ||
              row['subjectId'] ||
              ''
            ).trim();

            const subjectName = String(
              row['NOMBRE_MATERIA'] ||
              row['subjectName'] ||
              ''
            ).trim();

            const credits = parseInt(row['subjectCredits'] || row['CREDITOS'] || row['credits'] || row['UC_BASE']) || 3;

            if (!subjectId) continue;

            // Initialize student if not exists
            if (!studentMap.has(studentId)) {
              studentMap.set(studentId, {
                studentId,
                name: String(row['NOMBRE_ESTUDIANTE'] || row['name'] || row['studentName'] || 'Estudiante').trim(),
                career: String(row['CARRERA_NOMBRE'] || row['career'] || row['programDesc'] || 'Ingeniería Informática').trim(),
                gpa: parseFloat(String(row['averageGradePoints'] || row['PROMEDIO'] || row['gpa'] || '0').replace(',', '.')) || 0,
                accumulatedCredits: parseInt(row['CREDITOS_ACUMULADOS'] || row['accumulatedCredits'] || row['earnedCredits']) || 0,
                semester: parseInt(row['semesterLocation'] || row['SEMESTRE'] || row['semester']) || 1,
                status: String(row['ESTADO'] || row['status'] || 'Activo').trim(),
                subjects: []
              });
            }

            // Add subject if not duplicate
            const student = studentMap.get(studentId);
            if (!student.subjects.find(s => s.subjectId === subjectId)) {
              student.subjects.push({
                subjectId,
                subjectName: subjectName || subjectId,
                credits
              });
            }
          }

          // Fallback: try to parse without headers if no results
          if (studentMap.size === 0) {
            return parseProjectionsCSVNoHeaders(file).then(resolve).catch(reject);
          }

          resolve(Array.from(studentMap.values()));
        } catch (error) {
          reject(new Error('Error parsing projections CSV: ' + error.message));
        }
      },
      error: (error) => {
        reject(new Error('Error reading CSV file: ' + error.message));
      }
    });
  });
}

/**
 * Fallback parser without headers
 */
function parseProjectionsCSVNoHeaders(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ';',
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const studentMap = new Map();

          for (const row of results.data) {
            if (row.length < 6) continue;

            let studentId = null;
            let subjectId = null;
            let subjectName = null;

            for (let i = 0; i < row.length; i++) {
              const cell = String(row[i]).trim();

              // Subject ID pattern: XXXX-NNNNN
              if (/^[A-Z]{3,4}-\d{4,5}$/.test(cell)) {
                subjectId = cell;
              }
              // Student ID: long number (cedula)
              else if (/^\d{7,10}$/.test(cell) && !studentId) {
                studentId = cell;
              }
            }

            if (subjectId) {
              const subjectIdIndex = row.findIndex(cell =>
                String(cell).trim() === subjectId
              );
              if (subjectIdIndex >= 0 && subjectIdIndex + 1 < row.length) {
                subjectName = String(row[subjectIdIndex + 1]).trim();
              }
            }

            if (studentId && subjectId) {
              if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                  studentId,
                  name: 'Estudiante',
                  career: 'Ingeniería Informática',
                  gpa: 0,
                  accumulatedCredits: 0,
                  semester: 1,
                  status: 'Activo',
                  subjects: []
                });
              }

              const student = studentMap.get(studentId);
              if (!student.subjects.find(s => s.subjectId === subjectId)) {
                student.subjects.push({
                  subjectId,
                  subjectName: subjectName || subjectId,
                  credits: 3
                });
              }
            }
          }

          resolve(Array.from(studentMap.values()));
        } catch (error) {
          reject(new Error('Error parsing projections CSV: ' + error.message));
        }
      },
      error: (error) => {
        reject(new Error('Error reading CSV file: ' + error.message));
      }
    });
  });
}

/**
 * Parse the Oferta Académica CSV (sections/schedules)
 */
export function parseSectionsCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const sections = [];

          for (const row of results.data) {
            const subjCode = String(row['SSBSECT_SUBJ_CODE'] || '').trim();
            const crseNumb = String(row['SSBSECT_CRSE_NUMB'] || '').trim().replace(/'/g, '');
            const subjectName = String(row['COURSE_NAME'] || row['NOMBRE_MATERIA'] || row['subjectName'] || '').trim();
            const semester = parseInt(row['COURSE_SEMESTRE'] || row['SEMESTRE'] || row['semester']) || 0;

            if (!subjCode || !crseNumb) continue;

            const normalizedSubjectId = `${subjCode}-${crseNumb}`;
            const nrc = String(row['SSBSECT_CRN'] || '').trim();
            const campus = String(row['CAMPUS'] || row['CAMPUS '] || '').trim().replace(/'/g, '');
            const cupo = parseInt(row['CUPO']) || 0;
            const inscritos = parseInt(row['INSCRITOS']) || 0;
            const disponibles = cupo - inscritos;
            const credits = parseInt(row['UC_BASE'] || row['CREDITOS'] || row['credits']) || 3;

            const profesor = String(
              row['NOMBRE_PROFESOR'] ||
              row['PROFESOR'] ||
              row['SPRIDEN_LAST_NAME'] ||
              ''
            ).trim();

            const schedule = [];
            const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
            const dayAbbrev = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const dayShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

            for (let i = 0; i < days.length; i++) {
              const dayValue = String(row[days[i]] || '').trim();
              if (dayValue && dayValue.length > 0) {
                const parsed = parseTimeSlot(dayValue, i);
                if (parsed) {
                  schedule.push({
                    day: i,
                    dayName: days[i],
                    dayAbbrev: dayAbbrev[i],
                    dayShort: dayShort[i],
                    ...parsed
                  });
                }
              }
            }

            if (nrc && schedule.length > 0) {
              sections.push({
                nrc,
                subjectId: normalizedSubjectId,
                profesor,
                campus,
                cupo,
                inscritos,
                disponibles,
                credits,
                hasAvailability: disponibles > 0,
                subjectName: subjectName || normalizedSubjectId,
                semester,
                schedule
              });
            }
          }

          resolve(sections);
        } catch (error) {
          reject(new Error('Error parsing sections CSV: ' + error.message));
        }
      },
      error: (error) => {
        reject(new Error('Error reading CSV file: ' + error.message));
      }
    });
  });
}

/**
 * Parse a time slot string like "13:00_14:50 L1214"
 */
function parseTimeSlot(value, dayIndex) {
  const match = value.match(/(\d{1,2}):(\d{2})[_-](\d{1,2}):(\d{2})\s*(.*)?/);

  if (!match) return null;

  const startHour = parseInt(match[1]);
  const startMin = parseInt(match[2]);
  const endHour = parseInt(match[3]);
  const endMin = parseInt(match[4]);
  const room = (match[5] || '').trim();

  return {
    startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
    endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
    startMinutes: startHour * 60 + startMin,
    endMinutes: endHour * 60 + endMin,
    room
  };
}

/**
 * Get sections grouped by subject ID
 */
export function groupSectionsBySubject(sections) {
  const grouped = new Map();

  for (const section of sections) {
    if (!grouped.has(section.subjectId)) {
      grouped.set(section.subjectId, []);
    }
    grouped.get(section.subjectId).push(section);
  }

  return grouped;
}

/**
 * Format schedule for display
 */
export function formatScheduleDisplay(schedule) {
  const grouped = {};

  for (const slot of schedule) {
    const time = `${slot.startTime} - ${slot.endTime}`;
    if (!grouped[time]) {
      grouped[time] = [];
    }
    grouped[time].push(slot.dayAbbrev);
  }

  return Object.entries(grouped).map(([time, days]) => ({
    days: days.join(' / '),
    time
  }));
}
