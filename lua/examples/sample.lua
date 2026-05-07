-- lua/examples/sample.lua
local function greet(name)
  local msg = "Hello, " .. name .. "!"
  print(msg)
end

for i = 1, 3 do
  greet("world")
end
