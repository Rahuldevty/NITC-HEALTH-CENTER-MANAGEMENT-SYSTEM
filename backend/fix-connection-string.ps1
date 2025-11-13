# PowerShell script to fix MongoDB connection string
Write-Host "🔧 Fixing MongoDB Connection String..." -ForegroundColor Yellow

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Read current .env
$content = Get-Content $envFile -Raw

# Check if MONGO_URI exists and fix it
if ($content -match "MONGO_URI=(.+)") {
    $currentUri = $matches[1].Trim()
    Write-Host "Current MONGO_URI: $currentUri" -ForegroundColor Cyan
    
    # Check if it ends with just / or /nitc-hcms
    if ($currentUri -match "mongodb\+srv://.+\@.+/$") {
        Write-Host "⚠️  Connection string missing database name!" -ForegroundColor Yellow
        $fixedUri = $currentUri.TrimEnd('/') + "/nitc-hcms?retryWrites=true" + [char]38 + "w=majority"
        Write-Host "Fixed URI: $fixedUri" -ForegroundColor Green
        
        # Replace in content
        $content = $content -replace "MONGO_URI=(.+)\r?\n", "MONGO_URI=$fixedUri`r`n"
        
        # Write back
        Set-Content $envFile -Value $content -NoNewline
        Write-Host "✅ Connection string fixed!" -ForegroundColor Green
    } elseif ($currentUri -match "mongodb\+srv://.+\@.+/nitc-hcms") {
        Write-Host "✅ Connection string looks correct!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connection string format might be incorrect" -ForegroundColor Yellow
        Write-Host "Expected format: mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ MONGO_URI not found in .env file!" -ForegroundColor Red
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make sure your IP is whitelisted in MongoDB Atlas" -ForegroundColor White
Write-Host "2. Go to: https://cloud.mongodb.com/ → Network Access" -ForegroundColor White
Write-Host "3. Add your IP or use 0.0.0.0/0 for development" -ForegroundColor White
Write-Host "4. Wait 2-3 minutes for changes to take effect" -ForegroundColor White
Write-Host "5. Restart your server" -ForegroundColor White

