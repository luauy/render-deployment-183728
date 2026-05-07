// pages/obfuscate.js - client UI for sending code to the server obfuscation API
// Now decodes base64-encoded result payloads returned by the API

document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('run')
  const out = document.getElementById('out')
  runBtn.addEventListener('click', async () => {
    out.textContent = 'Sending...'
    const code = document.getElementById('code').value
    const token = document.getElementById('token').value
    const options = {
      mode: 'lua',
      mangle_local: document.getElementById('mangle').checked,
      encrypt_strings: document.getElementById('encrypt').checked,
      encode_numbers: document.getElementById('encode').checked
    }
    try {
      const resp = await fetch('/api/obfuscate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ code, options })
      })

      let j
      try {
        j = await resp.json()
      } catch (e) {
        out.textContent = 'Invalid JSON response from server.'
        return
      }

      if (!resp.ok) {
        out.textContent = 'Error: ' + (j.error || JSON.stringify(j))
        return
      }

      // If server returned a base64-encoded result, decode it; otherwise use plain result
      if (j.b64result) {
        try {
          // atob returns a binary string; for UTF-8 safe usage:
          const decoded = new TextDecoder('utf-8').decode(
            Uint8Array.from(atob(j.b64result), c => c.charCodeAt(0))
          )
          out.textContent = decoded
        } catch (e) {
          // Fallback: just show base64 string
          out.textContent = 'Error decoding base64 result: ' + e.message
        }
      } else if (j.result) {
        out.textContent = j.result
      } else {
        out.textContent = JSON.stringify(j)
      }

    } catch (e) {
      out.textContent = 'Network/Error: ' + e.message
    }
  })
})
