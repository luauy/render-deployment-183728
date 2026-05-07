// server/index.js - improved JSON-safe API responses (base64-encode output)
// Note: returns { ok: true, b64result: <base64-string> } on success

const express = require('express')
const bodyParser = require('body-parser')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000
const TOKEN = process.env.OBFUSCATE_TOKEN || 'changeme'
const MAX_BODY = process.env.MAX_BODY || '200kb'
const TIMEOUT_MS = parseInt(process.env.OBFUSCATE_TIMEOUT_MS || '5000', 10)

app.use(bodyParser.json({ limit: MAX_BODY }))

// Try to load a wasm module (if present). The expected exported function is `obfuscate`.
let wasmModule = null
const wasmPath = path.join(__dirname, 'obfuscator.wasm')
if (fs.existsSync(wasmPath)) {
  try {
    const wasmBytes = fs.readFileSync(wasmPath)
    const mod = new WebAssembly.Module(wasmBytes)
    const inst = new WebAssembly.Instance(mod, {})
    if (inst.exports && typeof inst.exports.obfuscate === 'function') {
      wasmModule = inst
      console.log('WASM obfuscator loaded.')
    } else {
      console.warn('WASM loaded but no obfuscate export found. Fallback to Lua.')
    }
  } catch (e) {
    console.warn('Failed to load WASM module, fallback to Lua:', e.message)
  }
}

function checkAuth(req) {
  const h = req.headers['authorization'] || ''
  if (!h.startsWith('Bearer ')) return false
  const token = h.slice(7)
  return token === TOKEN
}

app.post('/api/obfuscate', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ error: 'invalid token' })
  const code = req.body && req.body.code
  const options = req.body && req.body.options || {}
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'missing or invalid code' })

  // If a WASM module is available and supports obfuscation, call it.
  if (wasmModule) {
    try {
      // NOTE: This example does not include wasm-bindgen glue. A proper wasm-pack build will provide a JS wrapper.
      return res.status(501).json({ error: 'WASM present but not callable in this runtime example. Use wasm-pack generated glue or fallback to Lua.' })
    } catch (e) {
      return res.status(500).json({ error: 'wasm error', detail: e.message })
    }
  }

  // Fallback: spawn a Lua process that runs server/obfuscator.lua
  const luaPath = process.env.LUA_BIN || 'lua'
  const serverScript = path.join(__dirname, 'obfuscator.lua')
  const args = []
  if (options.mode) args.push('--mode=' + options.mode)
  if (options.mangle_local) args.push('--mangle-local')
  if (options.encrypt_strings) args.push('--encrypt-strings')
  if (options.encode_numbers) args.push('--encode-numbers')

  args.unshift(serverScript)

  const child = spawn(luaPath, args, { stdio: ['pipe', 'pipe', 'pipe'] })
  let stdout = ''
  let stderr = ''
  let timedOut = false

  const to = setTimeout(() => {
    timedOut = true
    child.kill('SIGKILL')
  }, TIMEOUT_MS)

  child.stdout.on('data', (d) => { stdout += d.toString('utf8') })
  child.stderr.on('data', (d) => { stderr += d.toString('utf8') })

  child.on('error', (err) => {
    clearTimeout(to)
    return res.status(500).json({ error: 'failed to start obfuscator process', detail: err.message })
  })

  child.on('close', (codeExit) => {
    clearTimeout(to)
    if (timedOut) return res.status(504).json({ error: 'timeout' })
    if (codeExit !== 0) return res.status(500).json({ error: 'obfuscator failed', detail: stderr || 'unknown error' })

    try {
      // Ensure stdout is UTF-8 string. Encode to base64 to avoid JSON-breaking characters.
      const b64 = Buffer.from(stdout, 'utf8').toString('base64')
      return res.json({ ok: true, b64result: b64 })
    } catch (e) {
      return res.status(500).json({ error: 'encoding error', detail: e.message })
    }
  })

  // write the user code to stdin
  try {
    child.stdin.write(code)
    child.stdin.end()
  } catch (e) {
    clearTimeout(to)
    child.kill('SIGKILL')
    return res.status(500).json({ error: 'failed to send code to obfuscator', detail: e.message })
  }

})

app.listen(PORT, () => {
  console.log('Obfuscation API listening on port', PORT)
})
