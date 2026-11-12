# Hindi Type

A small Chrome Manifest V3 extension: click a webpage text field, write English in the extension, review its Hindi translation, and press **Type it** to insert at the saved cursor. It never submits the form or sends a message for you.

## Install in desktop Chrome

1. Download and extract this project ZIP. Keep the extracted folder on your computer.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the folder containing `manifest.json` (the `hindi-type` folder in the supplied ZIP).
5. Pin **Hindi Type** from Chrome's puzzle-piece Extensions menu.
6. Refresh any webpage that was open before installing.

No build, npm install, account, or API key is needed to use the extension. This is for desktop Chrome, not the standard Chrome Android app. It is not a Chrome Web Store listing.

## Use

1. Click the exact webpage field where you want Hindi. Place the caret where the text should go, or select text you want to replace.
2. Click the Hindi Type toolbar icon.
3. Write an English sentence and click **Translate to Hindi**.
4. Check the **Hindi preview**. You can edit it to fix names, tone, pronouns, or meaning.
5. Click **Type it** once. Your text is inserted, not submitted.
6. Close the popup and choose a new cursor before your next insertion.

**Copy Hindi** is a fallback for editors that do not accept direct insertion. Closing the popup discards the English and Hindi draft. Translation is on-demand, not on every keystroke.

## Translation and accuracy

This version translates **English meaning into Hindi**, rather than transliterating Roman Hindi. For example, `I will call you tomorrow morning.` produced `मैं तुम्हें कल सुबह फोन करूंगा.` in the live test. `namaste` -> `नमस्ते` phonetic typing is a different feature and is not the mode implemented here.

It uses Google's public, **unofficial** single-translation endpoint at `https://translate.googleapis.com/translate_a/single`, with source `en`, target `hi`, and client `gtx`. No credentials are embedded. It needs internet access. The endpoint is undocumented, has no availability guarantee, and may change or rate-limit requests. This is a personal-use prototype, not an official Google integration. A production release should use an authorized supported translation service and follow its terms.

No machine translation can promise perfect accuracy. Context, formality (`आप` vs `तुम`), gender, names, idioms, and ambiguous English can need correction. Review the editable preview, especially for important messages. Inputs are limited to 5,000 characters; long or technical text should be split into complete sentences.

## Privacy and permissions

- Only the text you explicitly ask to translate is sent to Google over HTTPS. Do not translate passwords, financial secrets, or sensitive private text.
- The extension has access to ordinary HTTP/HTTPS pages to remember which editor and frame you clicked. Chrome will show a broad site-access warning for this capability. You can restrict site access in Chrome, but insertion then works only on allowed sites.
- The content script observes focus events. It does not scrape whole pages or send existing field text to the translation service.
- Temporary session storage contains only the tab/frame routing and timestamp, not your English/Hindi draft. It is cleared when Chrome restarts; closing a tab removes its route.
- No analytics, third-party scripts, remote code, or API keys.
- Password inputs and disabled/read-only fields are not insertion targets.

## Compatibility and limits

Works with standard text inputs, textareas, and many `contenteditable` editors, including ordinary permitted iframes and open shadow-root fields. It inserts through the browser's editing command so normal input events and undo work on tested fields. A native-value-setter fallback is provided for standard inputs.

It **does not emulate physical keyboard hardware** and does not create trusted keyboard events. Sites that require those events, canvas editors such as Google Docs, custom/closed-shadow-root editors, browser-internal pages (`chrome://...`), the Chrome Web Store, PDF viewers, and protected/sandboxed frames may not work. Use Copy Hindi and paste manually where possible. No claim of universal webpage support is made.

The extension does not press Enter, click Send, or submit forms. If the original field is removed or becomes read-only, insertion is refused. A successful insertion means the editor received the text; it does not guarantee a site's application logic accepted or saved it. Check the webpage before submitting.

## Troubleshooting

- **No editable cursor found:** Refresh the page after installing, click an editable field, then reopen the popup. Check that Chrome's site-access setting permits this site.
- **Translation failed/timed out:** Check internet access and try again later. The free endpoint may be rate-limited.
- **Unsupported editor:** Use Copy Hindi, then paste into the page yourself.
- **Changed original field:** Close the popup, choose the field again, and reopen it.
- **Updates:** Replace the source files, click Reload on `chrome://extensions`, and refresh your webpage.

## Files

- `manifest.json`: Chrome configuration and permissions.
- `background.js`: translation request and temporary tab/frame routing.
- `content.js`: editor/cursor capture and insertion.
- `popup.html`, `popup.css`, `popup.js`: translation preview and actions.

## Verification

Tested with an unpacked extension in Chromium using its actual extension popup document, service worker, and content scripts. A live, unmocked Google endpoint request translated the example sentence, then inserted it into the delivery-instructions textarea at `https://httpbin.org/forms/post` between existing text at the saved caret. No form was submitted.

Additional controlled-page checks passed for selected input replacement, `contenteditable` replacement with native undo, iframe routing, duplicate-insertion prevention, and password-field refusal. The actual toolbar popup was also opened and tested in headed Chromium: a second live translation of `Please send me the meeting details.` produced `कृपया मुझे बैठक का विवरण भेजें.` and was inserted at the saved cursor on the real test webpage. Specific third-party complex editors still require a site-specific smoke test. Translation quality beyond these samples was not formally evaluated.
