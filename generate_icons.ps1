Add-Type -AssemblyName System.Drawing

function Generate-PwaIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # 1. Fondo oscuro elegante (#020617)
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#020617"))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    
    # 2. Recuadro interior oscuro (#0f172a)
    $pad = [int]($size * 0.08)
    $innerSize = $size - (2 * $pad)
    $cardBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0f172a"))
    $g.FillRectangle($cardBrush, $pad, $pad, $innerSize, $innerSize)
    
    # 3. Borde Indigo fino (#6366f1)
    $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#6366f1")), ([float]($size * 0.02))
    $g.DrawRectangle($pen, $pad, $pad, $innerSize, $innerSize)
    
    # 4. Dibujar letra "T" geométrica usando polígonos/rectángulos
    $tWidth = [int]($size * 0.44)
    $tThick = [int]($size * 0.085)
    $tLeft = [int](($size - $tWidth) / 2)
    $tTop = [int]($size * 0.28)
    $tHeight = [int]($size * 0.44)
    $stemWidth = [int]($size * 0.09)
    $stemLeft = [int](($size - $stemWidth) / 2)
    
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#ffffff"))
    # Barra horizontal de la T
    $g.FillRectangle($whiteBrush, $tLeft, $tTop, $tWidth, $tThick)
    # Barra vertical de la T
    $g.FillRectangle($whiteBrush, $stemLeft, $tTop, $stemWidth, $tHeight)
    
    # 5. Diamante / Fuego ámbar superior derecho
    $flameSize = [int]($size * 0.11)
    $flameX = [int]($size * 0.70)
    $flameY = [int]($size * 0.24)
    $amberBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#f59e0b"))
    $g.FillEllipse($amberBrush, $flameX, $flameY, $flameSize, $flameSize)
    
    $g.Dispose()
    $fullPath = Join-Path (Get-Location) $outPath
    $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generado con exito: $fullPath"
}

Generate-PwaIcon 192 "frontend/public/pwa-192x192.png"
Generate-PwaIcon 512 "frontend/public/pwa-512x512.png"
Generate-PwaIcon 180 "frontend/public/apple-touch-icon.png"
Generate-PwaIcon 180 "frontend/public/apple-touch-icon-180x180.png"
