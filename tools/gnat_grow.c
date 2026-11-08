/* Wasm linear-memory growth for the Ada rts-native allocator.
   __gnat_grow(pages) grows by that many 64 KiB pages and returns the
   previous size in pages. On failure it returns -pages so the runtime's
   (pages + result) becomes 0 and the allocation is refused.
   A request of 0 pages only reports the current size. */
typedef unsigned int u32;
typedef int i32;

__attribute__((export_name("__gnat_grow")))
u32 __gnat_grow(u32 pages) {
  i32 old = __builtin_wasm_memory_grow(0, pages);
  if (old < 0) {
    return 0u - pages;
  }
  return (u32)old;
}
