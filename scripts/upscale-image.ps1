param([string]$Path, [string]$Out, [int]$Scale = 4)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($Path)
$w = $img.Width * $Scale
$h = $img.Height * $Scale
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gfx.DrawImage($img, 0, 0, $w, $h)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$gfx.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "$Out $w x $h"
