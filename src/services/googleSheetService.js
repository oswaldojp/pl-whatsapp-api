import path from 'path';
import {google} from 'googleapis';

const sheets = google.sheets('v4');

async function addRowToSheet(auth, spreadsheetId, values) {
  const request = {
    spreadsheetId,
    range: 'reservas',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values],
    },
    auth,
  };

  try {
    const response = (await sheets.spreadsheets.values.append(request).data);
    //console.log('Row added:', response);
    return response;
  } catch (error) {
    console.error('Error adding row:', error);
  }
}

const appendToSheet = async (data) => {
  try {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'src/credentials', 'credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const spreadsheetId = '114i3tV2bLU6vIGoKxJNl1l2S9sb5kSzpvMI5c_UGxPs';
    await addRowToSheet(client, spreadsheetId, data);

    return 'Datos correctamente agregados';
  } catch (error) {
    console.error('Error adding row:', error);
  }
};

export default appendToSheet;