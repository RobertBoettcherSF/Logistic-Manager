#!/usr/bin/env python3
"""Embed sd.wasm into the single demo page.
usage: embed.py sd.wasm web/template.html docs/index.html
"""
import base64
import pathlib
import sys

wasm, template, out = sys.argv[1:4]
raw = pathlib.Path(wasm).read_bytes()
if raw[:4] != b"\0asm":
    sys.exit("wasm magic missing")
b64 = base64.b64encode(raw).decode("ascii")
commit = "0.3.0"
page = pathlib.Path(template).read_text(encoding="utf-8")
for needle in ("__WASM_BASE64__", "__BUILD_ID__"):
    if needle not in page:
        sys.exit("template has no " + needle + " placeholder")
page = page.replace("__WASM_BASE64__", b64).replace("__BUILD_ID__", commit)
pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
pathlib.Path(out).write_text(page, encoding="utf-8")
print(f"wrote {out} ({len(raw)} wasm bytes, {len(b64)} base64 chars, {commit})")
