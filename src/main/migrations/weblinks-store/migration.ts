/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectionToken } from "@ogre-tools/injectable";
import type { MigrationDeclaration } from "../declaration";

export const weblinksStoreMigrationDeclarationInjectionToken = getInjectionToken<MigrationDeclaration>({
  id: "weblinks-store-migration-declaration-token",
});
