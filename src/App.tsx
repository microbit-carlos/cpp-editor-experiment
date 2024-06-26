/**
 * (c) 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ChakraProvider } from "@chakra-ui/react";
import { polyfill } from "mobile-drag-drop";
import { useEffect } from "react";
import "./App.css";
import VisualViewPortCSSVariables from "./common/VisualViewportCSSVariables";
import { DialogProvider } from "./common/use-dialogs";
import { deployment, useDeployment } from "./deployment";
import { DeviceContextProvider } from "./device/device-hooks";
import { MockDeviceConnection } from "./device/mock";
import { MicrobitWebUSBConnection } from "./device/webusb";
import DocumentationProvider from "./documentation/documentation-hooks";
import SearchProvider from "./documentation/search/search-hooks";
import { ActiveEditorProvider } from "./editor/active-editor-hooks";
import { BasicFileSystem } from "./fs/basic-fs";
import { FileSystemProvider } from "./fs/fs-hooks";
import { ClangHexGenerator } from "./fs/hex-gen";
import { HexGenProvider } from "./fs/hex-hooks";
import { createHost } from "./fs/host";
import { LanguageServerClientProvider } from "./language-server/language-server-hooks";
import { LoggingProvider } from "./logging/logging-hooks";
import TranslationProvider from "./messages/TranslationProvider";
import ProjectDropTarget from "./project/ProjectDropTarget";
import { RouterProvider } from "./router-hooks";
import SessionSettingsProvider from "./settings/session-settings";
import SettingsProvider from "./settings/settings";
import BeforeUnloadDirtyCheck from "./workbench/BeforeUnloadDirtyCheck";
import Workbench from "./workbench/Workbench";
import { SelectionProvider } from "./workbench/use-selection";

const isMockDeviceMode = () =>
  // We use a cookie set from the e2e tests. Avoids having separate test and live builds.
  Boolean(
    document.cookie.split("; ").find((row) => row.startsWith("mockDevice="))
  );

const logging = deployment.logging;
const device = isMockDeviceMode()
  ? new MockDeviceConnection()
  : new MicrobitWebUSBConnection({ logging });

const host = createHost(logging);
// const fs = new _FileSystem(logging, host, fetchMicroPython);
const bfs = new BasicFileSystem(logging, host);
const hexGenerator = new ClangHexGenerator(bfs);

// If this fails then we retry on access.
// fs.initializeInBackground();
bfs.initialize(); //should be able to get away with just letting this run since clang also has to initialise, which takes significantly longer

const App = () => {
  useEffect(() => {
    logging.event({ type: "boot" });
    device.initialize();
    return () => {
      device.dispose();
    };
  }, []);

  polyfill({
    forceApply: true,
  });

  const deployment = useDeployment();
  return (
    <>
      <VisualViewPortCSSVariables />
      <ChakraProvider theme={deployment.chakraTheme}>
        <LoggingProvider value={logging}>
          <SettingsProvider>
            <SessionSettingsProvider>
              <TranslationProvider>
                <FileSystemProvider value={bfs}>
                  <HexGenProvider value={hexGenerator}>
                    <DeviceContextProvider value={device}>
                      <LanguageServerClientProvider>
                        <BeforeUnloadDirtyCheck />
                        <DocumentationProvider>
                          <SearchProvider>
                            <SelectionProvider>
                              <DialogProvider>
                                <RouterProvider>
                                  <ProjectDropTarget>
                                    <ActiveEditorProvider>
                                      <Workbench />
                                    </ActiveEditorProvider>
                                  </ProjectDropTarget>
                                </RouterProvider>
                              </DialogProvider>
                            </SelectionProvider>
                          </SearchProvider>
                        </DocumentationProvider>
                      </LanguageServerClientProvider>
                    </DeviceContextProvider>
                  </HexGenProvider>
                </FileSystemProvider>
              </TranslationProvider>
            </SessionSettingsProvider>
          </SettingsProvider>
        </LoggingProvider>
      </ChakraProvider>
    </>
  );
};

export default App;
