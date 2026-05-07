-- server/obfuscator.lua
-- Server-side copy of the lightweight Prometheus-inspired obfuscator.
-- This file is moved out of the static-serving paths so it isn't trivially downloadable from the site UI.
-- NOTE: for secrecy you should keep this server folder private or host it in a private repository / deployment.

-- (This is the same conservative obfuscator implementation included in the repo earlier.)

local argparse = {}
for i = 1, #arg do
  local a = arg[i]
  if a:match("^%-%-%") then
    local k,v = a:match("^%-%-([^=]+)=(.*)$")
    if k then argparse[k] = v else argparse[a:sub(3)] = true end
  end
end

local input_path = argparse.input or "-"
local output_path = argparse.output or "-"
local mode = (argparse.mode or "lua"):lower()
local mangle_local = argparse["mangle-local"]
local encrypt_strings = argparse["encrypt-strings"]
local encode_numbers = argparse["encode-numbers"]

local function read_file(path)
  if path == "-" then
    return io.read("*a")
  end
  local f = assert(io.open(path, "rb"))
  local d = f:read("*a")
  f:close()
  return d
end

local function write_file(path, data)
  if path == "-" then
    io.write(data)
    return
  end
  local f = assert(io.open(path, "wb"))
  f:write(data)
  f:close()
end

local function gen_name(i)
  local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  local res = "_"
  local n = i
  repeat
    n = n - 1
    res = res .. chars[(n % #chars) + 1]
    n = math.floor(n / #chars)
  until n <= 0
  return res
end

local function collect_locals(src, is_luau)
  local map = {}
  local idx = 1
  for decl in src:gmatch("([^
]-\n)") do
    local s = decl
    if s:match("^%s*local%s+") then
      local code = s:gsub('%s*%-%-.*$', '')
      local after = code:match('^%s*local%s+(.*)')
      if after then
        for name in after:gmatch('([%a_][%w_]*)') do
          if is_luau then
            local typeAnnPattern = name .. '%s*:'
            if not s:find(typeAnnPattern, 1, true) then
              if not map[name] then map[name] = gen_name(idx); idx = idx + 1 end
            end
          else
            if not map[name] then map[name] = gen_name(idx); idx = idx + 1 end
          end
        end
      end
    end
  end
  return map
end

local function replace_idents(src, map)
  if not map then return src end
  for orig, mangled in pairs(map) do
    src = src:gsub("%f[%w]" .. orig .. "%f[%W]", mangled)
  end
  return src
end

local function encrypt_strings_pass(src, key)
  key = key or 0x42
  local seq = 0
  local dec_table = {}
  local function enc(s)
    seq = seq + 1
    local bytes = {}
    for i = 1, #s do
      bytes[#bytes+1] = tostring(string.byte(s, i) ~ key)
    end
    local rep = "__PROM_S" .. tostring(seq)
    dec_table[rep] = {bytes = table.concat(bytes, ","), key = key}
    return rep
  end
  local out = src:gsub([=[(['"])(.-)%1]=], function(q, s)
    return enc(s)
  end)
  local decoder_lines = {"local function __prom_decode(nums, k)\n  local t = {}\n  for n in nums:gmatch('[^,]+') do\n    local v = tonumber(n) ~ k\n    table.insert(t, string.char(v))\n  end\n  return table.concat(t)\nend\n"}
  for id,info in pairs(dec_table) do
    table.insert(decoder_lines, string.format("local %s = __prom_decode('%s', %d)\n", id, info.bytes, info.key))
  end
  for id,_ in pairs(dec_table) do
    out = out:gsub(id, string.format('(%s)', id))
  end
  return table.concat(decoder_lines, "") .. "\n" .. out
end

local function encode_numbers_pass(src)
  local function split_num(n)
    local nnum = tonumber(n)
    if not nnum then return n end
    local a = math.floor(nnum / 2)
    local b = nnum - a
    return tostring(a) .. " + " .. tostring(b)
  end
  return src:gsub('(%f[%d]%-?%d+%.?%d*%f[%D])', function(n) return split_num(n) end)
end

local function transform(src)
  local is_luau = (mode == 'luau')
  local preamble = "-- Obfuscated by luauy/prometheus-fork (based on Prometheus)\n"

  if mangle_local then
    local locals_map = collect_locals(src, is_luau)
    src = replace_idents(src, locals_map)
  end

  if encode_numbers then
    src = encode_numbers_pass(src)
  end

  if encrypt_strings then
    src = encrypt_strings_pass(src)
  end

  return preamble .. src
end

local ok, inp = pcall(read_file, input_path)
if not ok then error('Failed to read input: ' .. tostring(inp)) end
local out = transform(inp)
local w_ok, w_err = pcall(write_file, output_path, out)
if not w_ok then error('Failed to write output: ' .. tostring(w_err)) end

print("Obfuscation complete. Mode=" .. mode .. (mangle_local and ", mangle-local" or "") .. (encrypt_strings and ", encrypt-strings" or "") )
