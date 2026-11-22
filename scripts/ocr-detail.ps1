Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[Windows.Storage.Streams.InMemoryRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.SoftwareBitmap,Windows.Graphics.Imaging,ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine,Windows.Media.Ocr,ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrResult,Windows.Media.Ocr,ContentType=WindowsRuntime] | Out-Null
[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime] | Out-Null

function Await($op, $type) {
  $m = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and
    $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1
  } | Select-Object -First 1
  $m.MakeGenericMethod($type).Invoke($null, @($op)).GetAwaiter().GetResult()
}

function Get-FirstImage($path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $latin = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($bytes)
  foreach ($m in [regex]::Matches($latin, '(?s)(\d+) 0 obj\s*<<(.*?)>>\s*stream\r?\n')) {
    if ($m.Groups[2].Value -match '/DCTDecode' -and $m.Groups[2].Value -match '/Subtype\s*/Image') {
      $start = $m.Index + $m.Length
      $lm = [regex]::Match($m.Groups[2].Value, '/Length\s+(\d+)')
      if (-not $lm.Success) { continue }
      $len = [int]$lm.Groups[1].Value
      $ms = New-Object System.IO.MemoryStream
      $ms.Write($bytes, $start, $len)
      $ms.Position = 0
      return ,@([System.Drawing.Bitmap]::FromStream($ms), $m.Groups[1].Value)
    }
  }
  throw "No image found in $path"
}

$path = 'C:\Users\swaro\OneDrive\Desktop\NEW PROJECT\Level -1 Age - 5 to 10 years.pdf'
$result = Get-FirstImage $path
$bmp = $result[0]
"Image: $($bmp.Width)x$($bmp.Height)"

$stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
$png = New-Object System.IO.MemoryStream
$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$writer = [Windows.Storage.Streams.DataWriter]::new($stream)
$writer.WriteBytes($png.ToArray())
Await ($writer.StoreAsync()) ([uint32]) | Out-Null
$stream.Seek(0)
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
$ocr = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

"=== ALL OCR LINES (y, x, text) ==="
$ocr.Lines | ForEach-Object {
  $line = $_
  $words = $line.Words | ForEach-Object { $_.Text }
  $text = $words -join ' '
  $first = $line.Words | Select-Object -First 1
  if ($first) {
    $b = $first.BoundingRect
    '{0,4},{1,4}  {2}' -f [int]$b.X, [int]$b.Y, $text
  }
}
