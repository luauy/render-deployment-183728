// pages/obfuscate.js - client UI for sending code to the server obfuscation API
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
      const j = await resp.json()
      if (!resp.ok) {
        out.textContent = 'Error: ' + (j.error || JSON.stringify(j))
        return
      }
      out.textContent = j.result || JSON.stringify(j)
    } catch (e) {
      out.textContent = 'Network/Error: ' + e.message
    }
  })
})
