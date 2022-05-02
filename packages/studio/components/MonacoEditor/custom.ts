import { mapValues, schemas } from '@appsemble/utils';
import { Schema } from 'jsonschema';
import 'monaco-editor/esm/vs/editor/contrib/colorPicker/browser/colorContributions.js';
import 'monaco-editor/esm/vs/editor/contrib/comment/browser/comment.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/format/browser/formatActions.js';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hover.js';
import 'monaco-editor/esm/vs/editor/contrib/inlineCompletions/browser/ghostText.contribution.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import { setDiagnosticsOptions } from 'monaco-yaml';

import { appValidationLabel } from './appValidation/index.js';
import './languages.js';

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case appValidationLabel:
        return new Worker(new URL('appValidation/worker', import.meta.url));
      case 'css':
        return new Worker(new URL('monaco-editor/esm/vs/language/css/css.work