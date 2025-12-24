$gitHash = git rev-parse --short HEAD
$versionString = "Build $gitHash"

# 1. Update JS
$content = "export const APP_VERSION = '$versionString';"
Set-Content -Path "js/version.js" -Value $content

# 2. Update HTML Files (Regex Replace)
$htmlFiles = Get-ChildItem -Path . -Filter "*.html"
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    # Regex look for <span class="version">Build ...</span>
    $newContent = $content -replace '<span class="version">Build [a-f0-9]+</span>', "<span class=`"version`">$versionString</span>"
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}

Write-Host "Version updated to: $versionString"
