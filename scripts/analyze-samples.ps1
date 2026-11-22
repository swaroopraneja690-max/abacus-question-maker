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
  $match = [regex]::Match($latin, '(?s)\d+ 0 obj\s*<<(.*?)>>\s*stream\r?\n')
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

function Get-DarkCounts($bmp) {
  $rows = @()
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $count = 0
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $p = $bmp.GetPixel($x, $y)
      if (($p.R * 0.3 + $p.G * 0.59 + $p.B * 0.11) -lt 140) { $count++ }
    }
    $rows += $count
  }
  return ,$rows
}

$folder = 'C:\Users\swaro\OneDrive\Desktop\NEW PROJECT'
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))

Get-ChildItem -LiteralPath $folder -Filter '*.pdf' | ForEach-Object {
  $result = Get-FirstImage $_.FullName
  $bmp = $result[0]
  $obj = $result[1]
  "########## $($_.Name)  obj=$obj  $($bmp.Width)x$($bmp.Height)"

  $rowCounts = Get-DarkCounts $bmp
  $horizontal = @()
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    if ($rowCounts[$y] -gt ($bmp.Width * 0.85)) { $horizontal += $y }
  }
  "Horizontal lines: $($horizontal -join ',')"

  $gridTop = if ($horizontal.Count -gt 0) { $horizontal[0] - 20 } else { 80 }
  $gridBottom = if ($horizontal.Count -gt 0) { $horizontal[-1] + 5 } else { $bmp.Height - 10 }
  $vertical = @()
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $count = 0
    for ($y = $gridTop; $y -le $gridBottom; $y++) {
      $p = $bmp.GetPixel($x, $y)
      if (($p.R * 0.3 + $p.G * 0.59 + $p.B * 0.11) -lt 140) { $count++ }
    }
    if ($count -gt (($gridBottom - $gridTop) * 0.75)) { $vertical += $x }
  }
  "Vertical lines: $($vertical -join ',')"

  $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
  $png = New-Object System.IO.MemoryStream
  $bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $writer = [Windows.Storage.Streams.DataWriter]::new($stream)
  $writer.WriteBytes($png.ToArray())
  Await ($writer.StoreAsync()) ([uint32]) | Out-Null
  $stream.Seek(0)
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $ocr = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  "OCR header words (y < 100):"
  $ocr.Lines | ForEach-Object {
    foreach ($w in $_.Words) {
      $b = $w.BoundingRect
      if ($b.Y -lt 100) { '  {0,4},{1,3}  {2}' -f [int]$b.X, [int]$b.Y, $w.Text }
    }
  }
  ''
}
