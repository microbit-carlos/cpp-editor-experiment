/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { EVENT_PROJECT_UPDATED, FileSystem, Project, diff } from "../fs/fs";
import { LanguageServerClient, createUri } from "./client";

export type FsChangesListener = (current: Project) => any;

/**
 * Updates the language server open files as the file system
 * changes.
 *
 * @param client The language server client.
 * @param fs The file system.
 */
export const trackFsChanges = (
  client: LanguageServerClient,
  fs: FileSystem
): FsChangesListener => {
  let previous: Project = {
    ...fs.project,
    // Start with no files for the diff, regardless of where the file
    // system initialization has got to so we open everything.
    files: [],
  };
  const documentText = async (name: string) =>
    new TextDecoder().decode((await fs.read(name)).data);
  const diffAndUpdateClient = async (current: Project) => {
    const changes = diff(previous, current); //.filter((c) => isPythonFile(c.name));  //filter for cpp/h ?
    previous = current;
    for (const change of changes) {
      const uri = createUri(change.name);
      switch (change.type) {
        case "create": {
          client.didOpenTextDocument({
            textDocument: {
              languageId: "c++",
              text: await documentText(change.name),
              uri,
            },
          });
          break;
        }
        case "delete": {
          client.didCloseTextDocument({
            textDocument: {
              uri,
            },
          });
          break;
        }
        case "edit": {
          // This is only when a document is entirely changed. Open documents are handled
          // by the editor language server client integration and don't result in project
          // file version changes.
          client.didChangeTextDocument(uri, [
            {
              text: await documentText(change.name),
            },
          ]);
          break;
        }
        default:
          throw new Error("Unexpected change: " + change.type);
      }
    }
  };
  fs.addListener(EVENT_PROJECT_UPDATED, diffAndUpdateClient);
  diffAndUpdateClient(fs.project);
  return diffAndUpdateClient;
};

export const removeTrackFsChangesListener = (
  fs: FileSystem,
  listener: FsChangesListener
): void => {
  fs.removeListener(EVENT_PROJECT_UPDATED, listener);
};
