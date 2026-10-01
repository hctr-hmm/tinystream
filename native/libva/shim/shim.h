// SPDX-License-Identifier: AGPL-3.0-or-later

#include <dlfcn.h>
#include <stddef.h>

#if defined(__APPLE__)
#define LIBVA "libva.2.dylib"
#define LIBVA_DRM "libva-drm.2.dylib"
#else
#define LIBVA "libva.so.2"
#define LIBVA_DRM "libva-drm.so.2"
#endif

static void *shim_open(const char *lib, void **handle) {
    void *h = __atomic_load_n(handle, __ATOMIC_ACQUIRE);
    if (!h && (h = dlopen(lib, RTLD_NOW | RTLD_LOCAL)))
        __atomic_store_n(handle, h, __ATOMIC_RELEASE);
    return h;
}

static void *shim_sym(const char *lib, void **handle, const char *name) {
    void *h = shim_open(lib, handle);
    return h ? dlsym(h, name) : NULL;
}

#define FORWARD(lib, handle, ret, fail, name, params, args)                     \
    ret name params {                                                           \
        static void *fn;                                                        \
        void *f = __atomic_load_n(&fn, __ATOMIC_ACQUIRE);                       \
        if (!f && (f = shim_sym(lib, &handle, #name)))                          \
            __atomic_store_n(&fn, f, __ATOMIC_RELEASE);                         \
        return f ? ((ret(*) params)f) args : fail;                              \
    }
