# luauy / render-deployment-183728

This repository is a personal area for building and publishing Lua/Luau tools and a small static site prepared for Render.

This fork contains a lightweight, Prometheus-inspired obfuscator plus helper files and site pages to make publishing and testing easy.

Attribution

This project is a derivative work based on Prometheus by Elias Oelschner (prometheus-lua/Prometheus).
As required by the Prometheus License, this repository includes visible attribution:

> Based on Prometheus by Elias Oelschner, https://github.com/prometheus-lua/Prometheus

See the original repository and LICENSE for full license text and conditions.

Quick start

- Static site: deploy on Render as a static site (publish path: `/`).
- Obfuscator (CLI):

  ```bash
  # example: obfuscate input.lua to output.obf.lua
  ./bin/obfuscate.sh --input lua/examples/sample.lua --output out.obf.lua --mangle-local --encrypt-strings
  ```

Files added in this commit

- index.html — simple site entry (Render-friendly, no blocking code)
- assets/styles.css — minimal styling
- pages/lua-obfuscator.html — obfuscator documentation and options
- pages/advanced.html — Luau-specific notes and advanced guidance
- lua/obfuscator.lua — lightweight Prometheus-inspired obfuscator (already present)
- lua/examples/sample.lua — sample Lua file for testing
- bin/obfuscate.sh — small bash wrapper for the obfuscator
- render.yaml — suggested Render static site config

Notes

- This fork intentionally keeps transforms conservative in `--mode=luau` to reduce the risk of breaking Luau syntax or Roblox runtime constraints.
- Aggressive AST-based passes from Prometheus require careful porting and testing; they are not fully ported here.

Next steps I can take for you

- Add CI tests that run the obfuscator against sample files and verify valid output.
- Expand the obfuscator with more AST passes on a feature branch.
- Improve the web UI and add example before/after code snippets.
