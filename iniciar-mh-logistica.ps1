$nodeDir = "$env:USERPROFILE\AppData\Local\NodePortable\node-v20.18.1-win-x64"
$env:Path = "$nodeDir;$env:Path"
$proyecto = "C:\Users\EMILIO SARABIA\Documents\DashBoard"

$enUso = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $enUso) {
    Start-Process -FilePath "$nodeDir\npx.cmd" -ArgumentList "next dev -p 3000" -WorkingDirectory $proyecto -WindowStyle Hidden
    Start-Sleep -Seconds 6
}

Start-Process "http://localhost:3000"
