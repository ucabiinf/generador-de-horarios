import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  // Configurar CORS para permitir llamadas desde tu propio frontend
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');

  const { cedula } = request.query;

  if (!cedula) return response.status(400).json({ error: 'Cédula requerida' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    // Llamamos al Stored Procedure de forma segura
    const result = await sql`SELECT * FROM get_student_info(${cedula})`;

    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}