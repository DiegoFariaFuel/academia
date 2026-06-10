$headers = @{
    apikey = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp'
    Authorization = 'Bearer sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp'
}
try {
    $r = Invoke-WebRequest -Uri 'https://dzsiizepifzoifdhmtxr.supabase.co/auth/v1/settings' -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
}
