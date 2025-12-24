$gitHash = git rev-parse --short HEAD
$content = "export const APP_VERSION = 'Build $gitHash';"
Set-Content -Path "js/version.js" -Value $content
Write-Host "Version updated to: Build $gitHash"
