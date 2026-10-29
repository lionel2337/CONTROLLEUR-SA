Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\USER\Documents\controlleur SA\public\logo.png.jpeg'
$img = [System.Drawing.Image]::FromFile($src)

function SaveResized($image, $size, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($image, 0, 0, $size, $size)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved: $outPath"
}

$base = 'C:\Users\USER\Documents\controlleur SA\public'
SaveResized $img 192 "$base\icon-192.png"
SaveResized $img 512 "$base\icon-512.png"

$img.Dispose()
Write-Host "Done!"
