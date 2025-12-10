# Fix ESM imports by adding .js extensions
# This script updates all TypeScript files in the domain layer

$domainPath = "src/domain"

# Get all TypeScript files
$files = Get-ChildItem -Path $domainPath -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Fix @shared imports
    if ($content -match "from '@shared/(types|errors|constants|utils)';") {
        $content = $content -replace "from '@shared/(types|errors|constants|utils)';", "from '@shared/`$1/index.js';"
        $modified = $true
    }
    
    # Fix relative imports without .js extension
    if ($content -match "from '\.\./[^']+(?<!\.js)';") {
        $content = $content -replace "from '(\.\./[^']+)';", "from '`$1.js';"
        $modified = $true
    }
    
    if ($content -match "from '\./[^']+(?<!\.js)';") {
        $content = $content -replace "from '(\./[^']+)';", "from '`$1.js';"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing imports!"
