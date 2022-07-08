/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { Menu, Tray } from "electron";
import packageJsonInjectable from "../../../../common/vars/package-json.injectable";
import showApplicationWindowInjectable from "../../../../main/start-main-application/lens-window/show-application-window.injectable";
import isWindowsInjectable from "../../../../common/vars/is-windows.injectable";
import loggerInjectable from "../../../../common/logger.injectable";
import { convertToElectronMenuTemplate } from "../reactive-tray-menu-items/converters";
import trayIconInjectable from "../menu-icon/tray-icon.injectable";

const TRAY_LOG_PREFIX = "[TRAY]";

export interface MinimalTrayMenuItem {
  id: string;
  parentId: string | null;
  enabled: boolean;
  label?: string;
  click?: () => Promise<void> | void;
  tooltip?: string;
  separator?: boolean;
}

export interface ElectronTray {
  start(): void;
  stop(): void;
  setMenuItems(menuItems: MinimalTrayMenuItem[]): void;
  setIconPath(iconPath: string): void;
}

const electronTrayInjectable = getInjectable({
  id: "electron-tray",

  instantiate: (di): ElectronTray => {
    const packageJson = di.inject(packageJsonInjectable);
    const showApplicationWindow = di.inject(showApplicationWindowInjectable);
    const isWindows = di.inject(isWindowsInjectable);
    const logger = di.inject(loggerInjectable);
    const trayIcon = di.inject(trayIconInjectable);

    let tray: Tray;

    return {
      start: () => {
        tray = new Tray(trayIcon.get().iconPath);

        tray.setToolTip(packageJson.description);
        tray.setIgnoreDoubleClickEvents(true);

        if (isWindows) {
          tray.on("click", () => {
            showApplicationWindow()
              .catch(error => logger.error(`${TRAY_LOG_PREFIX}: Failed to open lens`, { error }));
          });
        }
      },
      stop: () => {
        tray.destroy();
      },
      setMenuItems: (menuItems) => {
        const template = convertToElectronMenuTemplate(menuItems);
        const menu = Menu.buildFromTemplate(template);

        tray.setContextMenu(menu);
      },
      setIconPath: (iconPath) => {
        tray.setImage(iconPath);
      },
    };
  },

  causesSideEffects: true,
});

export default electronTrayInjectable;
