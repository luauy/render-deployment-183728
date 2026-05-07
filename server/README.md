# server/README.md

This folder contains server-side code for an obfuscation API. The goal is to run obfuscation on the server so web users can obfuscate their code without downloading the obfuscator source from the static site.

Important notes
- Keeping server/ in this public repository still exposes the server code to anyone who can access the repo. For secrecy, move the server folder to a private repository or private deployment after review.
- A more secure approach is to compile the obfuscator core to WebAssembly (Rust) and ship only the WASM binary to the server. The WASM binary is still downloadable if hosted publicly, so host it privately.

Two execution paths are supported by the example server implementation:
1. WASM runtime (preferred for performance and portability): if `server/obfuscator.wasm` exists and exports an `obfuscate` function, the server will attempt to call it. See `server/wasm/README.md` for guidance on compiling from Rust.
2. Lua fallback: if no WASM module is present, the server will spawn a local Lua interpreter and run `server/obfuscator.lua`. Ensure your deployment includes a Lua runtime in this case.

Auth & security
- The server example enforces a bearer token via the OBFUSCATE_TOKEN environment variable. Set a strong token in your Render (or other) environment.
- The server enforces a body size limit and execution timeout. You should tune these values to your deployment and add rate-limiting and authentication as needed.

To run locally (development)
- Requires Node.js and a system Lua binary in PATH (if you plan to use the Lua fallback):
  - OBFUSCATE_TOKEN=dev-token node server/index.js
- POST to http://localhost:3000/api/obfuscate with Authorization: Bearer dev-token and JSON body: {"code":"print(1)", "options":{ "mode":"lua", "mangle_local": true }}
