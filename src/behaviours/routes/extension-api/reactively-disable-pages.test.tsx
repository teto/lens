/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { RenderResult } from "@testing-library/react";
import type { IObservableValue } from "mobx";
import { observable, runInAction, computed } from "mobx";
import React from "react";
import type { TestExtensionRenderer } from "../../../renderer/components/test-utils/get-extension-fake";
import type { ApplicationBuilder } from "../../../renderer/components/test-utils/get-application-builder";
import { getApplicationBuilder } from "../../../renderer/components/test-utils/get-application-builder";
import { getExtensionFakeFor } from "../../../renderer/components/test-utils/get-extension-fake";

describe("reactively disable pages", () => {
  let builder: ApplicationBuilder;
  let rendered: RenderResult;
  let someObservable: IObservableValue<boolean>;
  let rendererTestExtension: TestExtensionRenderer;

  beforeEach(async () => {
    builder = getApplicationBuilder();

    const getExtensionFake = getExtensionFakeFor(builder);

    someObservable = observable.box(false);

    const testExtension = getExtensionFake({
      id: "test-extension-id",
      name: "test-extension",

      rendererOptions: {
        globalPages: [{
          components: {
            Page: () => <div data-testid="some-test-page">Some page</div>,
          },

          enabled: computed(() => someObservable.get()),
        }],
      },
    });

    rendered = await builder.render();

    builder.extensions.enable(testExtension);

    rendererTestExtension = testExtension.renderer;
  });

  it("when navigating to the page, does not show the page", () => {
    rendererTestExtension.navigate();

    const actual = rendered.queryByTestId("some-test-page");

    expect(actual).not.toBeInTheDocument();
  });

  it("given page becomes enabled, when navigating to the page, shows the page", () => {
    runInAction(() => {
      someObservable.set(true);
    });

    rendererTestExtension.navigate();

    const actual = rendered.queryByTestId("some-test-page");

    expect(actual).toBeInTheDocument();
  });
});
