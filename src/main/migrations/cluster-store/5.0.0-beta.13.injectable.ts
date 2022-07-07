/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { ClusterModel, ClusterPreferences, ClusterPrometheusPreferences } from "../../../common/cluster-types";
import { generateNewIdFor } from "../utils";
import directoryForUserDataInjectable from "../../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";
import { isDefined } from "../../../common/utils";
import { getInjectable } from "@ogre-tools/injectable";
import { clusterStoreMigrationDeclarationInjectionToken } from "./migration";
import migrationLogInjectable from "../log.injectable";
import fsInjectable from "../../../common/fs/fs.injectable";
import joinPathsInjectable from "../../../common/path/join-paths.injectable";

function mergePrometheusPreferences(left: ClusterPrometheusPreferences, right: ClusterPrometheusPreferences): ClusterPrometheusPreferences {
  if (left.prometheus && left.prometheusProvider) {
    return {
      prometheus: left.prometheus,
      prometheusProvider: left.prometheusProvider,
    };
  }

  if (right.prometheus && right.prometheusProvider) {
    return {
      prometheus: right.prometheus,
      prometheusProvider: right.prometheusProvider,
    };
  }

  return {};
}

function mergePreferences(left: ClusterPreferences, right: ClusterPreferences): ClusterPreferences {
  return {
    terminalCWD: left.terminalCWD || right.terminalCWD || undefined,
    clusterName: left.clusterName || right.clusterName || undefined,
    iconOrder: left.iconOrder || right.iconOrder || undefined,
    icon: left.icon || right.icon || undefined,
    httpsProxy: left.httpsProxy || right.httpsProxy || undefined,
    hiddenMetrics: mergeSet(left.hiddenMetrics ?? [], right.hiddenMetrics ?? []),
    ...mergePrometheusPreferences(left, right),
  };
}

function mergeLabels(left: Record<string, string>, right: Record<string, string>): Record<string, string> {
  return {
    ...right,
    ...left,
  };
}

function mergeSet(...iterables: Iterable<string | undefined>[]): string[] {
  const res = new Set<string>();

  for (const iterable of iterables) {
    for (const val of iterable) {
      if (val) {
        res.add(val);
      }
    }
  }

  return [...res];
}

function mergeClusterModel(prev: ClusterModel, right: Omit<ClusterModel, "id">): ClusterModel {
  return {
    id: prev.id,
    kubeConfigPath: prev.kubeConfigPath,
    contextName: prev.contextName,
    preferences: mergePreferences(prev.preferences ?? {}, right.preferences ?? {}),
    metadata: prev.metadata,
    labels: mergeLabels(prev.labels ?? {}, right.labels ?? {}),
    accessibleNamespaces: mergeSet(prev.accessibleNamespaces ?? [], right.accessibleNamespaces ?? []),
    workspace: prev.workspace || right.workspace,
    workspaces: mergeSet([prev.workspace, right.workspace], prev.workspaces ?? [], right.workspaces ?? []),
  };
}

const clusterStoreV500Beta13MigrationInjectable = getInjectable({
  id: "cluster-store-v5.0.0-beta.13-migration",
  instantiate: (di) => {
    const migrationLog = di.inject(migrationLogInjectable);
    const userDataPath = di.inject(directoryForUserDataInjectable);
    const joinPaths = di.inject(joinPathsInjectable);
    const { moveSync, removeSync } = di.inject(fsInjectable);

    const moveStorageFolder = ({ folder, newId, oldId }: { folder: string; newId: string; oldId: string }) => {
      const oldPath = joinPaths(folder, `${oldId}.json`);
      const newPath = joinPaths(folder, `${newId}.json`);

      try {
        moveSync(oldPath, newPath);
      } catch (error) {
        if (String(error).includes("dest already exists")) {
          migrationLog(`Multiple old lens-local-storage files for newId=${newId}. Removing ${oldId}.json`);
          removeSync(oldPath);
        }
      }
    };

    return {
      version: "5.0.0-beta.13",
      run(store) {
        const folder = joinPaths(userDataPath, "lens-local-storage");

        const oldClusters = (store.get("clusters") ?? []) as ClusterModel[];
        const clusters = new Map<string, ClusterModel>();

        for (const { id: oldId, ...cluster } of oldClusters) {
          const newId = generateNewIdFor(cluster);
          const newCluster = clusters.get(newId);

          if (newCluster) {
            migrationLog(`Duplicate entries for ${newId}`, { oldId });
            clusters.set(newId, mergeClusterModel(newCluster, cluster));
          } else {
            migrationLog(`First entry for ${newId}`, { oldId });
            clusters.set(newId, {
              ...cluster,
              id: newId,
              workspaces: [cluster.workspace].filter(isDefined),
            });
            moveStorageFolder({ folder, newId, oldId });
          }
        }

        store.set("clusters", [...clusters.values()]);
      },
    };
  },
  injectionToken: clusterStoreMigrationDeclarationInjectionToken,
});

export default clusterStoreV500Beta13MigrationInjectable;

