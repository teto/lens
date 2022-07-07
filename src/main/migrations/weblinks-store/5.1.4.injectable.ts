/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { docsUrl, slackUrl } from "../../../common/vars";
import type { WeblinkData } from "../../../common/weblinks/store";
import { getInjectable } from "@ogre-tools/injectable";
import { weblinksStoreMigrationDeclarationInjectionToken } from "./migration";

export const lensWebsiteLinkName = "Lens Website";
export const lensDocumentationWeblinkName = "Lens Documentation";
export const lensSlackWeblinkName = "Lens Community Slack";
export const lensTwitterWeblinkName = "Lens on Twitter";
export const lensBlogWeblinkName = "Lens Official Blog";
export const kubernetesDocumentationWeblinkName = "Kubernetes Documentation";

const weblinksStoreV514MigrationInjectable = getInjectable({
  id: "weblinks-store-v5.1.4-migration",
  instantiate: () => ({
    version: "5.1.4",
    run(store) {
      const weblinksRaw = store.get("weblinks");
      const weblinks = (Array.isArray(weblinksRaw) ? weblinksRaw : []) as WeblinkData[];

      weblinks.push(
        { id: "https://k8slens.dev", name: lensWebsiteLinkName, url: "https://k8slens.dev" },
        { id: docsUrl, name: lensDocumentationWeblinkName, url: docsUrl },
        { id: slackUrl, name: lensSlackWeblinkName, url: slackUrl },
        { id: "https://twitter.com/k8slens", name: lensTwitterWeblinkName, url: "https://twitter.com/k8slens" },
        { id: "https://medium.com/k8slens", name: lensBlogWeblinkName, url: "https://medium.com/k8slens" },
        { id: "https://kubernetes.io/docs/home/", name: kubernetesDocumentationWeblinkName, url: "https://kubernetes.io/docs/home/" },
      );

      store.set("weblinks", weblinks);
    },
  }),
  injectionToken: weblinksStoreMigrationDeclarationInjectionToken,
});

export default weblinksStoreV514MigrationInjectable;

