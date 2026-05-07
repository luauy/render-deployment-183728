# Access & Privacy

This repository hosts a public demo site and documentation for a Lua/Luau obfuscator project. To reduce casual downloads of the obfuscator implementation, direct links to the obfuscator sources are intentionally not present on the public site.

If you are the repository owner and want to keep the obfuscator entirely private, the recommended steps are:

1. Move the `server/` folder (and any obfuscator sources) into a private repository or private submodule. This prevents casual access to the server code from the public repo.
2. Configure CI to build the WASM artifact and produce a private Docker image that contains the compiled wasm and server code; push that image to a private container registry.
3. Deploy the private Docker image to Render or another host as a private web service; do not commit compiled wasm artifacts to the public repo.

If you want me to help move the server folder into a private repo and prepare a migration script, say the word and I will prepare an extraction script and step-by-step guide. 
