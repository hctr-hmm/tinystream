// SPDX-License-Identifier: AGPL-3.0-or-later

#include <va/va_drm.h>

#include "shim.h"

static void *libva_drm;

FORWARD(LIBVA_DRM, libva_drm, VADisplay, NULL, vaGetDisplayDRM, (int fd), (fd))
