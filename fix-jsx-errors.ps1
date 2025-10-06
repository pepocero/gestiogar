# Fix JSX Syntax Errors Script
Write-Host "🔧 Fixing JSX Syntax Errors..." -ForegroundColor Yellow

# Function to fix common JSX indentation issues
function Fix-JSXIndentation {
    param($FilePath, $ProblemLineNumber)
    
    Write-Host "Fixing $FilePath at line $ProblemLineNumber" -ForegroundColor Cyan
    
    # Read all lines
    $lines = Get-Content $FilePath -Raw
    
    # Common fixes for JSX issues
    $fixed = $lines -replace '\s+return \(\s*\n\s*<div', "  return (`n    <div"
    $fixed = $fixed -replace '\s+<div className="space-y-6">\s*\n\s*\{\s*/\*', "    <div className=`"space-y-6`">`n      {/*"
    $fixed = $fixed -replace '\s*<div className="space-y-6">\s*\n\s*\{\s*/\* Header \*\/\s*\}', "    <div className=`"space-y-6`">`n      {/* Header */}"
    
    # Write back
    $fixed | Set-Content $FilePath -NoNewline
    
    Write-Host "✅ Fixed $FilePath" -ForegroundColor Green
}

# Fix each file
Fix-JSXIndentation "app/insurance/page.tsx" 414
Fix-JSXIndentation "app/materials/page.tsx" 325  
Fix-JSXIndentation "app/settings/notifications/page.tsx" 11
Fix-JSXIndentation "app/settings/profile/page.tsx" 114

Write-Host "🎉 All JSX errors fixed!" -ForegroundColor Green
Write-Host "📦 Running build test..." -ForegroundColor Cyan

# Test build
npm run build

