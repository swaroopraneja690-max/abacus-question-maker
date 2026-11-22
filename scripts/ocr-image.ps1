param([string]$Path)

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

$img = [System.Drawing.Image]::FromFile($Path)
$stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
$png = New-Object System.IO.MemoryStream
$img.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$writer = [Windows.Storage.Streams.DataWriter]::new($stream)
$writer.WriteBytes($png.ToArray())
Await ($writer.StoreAsync()) ([uint32]) | Out-Null
$stream.Seek(0)
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
$ocr = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

"Image: $($img.Width)x$($img.Height)"
$ocr.Lines | ForEach-Object {
  $words = $_.Words | ForEach-Object { $_.Text }
  $text = $words -join ' '
  $first = $_.Words | Select-Object -First 1
  if ($first) {
    $b = $first.BoundingRect
    '{0,4},{1,4}  {2}' -f [int]$b.X, [int]$b.Y, $text
  }
}
$img.Dispose()
