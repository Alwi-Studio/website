import { stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import sharp from 'sharp'

const assetsDir = join(process.cwd(), 'src', 'assets')

const images = [
  { file: 'background.webp', quality: 48 },
  { file: 'LONG--FOR-BG-HITAM.webp', quality: 62 },
  { file: 'MAIN--FOR-BG-HITAM.webp', quality: 62 },
]

function outputName(file) {
  return file.replace(/\.webp$/i, '.avif')
}

for (const image of images) {
  const inputPath = join(assetsDir, image.file)
  const outputPath = join(dirname(inputPath), outputName(basename(inputPath)))

  await sharp(inputPath)
    .avif({
      quality: image.quality,
      effort: 8,
    })
    .toFile(outputPath)

  const inputStats = await stat(inputPath)
  const outputStats = await stat(outputPath)
  const savedPercent = Math.round((1 - outputStats.size / inputStats.size) * 100)

  console.log(
    `${image.file} -> ${outputName(image.file)} (${inputStats.size} B -> ${outputStats.size} B, ${savedPercent}% smaller)`,
  )
}
