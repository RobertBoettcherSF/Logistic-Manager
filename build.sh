#!/bin/sh
# Compiles the Swift Drive Ada core to WebAssembly and embeds it in
# docs/index.html. JavaScript in web/template.html only draws.
set -e
cd "$(dirname "$0")"
T=$PWD/toolchain/usr
if [ ! -x "$T/bin/llvm-gcc" ]; then
  echo "Run tools/get-toolchain.sh first"
  exit 1
fi
export LD_LIBRARY_PATH="$PWD/toolchain/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
LD=$(command -v wasm-ld || true)
if [ -z "$LD" ]; then
  LD=$(ls /usr/bin/wasm-ld-* 2>/dev/null | tail -1 || true)
fi
if [ -z "$LD" ]; then
  echo "wasm-ld not found (install the lld package)"
  exit 1
fi
rm -rf obj/wasm
mkdir -p obj/wasm docs
cd obj/wasm
for F in \
  ../../src/sd_fare.adb \
  ../../src/sd_geo.adb \
  ../../src/sd_trip.adb \
  ../../src/sd_api.adb
do
  echo "cc $F"
  "$T/bin/llvm-gcc" -c --target=wasm32 -O2 -gnat2012 -gnatwa -gnatwe -gnatw.X \
    --RTS="$T/lib/rts-native" -I../../src "$F"
done
python3 - "$T/lib/rts-native/adalib/libgnat.a" libgnat-wasm.a << 'PY'
import os, subprocess, sys
src, dst = sys.argv[1:]
os.makedirs("rts-pick", exist_ok=True)
members = subprocess.check_output(["ar", "t", src], text=True).split()
keep = []
for i, member in enumerate(members):
    data = subprocess.check_output(["ar", "p", src, member])
    if data.startswith(b"\0asm") or data.startswith(b"BC\xc0\xde"):
        path = os.path.join("rts-pick", f"{i:04d}-{member}")
        open(path, "wb").write(data)
        keep.append(path)
if not keep:
    sys.exit("no wasm objects in libgnat.a")
subprocess.check_call(["ar", "rcs", dst, *keep])
print(f"rts archive {len(keep)} wasm members, skipped {len(members) - len(keep)}")
PY
set --
for E in $(python3 - << 'PY'
import re
text = open("../../src/sd_api.ads", encoding="utf-8").read()
print(" ".join(re.findall(r'External_Name => "([^"]+)"', text)))
PY
); do
  set -- "$@" "--export=$E"
done
clang --target=wasm32-unknown-unknown -c -O2 -o gnat_grow.o ../../tools/gnat_grow.c
"$LD" --no-entry --export-memory --strip-all \
  "$@" \
  -z stack-size=1048576 \
  --initial-memory=16777216 \
  --max-memory=67108864 \
  -o sd.wasm \
  *.o \
  libgnat-wasm.a
cd ../..
python3 tools/embed.py obj/wasm/sd.wasm web/template.html docs/index.html
echo "Built docs/index.html ($(wc -c < obj/wasm/sd.wasm) bytes of WebAssembly)"
