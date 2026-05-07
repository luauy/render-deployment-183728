# server/wasm/README.md

If you want to implement a high-performance obfuscator core and compile it to WebAssembly, a good approach is to reimplement the core obfuscation algorithms in Rust and expose a simple FFI-friendly function like:

  - extern "C" fn obfuscate(ptr: *const u8, len: usize, out_ptr: *mut u8) -> usize

or use wasm-bindgen to export a function that accepts and returns strings directly for Node.js.

General steps:
1. Implement obfuscator core in Rust.
2. Add wasm-bindgen and compile: `wasm-pack build --target nodejs` or `cargo build --target wasm32-unknown-unknown` then use wasm-bindgen-cli.
3. Place the generated .wasm and glue files into `server/wasm/` and update `server/index.js` to `require` or instantiate the module using the generated glue.

Security note: keep the compiled WASM binary in a private deployment or private repo to avoid revealing your implementation if secrecy is important.
