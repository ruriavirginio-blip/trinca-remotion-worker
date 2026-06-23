const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { mkdir } = require('fs/promises');
const { join } = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(express.json());

// CORS: permite o cockpit (protocolorv.com.br) chamar o worker direto do navegador.
// O render leva ~80-90s (acima do limite da Vercel), então o navegador é quem espera.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'remotion-worker' });
});

app.post('/render', async (req, res) => {
  const { videoUrl, gancho, gatilho, legenda, cta, captions, audioUrl, durationSeconds } = req.body;

  if (!videoUrl || !gancho || !gatilho) {
    return res.status(400).json({ error: 'videoUrl, gancho e gatilho sao obrigatorios' });
  }

  const duration = durationSeconds || 30;
  const durationInFrames = duration * 30;
  const outputFileName = `reel-trinca-${Date.now()}.mp4`;
  const outputDir = '/tmp/remotion-output';
  const outputPath = join(outputDir, outputFileName);

  try {
    await mkdir(outputDir, { recursive: true });

    const bundleLocation = await bundle({
      entryPoint: './index.ts',
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'ReelTrinca',
      inputProps: {
        videoSrc: videoUrl,
        gancho,
        gatilho,
        legenda,
        cta: cta || 'Comenta EU QUERO 👇',
        captions: Array.isArray(captions) ? captions : [],
        audioSrc: audioUrl,
      },
    });

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      concurrency: 1,
      offthreadVideoCacheSizeInBytes: 64 * 1024 * 1024,
      chromiumOptions: {
        enableMultiProcessOnLinux: false,
      },
      inputProps: {
        videoSrc: videoUrl,
        gancho,
        gatilho,
        legenda,
        cta: cta || 'Comenta EU QUERO 👇',
        captions: Array.isArray(captions) ? captions : [],
        audioSrc: audioUrl,
      },
    });

    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: 'video',
      public_id: `reels-trinca/${outputFileName.replace('.mp4', '')}`,
      folder: 'reels-trinca',
      overwrite: true,
    });

    return res.json({
      success: true,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      fileName: outputFileName,
    });

  } catch (error) {
    console.error('Erro na renderizacao:', error);
    return res.status(500).json({
      error: 'Falha na renderizacao',
      details: String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Remotion worker rodando na porta ${PORT}`);
});
