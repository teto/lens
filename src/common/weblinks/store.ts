/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { action, comparer, observable, makeObservable } from "mobx";
import type { BaseStoreDependencies } from "../base-store";
import { BaseStore } from "../base-store";
import * as uuid from "uuid";
import { toJS } from "../utils";
import type { Migrations } from "conf/dist/source/types";

export interface WeblinkData {
  id: string;
  name: string;
  url: string;
}

export interface WeblinkCreateOptions {
  id?: string;
  name: string;
  url: string;
}


export interface WeblinkStoreModel {
  weblinks: WeblinkData[];
}

export interface WeblinkStoreDependencies extends BaseStoreDependencies {
  readonly migrations: Migrations<WeblinkStoreModel> | undefined;
}

export class WeblinkStore extends BaseStore<WeblinkStoreModel> {
  readonly displayName = "WeblinkStore";
  @observable weblinks: WeblinkData[] = [];

  constructor(protected readonly dependencies: WeblinkStoreDependencies) {
    super(dependencies, {
      configName: "lens-weblink-store",
      accessPropertiesByDotNotation: false, // To make dots safe in cluster context names
      syncOptions: {
        equals: comparer.structural,
      },
      migrations: dependencies.migrations,
    });
    makeObservable(this);
    this.load();
  }

  @action
  protected fromStore(data: Partial<WeblinkStoreModel> = {}) {
    this.weblinks = data.weblinks || [];
  }

  add(data: WeblinkCreateOptions) {
    const {
      id = uuid.v4(),
      name,
      url,
    } = data;
    const weblink: WeblinkData = { id, name, url };

    this.weblinks.push(weblink);

    return weblink;
  }

  @action
  removeById(id: string) {
    this.weblinks = this.weblinks.filter((w) => w.id !== id);
  }

  toJSON(): WeblinkStoreModel {
    const model: WeblinkStoreModel = {
      weblinks: this.weblinks,
    };

    return toJS(model);
  }
}
