// server/index.js - simple obfuscation API server
// Note: This is an example implementation. For secrecy, keep the server folder private when you deploy.

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

function checkAuth(req, res) {
  const h = req.headers['authorization'] || ''
  if (!h.startsWith('Bearer ')) return false
  const token = h.slice(7)
  return token === TOKEN
}

app.post('/api/obfuscate', async (req, res) => {
  if (!checkAuth(req, res)) return res.status(401).json({ error: 'invalid token' })
  const code = req.body && req.body.code
  const options = req.body && req.body.options || {}
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'missing code' })

  // If a WASM module is available and supports obfuscation, call it.
  if (wasmModule) {
    try {
      // Note: calling a WASM function that accepts strings requires a helper runtime (malloc, memory, etc.).
      // A real Rust -> WASM build should export a friendly FFI function (for example via wasm-bindgen) and a Node.js glue.
      return res.status(501).json({ error: 'WASM present but not callable in this example. See server/wasm/README.md to compile a callable module.' })
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

  child.stdout.on('data', (d) => { stdout += d.toString() })
  child.stderr.on('data', (d) => { stderr += d.toString() })

  child.on('close', (codeExit) => {
    clearTimeout(to)
    if (timedOut) return res.status(504).json({ error: 'timeout' })
    if (codeExit !== 0) return res.status(500).json({ error: 'obfuscator failed', detail: stderr })
    // stdout contains obfuscated output
    return res.json({ ok: true, result: stdout })
  })

  // write the user code to stdin
  child.stdin.write(code)
  child.stdin.end()

})

app.listen(PORT, () => {
  console.log('Obfuscation API listening on port', PORT)
})
