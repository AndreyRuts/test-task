// import axios from 'axios';
// import fs from 'fs';
// import FormData from 'form-data';
// import { getEnvVar } from '../utils/getEnvVar.js';

// export const transcribeAudio = async (filePath, language = 'en') => {
//   const form = new FormData();
//   form.append('file', fs.createReadStream(filePath));
//   form.append('model', 'whisper-1');
//   form.append('response_format', 'json');
//   form.append('language', language);

//   const OPENAI_API_KEY = getEnvVar('OPENAI_API_KEY');

//   const response = await axios.post(
//     'https://api.openai.com/v1/audio/transcriptions',
//     form,
//     {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         ...form.getHeaders(),
//       },
//     }
//   );

//   return response.data.text; // Результат расшифровки
// };
