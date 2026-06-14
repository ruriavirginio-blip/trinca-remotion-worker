const express = require('express');
const {createReadStream} = require('node:fs');
const {mkdir} = require('node:fs/promises');
const {join} = require('node:path');
const {bundle} = require('@remotion/bundler');
const {renderMedia, selectComposition} = require('@remotion/renderer');
const {google} = require('googleapis');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({limit: '10mb'}));

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readGoogleCredentials() {
  const rawCredentials = cleanText(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  if (!rawCredentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON nao configurado.');
  }

  return JSON.parse(rawCredentials);
}

app.get('/health', (_request, response) => {
  response.json({ok: true, service: 'remotion-worker'});
});

app.post('/render', async (request, response) => {
  try {
    const body = request.body || {};
    const videoUrl = cleanText(body.videoUrl);
    const gancho = cleanText(body.gancho);
    const gatilho = cleanText(body.gatilho);
    const legenda = cleanText(body.legenda);
    const audioUrl = cleanText(body.audioUrl);
    const durationSeconds = body.durationSeconds || 30;

    if (!videoUrl || !gancho || !gatilho) {
      return response.status(400).json({error: 'videoUrl, gancho e gatilho sao obrigatorios'});
    }

    if (durationSeconds < 5 || durationSeconds > 180) {
      return response.status(400).json({error: 'durationSeconds deve ficar entre 5 e 180 segundos'});
    }

    const durationInFrames = Math.round(durationSeconds * 30);
    const outputFileName = `reel-trinca-${Date.now()}.mp4`;
    const outputDir = '/tmp/remotion-output';
    const outputPath = join(outputDir, outputFileName);

    await mkdir(outputDir, {recursive: true});

    const bundleLocation = await bundle({
      entryPoint: join(process.cwd(), 'index.ts'),
      webpackOverride: (config) => config,
    });

    const inputProps = {
      videoSrc: videoUrl,
      gancho,
      gatilho,
      legenda,
      audioSrc: audioUrl || undefined,
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'ReelTrinca',
      inputProps,
    });

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      timeoutInMilliseconds: Number(process.env.REMOTION_TIMEOUT_IN_MILLISECONDS || 300000),
    });

    const driveUrl = await uploadToDrive(outputPath, outputFileName);

    return response.json({
      success: true,
      driveUrl,
      fileName: outputFileName,
      message: 'Reel renderizado e salvo no Drive com sucesso',
    });
  } catch (error) {
    console.error('Erro na renderizacao Remotion:', error);
    return response.status(500).json({
      error: 'Falha na renderizacao',
      details: String(error),
    });
  }
});

async function uploadToDrive(filePath, fileName) {
  const auth = new google.auth.GoogleAuth({
    credentials: readGoogleCredentials(),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({version: 'v3', auth});
  const folderId = cleanText(process.env.GOOGLE_DRIVE_REELS_FOLDER_ID);

  const result = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: 'video/mp4',
      body: createReadStream(filePath),
    },
    fields: 'id, webViewLink',
  });

  if (!result.data.id) {
    throw new Error('Google Drive nao retornou o ID do arquivo.');
  }

  await drive.permissions.create({
    fileId: result.data.id,
    requestBody: {role: 'reader', type: 'anyone'},
  });

  return result.data.webViewLink || '';
}

app.listen(port, () => {
  console.log(`Remotion worker listening on port ${port}`);
});
