/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { observer } from "mobx-react";
import { SubTitle } from "../layout/sub-title";
import { Select } from "../select";
import type { ThemeStore } from "../../themes/store";
import type { UserStore } from "../../../common/user-store";
import { Input } from "../input";
import { Switch } from "../switch";
import moment from "moment-timezone";
import { defaultExtensionRegistryUrl, defaultLocaleTimezone, defaultExtensionRegistryUrlLocation } from "../../../common/user-store/preferences-helpers";
import type { IComputedValue } from "mobx";
import { runInAction } from "mobx";
import { isUrl } from "../input/input_validators";
import { ExtensionSettings } from "./extension-settings";
import type { RegisteredAppPreference } from "./app-preferences/app-preference-registration";
import { withInjectables } from "@ogre-tools/injectable-react";
import appPreferencesInjectable from "./app-preferences/app-preferences.injectable";
import { Preferences } from "./preferences";
import userStoreInjectable from "../../../common/user-store/user-store.injectable";
import themeStoreInjectable from "../../themes/store.injectable";
import { defaultThemeId } from "../../../common/vars";
import { updateChannels } from "../../../behaviours/application-update/common/update-channels";
import { map, toPairs } from "lodash/fp";
import { pipeline } from "@ogre-tools/fp";
import type { SelectedUpdateChannel } from "../../../behaviours/application-update/common/selected-update-channel/selected-update-channel.injectable";
import selectedUpdateChannelInjectable from "../../../behaviours/application-update/common/selected-update-channel/selected-update-channel.injectable";

interface Dependencies {
  appPreferenceItems: IComputedValue<RegisteredAppPreference[]>;
  userStore: UserStore;
  themeStore: ThemeStore;
  selectedUpdateChannel: SelectedUpdateChannel;
}

const timezoneOptions = moment.tz.names()
  .map(timezone => ({
    value: timezone,
    label: timezone.replace("_", " "),
  }));

const updateChannelOptions = pipeline(
  toPairs(updateChannels),

  map(([, channel]) => ({
    value: channel.id,
    label: channel.label,
  })),
);

const extensionInstallRegistryOptions = [
  {
    value: "default",
    label: "Default Url",
  },
  {
    value: "npmrc",
    label: "Global .npmrc file's Url",
  },
  {
    value: "custom",
    label: "Custom Url",
  },
] as const;

const NonInjectedApplication: React.FC<Dependencies> = ({ appPreferenceItems, userStore, themeStore, selectedUpdateChannel }) => {
  const [customUrl, setCustomUrl] = React.useState(userStore.extensionRegistryUrl.customUrl || "");
  const themeOptions = [
    {
      value: "system", // TODO: replace with a sentinal value that isn't string (and serialize it differently)
      label: "Sync with computer",
    },
    ...Array.from(themeStore.themes, ([themeId, { name }]) => ({
      value: themeId,
      label: name,
    })),
  ];
  const extensionSettings = appPreferenceItems.get()
    .filter((preference) => preference.showInPreferencesTab === "application");

  return (
    <Preferences data-testid="application-preferences-page">
      <section id="application">
        <h2 data-testid="application-header">Application</h2>
        <section id="appearance">
          <SubTitle title="Theme" />
          <Select
            id="theme-input"
            options={themeOptions}
            value={userStore.colorTheme}
            onChange={value => userStore.colorTheme = value?.value ?? defaultThemeId}
            themeName="lens"
          />
        </section>

        <hr/>

        <section id="extensionRegistryUrl">
          <SubTitle title="Extension Install Registry" />
          <Select
            id="extension-install-registry-input"
            options={extensionInstallRegistryOptions}
            value={userStore.extensionRegistryUrl.location}
            onChange={value => runInAction(() => {
              userStore.extensionRegistryUrl.location = value?.value ?? defaultExtensionRegistryUrlLocation;

              if (userStore.extensionRegistryUrl.location === "custom") {
                userStore.extensionRegistryUrl.customUrl = "";
              }
            })}
            themeName="lens"
          />
          <p className="mt-4 mb-5 leading-relaxed">
            {"This setting is to change the registry URL for installing extensions by name. "}
            {`If you are unable to access the default registry (${defaultExtensionRegistryUrl}) you can change it in your `}
            <b>.npmrc</b>
            {" file or in the input below."}
          </p>

          <Input
            theme="round-black"
            validators={isUrl}
            value={customUrl}
            onChange={setCustomUrl}
            onBlur={() => userStore.extensionRegistryUrl.customUrl = customUrl}
            placeholder="Custom Extension Registry URL..."
            disabled={userStore.extensionRegistryUrl.location !== "custom"}
          />
        </section>

        <hr />

        <section id="other">
          <SubTitle title="Start-up" />
          <Switch checked={userStore.openAtLogin} onChange={() => userStore.openAtLogin = !userStore.openAtLogin}>
            Automatically start Lens on login
          </Switch>
        </section>

        <hr />

        {extensionSettings.map(setting => (
          <ExtensionSettings
            key={setting.id}
            setting={setting}
            size="normal"
          />
        ))}

        <section id="update-channel">
          <SubTitle title="Update Channel" />
          <Select
            id="update-channel-input"
            options={updateChannelOptions}
            value={selectedUpdateChannel.value.get().id}
            onChange={(selected) => selectedUpdateChannel.setValue(selected?.value) }
            themeName="lens"
          />
        </section>

        <hr />

        <section id="locale">
          <SubTitle title="Locale Timezone" />
          <Select
            id="timezone-input"
            options={timezoneOptions}
            value={userStore.localeTimezone}
            onChange={value => userStore.localeTimezone = value?.value ?? defaultLocaleTimezone}
            themeName="lens"
          />
        </section>
      </section>
    </Preferences>
  );
};

export const Application = withInjectables<Dependencies>(
  observer(NonInjectedApplication),

  {
    getProps: (di) => ({
      appPreferenceItems: di.inject(appPreferencesInjectable),
      userStore: di.inject(userStoreInjectable),
      themeStore: di.inject(themeStoreInjectable),
      selectedUpdateChannel: di.inject(selectedUpdateChannelInjectable),
    }),
  },
);
