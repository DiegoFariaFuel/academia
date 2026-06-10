$headers = @{
    apikey = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp'
    Authorization = 'Bearer sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp'
}
try {
    $r = Invoke-WebRequest -Uri 'https://dzsiizepifzoifdhmtxr.supabase.co/auth/v1/user' -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
